import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createConversation, findConversationByIdAndUser } from '../src/DAO/conversation.dao.js';

let database;

before(async () => {
  database = await MongoMemoryServer.create();
  await mongoose.connect(database.getUri('conversation_dao_test'));
});

after(async () => {
  await mongoose.disconnect();
  if (database) await database.stop();
});

test('creates conversations with provided or default titles', async () => {
  const user = new mongoose.Types.ObjectId();
  const conversation = await createConversation({ user, title: '  A conversation  ' });
  assert.equal(conversation.title, 'A conversation');
  assert.equal(String(conversation.user), String(user));
  assert.equal(conversation.lastMessage, null);

  const defaultConversation = await createConversation({ user });
  assert.equal(defaultConversation.title, 'New conversation');
});

test('finds conversations only for their owner', async () => {
  const owner = new mongoose.Types.ObjectId();
  const otherUser = new mongoose.Types.ObjectId();
  const conversation = await createConversation({ user: owner, title: 'Private' });

  const found = await findConversationByIdAndUser(String(conversation._id), owner);
  assert.equal(String(found._id), String(conversation._id));
  assert.equal(await findConversationByIdAndUser(conversation._id, otherUser), null);
  assert.equal(await findConversationByIdAndUser(new mongoose.Types.ObjectId(), owner), null);
});
