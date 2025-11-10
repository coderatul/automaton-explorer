
export type State = string;
export type Symbol = string;

export enum AutomatonType {
  DFA = "DFA",
  NFA = "NFA"
}

export interface Transition {
  fromState: State;
  inputSymbol: Symbol;
  toState: State;
}

export interface Automaton {
  type: AutomatonType;
  states: State[];
  alphabet: Symbol[];
  transitions: Transition[];
  startState: State;
  acceptingStates: State[];
}

export interface TransitionStep {
  step: number;
  fromState: State;
  inputSymbol: Symbol;
  toState: State;
  isActive: boolean;
}

export interface AutomatonResult {
  accepted: boolean;
  steps: TransitionStep[];
  currentStep: number;
  currentState: State;
  inputString: string;
  processedInput: string;
  remainingInput: string;
}

export enum SimulationStatus {
  IDLE = "idle",
  RUNNING = "running",
  PAUSED = "paused",
  FINISHED = "finished"
}

export enum SimulationSpeed {
  SLOW = 1500,
  MEDIUM = 800,
  FAST = 300
}

export interface SimulationState {
  status: SimulationStatus;
  speed: SimulationSpeed;
  stepIndex: number;
}

export interface Node {
  id: string;
  type: 'state';
  data: {
    label: string;
    isStart: boolean;
    isAccepting: boolean;
    isActive: boolean;
  };
  position: {
    x: number;
    y: number;
  };
}

// Updated Edge interface to be compatible with ReactFlow's Edge type
export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label: string;
  type: 'smoothstep' | 'default' | 'straight' | 'step' | 'smoothstep';
  animated: boolean;
  style?: Record<string, any>;
  labelStyle?: Record<string, any>;
  isActive?: boolean;
  markerEnd?: {
    type: MarkerType;
    width?: number;
    height?: number;
    color?: string;
  };
}

export type NodePositions = Record<string, { x: number, y: number }>;

// Add MarkerType enum to match ReactFlow's expected types
export enum MarkerType {
  Arrow = 'arrow',
  ArrowClosed = 'arrowclosed'
}
