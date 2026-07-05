export default function DeleteConfirmModal({
  isOpen,
  title,
  message,
  onCancel,
  onConfirm,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <section className="modal-card confirm-modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="danger-button" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}
