export default function MindMapToolbar({
  topics,
  rootTopicId,
  dragEnabled,
  layoutDirection,
  selectedNodeLabel,
  selectedNodeType,
  onRootTopicChange,
  onRefresh,
  onAutoLayout,
  onFitView,
  onDragToggle,
  onCreateTopic,
  onCreateNote,
  onDrawChild,
}) {
  return (
    <div className="mind-map-toolbar">
      <div className="mind-map-settings">
        <label>
          Root Topic
          <select value={rootTopicId || ""} onChange={(event) => onRootTopicChange(event.target.value || null)}>
            <option value="">All topics</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {"- ".repeat(topic.level || 0)}
                {topic.name}
              </option>
            ))}
          </select>
        </label>

        <label className="inline-check mind-toggle">
          <input
            type="checkbox"
            checked={dragEnabled}
            onChange={(event) => onDragToggle(event.target.checked)}
          />
          Drag nodes
        </label>
      </div>

      <div className="mind-map-actions">
        <button type="button" className="secondary-button" onClick={onCreateTopic}>
          <i className="bi bi-folder-plus" />
          Topic
        </button>
        <button type="button" className="secondary-button" onClick={onCreateNote}>
          <i className="bi bi-journal-plus" />
          Note
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={!selectedNodeLabel}
          onClick={onDrawChild}
          title={
            selectedNodeLabel
              ? `Draw child under ${selectedNodeLabel}`
              : "Select a topic or note first"
          }
        >
          <i className="bi bi-node-plus" />
          {selectedNodeType === "note" ? "Subnote" : "Child"}
        </button>
        <button type="button" className="secondary-button" onClick={onRefresh}>
          <i className="bi bi-arrow-clockwise" />
          Refresh
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onAutoLayout}
          title={
            layoutDirection === "LR"
              ? "Switch to vertical layout"
              : "Switch to horizontal layout"
          }
        >
          <i className="bi bi-diagram-3" />
          {layoutDirection === "LR" ? "Horizontal" : "Vertical"}
        </button>
        <button type="button" className="primary-button" onClick={onFitView}>
          <i className="bi bi-arrows-fullscreen" />
          Fit View
        </button>
      </div>
    </div>
  );
}
