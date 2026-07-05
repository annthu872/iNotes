import dagre from "dagre";

const NODE_WIDTH = 230;
const NODE_HEIGHT = 96;

export function layoutMindMap(nodes, edges, direction = "LR") {
  const graph = new dagre.graphlib.Graph();

  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: direction,
    nodesep: 46,
    ranksep: 78,
    marginx: 24,
    marginy: 24,
  });

  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: node.width || NODE_WIDTH,
      height: node.height || NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  return nodes.map((node) => {
    const graphNode = graph.node(node.id);

    return {
      ...node,
      position: {
        x: graphNode.x - (node.width || NODE_WIDTH) / 2,
        y: graphNode.y - (node.height || NODE_HEIGHT) / 2,
      },
    };
  });
}
