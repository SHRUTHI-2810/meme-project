import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    // Local dev / CI: no credentials needed.
    initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'demo-meme-maker' });
  } else {
    // Production: set GOOGLE_APPLICATION_CREDENTIALS to your service-account JSON path.
    initializeApp({ credential: applicationDefault() });
  }
}

export const db = getFirestore();
