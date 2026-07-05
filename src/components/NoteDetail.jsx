import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { formatDateShort, formatStatus } from "../utils/uiFormatters";

export default function NoteDetail({
  note,
  topic,
  onNewNote,
  onEditNote,
  onDeleteNote,
  onAddSubnote,
}) {
  if (!note) {
    return (
      <section className="detail-panel empty-detail">
        <div className="empty-detail-icon">
          <i className="bi bi-journal-text" />
        </div>
        <h2>Select a note</h2>
        <p>Select a note to view the answer.</p>
        <button type="button" className="primary-button" onClick={onNewNote}>
          <i className="bi bi-plus-lg" />
          New Note
        </button>
      </section>
    );
  }

  const content = note.content || note.answerMarkdown || note.shortAnswer || "";

  return (
    <section className="detail-panel">
      <div className="detail-actions">
        <div className="breadcrumb">
          <span>{topic?.name || "No topic"}</span>
          <span>/</span>
          <span>{formatStatus(note.status)}</span>
        </div>
        <div className="action-buttons">
          <button
            type="button"
            className="icon-button"
            title="Add subnote"
            onClick={() => onAddSubnote(note)}
          >
            <i className="bi bi-node-plus" />
          </button>
          <button
            type="button"
            className="icon-button"
            title="Edit note"
            onClick={() => onEditNote(note)}
          >
            <i className="bi bi-pencil" />
          </button>
          <button
            type="button"
            className="icon-button danger-soft"
            title="Delete note"
            onClick={() => onDeleteNote(note)}
          >
            <i className="bi bi-trash3" />
          </button>
        </div>
      </div>

      <div className="detail-title-block">
        <h2>{note.title}</h2>
        <div className="detail-badges">
          <span className="topic-pill">{topic?.name || "No topic"}</span>
          <span className={`status-badge ${note.status || "new"}`}>
            {formatStatus(note.status)}
          </span>
          {note.isFavorite && (
            <span className="flashcard-pill">
              <i className="bi bi-star-fill" />
              Favorite
            </span>
          )}
          {note.isFlashcard && (
            <span className="flashcard-pill">
              <i className="bi bi-layers" />
              Flashcard
            </span>
          )}
        </div>
      </div>

      {note.question && (
        <section className="note-detail-section">
          <h3>Question</h3>
          <p>{note.question}</p>
        </section>
      )}

      {note.shortAnswer && (
        <section className="note-detail-section">
          <h3>Short Answer</h3>
          <p>{note.shortAnswer}</p>
        </section>
      )}

      <h3 className="answer-heading">Full Content</h3>
      <article className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {content || "No content yet."}
        </ReactMarkdown>
      </article>

      {note.tags?.length > 0 && (
        <div className="tag-row large">
          {note.tags.map((tag) => (
            <span key={tag} className="tag-pill">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <footer className="detail-footer">
        <span>
          <i className="bi bi-plus-circle" />
          Created {formatDateShort(note.createdAt)}
        </span>
        <span>
          <i className="bi bi-arrow-repeat" />
          Updated {formatDateShort(note.updatedAt)}
        </span>
      </footer>
    </section>
  );
}
