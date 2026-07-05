import { useMemo } from "react";
import TopicTree from "./TopicTree";
import { buildTopicTree } from "../services/topicService";

function getQuestionCount(topic, questions) {
  if (Number.isFinite(topic.questionCount)) {
    return topic.questionCount;
  }

  return questions.filter((question) => question.topicId === topic.id).length;
}

export default function TopicSidebar({
  topics,
  questions,
  selectedTopicId,
  onSelectTopic,
  onNewTopic,
  onAddSubtopic,
  onEditTopic,
  onDeleteTopic,
}) {
  const favoriteCount = topics.filter((topic) => topic.isFavorite).length;
  const topicTree = useMemo(() => buildTopicTree(topics), [topics]);

  return (
    <aside className="topic-sidebar">
      <div className="sidebar-top">
        <div className="sidebar-section-heading">
          <span>TOPICS</span>
          <button type="button" className="mini-button" onClick={onNewTopic}>
            <i className="bi bi-plus-lg" />
            New topic
          </button>
        </div>
        <p className="sidebar-summary">
          {topics.length} categories · {questions.length} questions
        </p>
      </div>

      <nav className="topic-nav">
        <button
          type="button"
          className={`topic-row ${selectedTopicId === null ? "active" : ""}`}
          onClick={() => onSelectTopic(null)}
        >
          <span className="topic-name">All Categories</span>
          <span className="count-badge">{questions.length}</span>
        </button>

        <TopicTree
          topicTree={topicTree}
          notes={questions}
          selectedTopicId={selectedTopicId}
          onSelectTopic={onSelectTopic}
          onAddSubtopic={onAddSubtopic || onEditTopic}
          onEditTopic={onEditTopic}
          onDeleteTopic={onDeleteTopic || onEditTopic}
        />
      </nav>

      <footer className="sidebar-footer">
        <span>© 2025 INote</span>
        {favoriteCount > 0 && <span>{favoriteCount} favorites</span>}
      </footer>
    </aside>
  );
}
