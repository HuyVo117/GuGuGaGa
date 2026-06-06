import admin from "firebase-admin";
import { readFileSync } from "fs";
import { config } from "./env.js";

const serviceAccount = JSON.parse(
  readFileSync(config.firebase.serviceAccountPath, "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

export default db;
