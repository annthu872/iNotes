import { Handle, Position } from "reactflow";

export default function TopicMindMapNode({ data, selected }) {
  return (
    <div className={`mind-node topic-mind-node ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div className="mind-node-kicker">Topic</div>
      <strong>{data.label}</strong>
      {data.description && <p>{data.description}</p>}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
