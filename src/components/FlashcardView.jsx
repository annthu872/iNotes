import { useEffect, useState } from "react";
import MarkdownPreview from "./MarkdownPreview";
import { getFavoriteNotes, markNoteReviewed } from "../services/noteService";

export default function FlashcardView({ refreshKey }) {
  const [favoriteNotes, setFavoriteNotes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadFavoriteNotes();
  }, [refreshKey]);

  async function loadFavoriteNotes() {
    try {
      const loadedNotes = await getFavoriteNotes();
      setFavoriteNotes(loadedNotes);
      setCurrentIndex(0);
      setShowAnswer(false);
      setError("");
    } catch (loadError) {
      setError("Unable to load flashcards.");
    }
  }

  async function handleShowAnswer() {
    const currentNote = favoriteNotes[currentIndex];

    if (!currentNote) {
      return;
    }

    setShowAnswer(true);

    try {
      await markNoteReviewed(currentNote.id);
    } catch (reviewError) {
      setError("Unable to update review count.");
    }
  }

  async function handleNextQuestion() {
    const currentNote = favoriteNotes[currentIndex];

    if (currentNote) {
      try {
        await markNoteReviewed(currentNote.id);
      } catch (reviewError) {
        setError("Unable to update review count.");
      }
    }

    setShowAnswer(false);
    setCurrentIndex((currentValue) =>
      favoriteNotes.length === 0 ? 0 : (currentValue + 1) % favoriteNotes.length
    );
  }

  const currentNote = favoriteNotes[currentIndex];

  return (
    <section className="section">
      <h2>Flashcards</h2>

      {error && <p className="error">{error}</p>}

      {!currentNote && (
        <p className="empty">Mark notes as favorite to create flashcards.</p>
      )}

      {currentNote && (
        <article className="flashcard">
          <p className="counter">
            {currentIndex + 1} of {favoriteNotes.length}
          </p>
          <h3>{currentNote.title}</h3>

          {showAnswer && (
            <div className="answer">
              <MarkdownPreview markdown={currentNote.answerMarkdown || ""} />
            </div>
          )}

          <div className="button-row">
            {!showAnswer && (
              <button type="button" onClick={handleShowAnswer}>
                Show Answer
              </button>
            )}
            <button type="button" className="secondary" onClick={handleNextQuestion}>
              Next Question
            </button>
          </div>
        </article>
      )}
    </section>
  );
}
