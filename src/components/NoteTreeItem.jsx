import { useState } from "react";
import { getQuestionPreview } from "../utils/searchHelpers";
import { formatStatus } from "../utils/uiFormatters";

export default function NoteTreeItem({
  note,
  topicById,
  selectedNoteId,
  onSelectNote,
  onAddSubnote,
  onEditNote,
  onDeleteNote,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = note.children?.length > 0;
  const topic = topicById.get(note.topicId);
  const preview = getQuestionPreview(
    note.shortAnswer || note.question || note.content || note.answerMarkdown || "",
    96
  );

  return (
    <div className="tree-branch">
      <div className="note-tree-row-wrap">
        <div
          role="button"
          tabIndex={0}
          className={`note-tree-card ${selectedNoteId === note.id ? "selected" : ""}`}
          onClick={() => onSelectNote(note.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelectNote(note.id);
            }
          }}
        >
          <div className="note-tree-card-top">
            <div className="note-tree-card-meta">
              {hasChildren ? (
                <button
                  type="button"
                  className="tree-toggle note-card-toggle"
                  title="Expand or collapse note"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsOpen((current) => !current);
                  }}
                >
                  <i className={`bi ${isOpen ? "bi-chevron-down" : "bi-chevron-right"}`} />
                </button>
              ) : (
                <span className="note-card-toggle-spacer" />
              )}
              <span className="topic-pill">{topic?.name || "No topic"}</span>
            </div>
            <span className={`status-badge ${note.status || "new"}`}>
              {formatStatus(note.status)}
            </span>
          </div>
          <strong>{note.title}</strong>
          {preview && <p>{preview}</p>}
        </div>

        <div className="tree-row-actions note-actions">
          <button
            type="button"
            className="tree-action"
            title={`Add subnote under ${note.title}`}
            onClick={() => onAddSubnote(note)}
          >
            <i className="bi bi-node-plus" />
          </button>
          <button
            type="button"
            className="tree-action"
            title={`Edit ${note.title}`}
            onClick={() => onEditNote(note)}
          >
            <i className="bi bi-pencil" />
          </button>
          <button
            type="button"
            className="tree-action danger-soft"
            title={`Delete ${note.title}`}
            onClick={() => onDeleteNote(note)}
          >
            <i className="bi bi-trash3" />
          </button>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="tree-children note-children">
          {note.children.map((childNote) => (
            <NoteTreeItem
              key={childNote.id}
              note={childNote}
              topicById={topicById}
              selectedNoteId={selectedNoteId}
              onSelectNote={onSelectNote}
              onAddSubnote={onAddSubnote}
              onEditNote={onEditNote}
              onDeleteNote={onDeleteNote}
            />
          ))}
        </div>
      )}
    </div>
  );
}
