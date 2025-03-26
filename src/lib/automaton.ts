
import { Automaton, AutomatonResult, Node, Edge, State, Symbol, Transition, TransitionStep, NodePositions, MarkerType } from "./types";

export function processString(automaton: Automaton, input: string): AutomatonResult {
  const steps: TransitionStep[] = [];
  let currentState = automaton.startState;
  let accepted = false;
  let stepCount = 0;
  let processedInput = "";
  let remainingInput = input;

  // Process each character in the input string
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    
    // Check if the input symbol is in the alphabet
    if (!automaton.alphabet.includes(char)) {
      steps.push({
        step: stepCount,
        fromState: currentState,
        inputSymbol: char,
        toState: "ERROR",
        isActive: false
      });
      processedInput += char;
      remainingInput = input.substring(i + 1);
      break;
    }
    
    const transition = findTransition(automaton, currentState, char);
    
    if (!transition) {
      // If no valid transition is found, the string is rejected
      steps.push({
        step: stepCount,
        fromState: currentState,
        inputSymbol: char,
        toState: "ERROR",
        isActive: false
      });
      processedInput += char;
      remainingInput = input.substring(i + 1);
      break;
    }
    
    steps.push({
      step: stepCount,
      fromState: currentState,
      inputSymbol: char,
      toState: transition.toState,
      isActive: false
    });
    
    currentState = transition.toState;
    processedInput += char;
    remainingInput = input.substring(i + 1);
    stepCount++;
  }
  
  // Check if the final state is an accepting state
  accepted = automaton.acceptingStates.includes(currentState);
  
  return {
    accepted,
    steps,
    currentStep: 0,
    currentState: automaton.startState,
    inputString: input,
    processedInput: processedInput,
    remainingInput: remainingInput
  };
}

export function findTransition(automaton: Automaton, currentState: State, inputSymbol: Symbol): Transition | undefined {
  return automaton.transitions.find(
    (t) => t.fromState === currentState && t.inputSymbol === inputSymbol
  );
}

export function validateAutomaton(automaton: Automaton): { valid: boolean, error?: string } {
  // Check that states array is not empty
  if (automaton.states.length === 0) {
    return { valid: false, error: "States list cannot be empty" };
  }
  
  // Check that start state is in states
  if (!automaton.states.includes(automaton.startState)) {
    return { valid: false, error: "Start state is not in the list of states" };
  }
  
  // Check that accepting states are in states
  for (const state of automaton.acceptingStates) {
    if (!automaton.states.includes(state)) {
      return { valid: false, error: `Accepting state '${state}' is not in the list of states` };
    }
  }
  
  // Check that all transitions use valid states and symbols
  for (const transition of automaton.transitions) {
    if (!automaton.states.includes(transition.fromState)) {
      return { valid: false, error: `Transition uses undefined state '${transition.fromState}'` };
    }
    if (!automaton.states.includes(transition.toState)) {
      return { valid: false, error: `Transition uses undefined state '${transition.toState}'` };
    }
    if (!automaton.alphabet.includes(transition.inputSymbol)) {
      return { valid: false, error: `Transition uses undefined symbol '${transition.inputSymbol}'` };
    }
  }
  
  return { valid: true };
}

export function createGraphElements(automaton: Automaton, activeState?: State, activeTransition?: { from: State, symbol: Symbol }): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Create nodes - ensure all states are included
  automaton.states.forEach(state => {
    nodes.push({
      id: state,
      type: 'state',
      data: {
        label: state,
        isStart: state === automaton.startState,
        isAccepting: automaton.acceptingStates.includes(state),
        isActive: state === activeState
      },
      position: calculateNodePosition(state, automaton.states.length, automaton)
    });
  });
  
  // Create edges with smarter label placement
  const edgesBySourceTarget = new Map<string, number>();
  
  automaton.transitions.forEach(transition => {
    const isActive = activeTransition && 
      activeTransition.from === transition.fromState && 
      activeTransition.symbol === transition.inputSymbol;
    
    // Check for self-loops
    const isSelfLoop = transition.fromState === transition.toState;
    
    // Count edges between same nodes for multi-edge handling
    const edgeKey = `${transition.fromState}-${transition.toState}`;
    const reverseEdgeKey = `${transition.toState}-${transition.fromState}`;
    const edgeCount = edgesBySourceTarget.get(edgeKey) || 0;
    edgesBySourceTarget.set(edgeKey, edgeCount + 1);
    
    // Determine edge type and style
    let edgeType: "smoothstep" | "default" | "straight" | "step" = 'default';
    let style: Record<string, any> = { 
      stroke: isActive ? 'hsl(var(--accent))' : '#333', 
      strokeWidth: isActive ? 2 : 1.5 
    };
    let sourceHandle = undefined;
    let targetHandle = undefined;
    
    if (isSelfLoop) {
      edgeType = 'default';
      style.curvature = 0.5;
      sourceHandle = 'top';
      targetHandle = 'top';
    } else {
      // If there are multiple edges between the same nodes, adjust the curve
      const hasReverseEdge = edgesBySourceTarget.has(reverseEdgeKey);
      if (hasReverseEdge || edgeCount > 0) {
        edgeType = 'smoothstep';
        // Alternating curves for multiple edges
        style.curvature = edgeCount % 2 === 0 ? 0.5 : -0.5;
      }
    }
    
    edges.push({
      id: `${transition.fromState}-${transition.inputSymbol}-${transition.toState}`,
      source: transition.fromState,
      target: transition.toState,
      sourceHandle: sourceHandle,
      targetHandle: targetHandle,
      label: transition.inputSymbol,
      type: edgeType,
      animated: isActive,
      isActive,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: isActive ? 'hsl(var(--accent))' : '#333'
      },
      style: style,
      labelStyle: {
        fill: isActive ? 'hsl(var(--accent))' : '#228B22',
        fontWeight: 'bold',
        fontSize: '14px'
      }
    });
  });
  
  return { nodes, edges };
}

// Helper function to calculate reasonable node positions in a circle
function calculateNodePosition(state: string, totalStates: number, automaton: Automaton): { x: number, y: number } {
  // Default position for a single state
  if (totalStates <= 1) {
    return { x: 250, y: 150 };
  }
  
  // For multiple states, arrange in a circle with more space between nodes
  const stateIndex = automaton.states.indexOf(state);
  
  // Increase radius based on number of states to prevent overlap
  const radius = Math.min(Math.max(totalStates * 50, 180), 300);
  
  // Calculate angle with an offset to start from the top
  const angle = (stateIndex * (2 * Math.PI / totalStates)) + Math.PI/2;
  
  // Center of the canvas
  const centerX = 300;
  const centerY = 200;
  
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  };
}

export function updateGraphPositions(nodes: Node[], positionMap: NodePositions): Node[] {
  return nodes.map(node => {
    const newPos = positionMap[node.id];
    if (newPos) {
      return { 
        ...node, 
        position: newPos 
      };
    }
    return node;
  });
}
