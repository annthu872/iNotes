import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore/lite";
import { db } from "../firebase/firebaseConfig";
import { getReadableFirebaseError } from "../utils/firebaseErrorHelpers";
import { getDateMillis } from "../utils/dateHelpers";

const topicsCollection = collection(db, "topics");
const questionsCollection = collection(db, "questions");
const notesCollection = collection(db, "notes");

const withDocumentId = (documentSnapshot) => ({
  id: documentSnapshot.id,
  ...documentSnapshot.data(),
});

const getTimestampMillis = (value) => getDateMillis(value);

const sortTopics = (topics) =>
  [...topics].sort((firstTopic, secondTopic) => {
    if (firstTopic.isFavorite !== secondTopic.isFavorite) {
      return firstTopic.isFavorite ? -1 : 1;
    }

    const lastUsedDifference =
      getTimestampMillis(secondTopic.lastUsedAt) -
      getTimestampMillis(firstTopic.lastUsedAt);

    if (lastUsedDifference !== 0) {
      return lastUsedDifference;
    }

    return (firstTopic.name || "").localeCompare(secondTopic.name || "");
  });

function validateTopicName(name) {
  if (!name || !name.trim()) {
    throw new Error("Topic name is required.");
  }
}

function normalizeTopicForApp(topic) {
  return {
    description: "",
    icon: "folder",
    color: "#2563eb",
    questionCount: 0,
    isFavorite: false,
    lastUsedAt: null,
    parentTopicId: null,
    pathIds: [],
    level: 0,
    order: getTimestampMillis(topic.createdAt) || 0,
    ...topic,
  };
}

function getDescendantTopics(topics, topicId) {
  return topics.filter((topic) => topic.pathIds?.includes(topicId));
}

function getTopicChildren(topics, topicId) {
  return topics.filter((topic) => topic.parentTopicId === topicId);
}

async function commitBatchDeletes(documentRefs) {
  const batchSize = 450;

  for (let index = 0; index < documentRefs.length; index += batchSize) {
    const batch = writeBatch(db);
    const refsForBatch = documentRefs.slice(index, index + batchSize);

    refsForBatch.forEach((documentRef) => batch.delete(documentRef));
    await batch.commit();
  }
}

function ensureCanMoveTopic(topic, newParentTopicId, allTopics) {
  if (topic.id === newParentTopicId) {
    throw new Error("A topic cannot become its own parent.");
  }

  const descendantIds = getDescendantTopics(allTopics, topic.id).map(
    (descendant) => descendant.id
  );

  if (descendantIds.includes(newParentTopicId)) {
    throw new Error("A topic cannot be moved under one of its descendants.");
  }
}

// Creates a topic/category with sidebar-friendly defaults.
export async function createTopic(topicData) {
  try {
    validateTopicName(topicData.name);

    const cleanData = {
      name: topicData.name.trim(),
      description: topicData.description?.trim() || "",
      icon: topicData.icon?.trim() || "folder",
      color: topicData.color || "#2563eb",
      questionCount: 0,
      isFavorite: topicData.isFavorite ?? false,
      lastUsedAt: null,
      parentTopicId: null,
      pathIds: [],
      level: 0,
      order: topicData.order ?? Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(topicsCollection, cleanData);

    return {
      id: docRef.id,
      ...cleanData,
    };
  } catch (error) {
    console.error("Error creating topic:", error);
    throw new Error(error.message || "Failed to create topic.");
  }
}

// Creates a subtopic in the flat topics collection.
export async function createSubtopic(parentTopicId, topicData) {
  try {
    validateTopicName(topicData.name);

    const parentTopic = await getTopicById(parentTopicId);

    if (!parentTopic) {
      throw new Error("Parent topic was not found.");
    }

    const cleanData = {
      name: topicData.name.trim(),
      description: topicData.description?.trim() || "",
      icon: topicData.icon?.trim() || "folder",
      color: topicData.color || parentTopic.color || "#2563eb",
      questionCount: 0,
      isFavorite: topicData.isFavorite ?? false,
      lastUsedAt: null,
      parentTopicId,
      pathIds: [...(parentTopic.pathIds || []), parentTopic.id],
      level: (parentTopic.level || 0) + 1,
      order: topicData.order ?? Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(topicsCollection, cleanData);

    return {
      id: docRef.id,
      ...cleanData,
    };
  } catch (error) {
    console.error("Error creating subtopic:", error);
    throw new Error(error.message || "Failed to create subtopic.");
  }
}

// Loads topics sorted for the sidebar: favorites, recently used, then name.
export async function getAllTopics() {
  try {
    const topicsQuery = query(topicsCollection, orderBy("name", "asc"));
    const querySnapshot = await getDocs(topicsQuery);

    return sortTopics(querySnapshot.docs.map(withDocumentId).map(normalizeTopicForApp));
  } catch (error) {
    console.error("Error loading topics:", error);
    throw new Error(getReadableFirebaseError(error, "Failed to load topics."));
  }
}

export async function getRootTopics() {
  try {
    const topicsQuery = query(topicsCollection, where("parentTopicId", "==", null));
    const querySnapshot = await getDocs(topicsQuery);

    return sortTopics(querySnapshot.docs.map(withDocumentId).map(normalizeTopicForApp));
  } catch (error) {
    console.error("Error loading root topics:", error);
    throw new Error("Failed to load root topics.");
  }
}

export async function getSubtopics(parentTopicId) {
  try {
    const topicsQuery = query(
      topicsCollection,
      where("parentTopicId", "==", parentTopicId)
    );
    const querySnapshot = await getDocs(topicsQuery);

    return sortTopics(querySnapshot.docs.map(withDocumentId).map(normalizeTopicForApp));
  } catch (error) {
    console.error("Error loading subtopics:", error);
    throw new Error("Failed to load subtopics.");
  }
}

// Loads one topic by Firestore document id.
export async function getTopicById(topicId) {
  try {
    const docRef = doc(db, "topics", topicId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      return null;
    }

    return normalizeTopicForApp(withDocumentId(docSnapshot));
  } catch (error) {
    console.error("Error loading topic:", error);
    throw new Error("Failed to load topic.");
  }
}

// Updates editable topic fields without resetting question counts.
export async function updateTopic(topicId, updatedData) {
  try {
    if (updatedData.name !== undefined) {
      validateTopicName(updatedData.name);
    }

    const docRef = doc(db, "topics", topicId);
    const cleanData = {};

    if (updatedData.name !== undefined) {
      cleanData.name = updatedData.name.trim();
    }

    if (updatedData.description !== undefined) {
      cleanData.description = updatedData.description?.trim() || "";
    }

    if (updatedData.icon !== undefined) {
      cleanData.icon = updatedData.icon?.trim() || "folder";
    }

    if (updatedData.color !== undefined) {
      cleanData.color = updatedData.color || "#2563eb";
    }

    if (updatedData.isFavorite !== undefined) {
      cleanData.isFavorite = Boolean(updatedData.isFavorite);
    }

    if (updatedData.order !== undefined) {
      cleanData.order = Number(updatedData.order) || 0;
    }

    cleanData.updatedAt = serverTimestamp();

    await updateDoc(docRef, cleanData);

    return topicId;
  } catch (error) {
    console.error("Error updating topic:", error);
    throw new Error(error.message || "Failed to update topic.");
  }
}

export async function moveTopic(topicId, newParentTopicId) {
  try {
    const allTopics = await getAllTopics();
    const topic = allTopics.find((item) => item.id === topicId);

    if (!topic) {
      throw new Error("Topic was not found.");
    }

    ensureCanMoveTopic(topic, newParentTopicId, allTopics);

    const newParentTopic = newParentTopicId
      ? allTopics.find((item) => item.id === newParentTopicId)
      : null;

    if (newParentTopicId && !newParentTopic) {
      throw new Error("New parent topic was not found.");
    }

    const nextPathIds = newParentTopic
      ? [...(newParentTopic.pathIds || []), newParentTopic.id]
      : [];
    const nextLevel = nextPathIds.length;
    const descendants = getDescendantTopics(allTopics, topicId);
    const batch = writeBatch(db);

    batch.update(doc(db, "topics", topicId), {
      parentTopicId: newParentTopicId || null,
      pathIds: nextPathIds,
      level: nextLevel,
      updatedAt: serverTimestamp(),
    });

    descendants.forEach((descendant) => {
      const relativePath = (descendant.pathIds || []).slice(
        (topic.pathIds || []).length + 1
      );

      batch.update(doc(db, "topics", descendant.id), {
        pathIds: [...nextPathIds, topicId, ...relativePath],
        level: nextLevel + 1 + relativePath.length,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();

    return topicId;
  } catch (error) {
    console.error("Error moving topic:", error);
    throw new Error(error.message || "Failed to move topic.");
  }
}

// Deletes a topic. Recursive mode removes the topic branch and all linked notes/subnotes.
export async function deleteTopic(topicId, options = {}) {
  try {
    const { recursive = false } = options;
    const allTopics = await getAllTopics();
    const childTopics = getTopicChildren(allTopics, topicId);
    const topicIdsToDelete = [
      topicId,
      ...getDescendantTopics(allTopics, topicId).map((topic) => topic.id),
    ];

    if (!recursive && childTopics.length > 0) {
      throw new Error("Cannot delete topic because it still has subtopics.");
    }

    const questionsQuery = query(
      questionsCollection,
      where("topicId", "==", topicId),
      limit(1)
    );
    const questionsSnapshot = await getDocs(questionsQuery);
    const notesSnapshot = await getDocs(
      query(notesCollection, where("topicId", "==", topicId), limit(1))
    );

    if (!recursive && (!questionsSnapshot.empty || !notesSnapshot.empty)) {
      throw new Error("Cannot delete topic because it still has questions or notes.");
    }

    if (recursive) {
      const topicIdSet = new Set(topicIdsToDelete);
      const notesSnapshot = await getDocs(notesCollection);
      const allNotes = notesSnapshot.docs.map(withDocumentId);
      const directNotesToDelete = allNotes.filter((note) =>
        topicIdSet.has(note.topicId)
      );
      const directNoteIdSet = new Set(directNotesToDelete.map((note) => note.id));
      const notesToDelete = allNotes.filter(
        (note) =>
          directNoteIdSet.has(note.id) ||
          note.pathIds?.some((ancestorNoteId) => directNoteIdSet.has(ancestorNoteId))
      );
      const questionSnapshot = await getDocs(questionsCollection);
      const questionsToDelete = questionSnapshot.docs
        .map(withDocumentId)
        .filter((question) => topicIdSet.has(question.topicId));
      const refsToDelete = [
        ...topicIdsToDelete.map((id) => doc(db, "topics", id)),
        ...notesToDelete.map((note) => doc(db, "notes", note.id)),
        ...questionsToDelete.map((question) => doc(db, "questions", question.id)),
      ];

      await commitBatchDeletes(refsToDelete);
    } else {
      await deleteDoc(doc(db, "topics", topicId));
    }

    return topicId;
  } catch (error) {
    console.error("Error deleting topic:", error);
    throw new Error(error.message || "Failed to delete topic.");
  }
}

export function buildTopicTree(topics) {
  const topicMap = new Map(
    topics.map((topic) => [
      topic.id,
      {
        ...normalizeTopicForApp(topic),
        children: [],
      },
    ])
  );
  const roots = [];

  topicMap.forEach((topic) => {
    if (topic.parentTopicId && topicMap.has(topic.parentTopicId)) {
      topicMap.get(topic.parentTopicId).children.push(topic);
    } else {
      roots.push(topic);
    }
  });

  const sortBranch = (branch) => {
    branch.sort((firstTopic, secondTopic) => {
      const orderDifference = (firstTopic.order || 0) - (secondTopic.order || 0);
      return orderDifference || firstTopic.name.localeCompare(secondTopic.name);
    });
    branch.forEach((topic) => sortBranch(topic.children));
  };

  sortBranch(roots);

  return roots;
}

// Pins or unpins a topic for favorite-first sidebar sorting.
export async function toggleTopicFavorite(topicId, currentValue) {
  try {
    const docRef = doc(db, "topics", topicId);

    await updateDoc(docRef, {
      isFavorite: !currentValue,
      updatedAt: serverTimestamp(),
    });

    return topicId;
  } catch (error) {
    console.error("Error toggling topic favorite:", error);
    throw new Error("Failed to update topic favorite.");
  }
}

// Records that a topic was used when a question is created or updated.
export async function markTopicUsed(topicId) {
  try {
    if (!topicId) {
      return topicId;
    }

    const docRef = doc(db, "topics", topicId);

    await updateDoc(docRef, {
      lastUsedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return topicId;
  } catch (error) {
    console.error("Error marking topic used:", error);
    throw new Error("Failed to mark topic as used.");
  }
}

// Increases the cached question count shown beside a topic.
export async function incrementTopicQuestionCount(topicId) {
  try {
    if (!topicId) {
      return topicId;
    }

    const docRef = doc(db, "topics", topicId);

    await updateDoc(docRef, {
      questionCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    return topicId;
  } catch (error) {
    console.error("Error incrementing topic question count:", error);
    throw new Error("Failed to update topic question count.");
  }
}

// Decreases the cached question count while avoiding negative values.
export async function decrementTopicQuestionCount(topicId) {
  try {
    if (!topicId) {
      return topicId;
    }

    const docRef = doc(db, "topics", topicId);
    const topicSnapshot = await getDoc(docRef);

    if (!topicSnapshot.exists()) {
      return topicId;
    }

    const currentCount = topicSnapshot.data().questionCount || 0;

    await updateDoc(docRef, {
      questionCount: Math.max(currentCount - 1, 0),
      updatedAt: serverTimestamp(),
    });

    return topicId;
  } catch (error) {
    console.error("Error decrementing topic question count:", error);
    throw new Error("Failed to update topic question count.");
  }
}
