import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId) {
  throw new Error("❌ FIREBASE_PROJECT_ID is not defined in .env");
}

if (!clientEmail) {
  throw new Error("❌ FIREBASE_CLIENT_EMAIL is not defined in .env");
}

if (!privateKey) {
  throw new Error("❌ FIREBASE_PRIVATE_KEY is not defined in .env");
}

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

const adminAuth = getAuth(firebaseApp);

export default adminAuth;
