export function buildKnowledgeMindMap({ topics = [], notes = [], rootTopicId = null }) {
  const topicIdsToInclude = new Set();

  if (rootTopicId) {
    topicIdsToInclude.add(rootTopicId);
    topics
      .filter((topic) => topic.pathIds?.includes(rootTopicId))
      .forEach((topic) => topicIdsToInclude.add(topic.id));
  }

  const shouldIncludeTopic = (topic) =>
    !rootTopicId || topicIdsToInclude.has(topic.id);

  const shouldIncludeNote = (note) =>
    !rootTopicId || topicIdsToInclude.has(note.topicId);

  const topicNodes = topics.filter(shouldIncludeTopic).map((topic) => ({
    id: `topic:${topic.id}`,
    type: "topic",
    label: topic.name,
    parentId: topic.parentTopicId ? `topic:${topic.parentTopicId}` : null,
    data: topic,
  }));

  const noteNodes = notes.filter(shouldIncludeNote).map((note) => ({
    id: `note:${note.id}`,
    type: "note",
    label: note.title,
    parentId: note.parentNoteId
      ? `note:${note.parentNoteId}`
      : note.topicId
        ? `topic:${note.topicId}`
        : null,
    data: note,
  }));

  const topicEdges = topics
    .filter((topic) => shouldIncludeTopic(topic) && topic.parentTopicId)
    .map((topic) => ({
      id: `topic:${topic.parentTopicId}->topic:${topic.id}`,
      source: `topic:${topic.parentTopicId}`,
      target: `topic:${topic.id}`,
      relationType: "contains",
    }));

  const topicToNoteEdges = notes
    .filter((note) => shouldIncludeNote(note) && !note.parentNoteId && note.topicId)
    .map((note) => ({
      id: `topic:${note.topicId}->note:${note.id}`,
      source: `topic:${note.topicId}`,
      target: `note:${note.id}`,
      relationType: "contains",
    }));

  const noteEdges = notes
    .filter((note) => shouldIncludeNote(note) && note.parentNoteId)
    .map((note) => ({
      id: `note:${note.parentNoteId}->note:${note.id}`,
      source: `note:${note.parentNoteId}`,
      target: `note:${note.id}`,
      relationType: "contains",
    }));

  return {
    nodes: [...topicNodes, ...noteNodes],
    edges: [...topicEdges, ...topicToNoteEdges, ...noteEdges],
  };
}

export function createKnowledgeEdge(edgeData) {
  return {
    id: edgeData.id,
    sourceId: edgeData.sourceId,
    sourceType: edgeData.sourceType,
    targetId: edgeData.targetId,
    targetType: edgeData.targetType,
    relationType: edgeData.relationType || "related_to",
    label: edgeData.label || "",
  };
}
