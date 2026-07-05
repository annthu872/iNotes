import { useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { layoutMindMap } from "../utils/mindMapLayout";
import TopicMindMapNode from "./TopicMindMapNode";
import NoteMindMapNode from "./NoteMindMapNode";

const nodeTypes = {
  topic: TopicMindMapNode,
  note: NoteMindMapNode,
};

function MindMapCanvasInner({
  mindMap,
  layoutVersion,
  layoutDirection,
  fitVersion,
  dragEnabled,
  onNodeSelect,
}) {
  const reactFlow = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const flowEdges = useMemo(
    () =>
      mindMap.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#94a3b8", strokeWidth: 1.4 },
      })),
    [mindMap.edges]
  );

  const flowNodes = useMemo(
    () =>
      mindMap.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        data: {
          ...node.data,
          label: node.label,
        },
        position: { x: 0, y: 0 },
      })),
    [mindMap.nodes]
  );

  useEffect(() => {
    setEdges(flowEdges);
    setNodes(layoutMindMap(flowNodes, flowEdges, layoutDirection));
  }, [flowNodes, flowEdges, layoutVersion, layoutDirection, setEdges, setNodes]);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      reactFlow.fitView({ padding: 0.18, duration: 250 });
    });
  }, [fitVersion, nodes.length, reactFlow]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_, node) => onNodeSelect(node)}
      nodesDraggable={dragEnabled}
      nodesConnectable={false}
      elementsSelectable
      fitView
    >
      <Background color="#cbd5e1" gap={18} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export default function MindMapCanvas(props) {
  if (props.mindMap.nodes.length === 0) {
    return (
      <div className="mind-map-empty">
        <i className="bi bi-diagram-3" />
        <strong>No map data yet</strong>
        <span>Create topics and notes to generate a mind map.</span>
      </div>
    );
  }

  return (
    <div className="mind-map-canvas">
      <ReactFlowProvider>
        <MindMapCanvasInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
