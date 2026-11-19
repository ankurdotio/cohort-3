import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createMessage, findMessagesByConversation } from '../src/DAO/message.dao.js';
import { MessageModel } from '../src/models/message.model.js';

let database;

before(async () => {
  database = await MongoMemoryServer.create();
  await mongoose.connect(database.getUri('message_dao_test'));
});

after(async () => {
  await mongoose.disconnect();
  if (database) await database.stop();
});

test('creates messages with their role, content, and conversation', async () => {
  const conversation = new mongoose.Types.ObjectId();
  const message = await createMessage({ role: 'user', content: 'Hello', conversation });

  assert.equal(message.role, 'user');
  assert.equal(message.content, 'Hello');
  assert.equal(String(message.conversation), String(conversation));
  assert.ok(message.createdAt instanceof Date);
});

test('loads only the requested conversation in chronological order', async () => {
  const conversation = new mongoose.Types.ObjectId();
  const otherConversation = new mongoose.Types.ObjectId();
  const later = await createMessage({ role: 'assistant', content: 'Later', conversation });
  const earlier = await createMessage({ role: 'user', content: 'Earlier', conversation });
  await createMessage({ role: 'user', content: 'Other', conversation: otherConversation });

  await MessageModel.collection.updateOne(
    { _id: later._id },
    { $set: { createdAt: new Date('2026-01-02T00:00:00Z') } },
  );
  await MessageModel.collection.updateOne(
    { _id: earlier._id },
    { $set: { createdAt: new Date('2026-01-01T00:00:00Z') } },
  );

  const messages = await findMessagesByConversation(String(conversation));
  assert.deepEqual(messages.map((message) => message.content), ['Earlier', 'Later']);
  assert.deepEqual(await findMessagesByConversation(new mongoose.Types.ObjectId()), []);
});
