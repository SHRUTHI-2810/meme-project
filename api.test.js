import test from 'node:test';
import assert from 'node:assert/strict';

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
const { app } = await import('../src/app.js');
const { db } = await import('../src/db.js');

let server;
let base;
const json = (body) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

test.before(async () => {
  await db.collection('templates').doc('t1').set({ name: 'Test', url: 'https://example.com/a.jpg' });
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

test('creates a meme and lists it', async () => {
  const res = await fetch(`${base}/api/memes`, json({
    templateId: 't1', title: 'hello',
    captions: [{ text: 'top', x: 50, y: 10, size: 9 }],
  }));
  assert.equal(res.status, 201);
  const list = await (await fetch(`${base}/api/memes`)).json();
  assert.ok(list.some((m) => m.title === 'hello'));
});

test('likes a meme', async () => {
  const created = await (await fetch(`${base}/api/memes`, json({
    templateId: 't1', captions: [{ text: 'x', x: 1, y: 1, size: 5 }],
  }))).json();
  const liked = await (await fetch(`${base}/api/memes/${created.id}/like`, { method: 'POST' })).json();
  assert.equal(liked.likes, 1);
});

test('rejects invalid payloads', async () => {
  const res = await fetch(`${base}/api/memes`, json({ templateId: 't1', captions: [] }));
  assert.equal(res.status, 400);
});
