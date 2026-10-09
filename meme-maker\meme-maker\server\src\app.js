import express from 'express';
import cors from 'cors';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './db.js';

export const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true }));
app.use(express.json({ limit: '100kb' }));

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** Returns a cleaned caption list, or null when the payload is invalid. */
function parseCaptions(raw) {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 6) return null;
  const out = [];
  for (const c of raw) {
    if (typeof c?.text !== 'string' || c.text.length > 120) return null;
    if (![c.x, c.y, c.size].every(Number.isFinite)) return null;
    out.push({
      text: c.text.trim(),
      x: clamp(c.x, 0, 100),
      y: clamp(c.y, 0, 100),
      size: clamp(c.size, 3, 20),
    });
  }
  return out;
}

const toMeme = (doc) => {
  const d = doc.data();
  return { id: doc.id, ...d, createdAt: d.createdAt?.toDate().toISOString() ?? null };
};

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/templates', wrap(async (_req, res) => {
  const snap = await db.collection('templates').orderBy('name').get();
  res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}));

app.get('/api/memes', wrap(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const snap = await db.collection('memes').orderBy('createdAt', 'desc').limit(limit).get();
  res.json(snap.docs.map(toMeme));
}));

app.post('/api/memes', wrap(async (req, res) => {
  const { templateId, title = '' } = req.body ?? {};
  const captions = parseCaptions(req.body?.captions);
  if (typeof templateId !== 'string' || !captions || typeof title !== 'string' || title.length > 80) {
    return res.status(400).json({ error: 'Invalid meme: check templateId, title (max 80) and captions (1-6).' });
  }
  const tpl = await db.collection('templates').doc(templateId).get();
  if (!tpl.exists) return res.status(404).json({ error: 'Template not found.' });

  const ref = await db.collection('memes').add({
    templateId,
    templateUrl: tpl.data().url, // denormalised so the gallery needs no joins
    title: title.trim(),
    captions,
    likes: 0,
    createdAt: FieldValue.serverTimestamp(),
  });
  res.status(201).json(toMeme(await ref.get()));
}));

app.post('/api/memes/:id/like', wrap(async (req, res) => {
  const ref = db.collection('memes').doc(req.params.id);
  if (!(await ref.get()).exists) return res.status(404).json({ error: 'Meme not found.' });
  await ref.update({ likes: FieldValue.increment(1) });
  res.json(toMeme(await ref.get()));
}));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});
