import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore/lite";
import { db } from "../firebase/firebaseConfig";
import { getDateMillis } from "../utils/dateHelpers";

const topicsCollection = collection(db, "topics");
const notesCollection = collection(db, "notes");

const withDocumentId = (documentSnapshot) => ({
  id: documentSnapshot.id,
  ...documentSnapshot.data(),
});

function hasOwnValue(data, fieldName) {
  return Object.prototype.hasOwnProperty.call(data, fieldName);
}

function getDefaultOrder(data) {
  return getDateMillis(data.createdAt) || 0;
}

function chunkItems(items, chunkSize = 450) {
  const chunks = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

async function commitUpdates(collectionName, updates) {
  for (const chunk of chunkItems(updates)) {
    const batch = writeBatch(db);

    chunk.forEach(({ id, data }) => {
      batch.update(doc(db, collectionName, id), data);
    });

    await batch.commit();
  }
}

export async function normalizeExistingTopics() {
  try {
    const querySnapshot = await getDocs(topicsCollection);
    const updates = querySnapshot.docs
      .map(withDocumentId)
      .map((topic) => {
        const missingFields = {};

        if (!hasOwnValue(topic, "parentTopicId")) missingFields.parentTopicId = null;
        if (!hasOwnValue(topic, "pathIds")) missingFields.pathIds = [];
        if (!hasOwnValue(topic, "level")) missingFields.level = 0;
        if (!hasOwnValue(topic, "order")) missingFields.order = getDefaultOrder(topic);

        return {
          id: topic.id,
          data: missingFields,
        };
      })
      .filter((update) => Object.keys(update.data).length > 0);

    await commitUpdates("topics", updates);

    return {
      checked: querySnapshot.docs.length,
      updated: updates.length,
    };
  } catch (error) {
    console.error("Error normalizing topics:", error);
    throw new Error("Failed to normalize existing topics.");
  }
}

export async function normalizeExistingNotes() {
  try {
    const querySnapshot = await getDocs(notesCollection);
    const updates = querySnapshot.docs
      .map(withDocumentId)
      .map((note) => {
        const missingFields = {};

        if (!hasOwnValue(note, "parentNoteId")) missingFields.parentNoteId = null;
        if (!hasOwnValue(note, "pathIds")) missingFields.pathIds = [];
        if (!hasOwnValue(note, "level")) missingFields.level = 0;
        if (!hasOwnValue(note, "order")) missingFields.order = getDefaultOrder(note);
        if (!hasOwnValue(note, "status")) missingFields.status = "new";

        return {
          id: note.id,
          data: missingFields,
        };
      })
      .filter((update) => Object.keys(update.data).length > 0);

    await commitUpdates("notes", updates);

    return {
      checked: querySnapshot.docs.length,
      updated: updates.length,
    };
  } catch (error) {
    console.error("Error normalizing notes:", error);
    throw new Error("Failed to normalize existing notes.");
  }
}
