import { useEffect, useState } from "react";
import {
  createNote,
  deleteNote,
  getAllNotes,
  getNotesByTopic,
  toggleFavorite,
  updateNote,
} from "../services/noteService";

const emptyNoteForm = {
  title: "",
  answerMarkdown: "",
  topicId: "",
  difficulty: "medium",
  isFavorite: false,
};

export default function NoteManager({
  topics,
  selectedTopicId,
  onSelectTopic,
  onNotesChanged,
}) {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(emptyNoteForm);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [selectedTopicId]);

  useEffect(() => {
    if (!editingNoteId) {
      setFormData((currentForm) => ({
        ...currentForm,
        topicId: selectedTopicId || currentForm.topicId,
      }));
    }
  }, [selectedTopicId, editingNoteId]);

  async function loadNotes() {
    try {
      const loadedNotes = selectedTopicId
        ? await getNotesByTopic(selectedTopicId)
        : await getAllNotes();

      setNotes(loadedNotes);
      onNotesChanged?.();
    } catch (loadError) {
      setError("Unable to load notes.");
    }
  }

  function handleChange(event) {
    const { name, type, checked, value } = event.target;

    setFormData((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setFormData({
      ...emptyNoteForm,
      topicId: selectedTopicId || "",
    });
    setEditingNoteId(null);
    setError("");
  }

  function startEditing(note) {
    setEditingNoteId(note.id);
    setFormData({
      title: note.title || "",
      answerMarkdown: note.answerMarkdown || "",
      topicId: note.topicId || "",
      difficulty: note.difficulty || "medium",
      isFavorite: note.isFavorite ?? false,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Note title is required.");
      return;
    }

    if (!formData.answerMarkdown.trim()) {
      setError("Note answer is required.");
      return;
    }

    if (!formData.topicId) {
      setError("Please select a topic for this note.");
      return;
    }

    try {
      setIsSaving(true);

      if (editingNoteId) {
        await updateNote(editingNoteId, formData);
      } else {
        await createNote(formData);
      }

      onSelectTopic(formData.topicId);
      resetForm();
      await loadNotes();
    } catch (saveError) {
      setError("Unable to save note.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(noteId) {
    try {
      await deleteNote(noteId);
      await loadNotes();
    } catch (deleteError) {
      setError("Unable to delete note.");
    }
  }

  async function handleFavoriteClick(note) {
    try {
      await toggleFavorite(note.id, note.isFavorite);
      await loadNotes();
    } catch (favoriteError) {
      setError("Unable to update favorite status.");
    }
  }

  return (
    <section className="section">
      <h2>Notes</h2>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Topic
          <select
            name="topicId"
            value={formData.topicId}
            onChange={handleChange}
          >
            <option value="">Select topic</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Title
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="What is platform independence in Java?"
          />
        </label>

        <label>
          Answer Markdown
          <textarea
            name="answerMarkdown"
            value={formData.answerMarkdown}
            onChange={handleChange}
            rows="8"
            placeholder={"Java compiles into **bytecode**.\n\n```java\nSystem.out.println(\"Hello Java\");\n```"}
          />
        </label>

        <label>
          Difficulty
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        <label className="checkbox-label">
          <input
            name="isFavorite"
            type="checkbox"
            checked={formData.isFavorite}
            onChange={handleChange}
          />
          Favorite
        </label>

        {error && <p className="error">{error}</p>}

        <div className="button-row">
          <button type="submit" disabled={isSaving}>
            {editingNoteId ? "Update Note" : "Add Note"}
          </button>
          {editingNoteId && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list">
        {notes.length === 0 && <p className="empty">No notes yet.</p>}
        {notes.map((note) => {
          const topic = topics.find((item) => item.id === note.topicId);

          return (
            <article key={note.id} className="list-item note-item">
              <div>
                <strong>{note.title}</strong>
                <small>
                  {topic?.name || "No topic"} · {note.difficulty || "medium"} ·
                  Reviewed {note.reviewCount || 0} times
                </small>
              </div>

              <div className="item-actions">
                <button type="button" onClick={() => handleFavoriteClick(note)}>
                  {note.isFavorite ? "Unfavorite" : "Favorite"}
                </button>
                <button type="button" onClick={() => startEditing(note)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => handleDelete(note.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
