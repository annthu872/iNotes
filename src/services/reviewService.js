import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore/lite";
import { db } from "../firebase/firebaseConfig";
import { getReadableFirebaseError } from "../utils/firebaseErrorHelpers";
import {
  getFlashcardQuestions,
  getQuestionsByStatus,
} from "./questionService";
import { isDueNow, sevenDaysFromNow, tomorrow } from "../utils/dateHelpers";
import { sortQuestions } from "../utils/searchHelpers";

const reviewAttemptsCollection = collection(db, "reviewAttempts");

const VALID_REVIEW_RESULTS = ["known", "need_review"];

const withDocumentId = (documentSnapshot) => ({
  id: documentSnapshot.id,
  ...documentSnapshot.data(),
});

function validateReviewResult(result) {
  if (!VALID_REVIEW_RESULTS.includes(result)) {
    throw new Error("Review result must be known or need_review.");
  }
}

// Stores one review button click in reviewAttempts.
export async function createReviewAttempt(questionId, result) {
  try {
    if (!questionId) {
      throw new Error("Question id is required.");
    }

    validateReviewResult(result);

    const docRef = await addDoc(reviewAttemptsCollection, {
      questionId,
      result,
      reviewedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating review attempt:", error);
    throw new Error(error.message || "Failed to create review attempt.");
  }
}

// Loads review history for one question, newest attempt first.
export async function getReviewHistory(questionId) {
  try {
    const historyQuery = query(
      reviewAttemptsCollection,
      where("questionId", "==", questionId)
    );
    const querySnapshot = await getDocs(historyQuery);

    return querySnapshot.docs
      .map(withDocumentId)
      .sort((firstAttempt, secondAttempt) => {
        const firstTime = firstAttempt.reviewedAt?.toMillis?.() || 0;
        const secondTime = secondAttempt.reviewedAt?.toMillis?.() || 0;

        return secondTime - firstTime;
      });
  } catch (error) {
    console.error("Error loading review history:", error);
    throw new Error("Failed to load review history.");
  }
}

// Loads flashcards whose nextReviewAt is due now or still empty.
export async function getTodayFlashcards() {
  try {
    const flashcards = await getFlashcardQuestions();
    const dueFlashcards = flashcards.filter((question) =>
      isDueNow(question.nextReviewAt)
    );

    return sortQuestions(dueFlashcards, "review_due");
  } catch (error) {
    console.error("Error loading today's flashcards:", error);
    throw new Error(
      getReadableFirebaseError(error, "Failed to load today's flashcards.")
    );
  }
}

// Handles "I Know This" and schedules the card seven days out.
export async function markAsKnown(questionId) {
  try {
    await createReviewAttempt(questionId, "known");

    const docRef = doc(db, "questions", questionId);
    await updateDoc(docRef, {
      status: "mastered",
      lastReviewedAt: serverTimestamp(),
      nextReviewAt: sevenDaysFromNow(),
      reviewCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error marking question as known:", error);
    throw new Error("Failed to mark question as known.");
  }
}

// Handles "Need Review" and schedules the card for tomorrow.
export async function markAsNeedReview(questionId) {
  try {
    await createReviewAttempt(questionId, "need_review");

    const docRef = doc(db, "questions", questionId);
    await updateDoc(docRef, {
      status: "need_review",
      lastReviewedAt: serverTimestamp(),
      nextReviewAt: tomorrow(),
      reviewCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error marking question as need review:", error);
    throw new Error("Failed to mark question as need review.");
  }
}

// Loads questions currently marked as needing review.
export async function getNeedReviewQuestions() {
  try {
    return getQuestionsByStatus("need_review");
  } catch (error) {
    console.error("Error loading need review questions:", error);
    throw new Error("Failed to load need review questions.");
  }
}
