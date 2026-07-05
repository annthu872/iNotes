import { formatDateShort, formatStatus } from "../utils/uiFormatters";

export default function QuestionInfoPanel({ question, topic }) {
  if (!question) {
    return (
      <section className="side-card">
        <h2>Question Info</h2>
        <p className="empty-copy">Select a question to see metadata.</p>
      </section>
    );
  }

  return (
    <section className="side-card">
      <h2>Question Info</h2>
      <dl className="info-list">
        <div>
          <dt>Topic</dt>
          <dd>{topic?.name || "Not set"}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{formatStatus(question.status)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <span className={`status-badge ${question.status || "new"}`}>
              {formatStatus(question.status)}
            </span>
          </dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{formatDateShort(question.updatedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
