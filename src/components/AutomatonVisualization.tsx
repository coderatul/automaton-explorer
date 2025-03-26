
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Edge as ReactFlowEdge,
  Node as ReactFlowNode,
  NodeChange,
  NodePositionChange,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
  ConnectionLineType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAutomaton } from "@/context/AutomatonContext";
import StateNode from "./StateNode";
import { Edge as AutomatonEdge } from "@/lib/types";
import { RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

// Define custom node types
const nodeTypes = {
  state: StateNode,
};

// Define custom edge styles
const edgeStyles = {
  stroke: '#333',
  strokeWidth: 2,
  edgeStrokeWidth: 2,
  sourceRadius: 1,
};

const darkEdgeStyles = {
  stroke: '#aaa',
  strokeWidth: 2,
  edgeStrokeWidth: 2,
  sourceRadius: 1,
};

// The Flow component is separated from the container to access the ReactFlow hooks
function Flow() {
  const { 
    graphElements, 
    updateNodePositions, 
    storeNodePositions 
  } = useAutomaton();
  const { fitView } = useReactFlow();
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );
  
  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains("dark"));
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);
  
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    // Filter for position changes only
    const positionChanges = changes.filter(
      (change): change is NodePositionChange => 
        change.type === "position" && change.dragging === false
    );
    
    // When a node stops being dragged, update positions in context
    positionChanges.forEach((change) => {
      if (change.position) {
        updateNodePositions(change.id, change.position);
      }
    });
    
    // Store positions when changes are complete
    if (positionChanges.length > 0) {
      storeNodePositions();
    }
  }, [updateNodePositions, storeNodePositions]);
  
  // Convert our custom edges to ReactFlow edges with null check
  const edges = useMemo(() => {
    if (!graphElements || !graphElements.edges) {
      return [];
    }
    
    // Apply default edge styling to all edges
    const styledEdges = graphElements.edges.map(edge => {
      return {
        ...edge,
        type: edge.type || 'default',
        style: {
          ...(isDarkMode ? darkEdgeStyles : edgeStyles),
          ...(edge.style || {}),
          stroke: edge.isActive 
            ? 'hsl(var(--accent))' 
            : (isDarkMode ? '#aaa' : '#333'),
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: edge.isActive 
            ? 'hsl(var(--accent))' 
            : (isDarkMode ? '#aaa' : '#333'),
          ...edge.markerEnd,
        },
        labelStyle: {
          fill: isDarkMode ? '#4ade80' : '#228B22',
          fontWeight: 'bold',
          fontSize: '14px',
          ...edge.labelStyle,
        },
      };
    });
    
    return styledEdges as ReactFlowEdge[];
  }, [graphElements?.edges, isDarkMode]);
  
  // Same for nodes with null check
  const nodes = useMemo(() => {
    if (!graphElements || !graphElements.nodes) {
      return [];
    }
    return graphElements.nodes;
  }, [graphElements?.nodes]);
  
  // Adjust view when graph changes
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.5 }), 50);
    }
  }, [nodes.length, fitView]);
  
  // Handle layout reset
  const resetLayout = useCallback(() => {
    if (fitView) {
      fitView({ padding: 0.5, duration: 800 });
    }
  }, [fitView]);
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.4}
      maxZoom={2}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      proOptions={{ hideAttribution: true }}
      connectionLineType={ConnectionLineType.SmoothStep}
      connectionLineStyle={{
        stroke: isDarkMode ? '#aaa' : '#333',
        strokeWidth: 1.5,
      }}
      defaultEdgeOptions={{
        type: 'smoothstep',
        style: isDarkMode ? darkEdgeStyles : edgeStyles,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: isDarkMode ? '#aaa' : '#333',
        },
        labelStyle: {
          fill: isDarkMode ? '#4ade80' : '#228B22',
          fontWeight: 'bold',
          fontSize: '14px',
        },
      }}
      fitViewOptions={{
        padding: 0.5,
        minZoom: 0.5,
        maxZoom: 1.5,
      }}
    >
      <Background size={1} gap={16} color={isDarkMode ? "#374151" : "#f1f5f9"} />
      <Controls position="bottom-right" showInteractive={false} />
      
      <Panel position="top-right">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetLayout}
          className="flex items-center gap-1"
        >
          <RefreshCw size={16} />
          <span>Reset Layout</span>
        </Button>
      </Panel>
    </ReactFlow>
  );
}

export function AutomatonVisualization() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <h3 className="text-lg font-medium">Automaton Visualization</h3>
      </div>
      
      <div className="flex-1">
        <ReactFlowProvider>
          <Flow />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
