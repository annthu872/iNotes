import { useMemo, useState } from "react";

function getTopicCount(topic, notes) {
  const topicBranchIds = new Set([topic.id]);

  function collectChildTopicIds(currentTopic) {
    currentTopic.children?.forEach((childTopic) => {
      topicBranchIds.add(childTopic.id);
      collectChildTopicIds(childTopic);
    });
  }

  collectChildTopicIds(topic);

  const branchCount = notes.filter((note) => topicBranchIds.has(note.topicId)).length;

  if (branchCount > 0) {
    return branchCount;
  }

  return Number.isFinite(topic.questionCount) ? topic.questionCount : 0;
}

export default function TopicTreeItem({
  topic,
  notes,
  selectedTopicId,
  onSelectTopic,
  onAddSubtopic,
  onEditTopic,
  onDeleteTopic,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = topic.children?.length > 0;
  const topicCount = useMemo(() => getTopicCount(topic, notes), [topic, notes]);

  return (
    <div className="tree-branch">
      <div className="tree-row-wrap">
        <button
          type="button"
          className="tree-toggle"
          title={hasChildren ? "Expand or collapse topic" : "No subtopics"}
          onClick={() => hasChildren && setIsOpen((current) => !current)}
        >
          {hasChildren ? (
            <i className={`bi ${isOpen ? "bi-chevron-down" : "bi-chevron-right"}`} />
          ) : (
            <span />
          )}
        </button>

        <button
          type="button"
          className={`topic-row tree-main-row ${selectedTopicId === topic.id ? "active" : ""}`}
          onClick={() => onSelectTopic(topic.id)}
          title={topic.name}
        >
          <span className="topic-name-wrap">
            
            <span className="topic-name">{topic.name}</span>
            {topic.isFavorite && <i className="bi bi-star-fill topic-favorite" />}
          </span>
          <span className="count-badge">{topicCount}</span>
        </button>

        <div className="tree-row-actions">
          <button
            type="button"
            className="tree-action"
            title={`Add subtopic under ${topic.name}`}
            onClick={() => onAddSubtopic(topic)}
          >
            <i className="bi bi-node-plus" />
          </button>
          <button
            type="button"
            className="tree-action"
            title={`Edit ${topic.name}`}
            onClick={() => onEditTopic(topic)}
          >
            <i className="bi bi-pencil" />
          </button>
          <button
            type="button"
            className="tree-action danger-soft"
            title={`Delete ${topic.name}`}
            onClick={() => onDeleteTopic(topic)}
          >
            <i className="bi bi-trash3" />
          </button>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="tree-children">
          {topic.children.map((childTopic) => (
            <TopicTreeItem
              key={childTopic.id}
              topic={childTopic}
              notes={notes}
              selectedTopicId={selectedTopicId}
              onSelectTopic={onSelectTopic}
              onAddSubtopic={onAddSubtopic}
              onEditTopic={onEditTopic}
              onDeleteTopic={onDeleteTopic}
            />
          ))}
        </div>
      )}
    </div>
  );
}
