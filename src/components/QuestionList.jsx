import { getQuestionPreview } from "../utils/searchHelpers";
import { formatDateShort, formatStatus } from "../utils/uiFormatters";

function getTopic(topicId, topics) {
  return topics.find((topic) => topic.id === topicId);
}

export default function QuestionList({
  questions,
  topics,
  selectedQuestionId,
  searchQuery,
  sortType,
  isLoading,
  onSortChange,
  onSelectQuestion,
  onToggleFavorite,
  onNewQuestion,
}) {
  const countLabel =
    questions.length > 0 ? `1-${questions.length} of ${questions.length}` : "0 of 0";

  return (
    <section className="question-list-panel">
      <div className="panel-header">
        <div>
          <h2>Questions</h2>
          <span>{searchQuery ? "Filtered results" : "Interview notebook"}</span>
        </div>
        <div className="list-toolbar">
          <span>{countLabel}</span>
          <select value={sortType} onChange={(event) => onSortChange(event.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="updated">Recently Updated</option>
            <option value="title">Title</option>
            <option value="review_due">Review Due</option>
          </select>
        </div>
      </div>

      <div className="question-list">
        {isLoading && <p className="empty-state">Loading questions...</p>}
        {!isLoading && questions.length === 0 && (
          <div className="empty-state">
            <p>
              {searchQuery
                ? "No questions match your search."
                : "No questions yet. Create your first question."}
            </p>
            <button type="button" className="primary-button small" onClick={onNewQuestion}>
              <i className="bi bi-plus-lg" />
              New Question
            </button>
          </div>
        )}

        {questions.map((question) => {
          const topic = getTopic(question.topicId, topics);
          const isSelected = selectedQuestionId === question.id;

          return (
            <article
              key={question.id}
              className={`question-card ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectQuestion(question.id)}
            >
              <div className="question-card-top">
                <span className="topic-pill">{topic?.name || "No topic"}</span>
                <button
                  type="button"
                  className="star-button"
                  title="Toggle favorite"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleFavorite(question);
                  }}
                >
                  <i className={`bi ${question.isFavorite ? "bi-star-fill" : "bi-star"}`} />
                </button>
              </div>
              <h3>{question.title}</h3>
              <p>{getQuestionPreview(question.answerMarkdown, 95)}</p>
              <div className="question-card-meta">
                <span>
                  <i className="bi bi-calendar3" />
                  {formatDateShort(question.updatedAt || question.createdAt)}
                </span>
                <span className={`status-badge ${question.status || "new"}`}>
                  {formatStatus(question.status)}
                </span>
              </div>
              <div className="question-card-footer">
                <span>{formatStatus(question.difficulty || "medium")}</span>
                {question.isFlashcard && (
                  <span>
                    <i className="bi bi-layers" />
                    Flashcard
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
