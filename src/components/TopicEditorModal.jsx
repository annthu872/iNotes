import { useEffect, useState } from "react";

const emptyForm = {
  name: "",
  description: "",
  parentTopicId: "",
  color: "#2563eb",
  isFavorite: false,
};

const colorOptions = ["#2563eb", "#16a34a", "#f97316", "#7c3aed", "#0f172a"];

export default function TopicEditorModal({
  isOpen,
  topic,
  topics = [],
  parentTopic,
  onClose,
  onSave,
  onDelete,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(
      topic
        ? {
            name: topic.name || "",
            description: topic.description || "",
            parentTopicId: topic.parentTopicId || "",
            color: topic.color || "#2563eb",
            isFavorite: topic.isFavorite ?? false,
          }
        : {
            ...emptyForm,
            parentTopicId: parentTopic?.id || "",
            color: parentTopic?.color || "#2563eb",
          }
    );
    setError("");
  }, [isOpen, topic, parentTopic]);

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

    if (!formData.name.trim()) {
      setError("Topic name is required.");
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        ...formData,
        parentTopicId: formData.parentTopicId || null,
      });
    } catch (saveError) {
      setError(saveError.message || "Unable to save topic.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setIsSaving(true);
      await onDelete(topic);
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete topic.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="modal-card">
        <div className="modal-header">
          <div>
            <h2>{topic ? "Edit Topic" : parentTopic ? "Create Subtopic" : "Create Topic"}</h2>
            <p>
              {parentTopic
                ? `Creating subtopic under: ${parentTopic.name}`
                : "Create or organize a handbook topic."}
            </p>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Java"
              autoFocus
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional short description"
            />
          </label>

          <label>
            Parent topic
            <select
              name="parentTopicId"
              value={formData.parentTopicId}
              onChange={handleChange}
            >
              <option value="">Root topic</option>
              {topics
                .filter(
                  (candidateTopic) =>
                    !topic ||
                    (candidateTopic.id !== topic.id &&
                      !candidateTopic.pathIds?.includes(topic.id))
                )
                .map((candidateTopic) => (
                  <option key={candidateTopic.id} value={candidateTopic.id}>
                    {"- ".repeat(candidateTopic.level || 0)}
                    {candidateTopic.name}
                  </option>
                ))}
            </select>
          </label>

          <div className="topic-color-picker">
            <label>
              Color
              <input
                name="color"
                type="color"
                value={formData.color}
                onChange={handleChange}
              />
            </label>
            <div className="color-presets" aria-label="Topic color presets">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-swatch ${formData.color === color ? "active" : ""}`}
                  style={{ backgroundColor: color }}
                  title={color}
                  onClick={() =>
                    setFormData((currentForm) => ({
                      ...currentForm,
                      color,
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <div className="topic-preview">
            <span style={{ backgroundColor: formData.color }} />
            <strong>{formData.name.trim() || "Topic preview"}</strong>
          </div>

          <label className="inline-check">
            <input
              name="isFavorite"
              type="checkbox"
              checked={formData.isFavorite}
              onChange={handleChange}
            />
            Favorite topic
          </label>

          {error && <p className="error-text">{error}</p>}

          <div className="modal-actions split">
            {topic && (
              <button
                type="button"
                className="danger-button"
                disabled={isSaving}
                onClick={handleDelete}
              >
                <i className="bi bi-trash3" />
                Delete Topic
              </button>
            )}
            <span />
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSaving}>
              <i className="bi bi-check2" />
              Save
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
