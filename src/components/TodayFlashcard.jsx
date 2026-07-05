import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  getTodayFlashcards,
  markAsKnown,
  markAsNeedReview,
} from "../services/reviewService";
import { getFlashcardQuestions } from "../services/questionService";

export default function TodayFlashcard({ refreshKey, onReviewed }) {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCards();
  }, [refreshKey]);

  async function loadCards() {
    try {
      const dueCards = await getTodayFlashcards();
      const loadedCards = dueCards.length > 0 ? dueCards : await getFlashcardQuestions();
      setCards(loadedCards);
      setCurrentIndex(0);
      setShowAnswer(false);
      setError("");
    } catch (loadError) {
      setError("Unable to load flashcards.");
    }
  }

  function handleNext() {
    setShowAnswer(false);
    setCurrentIndex((currentValue) =>
      cards.length === 0 ? 0 : (currentValue + 1) % cards.length
    );
  }

  async function handleKnown() {
    await markAsKnown(currentCard.id);
    await onReviewed?.();
    handleNext();
  }

  async function handleNeedReview() {
    await markAsNeedReview(currentCard.id);
    await onReviewed?.();
    handleNext();
  }

  const currentCard = cards[currentIndex];

  return (
    <section className="side-card flashcard-card">
      <div className="side-card-heading">
        <h2>Today's Flashcard</h2>
        <span>{cards.length > 0 ? `${currentIndex + 1} / ${cards.length}` : "0 / 0"}</span>
      </div>

      {error && <p className="error-text">{error}</p>}
      {!currentCard && (
        <p className="empty-copy">No flashcards available. Mark a question as flashcard first.</p>
      )}

      {currentCard && (
        <>
          <div className="flashcard-question">
            <span>Question</span>
            <strong>{currentCard.title}</strong>
          </div>

          {!showAnswer && (
            <button type="button" className="primary-button full" onClick={() => setShowAnswer(true)}>
              Show Answer
            </button>
          )}

          {showAnswer && (
            <div className="flashcard-answer">
              <span>Answer</span>
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {currentCard.answerMarkdown || ""}
              </ReactMarkdown>
            </div>
          )}

          <div className="review-buttons">
            <button type="button" className="success-soft" onClick={handleKnown}>
              <i className="bi bi-check2" />
              I Know This
            </button>
            <button type="button" className="warning-soft" onClick={handleNeedReview}>
              <i className="bi bi-exclamation-circle" />
              Need Review
            </button>
            <button type="button" className="secondary-button full" onClick={handleNext}>
              <i className="bi bi-arrow-right" />
              Next Card
            </button>
          </div>
        </>
      )}
    </section>
  );
}
