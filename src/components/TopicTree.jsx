import TopicTreeItem from "./TopicTreeItem";

export default function TopicTree({
  topicTree,
  notes,
  selectedTopicId,
  onSelectTopic,
  onAddSubtopic,
  onEditTopic,
  onDeleteTopic,
}) {
  if (topicTree.length === 0) {
    return (
      <div className="sidebar-empty">
        <strong>No topics yet</strong>
        <span>Create your first topic to organize notes.</span>
      </div>
    );
  }

  return (
    <div className="tree-list">
      {topicTree.map((topic) => (
        <TopicTreeItem
          key={topic.id}
          topic={topic}
          notes={notes}
          selectedTopicId={selectedTopicId}
          onSelectTopic={onSelectTopic}
          onAddSubtopic={onAddSubtopic}
          onEditTopic={onEditTopic}
          onDeleteTopic={onDeleteTopic}
        />
      ))}
    </div>
  );
}
