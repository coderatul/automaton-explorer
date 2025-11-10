
import { Automaton, AutomatonResult, Node, Edge, State, Symbol, Transition, TransitionStep, NodePositions, MarkerType, AutomatonType } from "./types";

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

// Check if transitions are deterministic (DFA) or non-deterministic (NFA)
export function isDeterministic(transitions: Transition[]): boolean {
  // Check if there are multiple transitions for the same state-symbol pair
  const transitionMap = new Map<string, Set<string>>();
  
  for (const transition of transitions) {
    const key = `${transition.fromState}-${transition.inputSymbol}`;
    if (!transitionMap.has(key)) {
      transitionMap.set(key, new Set());
    }
    transitionMap.get(key)!.add(transition.toState);
  }
  
  // If any state-symbol pair has multiple destinations, it's non-deterministic
  for (const destinations of transitionMap.values()) {
    if (destinations.size > 1) {
      return false;
    }
  }
  
  return true;
}

// NFA to DFA conversion using subset construction algorithm
export function convertNFAtoDFA(nfa: Automaton): Automaton {
  if (nfa.type === AutomatonType.DFA) {
    return nfa; // Already a DFA, return as is
  }

  // Helper function to get all states reachable from a set of states with a given symbol
  function getNextStates(stateSet: Set<State>, symbol: Symbol): Set<State> {
    const nextStates = new Set<State>();
    for (const state of stateSet) {
      const transitions = nfa.transitions.filter(
        t => t.fromState === state && t.inputSymbol === symbol
      );
      transitions.forEach(t => nextStates.add(t.toState));
    }
    return nextStates;
  }

  // Convert a set of states to a string representation for DFA state naming
  function setToStateName(stateSet: Set<State>): State {
    if (stateSet.size === 0) return "∅";
    return Array.from(stateSet).sort().join(",");
  }

  // Parse a DFA state name back to a set of NFA states
  function stateNameToSet(stateName: State): Set<State> {
    if (stateName === "∅") return new Set();
    return new Set(stateName.split(","));
  }

  const dfaStates: State[] = [];
  const dfaTransitions: Transition[] = [];
  const dfaAcceptingStates: State[] = [];

  // Start with the initial state
  const startStateSet = new Set([nfa.startState]);
  const startStateName = setToStateName(startStateSet);
  
  const unprocessedStates: Set<State>[] = [startStateSet];
  const processedStateNames = new Set<State>();

  while (unprocessedStates.length > 0) {
    const currentStateSet = unprocessedStates.shift()!;
    const currentStateName = setToStateName(currentStateSet);

    if (processedStateNames.has(currentStateName)) {
      continue;
    }

    processedStateNames.add(currentStateName);
    dfaStates.push(currentStateName);

    // Check if this is an accepting state (contains any NFA accepting state)
    const isAccepting = Array.from(currentStateSet).some(state =>
      nfa.acceptingStates.includes(state)
    );
    if (isAccepting) {
      dfaAcceptingStates.push(currentStateName);
    }

    // Process each symbol in the alphabet
    for (const symbol of nfa.alphabet) {
      const nextStateSet = getNextStates(currentStateSet, symbol);
      const nextStateName = setToStateName(nextStateSet);

      // Add transition
      dfaTransitions.push({
        fromState: currentStateName,
        inputSymbol: symbol,
        toState: nextStateName
      });

      // Add to unprocessed if we haven't seen this state yet
      if (!processedStateNames.has(nextStateName)) {
        unprocessedStates.push(nextStateSet);
      }
    }
  }

  return {
    type: AutomatonType.DFA,
    states: dfaStates,
    alphabet: nfa.alphabet,
    transitions: dfaTransitions,
    startState: startStateName,
    acceptingStates: dfaAcceptingStates
  };
}
