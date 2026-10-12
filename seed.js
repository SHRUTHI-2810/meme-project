import { db } from './db.js';

// Replace/extend with your own hosted images (Firebase Storage works well).
// The host must send CORS headers or the canvas export will fail.
const templates = [
  { id: 'drake', name: 'Drake Hotline Bling', url: 'https://i.imgflip.com/30b1gx.jpg' },
  { id: 'distracted-boyfriend', name: 'Distracted Boyfriend', url: 'https://i.imgflip.com/1ur9b0.jpg' },
  { id: 'two-buttons', name: 'Two Buttons', url: 'https://i.imgflip.com/1g8my4.jpg' },
  { id: 'change-my-mind', name: 'Change My Mind', url: 'https://i.imgflip.com/24y43o.jpg' },
  { id: 'expanding-brain', name: 'Expanding Brain', url: 'https://i.imgflip.com/1jwhww.jpg' },
  { id: 'success-kid', name: 'Success Kid', url: 'https://i.imgflip.com/1bhk.jpg' },
];

const batch = db.batch();
for (const { id, ...data } of templates) batch.set(db.collection('templates').doc(id), data);
await batch.commit();
console.log(`Seeded ${templates.length} templates.`);
