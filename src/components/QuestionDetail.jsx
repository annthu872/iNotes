import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { formatDateShort, formatStatus } from "../utils/uiFormatters";

export default function QuestionDetail({
  question,
  topic,
  onNewQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onToggleFavorite,
}) {
  if (!question) {
    return (
      <section className="detail-panel empty-detail">
        <div className="empty-detail-icon">
          <i className="bi bi-journal-text" />
        </div>
        <h2>Select a question</h2>
        <p>Select a question to view the answer.</p>
        <button type="button" className="primary-button" onClick={onNewQuestion}>
          <i className="bi bi-plus-lg" />
          New Question
        </button>
      </section>
    );
  }

  return (
    <section className="detail-panel">
      <div className="detail-actions">
        <div className="breadcrumb">
          <span>{topic?.name || "Topic"}</span>
          <span>›</span>
          <span>{formatStatus(question.status)}</span>
        </div>
        <div className="action-buttons">
          <button
            type="button"
            className="icon-button"
            title="Edit question"
            onClick={() => onEditQuestion(question)}
          >
            <i className="bi bi-pencil" />
          </button>
          <button
            type="button"
            className="icon-button danger-soft"
            title="Delete question"
            onClick={() => onDeleteQuestion(question)}
          >
            <i className="bi bi-trash3" />
          </button>
          <button
            type="button"
            className="icon-button favorite"
            title="Toggle favorite"
            onClick={() => onToggleFavorite(question)}
          >
            <i className={`bi ${question.isFavorite ? "bi-star-fill" : "bi-star"}`} />
          </button>
        </div>
      </div>

      <div className="detail-title-block">
        <h2>{question.title}</h2>
        <div className="detail-badges">
          <span className="topic-pill">{topic?.name || "No topic"}</span>
          <span className={`status-badge ${question.status || "new"}`}>
            {formatStatus(question.status)}
          </span>
          <span className="difficulty-pill">{formatStatus(question.difficulty || "medium")}</span>
          {question.isFlashcard && (
            <span className="flashcard-pill">
              <i className="bi bi-layers" />
              Flashcard
            </span>
          )}
        </div>
      </div>

      <h3 className="answer-heading">Answer</h3>
      <article className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {question.answerMarkdown || ""}
        </ReactMarkdown>
      </article>

      <footer className="detail-footer">
        <span>
          <i className="bi bi-plus-circle" />
          Created {formatDateShort(question.createdAt)}
        </span>
        <span>
          <i className="bi bi-arrow-repeat" />
          Updated {formatDateShort(question.updatedAt)}
        </span>
      </footer>
    </section>
  );
}
