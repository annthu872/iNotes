import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
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
import { normalizeTags } from "../utils/searchHelpers";
import {
  decrementTopicQuestionCount,
  incrementTopicQuestionCount,
  markTopicUsed,
} from "./topicService";

const notesCollection = collection(db, "notes");
const VALID_STATUSES = ["new", "learning", "known", "review"];

const withDocumentId = (documentSnapshot) => ({
  id: documentSnapshot.id,
  ...documentSnapshot.data(),
});

function validateNoteTitle(noteData) {
  if (!noteData.title || !noteData.title.trim()) {
    throw new Error("Note title is required.");
  }
}

function validateStatus(status) {
  if (status && !VALID_STATUSES.includes(status)) {
    throw new Error("Status must be new, learning, known, or review.");
  }
}

function normalizeNoteForApp(note) {
  return {
    question: "",
    shortAnswer: "",
    content: note.answerMarkdown || "",
    answerMarkdown: note.answerMarkdown || note.content || "",
    topicId: null,
    parentNoteId: null,
    pathIds: [],
    level: 0,
    order: getDateMillis(note.createdAt) || 0,
    tags: [],
    status: "new",
    isFavorite: false,
    reviewCount: 0,
    lastReviewedAt: null,
    ...note,
  };
}

function cleanNoteData(noteData, hierarchyData = {}) {
  validateNoteTitle(noteData);
  validateStatus(noteData.status);

  const content = noteData.content ?? noteData.answerMarkdown ?? "";

  return {
    title: noteData.title.trim(),
    question: noteData.question?.trim() || "",
    shortAnswer: noteData.shortAnswer?.trim() || "",
    content,
    answerMarkdown: content,
    topicId: hierarchyData.topicId ?? noteData.topicId ?? null,
    parentNoteId: hierarchyData.parentNoteId ?? null,
    pathIds: hierarchyData.pathIds ?? [],
    level: hierarchyData.level ?? 0,
    order: noteData.order ?? Date.now(),
    tags: normalizeTags(noteData.tags || []),
    status: noteData.status || "new",
    isFavorite: noteData.isFavorite ?? false,
    isFlashcard: noteData.isFlashcard ?? false,
    difficulty: noteData.difficulty || "medium",
    reviewCount: noteData.reviewCount ?? 0,
    lastReviewedAt: noteData.lastReviewedAt ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function getDescendantNotes(notes, noteId) {
  return notes.filter((note) => note.pathIds?.includes(noteId));
}

function getNoteChildren(notes, noteId) {
  return notes.filter((note) => note.parentNoteId === noteId);
}

function ensureCanMoveNote(note, newParentNoteId, allNotes) {
  if (note.id === newParentNoteId) {
    throw new Error("A note cannot become its own parent.");
  }

  const descendantIds = getDescendantNotes(allNotes, note.id).map(
    (descendant) => descendant.id
  );

  if (descendantIds.includes(newParentNoteId)) {
    throw new Error("A note cannot be moved under one of its descendants.");
  }
}

function sortNotes(notes) {
  return [...notes].sort((firstNote, secondNote) => {
    const orderDifference = (firstNote.order || 0) - (secondNote.order || 0);

    if (orderDifference !== 0) {
      return orderDifference;
    }

    return (
      getDateMillis(secondNote.updatedAt) - getDateMillis(firstNote.updatedAt)
    );
  });
}

export async function createNote(noteData) {
  try {
    const cleanData = cleanNoteData(noteData);
    const docRef = await addDoc(notesCollection, cleanData);

    if (cleanData.topicId) {
      await incrementTopicQuestionCount(cleanData.topicId);
      await markTopicUsed(cleanData.topicId);
    }

    return {
      id: docRef.id,
      ...cleanData,
    };
  } catch (error) {
    console.error("Error creating note:", error);
    throw new Error(error.message || "Failed to create note.");
  }
}

export async function createSubnote(parentNoteId, noteData) {
  try {
    const parentNote = await getNoteById(parentNoteId);

    if (!parentNote) {
      throw new Error("Parent note was not found.");
    }

    const cleanData = cleanNoteData(noteData, {
      topicId: noteData.topicId ?? parentNote.topicId ?? null,
      parentNoteId,
      pathIds: [...(parentNote.pathIds || []), parentNote.id],
      level: (parentNote.level || 0) + 1,
    });
    const docRef = await addDoc(notesCollection, cleanData);

    return {
      id: docRef.id,
      ...cleanData,
    };
  } catch (error) {
    console.error("Error creating subnote:", error);
    throw new Error(error.message || "Failed to create subnote.");
  }
}

export async function getAllNotes() {
  try {
    const notesQuery = query(notesCollection, orderBy("updatedAt", "desc"));
    const querySnapshot = await getDocs(notesQuery);

    return sortNotes(querySnapshot.docs.map(withDocumentId).map(normalizeNoteForApp));
  } catch (error) {
    console.error("Error loading notes:", error);
    throw new Error(getReadableFirebaseError(error, "Failed to load notes."));
  }
}

export async function getNotesByTopic(topicId) {
  try {
    const notesQuery = query(notesCollection, where("topicId", "==", topicId));
    const querySnapshot = await getDocs(notesQuery);

    return sortNotes(querySnapshot.docs.map(withDocumentId).map(normalizeNoteForApp));
  } catch (error) {
    console.error("Error loading notes by topic:", error);
    throw new Error("Failed to load notes by topic.");
  }
}

export async function getRootNotesByTopic(topicId) {
  try {
    const notes = await getNotesByTopic(topicId);

    return sortNotes(notes.filter((note) => note.parentNoteId === null));
  } catch (error) {
    console.error("Error loading root notes by topic:", error);
    throw new Error("Failed to load root notes by topic.");
  }
}

export async function getSubnotes(parentNoteId) {
  try {
    const notesQuery = query(
      notesCollection,
      where("parentNoteId", "==", parentNoteId)
    );
    const querySnapshot = await getDocs(notesQuery);

    return sortNotes(querySnapshot.docs.map(withDocumentId).map(normalizeNoteForApp));
  } catch (error) {
    console.error("Error loading subnotes:", error);
    throw new Error("Failed to load subnotes.");
  }
}

export async function getNoteById(noteId) {
  try {
    const docRef = doc(db, "notes", noteId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      return null;
    }

    return normalizeNoteForApp(withDocumentId(docSnapshot));
  } catch (error) {
    console.error("Error loading note:", error);
    throw new Error("Failed to load note.");
  }
}

export async function updateNote(noteId, updatedData) {
  try {
    if (updatedData.title !== undefined) {
      validateNoteTitle(updatedData);
    }

    if (updatedData.status !== undefined) {
      validateStatus(updatedData.status);
    }

    const existingNote = await getNoteById(noteId);

    if (!existingNote) {
      throw new Error("Note was not found.");
    }

    const cleanData = {};

    if (updatedData.title !== undefined) cleanData.title = updatedData.title.trim();
    if (updatedData.question !== undefined) cleanData.question = updatedData.question?.trim() || "";
    if (updatedData.shortAnswer !== undefined) cleanData.shortAnswer = updatedData.shortAnswer?.trim() || "";

    if (updatedData.content !== undefined || updatedData.answerMarkdown !== undefined) {
      cleanData.content = updatedData.content ?? updatedData.answerMarkdown ?? "";
      cleanData.answerMarkdown = cleanData.content;
    }

    if (updatedData.topicId !== undefined) cleanData.topicId = updatedData.topicId || null;
    if (updatedData.tags !== undefined) cleanData.tags = normalizeTags(updatedData.tags);
    if (updatedData.status !== undefined) cleanData.status = updatedData.status;
    if (updatedData.order !== undefined) cleanData.order = Number(updatedData.order) || 0;
    if (updatedData.isFavorite !== undefined) cleanData.isFavorite = Boolean(updatedData.isFavorite);
    if (updatedData.isFlashcard !== undefined) cleanData.isFlashcard = Boolean(updatedData.isFlashcard);
    if (updatedData.difficulty !== undefined) cleanData.difficulty = updatedData.difficulty || "medium";

    cleanData.updatedAt = serverTimestamp();

    await updateDoc(doc(db, "notes", noteId), cleanData);

    if (
      updatedData.topicId !== undefined &&
      updatedData.topicId !== existingNote.topicId
    ) {
      await decrementTopicQuestionCount(existingNote.topicId);
      await incrementTopicQuestionCount(updatedData.topicId);
      await markTopicUsed(updatedData.topicId);
    } else if (existingNote.topicId) {
      await markTopicUsed(existingNote.topicId);
    }

    return noteId;
  } catch (error) {
    console.error("Error updating note:", error);
    throw new Error(error.message || "Failed to update note.");
  }
}

export async function moveNote(noteId, newParentNoteId) {
  try {
    const allNotes = await getAllNotes();
    const note = allNotes.find((item) => item.id === noteId);

    if (!note) throw new Error("Note was not found.");

    ensureCanMoveNote(note, newParentNoteId, allNotes);

    const newParentNote = newParentNoteId
      ? allNotes.find((item) => item.id === newParentNoteId)
      : null;

    if (newParentNoteId && !newParentNote) {
      throw new Error("New parent note was not found.");
    }

    const nextPathIds = newParentNote
      ? [...(newParentNote.pathIds || []), newParentNote.id]
      : [];
    const nextLevel = nextPathIds.length;
    const nextTopicId = newParentNote ? newParentNote.topicId : note.topicId;
    const descendants = getDescendantNotes(allNotes, noteId);
    const batch = writeBatch(db);

    batch.update(doc(db, "notes", noteId), {
      parentNoteId: newParentNoteId || null,
      pathIds: nextPathIds,
      level: nextLevel,
      topicId: nextTopicId ?? null,
      updatedAt: serverTimestamp(),
    });

    descendants.forEach((descendant) => {
      const relativePath = (descendant.pathIds || []).slice(
        (note.pathIds || []).length + 1
      );

      batch.update(doc(db, "notes", descendant.id), {
        pathIds: [...nextPathIds, noteId, ...relativePath],
        level: nextLevel + 1 + relativePath.length,
        topicId: descendant.topicId ?? nextTopicId ?? null,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();

    return noteId;
  } catch (error) {
    console.error("Error moving note:", error);
    throw new Error(error.message || "Failed to move note.");
  }
}

export async function deleteNote(noteId, options = {}) {
  try {
    const { recursive = false } = options;
    const allNotes = await getAllNotes();
    const note = allNotes.find((item) => item.id === noteId);

    if (!note) throw new Error("Note was not found.");

    const childNotes = getNoteChildren(allNotes, noteId);

    if (!recursive && childNotes.length > 0) {
      throw new Error("Cannot delete note because it still has subnotes.");
    }

    const noteIdsToDelete = recursive
      ? [noteId, ...getDescendantNotes(allNotes, noteId).map((item) => item.id)]
      : [noteId];
    const batch = writeBatch(db);

    noteIdsToDelete.forEach((id) => batch.delete(doc(db, "notes", id)));

    await batch.commit();
    await decrementTopicQuestionCount(note.topicId);

    return noteId;
  } catch (error) {
    console.error("Error deleting note:", error);
    throw new Error(error.message || "Failed to delete note.");
  }
}

export function buildNoteTree(notes) {
  const noteMap = new Map(
    notes.map((note) => [
      note.id,
      {
        ...normalizeNoteForApp(note),
        children: [],
      },
    ])
  );
  const roots = [];

  noteMap.forEach((note) => {
    if (note.parentNoteId && noteMap.has(note.parentNoteId)) {
      noteMap.get(note.parentNoteId).children.push(note);
    } else {
      roots.push(note);
    }
  });

  const sortBranch = (branch) => {
    branch.sort((firstNote, secondNote) => {
      const orderDifference = (firstNote.order || 0) - (secondNote.order || 0);
      return orderDifference || firstNote.title.localeCompare(secondNote.title);
    });
    branch.forEach((note) => sortBranch(note.children));
  };

  sortBranch(roots);

  return roots;
}

export async function getFavoriteNotes() {
  const notes = await getAllNotes();
  return notes.filter((note) => note.isFavorite === true);
}

export async function toggleFavorite(noteId, currentValue) {
  await updateDoc(doc(db, "notes", noteId), {
    isFavorite: !currentValue,
    updatedAt: serverTimestamp(),
  });

  return noteId;
}

export async function markNoteReviewed(noteId) {
  await updateDoc(doc(db, "notes", noteId), {
    lastReviewedAt: serverTimestamp(),
    reviewCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  return noteId;
}
