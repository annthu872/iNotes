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
} from "firebase/firestore/lite";
import { db } from "../firebase/firebaseConfig";
import { getReadableFirebaseError } from "../utils/firebaseErrorHelpers";
import {
  decrementTopicQuestionCount,
  incrementTopicQuestionCount,
  markTopicUsed,
} from "./topicService";
import { normalizeTags, sortQuestions } from "../utils/searchHelpers";

const questionsCollection = collection(db, "questions");

const VALID_DIFFICULTIES = ["easy", "medium", "hard"];
const VALID_STATUSES = ["new", "learning", "need_review", "mastered"];

const withDocumentId = (documentSnapshot) => ({
  id: documentSnapshot.id,
  ...documentSnapshot.data(),
});

function validateRequiredQuestionFields(questionData) {
  if (!questionData.topicId) {
    throw new Error("Topic is required.");
  }

  if (!questionData.title || !questionData.title.trim()) {
    throw new Error("Question title is required.");
  }

  if (!questionData.answerMarkdown || !questionData.answerMarkdown.trim()) {
    throw new Error("Question answer is required.");
  }
}

function validateDifficulty(difficulty) {
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    throw new Error("Difficulty must be easy, medium, or hard.");
  }
}

function validateStatus(status) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error("Status must be new, learning, need_review, or mastered.");
  }
}

function cleanQuestionData(questionData, options = {}) {
  const cleanData = {};

  if (options.requireFields || questionData.topicId !== undefined) {
    cleanData.topicId = questionData.topicId;
  }

  if (options.requireFields || questionData.title !== undefined) {
    cleanData.title = questionData.title.trim();
  }

  if (options.requireFields || questionData.answerMarkdown !== undefined) {
    cleanData.answerMarkdown = questionData.answerMarkdown.trim();
  }

  if (questionData.tags !== undefined || options.withDefaults) {
    cleanData.tags = normalizeTags(questionData.tags || []);
  }

  if (questionData.difficulty !== undefined || options.withDefaults) {
    cleanData.difficulty = questionData.difficulty || "medium";
    validateDifficulty(cleanData.difficulty);
  }

  if (questionData.status !== undefined || options.withDefaults) {
    cleanData.status = questionData.status || "new";
    validateStatus(cleanData.status);
  }

  if (questionData.isFavorite !== undefined || options.withDefaults) {
    cleanData.isFavorite = questionData.isFavorite ?? false;
  }

  if (questionData.isFlashcard !== undefined || options.withDefaults) {
    cleanData.isFlashcard = questionData.isFlashcard ?? false;
  }

  return cleanData;
}

// Creates a question and updates the related topic usage/count metadata.
export async function createQuestion(questionData) {
  try {
    validateRequiredQuestionFields(questionData);

    const cleanData = {
      ...cleanQuestionData(questionData, {
        requireFields: true,
        withDefaults: true,
      }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastReviewedAt: null,
      nextReviewAt: null,
      reviewCount: 0,
    };

    const docRef = await addDoc(questionsCollection, cleanData);

    await incrementTopicQuestionCount(cleanData.topicId);
    await markTopicUsed(cleanData.topicId);

    return {
      id: docRef.id,
      ...cleanData,
    };
  } catch (error) {
    console.error("Error creating question:", error);
    throw new Error(error.message || "Failed to create question.");
  }
}

// Loads every question, newest updates first for the main list.
export async function getAllQuestions() {
  try {
    const questionsQuery = query(questionsCollection, orderBy("updatedAt", "desc"));
    const querySnapshot = await getDocs(questionsQuery);

    return querySnapshot.docs.map(withDocumentId);
  } catch (error) {
    console.error("Error loading questions:", error);
    throw new Error(getReadableFirebaseError(error, "Failed to load questions."));
  }
}

// Loads one question by Firestore document id.
export async function getQuestionById(questionId) {
  try {
    const docRef = doc(db, "questions", questionId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      return null;
    }

    return withDocumentId(docSnapshot);
  } catch (error) {
    console.error("Error loading question:", error);
    throw new Error("Failed to load question.");
  }
}

// Loads questions that belong to one topic/category.
export async function getQuestionsByTopic(topicId) {
  try {
    const questionsQuery = query(
      questionsCollection,
      where("topicId", "==", topicId)
    );
    const querySnapshot = await getDocs(questionsQuery);

    return sortQuestions(querySnapshot.docs.map(withDocumentId), "updated");
  } catch (error) {
    console.error("Error loading questions by topic:", error);
    throw new Error("Failed to load questions by topic.");
  }
}

// Loads saved/favorite questions for quick access.
export async function getFavoriteQuestions() {
  try {
    const questionsQuery = query(
      questionsCollection,
      where("isFavorite", "==", true)
    );
    const querySnapshot = await getDocs(questionsQuery);

    return sortQuestions(querySnapshot.docs.map(withDocumentId), "updated");
  } catch (error) {
    console.error("Error loading favorite questions:", error);
    throw new Error("Failed to load favorite questions.");
  }
}

// Loads questions marked as flashcards and sorts due cards first.
export async function getFlashcardQuestions() {
  try {
    const questionsQuery = query(
      questionsCollection,
      where("isFlashcard", "==", true)
    );
    const querySnapshot = await getDocs(questionsQuery);

    return sortQuestions(querySnapshot.docs.map(withDocumentId), "review_due");
  } catch (error) {
    console.error("Error loading flashcard questions:", error);
    throw new Error(
      getReadableFirebaseError(error, "Failed to load flashcard questions.")
    );
  }
}

// Loads questions by review status: new, learning, need_review, mastered.
export async function getQuestionsByStatus(status) {
  try {
    validateStatus(status);

    const questionsQuery = query(
      questionsCollection,
      where("status", "==", status)
    );
    const querySnapshot = await getDocs(questionsQuery);

    return sortQuestions(querySnapshot.docs.map(withDocumentId), "updated");
  } catch (error) {
    console.error("Error loading questions by status:", error);
    throw new Error(error.message || "Failed to load questions by status.");
  }
}

// Loads questions containing one normalized tag.
export async function getQuestionsByTag(tag) {
  try {
    const normalizedTags = normalizeTags([tag]);

    if (normalizedTags.length === 0) {
      return [];
    }

    const questionsQuery = query(
      questionsCollection,
      where("tags", "array-contains", normalizedTags[0])
    );
    const querySnapshot = await getDocs(questionsQuery);

    return sortQuestions(querySnapshot.docs.map(withDocumentId), "updated");
  } catch (error) {
    console.error("Error loading questions by tag:", error);
    throw new Error("Failed to load questions by tag.");
  }
}

// Loads a limited set of recently updated questions for dashboard panels.
export async function getRecentQuestions(limitCount = 10) {
  try {
    const questionsQuery = query(
      questionsCollection,
      orderBy("updatedAt", "desc"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(questionsQuery);

    return querySnapshot.docs.map(withDocumentId);
  } catch (error) {
    console.error("Error loading recent questions:", error);
    throw new Error("Failed to load recent questions.");
  }
}

// Updates question fields and keeps topic counts correct if the topic changes.
export async function updateQuestion(questionId, updatedData) {
  try {
    const existingQuestion = await getQuestionById(questionId);

    if (!existingQuestion) {
      throw new Error("Question was not found.");
    }

    const mergedQuestion = {
      ...existingQuestion,
      ...updatedData,
    };

    validateRequiredQuestionFields(mergedQuestion);

    const cleanData = {
      ...cleanQuestionData(updatedData),
      updatedAt: serverTimestamp(),
    };

    const docRef = doc(db, "questions", questionId);
    await updateDoc(docRef, cleanData);

    if (updatedData.topicId && updatedData.topicId !== existingQuestion.topicId) {
      await decrementTopicQuestionCount(existingQuestion.topicId);
      await incrementTopicQuestionCount(updatedData.topicId);
      await markTopicUsed(updatedData.topicId);
    } else {
      await markTopicUsed(existingQuestion.topicId);
    }

    return questionId;
  } catch (error) {
    console.error("Error updating question:", error);
    throw new Error(error.message || "Failed to update question.");
  }
}

// Deletes a question and decrements the related topic count.
export async function deleteQuestion(questionId) {
  try {
    const existingQuestion = await getQuestionById(questionId);

    if (!existingQuestion) {
      throw new Error("Question was not found.");
    }

    const docRef = doc(db, "questions", questionId);
    await deleteDoc(docRef);
    await decrementTopicQuestionCount(existingQuestion.topicId);

    return questionId;
  } catch (error) {
    console.error("Error deleting question:", error);
    throw new Error(error.message || "Failed to delete question.");
  }
}

// Saves or unsaves a question as a favorite.
export async function toggleFavorite(questionId, currentValue) {
  try {
    const docRef = doc(db, "questions", questionId);

    await updateDoc(docRef, {
      isFavorite: !currentValue,
      updatedAt: serverTimestamp(),
    });

    return questionId;
  } catch (error) {
    console.error("Error toggling question favorite:", error);
    throw new Error("Failed to update favorite.");
  }
}

// Adds or removes a question from flashcard review.
export async function toggleFlashcard(questionId, currentValue) {
  try {
    const docRef = doc(db, "questions", questionId);
    const nextValue = !currentValue;
    const updateData = {
      isFlashcard: nextValue,
      updatedAt: serverTimestamp(),
    };

    if (nextValue) {
      const existingQuestion = await getQuestionById(questionId);

      if (!existingQuestion?.nextReviewAt) {
        updateData.nextReviewAt = new Date();
      }
    }

    await updateDoc(docRef, updateData);

    return questionId;
  } catch (error) {
    console.error("Error toggling question flashcard:", error);
    throw new Error("Failed to update flashcard setting.");
  }
}

// Changes only the review status for a question.
export async function updateQuestionStatus(questionId, status) {
  try {
    validateStatus(status);

    const docRef = doc(db, "questions", questionId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });

    return questionId;
  } catch (error) {
    console.error("Error updating question status:", error);
    throw new Error(error.message || "Failed to update question status.");
  }
}

// Replaces tags after trimming, lowercasing, and removing duplicates.
export async function updateQuestionTags(questionId, tags) {
  try {
    const docRef = doc(db, "questions", questionId);

    await updateDoc(docRef, {
      tags: normalizeTags(tags),
      updatedAt: serverTimestamp(),
    });

    return questionId;
  } catch (error) {
    console.error("Error updating question tags:", error);
    throw new Error("Failed to update question tags.");
  }
}

// Records a lightweight review without changing status or next due date.
export async function markQuestionReviewed(questionId) {
  try {
    const docRef = doc(db, "questions", questionId);

    await updateDoc(docRef, {
      lastReviewedAt: serverTimestamp(),
      reviewCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    return questionId;
  } catch (error) {
    console.error("Error marking question reviewed:", error);
    throw new Error("Failed to mark question as reviewed.");
  }
}

// MVP search: loads questions and filters locally across text fields and tags.
export async function searchQuestions(keyword) {
  try {
    const normalizedKeyword = (keyword || "").toLowerCase().trim();

    if (!normalizedKeyword) {
      return getAllQuestions();
    }

    const questions = await getAllQuestions();

    return questions.filter((question) => {
      const searchableText = [
        question.title,
        question.answerMarkdown,
        question.difficulty,
        question.status,
        ...(question.tags || []),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedKeyword);
    });
  } catch (error) {
    console.error("Error searching questions:", error);
    throw new Error("Failed to search questions.");
  }
}
