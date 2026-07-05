import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { formatDateShort, formatStatus } from "../utils/uiFormatters";

export default function MindMapInspector({
  selectedItem,
  selectedType,
  topic,
  onOpenInNotes,
  onDrawChild,
}) {
  if (!selectedItem) {
    return (
      <aside className="mind-map-inspector empty">
        <i className="bi bi-cursor" />
        <strong>Select a node</strong>
        <span>Click a topic or note to preview its content here.</span>
      </aside>
    );
  }

  const isNote = selectedType === "note";
  const content = selectedItem.content || selectedItem.answerMarkdown || "";

  return (
    <aside className="mind-map-inspector">
      <div className="mind-inspector-heading">
        <span className={isNote ? "topic-pill" : "status-badge learning"}>
          {isNote ? topic?.name || "No topic" : "Topic"}
        </span>
        {isNote && (
          <span className={`status-badge ${selectedItem.status || "new"}`}>
            {formatStatus(selectedItem.status)}
          </span>
        )}
      </div>

      <h2>{selectedItem.title || selectedItem.name}</h2>

      {!isNote && selectedItem.description && <p>{selectedItem.description}</p>}

      {isNote && selectedItem.question && (
        <section>
          <h3>Question</h3>
          <p>{selectedItem.question}</p>
        </section>
      )}

      {isNote && selectedItem.shortAnswer && (
        <section>
          <h3>Short Answer</h3>
          <p>{selectedItem.shortAnswer}</p>
        </section>
      )}

      {isNote && (
        <section>
          <h3>Content</h3>
          <article className="markdown-body compact">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {content || "No content yet."}
            </ReactMarkdown>
          </article>
        </section>
      )}

      <div className="mind-inspector-meta">
        <span>Updated {formatDateShort(selectedItem.updatedAt)}</span>
      </div>

      <div className="mind-inspector-actions">
        <button type="button" className="secondary-button" onClick={onDrawChild}>
          <i className="bi bi-node-plus" />
          Draw child
        </button>
        <button type="button" className="primary-button" onClick={onOpenInNotes}>
          <i className="bi bi-box-arrow-up-right" />
          Open in Notes
        </button>
      </div>
    </aside>
  );
}
