import { useMemo, useState } from "react";
import { buildKnowledgeMindMap } from "../services/mindMapService";
import MindMapCanvas from "./MindMapCanvas";
import MindMapInspector from "./MindMapInspector";
import MindMapToolbar from "./MindMapToolbar";

export default function MindMapPage({
  topics,
  notes,
  selectedTopicId,
  onRefresh,
  onOpenMindMapNode,
  onCreateTopic,
  onCreateNote,
  onCreateSubtopic,
  onCreateSubnote,
}) {
  const [rootTopicId, setRootTopicId] = useState(selectedTopicId || "");
  const [selectedNode, setSelectedNode] = useState(null);
  const [dragEnabled, setDragEnabled] = useState(false);
  const [layoutDirection, setLayoutDirection] = useState("LR");
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [fitVersion, setFitVersion] = useState(0);

  const topicById = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic])),
    [topics]
  );

  const noteById = useMemo(
    () => new Map(notes.map((note) => [note.id, note])),
    [notes]
  );

  const mindMap = useMemo(
    () =>
      buildKnowledgeMindMap({
        topics,
        notes,
        rootTopicId: rootTopicId || null,
      }),
    [topics, notes, rootTopicId]
  );

  const selectedNodeType = selectedNode?.id?.split(":")[0] || null;
  const selectedNodeId = selectedNode?.id?.split(":")[1] || null;
  const selectedItem =
    selectedNodeType === "topic"
      ? topicById.get(selectedNodeId)
      : selectedNodeType === "note"
        ? noteById.get(selectedNodeId)
        : null;
  const selectedItemTopic =
    selectedNodeType === "note" ? topicById.get(selectedItem?.topicId) : null;

  function handleNodeSelect(node) {
    setSelectedNode(node);
  }

  function handleCreateNote() {
    const topicId =
      selectedNodeType === "topic"
        ? selectedNodeId
        : selectedNodeType === "note"
          ? selectedItem?.topicId
          : rootTopicId || selectedTopicId || null;

    onCreateNote(topicId);
  }

  function handleDrawChild() {
    if (!selectedItem) {
      return;
    }

    if (selectedNodeType === "topic") {
      onCreateSubtopic(selectedItem);
      return;
    }

    if (selectedNodeType === "note") {
      onCreateSubnote(selectedItem);
    }
  }

  function handleToggleLayoutDirection() {
    setLayoutDirection((currentDirection) => (currentDirection === "LR" ? "TB" : "LR"));
    setLayoutVersion((current) => current + 1);
  }

  return (
    <main className="content-area mind-map-page">
      <MindMapToolbar
        topics={topics}
        rootTopicId={rootTopicId}
        dragEnabled={dragEnabled}
        layoutDirection={layoutDirection}
        selectedNodeLabel={selectedItem?.title || selectedItem?.name || ""}
        selectedNodeType={selectedNodeType}
        onRootTopicChange={setRootTopicId}
        onRefresh={onRefresh}
        onAutoLayout={handleToggleLayoutDirection}
        onFitView={() => setFitVersion((current) => current + 1)}
        onDragToggle={setDragEnabled}
        onCreateTopic={onCreateTopic}
        onCreateNote={handleCreateNote}
        onDrawChild={handleDrawChild}
      />

      <div className="mind-map-workspace">
        <MindMapCanvas
          mindMap={mindMap}
          layoutVersion={layoutVersion}
          layoutDirection={layoutDirection}
          fitVersion={fitVersion}
          dragEnabled={dragEnabled}
          onNodeSelect={handleNodeSelect}
        />

        <MindMapInspector
          selectedItem={selectedItem}
          selectedType={selectedNodeType}
          topic={selectedItemTopic}
          onDrawChild={handleDrawChild}
          onOpenInNotes={() => selectedNode && onOpenMindMapNode(selectedNode)}
        />
      </div>
    </main>
  );
}
