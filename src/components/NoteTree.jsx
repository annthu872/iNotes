import NoteTreeItem from "./NoteTreeItem";

export default function NoteTree({
  notes,
  noteTree,
  topicById,
  selectedTopic,
  selectedNoteId,
  isLoading,
  onNewNote,
  onSelectNote,
  onAddSubnote,
  onEditNote,
  onDeleteNote,
}) {
  return (
    <section className="question-list-panel note-tree-panel">
      <div className="panel-header">
        <div>
          <h2>Notes</h2>
          <span>
            {selectedTopic ? selectedTopic.name : "All topics"} · {notes.length} visible
          </span>
        </div>
        <button type="button" className="mini-button" onClick={onNewNote}>
          <i className="bi bi-plus-lg" />
          New note
        </button>
      </div>

      {isLoading && <div className="empty-state">Loading notes...</div>}

      {!isLoading && notes.length === 0 && (
        <div className="empty-state">
          <i className="bi bi-journal-plus" />
          <strong>No notes in this topic yet.</strong>
          <span>Add your first note to start building the handbook.</span>
          <button type="button" className="primary-button small" onClick={onNewNote}>
            <i className="bi bi-plus-lg" />
            Add note
          </button>
        </div>
      )}

      {!isLoading && notes.length > 0 && noteTree.length === 0 && (
        <div className="empty-state">No notes match your search.</div>
      )}

      {!isLoading && noteTree.length > 0 && (
        <div className="note-tree-scroll">
          {noteTree.map((note) => (
            <NoteTreeItem
              key={note.id}
              note={note}
              topicById={topicById}
              selectedNoteId={selectedNoteId}
              onSelectNote={onSelectNote}
              onAddSubnote={onAddSubnote}
              onEditNote={onEditNote}
              onDeleteNote={onDeleteNote}
            />
          ))}
        </div>
      )}
    </section>
  );
}
