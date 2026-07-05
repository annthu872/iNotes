import {
  firebaseDatabaseId,
  firebaseProjectId,
} from "../firebase/firebaseConfig";

export function getReadableFirebaseError(error, fallbackMessage) {
  const message = error?.message || "";
  const databaseMissing =
    message.includes("does not exist") && message.includes("database");

  if (databaseMissing) {
    return `Firestore database "${firebaseDatabaseId}" does not exist in Firebase project "${firebaseProjectId}". Create a Firestore database in that project, or set VITE_FIREBASE_DATABASE_ID if you created a named database. The "(default)" database id in Firebase URLs is normal.`;
  }

  return message || fallbackMessage;
}
