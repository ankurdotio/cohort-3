import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { after, before, test } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import jwt from 'jsonwebtoken';

let database;
let app;
let disconnectDB;
let dao;
let sequence = 0;
const path = '/api/v1/auth';

before(async () => {
  database = await MongoMemoryServer.create();
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = database.getUri('downbot_test');
  process.env.ACCESS_TOKEN_SECRET = randomBytes(48).toString('hex');
  process.env.REFRESH_TOKEN_SECRET = randomBytes(48).toString('hex');
  ({ default: app } = await import('../src/app.js'));
  const db = await import('../src/config/db.js');
  disconnectDB = db.disconnectDB;
  await db.connectDB();
  dao = await import('../src/DAO/user.dao.js');
});

after(async () => {
  if (disconnectDB) await disconnectDB();
  if (database) await database.stop();
});

function credentials() {
  return { name: 'Test Thinker', email: `thinker${++sequence}@example.com`, password: 'a-valid-password1' };
}

function cookie(response) {
  return response.headers['set-cookie'][0].split(';')[0];
}

function publicUser(user) {
  assert.deepEqual(Object.keys(user).sort(), ['createdAt', 'email', 'id', 'name']);
}

test('register hashes password, normalizes email, and sets a private refresh cookie', async () => {
  const input = { ...credentials(), name: '  Test Thinker  ' };
  input.email = input.email.toUpperCase();
  const response = await request(app).post(`${path}/register`).send(input).expect(201);
  assert.deepEqual(Object.keys(response.body).sort(), ['data', 'message', 'success']);
  assert.equal(response.body.success, true);
  publicUser(response.body.data.user);
  assert.equal(response.body.data.user.name, 'Test Thinker');
  assert.equal(response.body.data.user.email, input.email.toLowerCase());
  assert.equal(typeof response.body.data.accessToken, 'string');
  const setCookie = response.headers['set-cookie'][0];
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Strict/);
  assert.match(setCookie, /Path=\/api\/v1\/auth/);
  assert.match(setCookie, /Max-Age=604800/);
  const stored = await dao.findUserByEmail(input.email.toLowerCase());
  assert.notEqual(stored.password, input.password);
  assert.equal(await stored.comparePassword(input.password), true);
  assert.equal(stored.refreshToken, undefined);
});

test('registration rejects invalid fields, bcrypt truncation, and duplicate accounts', async () => {
  const invalid = await request(app).post(`${path}/register`)
    .send({ name: 'x', email: 'not-an-email', password: 'short' }).expect(422);
  assert.equal(invalid.body.success, false);
  assert.deepEqual(new Set(invalid.body.errors.map((error) => error.field)), new Set(['name', 'email', 'password']));
  const long = await request(app).post(`${path}/register`)
    .send({ ...credentials(), password: `a1${'é'.repeat(36)}` }).expect(422);
  assert.equal(long.body.errors[0].field, 'password');
  const input = credentials();
  await request(app).post(`${path}/register`).send(input).expect(201);
  const duplicate = await request(app).post(`${path}/register`).send(input).expect(409);
  assert.equal(duplicate.body.errors[0].field, 'email');
  assert.equal(duplicate.body.success, false);
});

test('login and me return only public user data; all invalid credentials look identical', async () => {
  const input = credentials();
  await request(app).post(`${path}/register`).send(input).expect(201);
  for (const body of [
    { email: input.email, password: 'wrong-password1' },
    { email: 'missing@example.com', password: input.password },
    { email: 'invalid', password: '' },
    { email: { $ne: null }, password: input.password },
  ]) {
    const response = await request(app).post(`${path}/login`).send(body).expect(401);
    assert.equal(response.body.message, 'Invalid credentials');
    assert.deepEqual(response.body.errors, []);
  }
  const login = await request(app).post(`${path}/login`)
    .send({ email: input.email.toUpperCase(), password: input.password }).expect(200);
  publicUser(login.body.data.user);
  const me = await request(app).get(`${path}/me`)
    .auth(login.body.data.accessToken, { type: 'bearer' }).expect(200);
  publicUser(me.body.data.user);
  assert.equal(me.body.data.user.email, input.email);
  assert.equal(me.headers['cache-control'], 'no-store');
});

test('protected profile rejects absent, forged, expired, and wrong-purpose tokens', async () => {
  await request(app).get(`${path}/me`).expect(401);
  await request(app).get(`${path}/me`).auth('invalid', { type: 'bearer' }).expect(401);
  const registered = await request(app).post(`${path}/register`).send(credentials()).expect(201);
  const refreshToken = cookie(registered).split('=')[1];
  await request(app).get(`${path}/me`).auth(refreshToken, { type: 'bearer' }).expect(401);
  const expired = jwt.sign(
    { id: registered.body.data.user.id, email: registered.body.data.user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: -1, issuer: 'downbot', audience: 'downbot:access' },
  );
  const response = await request(app).get(`${path}/me`).auth(expired, { type: 'bearer' }).expect(401);
  assert.deepEqual(response.body.errors, []);
});

test('refresh rotates unique tokens even within one second and rejects replay', async () => {
  const registered = await request(app).post(`${path}/register`).send(credentials()).expect(201);
  const oldCookie = cookie(registered);
  const refreshed = await request(app).post(`${path}/refresh`).set('Cookie', oldCookie).expect(200);
  assert.notEqual(cookie(refreshed), oldCookie);
  assert.notEqual(refreshed.body.data.accessToken, registered.body.data.accessToken);
  publicUser(refreshed.body.data.user);
  await request(app).post(`${path}/refresh`).set('Cookie', oldCookie).expect(401);
  await request(app).get(`${path}/me`).auth(refreshed.body.data.accessToken, { type: 'bearer' }).expect(200);
});

test('only one concurrent rotation may consume a refresh token', async () => {
  const registered = await request(app).post(`${path}/register`).send(credentials()).expect(201);
  const responses = await Promise.all([
    request(app).post(`${path}/refresh`).set('Cookie', cookie(registered)),
    request(app).post(`${path}/refresh`).set('Cookie', cookie(registered)),
  ]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 401]);
  const winner = responses.find((response) => response.status === 200);
  await request(app).post(`${path}/refresh`).set('Cookie', cookie(winner)).expect(200);
});

test('logout revokes the stored token and clears the cookie on the original path', async () => {
  const registered = await request(app).post(`${path}/register`).send(credentials()).expect(201);
  const response = await request(app).post(`${path}/logout`).set('Cookie', cookie(registered)).expect(200);
  assert.deepEqual(response.body.data, {});
  assert.match(response.headers['set-cookie'][0], /Path=\/api\/v1\/auth/);
  assert.match(response.headers['set-cookie'][0], /Expires=Thu, 01 Jan 1970/);
  const stored = await dao.findUserByIdWithRefreshToken(registered.body.data.user.id);
  assert.equal(stored.refreshToken, null);
  await request(app).post(`${path}/refresh`).set('Cookie', cookie(registered)).expect(401);
  await request(app).post(`${path}/logout`).expect(200);
});

test('logging in replaces the previous refresh session; stale logout cannot revoke the new one', async () => {
  const input = credentials();
  const first = await request(app).post(`${path}/register`).send(input).expect(201);
  const second = await request(app).post(`${path}/login`).send(input).expect(200);
  await request(app).post(`${path}/refresh`).set('Cookie', cookie(first)).expect(401);
  await request(app).post(`${path}/logout`).set('Cookie', cookie(first)).expect(200);
  await request(app).post(`${path}/refresh`).set('Cookie', cookie(second)).expect(200);
});

test('missing and malformed cookies fail explicitly, and malformed logout clears its cookie', async () => {
  await request(app).post(`${path}/refresh`).expect(401);
  await request(app).post(`${path}/refresh`).set('Cookie', 'refreshToken=invalid').expect(401);
  const response = await request(app).post(`${path}/logout`).set('Cookie', 'refreshToken=invalid').expect(401);
  assert.match(response.headers['set-cookie'][0], /Expires=Thu, 01 Jan 1970/);
});

test('unknown routes, malformed JSON, and oversized bodies use the failure envelope', async () => {
  const responses = [
    await request(app).get('/api/v1/missing').expect(404),
    await request(app).post(`${path}/login`).set('Content-Type', 'application/json').send('{').expect(400),
    await request(app).post(`${path}/register`).send({ name: 'x'.repeat(17000) }).expect(413),
  ];
  for (const response of responses) {
    assert.equal(response.body.success, false);
    assert.equal(typeof response.body.message, 'string');
    assert.ok(Array.isArray(response.body.errors));
    assert.equal(response.body.data, undefined);
  }
});
