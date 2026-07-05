import { useEffect, useState } from "react";

const emptyForm = {
  title: "",
  topicId: "",
  answerMarkdown: "",
  difficulty: "medium",
  status: "new",
  isFavorite: false,
  isFlashcard: false,
};

export default function QuestionEditorModal({
  isOpen,
  question,
  topics,
  selectedTopicId,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (question) {
      setFormData({
        title: question.title || "",
        topicId: question.topicId || "",
        answerMarkdown: question.answerMarkdown || "",
        difficulty: question.difficulty || "medium",
        status: question.status || "new",
        isFavorite: question.isFavorite ?? false,
        isFlashcard: question.isFlashcard ?? false,
      });
    } else {
      setFormData({
        ...emptyForm,
        topicId: selectedTopicId || "",
      });
    }

    setError("");
  }, [isOpen, question, selectedTopicId]);

  if (!isOpen) {
    return null;
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormData((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!formData.topicId) {
      setError("Topic is required.");
      return;
    }

    if (!formData.answerMarkdown.trim()) {
      setError("Answer Markdown is required.");
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        ...formData,
      });
    } catch (saveError) {
      setError(saveError.message || "Unable to save question.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="modal-card large-modal">
        <div className="modal-header">
          <h2>{question ? "Edit Question" : "Create Question"}</h2>
          <button type="button" className="icon-button" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Title
            <input name="title" value={formData.title} onChange={handleChange} />
          </label>

          <label>
            Topic
            <select name="topicId" value={formData.topicId} onChange={handleChange}>
              <option value="">Select topic</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Answer Markdown
            <textarea
              name="answerMarkdown"
              value={formData.answerMarkdown}
              onChange={handleChange}
              rows="11"
            />
          </label>

          <div className="form-grid-two">
            <label>
              Difficulty
              <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>

            <label>
              Status
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="new">New</option>
                <option value="learning">Learning</option>
                <option value="need_review">Need Review</option>
                <option value="mastered">Mastered</option>
              </select>
            </label>
          </div>

          <div className="check-row">
            <label>
              <input
                name="isFavorite"
                type="checkbox"
                checked={formData.isFavorite}
                onChange={handleChange}
              />
              Favorite
            </label>
            <label>
              <input
                name="isFlashcard"
                type="checkbox"
                checked={formData.isFlashcard}
                onChange={handleChange}
              />
              Flashcard
            </label>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSaving}>
              Save
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
