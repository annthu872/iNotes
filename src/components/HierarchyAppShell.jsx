import { useEffect, useMemo, useState } from "react";
import TopHeader from "./TopHeader";
import TopicSidebar from "./TopicSidebar";
import StatsCards from "./StatsCards";
import NoteTree from "./NoteTree";
import NoteDetail from "./NoteDetail";
import NoteFormModal from "./NoteFormModal";
import TopicEditorModal from "./TopicEditorModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import MindMapPage from "./MindMapPage";
import {
  createSubtopic,
  createTopic,
  deleteTopic,
  getAllTopics,
  moveTopic,
  updateTopic,
} from "../services/topicService";
import {
  buildNoteTree,
  createNote,
  createSubnote,
  deleteNote,
  getAllNotes,
  moveNote,
  updateNote,
} from "../services/noteService";
import {
  filterQuestionsLocally,
  getDashboardStats,
  sortQuestions,
} from "../utils/searchHelpers";

function countChildren(items, parentField, parentId) {
  return items.filter((item) => item[parentField] === parentId).length;
}

function getTopicBranchIds(topics, topicId) {
  if (!topicId) {
    return null;
  }

  return new Set(
    topics
      .filter((topic) => topic.id === topicId || topic.pathIds?.includes(topicId))
      .map((topic) => topic.id)
  );
}

function getNotesForTopicBranch(notes, topicBranchIds) {
  if (!topicBranchIds) {
    return notes;
  }

  const directNoteIds = new Set(
    notes
      .filter((note) => topicBranchIds.has(note.topicId))
      .map((note) => note.id)
  );

  return notes.filter(
    (note) =>
      directNoteIds.has(note.id) ||
      note.pathIds?.some((ancestorNoteId) => directNoteIds.has(ancestorNoteId))
  );
}

export default function HierarchyAppShell() {
  const [topics, setTopics] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState("notes");
  const [isLoading, setIsLoading] = useState(true);
  const [appError, setAppError] = useState("");

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [parentNote, setParentNote] = useState(null);

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [parentTopic, setParentTopic] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const topicById = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic])),
    [topics]
  );

  const noteById = useMemo(
    () => new Map(notes.map((note) => [note.id, note])),
    [notes]
  );

  const selectedTopic = selectedTopicId ? topicById.get(selectedTopicId) : null;
  const selectedNote = selectedNoteId ? noteById.get(selectedNoteId) : null;

  const notesWithTopicNames = useMemo(
    () =>
      notes.map((note) => ({
        ...note,
        topicName: topicById.get(note.topicId)?.name || "",
      })),
    [notes, topicById]
  );

  const selectedTopicBranchIds = useMemo(
    () =>
      activeView === "notes"
        ? getTopicBranchIds(topics, selectedTopicId)
        : null,
    [topics, selectedTopicId, activeView]
  );

  const notesInSelectedTopicBranch = useMemo(
    () => getNotesForTopicBranch(notesWithTopicNames, selectedTopicBranchIds),
    [notesWithTopicNames, selectedTopicBranchIds]
  );

  const visibleNotes = useMemo(() => {
    const filtered = filterQuestionsLocally(notesInSelectedTopicBranch, {
      keyword: searchQuery,
    });

    return sortQuestions(filtered, "updated");
  }, [notesInSelectedTopicBranch, searchQuery]);

  const noteTree = useMemo(() => buildNoteTree(visibleNotes), [visibleNotes]);

  const dashboardStats = useMemo(() => {
    const stats = getDashboardStats(topics, notes);

    return {
      ...stats,
      totalQuestions: visibleNotes.length,
      totalNeedReview: notes.filter(
        (note) => note.status === "review" || note.status === "need_review"
      ).length,
    };
  }, [topics, notes, visibleNotes.length]);

  useEffect(() => {
    if (activeView !== "notes") {
      return;
    }

    if (visibleNotes.length === 0) {
      setSelectedNoteId(null);
      return;
    }

    const stillVisible = visibleNotes.some((note) => note.id === selectedNoteId);

    if (!selectedNoteId || !stillVisible) {
      setSelectedNoteId(visibleNotes[0].id);
    }
  }, [visibleNotes, selectedNoteId, activeView]);

  async function loadInitialData() {
    try {
      setIsLoading(true);
      setAppError("");
      const [loadedTopics, loadedNotes] = await Promise.all([
        getAllTopics(),
        getAllNotes(),
      ]);

      setTopics(loadedTopics);
      setNotes(loadedNotes);
      setSelectedNoteId(loadedNotes[0]?.id || null);
    } catch (error) {
      setAppError(error.message || "Failed to load handbook data.");
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshData(preferredNoteId) {
    const [loadedTopics, loadedNotes] = await Promise.all([
      getAllTopics(),
      getAllNotes(),
    ]);

    setTopics(loadedTopics);
    setNotes(loadedNotes);

    if (preferredNoteId) {
      setSelectedNoteId(preferredNoteId);
    } else if (!loadedNotes.some((note) => note.id === selectedNoteId)) {
      setSelectedNoteId(loadedNotes[0]?.id || null);
    }
  }

  function openNewNote() {
    setEditingNote(null);
    setParentNote(null);
    setIsNoteModalOpen(true);
  }

  function openNewNoteForTopic(topicId) {
    setSelectedTopicId(topicId || null);
    setEditingNote(null);
    setParentNote(null);
    setIsNoteModalOpen(true);
  }

  function openSubnote(note) {
    setEditingNote(null);
    setParentNote(note);
    setIsNoteModalOpen(true);
  }

  function openEditNote(note) {
    setEditingNote(note);
    setParentNote(null);
    setIsNoteModalOpen(true);
  }

  async function handleSaveNote(noteData) {
    const nextParentId = noteData.parentNoteId || null;
    let savedNoteId = editingNote?.id;

    if (editingNote) {
      await updateNote(editingNote.id, noteData);

      if ((editingNote.parentNoteId || null) !== nextParentId) {
        await moveNote(editingNote.id, nextParentId);
      }
    } else if (nextParentId) {
      savedNoteId = (await createSubnote(nextParentId, noteData)).id;
    } else {
      savedNoteId = (await createNote(noteData)).id;
    }

    setIsNoteModalOpen(false);
    setEditingNote(null);
    setParentNote(null);
    await refreshData(savedNoteId);
  }

  function openNewTopic() {
    setEditingTopic(null);
    setParentTopic(null);
    setIsTopicModalOpen(true);
  }

  function openSubtopic(topic) {
    setEditingTopic(null);
    setParentTopic(topic);
    setIsTopicModalOpen(true);
  }

  function openEditTopic(topic) {
    setEditingTopic(topic);
    setParentTopic(null);
    setIsTopicModalOpen(true);
  }

  async function handleSaveTopic(topicData) {
    const nextParentId = topicData.parentTopicId || null;

    if (editingTopic) {
      await updateTopic(editingTopic.id, topicData);

      if ((editingTopic.parentTopicId || null) !== nextParentId) {
        await moveTopic(editingTopic.id, nextParentId);
      }
    } else if (nextParentId) {
      await createSubtopic(nextParentId, topicData);
    } else {
      await createTopic(topicData);
    }

    setIsTopicModalOpen(false);
    setEditingTopic(null);
    setParentTopic(null);
    await refreshData(selectedNoteId);
  }

  function requestDeleteTopic(topic) {
    const topicBranchIds = getTopicBranchIds(topics, topic.id) || new Set([topic.id]);
    const childCount = topicBranchIds.size - 1;
    const directNoteIds = new Set(
      notes
        .filter((note) => topicBranchIds.has(note.topicId))
        .map((note) => note.id)
    );
    const noteCount = notes.filter(
      (note) =>
        directNoteIds.has(note.id) ||
        note.pathIds?.some((ancestorNoteId) => directNoteIds.has(ancestorNoteId))
    ).length;

    setDeleteTarget({
      type: "topic",
      item: topic,
      title: "Delete this topic?",
      message:
        childCount > 0 || noteCount > 0
          ? `This will delete ${childCount} subtopic(s) and ${noteCount} note/subnote(s). This action cannot be undone.`
          : "This action cannot be undone.",
    });
  }

  function requestDeleteNote(note) {
    const childCount = countChildren(notes, "parentNoteId", note.id);

    setDeleteTarget({
      type: "note",
      item: note,
      title: "Delete this note?",
      message:
        childCount > 0
          ? "This note has subnotes. Safe delete will stop until you delete or move them."
          : "This action cannot be undone.",
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      if (deleteTarget.type === "topic") {
        await deleteTopic(deleteTarget.item.id, { recursive: true });
        const selectedTopic = topics.find((topic) => topic.id === selectedTopicId);

        if (
          selectedTopicId === deleteTarget.item.id ||
          selectedTopic?.pathIds?.includes(deleteTarget.item.id)
        ) {
          setSelectedTopicId(null);
        }
      } else {
        await deleteNote(deleteTarget.item.id);
        if (selectedNoteId === deleteTarget.item.id) {
          setSelectedNoteId(null);
        }
      }

      setDeleteTarget(null);
      await refreshData();
    } catch (error) {
      setAppError(error.message || "Unable to delete item.");
      setDeleteTarget(null);
    }
  }

  function handleMindMapNodeSelect(node) {
    const [nodeType, nodeId] = node.id.split(":");

    if (nodeType === "topic") {
      setSelectedTopicId(nodeId);
      setSelectedNoteId(null);
    }

    if (nodeType === "note") {
      const note = noteById.get(nodeId);
      setSelectedTopicId(note?.topicId || null);
      setSelectedNoteId(nodeId);
    }

    setActiveView("notes");
  }

  return (
    <div className="app-shell">
      <TopHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewQuestion={openNewNote}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {activeView === "mindMap" ? (
        <MindMapPage
          topics={topics}
          notes={notes}
          selectedTopicId={selectedTopicId}
          onRefresh={() => refreshData(selectedNoteId)}
          onOpenMindMapNode={handleMindMapNodeSelect}
          onCreateTopic={openNewTopic}
          onCreateNote={openNewNoteForTopic}
          onCreateSubtopic={openSubtopic}
          onCreateSubnote={openSubnote}
        />
      ) : (
        <div className="main-layout">
          <TopicSidebar
            topics={topics}
            questions={notes}
            selectedTopicId={selectedTopicId}
            onSelectTopic={setSelectedTopicId}
            onNewTopic={openNewTopic}
            onAddSubtopic={openSubtopic}
            onEditTopic={openEditTopic}
            onDeleteTopic={requestDeleteTopic}
          />

          <main className="content-area">
            {appError && <div className="app-alert">{appError}</div>}
            <StatsCards stats={dashboardStats} />

            {activeView === "topics" ? (
              <section className="detail-panel topic-focus-panel">
                <div className="detail-actions">
                  <div>
                    <h2>{selectedTopic?.name || "Topic management"}</h2>
                    <p>
                      {selectedTopic
                        ? "Edit this topic or add nested subtopics from the sidebar."
                        : "Select a topic to view its details."}
                    </p>
                  </div>
                  <div className="action-buttons">
                    <button type="button" className="primary-button" onClick={openNewTopic}>
                      <i className="bi bi-plus-lg" />
                      Root topic
                    </button>
                    {selectedTopic && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => openSubtopic(selectedTopic)}
                      >
                        <i className="bi bi-node-plus" />
                        Subtopic
                      </button>
                    )}
                  </div>
                </div>

                {selectedTopic ? (
                  <div className="topic-detail-grid">
                    <div>
                      <span>Name</span>
                      <strong>{selectedTopic.name}</strong>
                    </div>
                    <div>
                      <span>Description</span>
                      <strong>{selectedTopic.description || "No description"}</strong>
                    </div>
                    <div>
                      <span>Level</span>
                      <strong>{selectedTopic.level || 0}</strong>
                    </div>
                    <div>
                      <span>Subtopics</span>
                      <strong>
                        {countChildren(topics, "parentTopicId", selectedTopic.id)}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">Select a topic to manage it.</div>
                )}
              </section>
            ) : (
              <div className="work-area hierarchy-work-area">
                <NoteTree
                  notes={visibleNotes}
                  noteTree={noteTree}
                  topicById={topicById}
                  selectedTopic={selectedTopic}
                  selectedNoteId={selectedNoteId}
                  isLoading={isLoading}
                  onNewNote={openNewNote}
                  onSelectNote={setSelectedNoteId}
                  onAddSubnote={openSubnote}
                  onEditNote={openEditNote}
                  onDeleteNote={requestDeleteNote}
                />

                <NoteDetail
                  note={selectedNote}
                  topic={selectedNote ? topicById.get(selectedNote.topicId) : selectedTopic}
                  onNewNote={openNewNote}
                  onEditNote={openEditNote}
                  onDeleteNote={requestDeleteNote}
                  onAddSubnote={openSubnote}
                />
              </div>
            )}
          </main>
        </div>
      )}

      <NoteFormModal
        isOpen={isNoteModalOpen}
        note={editingNote}
        parentNote={parentNote}
        selectedTopicId={selectedTopicId}
        topics={topics}
        notes={notes}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
      />

      <TopicEditorModal
        isOpen={isTopicModalOpen}
        topic={editingTopic}
        topics={topics}
        parentTopic={parentTopic}
        onClose={() => setIsTopicModalOpen(false)}
        onSave={handleSaveTopic}
        onDelete={requestDeleteTopic}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.title}
        message={deleteTarget?.message}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
