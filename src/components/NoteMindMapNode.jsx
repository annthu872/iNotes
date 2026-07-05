import { Handle, Position } from "reactflow";
import { getQuestionPreview } from "../utils/searchHelpers";

export default function NoteMindMapNode({ data, selected }) {
  const preview = getQuestionPreview(
    data.shortAnswer || data.question || data.content || data.answerMarkdown || "",
    84
  );

  return (
    <div className={`mind-node note-mind-node ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div className="mind-node-kicker">Note</div>
      <strong>{data.label}</strong>
      {preview && <p>{preview}</p>}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
