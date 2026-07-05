import { useEffect, useMemo, useState } from "react";
import { normalizeTags } from "../utils/searchHelpers";

const emptyForm = {
  title: "",
  question: "",
  shortAnswer: "",
  content: "",
  topicId: "",
  parentNoteId: "",
  tags: "",
  status: "new",
  isFavorite: false,
  isFlashcard: false,
};

function isDescendantNote(optionNote, note) {
  return optionNote.pathIds?.includes(note.id);
}

export default function NoteFormModal({
  isOpen,
  note,
  parentNote,
  selectedTopicId,
  topics,
  notes,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const availableParentNotes = useMemo(
    () =>
      notes.filter((candidateNote) => {
        if (!note) {
          return true;
        }

        return candidateNote.id !== note.id && !isDescendantNote(candidateNote, note);
      }),
    [notes, note]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (note) {
      setFormData({
        title: note.title || "",
        question: note.question || "",
        shortAnswer: note.shortAnswer || "",
        content: note.content || note.answerMarkdown || "",
        topicId: note.topicId || "",
        parentNoteId: note.parentNoteId || "",
        tags: (note.tags || []).join(", "),
        status: note.status || "new",
        isFavorite: note.isFavorite ?? false,
        isFlashcard: note.isFlashcard ?? false,
      });
    } else {
      setFormData({
        ...emptyForm,
        topicId: parentNote?.topicId || selectedTopicId || "",
        parentNoteId: parentNote?.id || "",
      });
    }

    setError("");
  }, [isOpen, note, parentNote, selectedTopicId]);

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
      setError("Note title is required.");
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        ...formData,
        topicId: formData.topicId || null,
        parentNoteId: formData.parentNoteId || null,
        tags: normalizeTags(formData.tags),
      });
    } catch (saveError) {
      setError(saveError.message || "Unable to save note.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="modal-card large-modal">
        <div className="modal-header">
          <div>
            <h2>{note ? "Edit Note" : parentNote ? "Create Subnote" : "Create Note"}</h2>
            <p>
              {parentNote
                ? `Creating subnote under: ${parentNote.title}`
                : "Organize learning content under a topic or another note."}
            </p>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Basic Information</h3>
            <label>
              Title
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="What is Spring Security?"
                autoFocus
              />
            </label>
            <label>
              Question
              <textarea
                name="question"
                rows="3"
                value={formData.question}
                onChange={handleChange}
                placeholder="Write the interview question or problem statement."
              />
            </label>
          </div>

          <div className="form-section">
            <h3>Learning Content</h3>
            <label>
              Short answer
              <textarea
                name="shortAnswer"
                rows="3"
                value={formData.shortAnswer}
                onChange={handleChange}
                placeholder="A short summary for quick review."
              />
            </label>
            <label>
              Full content
              <textarea
                name="content"
                rows="9"
                value={formData.content}
                onChange={handleChange}
                placeholder="Markdown is supported. Use lists, inline code, and fenced code blocks."
              />
            </label>
          </div>

          <div className="form-section">
            <h3>Organization</h3>
            <div className="form-grid-two">
              <label>
                Topic
                <select name="topicId" value={formData.topicId} onChange={handleChange}>
                  <option value="">No topic</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {"- ".repeat(topic.level || 0)}
                      {topic.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Parent note
                <select
                  name="parentNoteId"
                  value={formData.parentNoteId}
                  onChange={handleChange}
                >
                  <option value="">Root note</option>
                  {availableParentNotes.map((candidateNote) => (
                    <option key={candidateNote.id} value={candidateNote.id}>
                      {"- ".repeat(candidateNote.level || 0)}
                      {candidateNote.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-grid-two">
              <label>
                Tags
                <input
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="spring, security, jwt"
                />
              </label>
              <label>
                Status
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="new">New</option>
                  <option value="learning">Learning</option>
                  <option value="known">Known</option>
                  <option value="review">Review</option>
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
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSaving}>
              <i className="bi bi-check2" />
              Save note
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
