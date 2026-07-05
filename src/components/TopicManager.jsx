import { useEffect, useState } from "react";
import {
  createTopic,
  deleteTopic,
  getAllTopics,
  updateTopic,
} from "../services/topicService";

const emptyTopicForm = {
  name: "",
  color: "#2563eb",
};

export default function TopicManager({
  topics,
  selectedTopicId,
  onSelectTopic,
  onTopicsChanged,
}) {
  const [formData, setFormData] = useState(emptyTopicForm);
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadTopics();
  }, []);

  async function loadTopics() {
    try {
      const loadedTopics = await getAllTopics();
      onTopicsChanged(loadedTopics);
    } catch (loadError) {
      setError("Unable to load topics. Check your Firebase config.");
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function resetForm() {
    setFormData(emptyTopicForm);
    setEditingTopicId(null);
    setError("");
  }

  function startEditing(topic) {
    setEditingTopicId(topic.id);
    setFormData({
      name: topic.name || "",
      color: topic.color || "#2563eb",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Topic name is required.");
      return;
    }

    try {
      setIsSaving(true);

      if (editingTopicId) {
        await updateTopic(editingTopicId, formData);
      } else {
        await createTopic(formData);
      }

      resetForm();
      await loadTopics();
    } catch (saveError) {
      setError("Unable to save topic.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(topicId) {
    try {
      await deleteTopic(topicId);

      if (selectedTopicId === topicId) {
        onSelectTopic("");
      }

      await loadTopics();
    } catch (deleteError) {
      setError("Unable to delete topic.");
    }
  }

  return (
    <section className="section topic-manager-panel">
      <div className="manager-heading">
        <div>
          <h2>Topics</h2>
          <p>Organize interview questions by category.</p>
        </div>
        <span className="count-badge">{topics.length}</span>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Java"
          />
        </label>

        <label>
          Color
          <input
            name="color"
            type="color"
            value={formData.color}
            onChange={handleChange}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <div className="button-row">
          <button type="submit" disabled={isSaving}>
            <i className={`bi ${editingTopicId ? "bi-check2" : "bi-plus-lg"}`} />
            {editingTopicId ? "Update Topic" : "Add Topic"}
          </button>
          {editingTopicId && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list">
        {topics.length === 0 && <p className="empty">No topics yet.</p>}
        {topics.map((topic) => (
          <article
            key={topic.id}
            className={`list-item ${
              selectedTopicId === topic.id ? "selected" : ""
            }`}
          >
            <button
              type="button"
              className="topic-main"
              onClick={() => onSelectTopic(topic.id)}
            >
              <span
                className="topic-color"
                style={{ backgroundColor: topic.color }}
              />
              <span>
                <strong>{topic.name}</strong>
                <small>{topic.questionCount || 0} questions</small>
              </span>
            </button>

            <div className="item-actions">
              <button type="button" onClick={() => startEditing(topic)}>
                <i className="bi bi-pencil" />
                Edit
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => handleDelete(topic.id)}
              >
                <i className="bi bi-trash3" />
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
