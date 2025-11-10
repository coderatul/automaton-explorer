import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Automaton, TransitionStep, SimulationState, SimulationStatus, SimulationSpeed, AutomatonResult, NodePositions, Edge, Node, AutomatonType } from "@/lib/types";
import { processString, validateAutomaton, createGraphElements, updateGraphPositions, convertNFAtoDFA, isDeterministic } from "@/lib/automaton";

interface AutomatonContextType {
  automaton: Automaton;
  updateAutomaton: (updatedAutomaton: Partial<Automaton>) => void;
  setAutomaton: (automaton: Automaton) => void;
  resetAutomaton: () => void;
  testString: string;
  setTestString: (str: string) => void;
  result: AutomatonResult | null;
  simulation: SimulationState;
  startSimulation: () => void;
  stepSimulation: () => void;
  resetSimulation: () => void;
  pauseSimulation: () => void;
  setSimulationSpeed: (speed: SimulationSpeed) => void;
  graphElements: { nodes: Node[], edges: Edge[] };
  nodePositions: NodePositions;
  updateNodePositions: (id: string, position: { x: number, y: number }) => void;
  storeNodePositions: () => void;
  isValidAutomaton: boolean;
  automatonError: string | undefined;
  exportAutomaton: () => void;
  importAutomaton: (json: string) => void;
}

const defaultAutomaton: Automaton = {
  type: AutomatonType.DFA,
  states: [],
  alphabet: [],
  transitions: [],
  startState: "",
  acceptingStates: [],
};

const defaultNodePositions: NodePositions = {};

export const AutomatonContext = createContext<AutomatonContextType>({} as AutomatonContextType);

export const useAutomaton = () => useContext(AutomatonContext);

export const AutomatonProvider = ({ children }: { children: ReactNode }) => {
  const [automaton, setAutomatonState] = useState<Automaton>(defaultAutomaton);
  const [testString, setTestString] = useState<string>("");
  const [result, setResult] = useState<AutomatonResult | null>(null);
  const [simulation, setSimulation] = useState<SimulationState>({
    status: SimulationStatus.IDLE,
    speed: SimulationSpeed.MEDIUM,
    stepIndex: 0
  });
  const [graphElements, setGraphElements] = useState<{ nodes: Node[], edges: Edge[] }>(
    createGraphElements(automaton)
  );
  const [nodePositions, setNodePositions] = useState<NodePositions>(defaultNodePositions);
  const [isValidAutomaton, setIsValidAutomaton] = useState<boolean>(true);
  const [automatonError, setAutomatonError] = useState<string | undefined>(undefined);

  const simulationInterval = useRef<number | null>(null);

  // Validate automaton when it changes
  useEffect(() => {
    const { valid, error } = validateAutomaton(automaton);
    
    // Check if transition table matches the selected type
    if (valid && automaton.transitions.length > 0) {
      const isTransitionsDeterministic = isDeterministic(automaton.transitions);
      
      if (automaton.type === AutomatonType.DFA && !isTransitionsDeterministic) {
        setIsValidAutomaton(false);
        setAutomatonError("You have selected DFA but your transition table is non-deterministic (NFA). Please choose NFA or modify your transitions.");
        return;
      }
    }
    
    setIsValidAutomaton(valid);
    setAutomatonError(error);
    
    // Update graph elements
    const activeState = result && simulation.status !== SimulationStatus.IDLE 
      ? result.steps[simulation.stepIndex]?.toState
      : undefined;
      
    const activeTransition = result && simulation.status !== SimulationStatus.IDLE 
      ? { 
          from: result.steps[simulation.stepIndex]?.fromState,
          symbol: result.steps[simulation.stepIndex]?.inputSymbol
        }
      : undefined;
      
    setGraphElements(createGraphElements(automaton, activeState, activeTransition));
  }, [automaton, result, simulation]);

  // Helper to reset the simulation
  const resetSimulation = useCallback(() => {
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }
    
    setSimulation({
      status: SimulationStatus.IDLE,
      speed: simulation.speed,
      stepIndex: 0
    });
    
    setResult(null);
  }, [simulation.speed]);

  // Start simulation
  const startSimulation = useCallback(() => {
    if (!isValidAutomaton) {
      toast.error("Cannot simulate: " + (automatonError || "Invalid automaton"));
      return;
    }
    
    // If we're already in a simulation and paused, just resume
    if (simulation.status === SimulationStatus.PAUSED && result) {
      setSimulation({
        ...simulation,
        status: SimulationStatus.RUNNING
      });
      return;
    }
    
    // Convert NFA to DFA if needed
    const workingAutomaton = automaton.type === AutomatonType.NFA 
      ? convertNFAtoDFA(automaton)
      : automaton;
    
    if (automaton.type === AutomatonType.NFA) {
      toast.info("NFA converted to DFA for simulation");
    }
    
    // Otherwise, start a new simulation
    const newResult = processString(workingAutomaton, testString);
    setResult(newResult);
    
    setSimulation({
      status: SimulationStatus.RUNNING,
      speed: simulation.speed,
      stepIndex: 0
    });
  }, [automaton, testString, simulation, isValidAutomaton, automatonError, result]);

  // Step through simulation
  const stepSimulation = useCallback(() => {
    if (!isValidAutomaton) {
      toast.error("Cannot simulate: " + (automatonError || "Invalid automaton"));
      return;
    }
    
    // If we don't have a result yet, start a new simulation but in PAUSED state
    if (!result || simulation.status === SimulationStatus.IDLE) {
      // Convert NFA to DFA if needed
      const workingAutomaton = automaton.type === AutomatonType.NFA 
        ? convertNFAtoDFA(automaton)
        : automaton;
      
      if (automaton.type === AutomatonType.NFA) {
        toast.info("NFA converted to DFA for simulation");
      }
      
      const newResult = processString(workingAutomaton, testString);
      setResult(newResult);
      
      setSimulation({
        status: SimulationStatus.PAUSED,
        speed: simulation.speed,
        stepIndex: 0
      });
      return;
    }
    
    // If we're at the end, don't go further
    if (simulation.stepIndex >= result.steps.length - 1) {
      setSimulation({
        ...simulation,
        status: SimulationStatus.FINISHED
      });
      return;
    }
    
    // Otherwise, advance one step
    setSimulation({
      ...simulation,
      status: SimulationStatus.PAUSED,
      stepIndex: simulation.stepIndex + 1
    });
  }, [automaton, testString, result, simulation, isValidAutomaton, automatonError]);

  // Pause simulation
  const pauseSimulation = useCallback(() => {
    setSimulation({
      ...simulation,
      status: SimulationStatus.PAUSED
    });
  }, [simulation]);

  // Run automatic simulation
  useEffect(() => {
    if (simulation.status === SimulationStatus.RUNNING) {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
      
      simulationInterval.current = window.setInterval(() => {
        setSimulation(prev => {
          if (!result || prev.stepIndex >= result.steps.length - 1) {
            clearInterval(simulationInterval.current!);
            return {
              ...prev,
              status: SimulationStatus.FINISHED
            };
          }
          
          return {
            ...prev,
            stepIndex: prev.stepIndex + 1
          };
        });
      }, simulation.speed);
    } else if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }
    
    return () => {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
      }
    };
  }, [simulation.status, simulation.speed, result]);

  // Update automaton
  const updateAutomaton = useCallback((updatedAutomaton: Partial<Automaton>) => {
    setAutomatonState(prev => ({
      ...prev,
      ...updatedAutomaton
    }));
    resetSimulation();
  }, [resetSimulation]);

  // Set entire automaton
  const setAutomaton = useCallback((newAutomaton: Automaton) => {
    setAutomatonState(newAutomaton);
    resetSimulation();
  }, [resetSimulation]);

  // Reset to default
  const resetAutomaton = useCallback(() => {
    setAutomatonState(defaultAutomaton);
    setTestString("");
    resetSimulation();
    setNodePositions(defaultNodePositions);
    toast.success("Automaton reset to default");
  }, [resetSimulation]);

  // Update simulation speed
  const setSimulationSpeed = useCallback((speed: SimulationSpeed) => {
    setSimulation(prev => ({
      ...prev,
      speed
    }));
  }, []);

  // Update node positions when dragged
  const updateNodePositions = useCallback((id: string, position: { x: number, y: number }) => {
    setNodePositions(prev => ({
      ...prev,
      [id]: position
    }));
  }, []);

  // Store new positions in graph
  const storeNodePositions = useCallback(() => {
    setGraphElements(prev => {
      const updatedNodes = updateGraphPositions(prev.nodes, nodePositions);
      return {
        nodes: updatedNodes,
        edges: prev.edges
      };
    });
  }, [nodePositions]);

  // Export automaton
  const exportAutomaton = useCallback(() => {
    const data = {
      automaton,
      testString,
      nodePositions
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'automaton-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Automaton configuration exported");
  }, [automaton, testString, nodePositions]);

  // Import automaton
  const importAutomaton = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      
      if (data.automaton) {
        setAutomatonState(data.automaton);
        
        if (data.testString) {
          setTestString(data.testString);
        }
        
        if (data.nodePositions) {
          setNodePositions(data.nodePositions);
        }
        
        resetSimulation();
        toast.success("Automaton configuration imported successfully");
      } else {
        toast.error("Invalid automaton configuration file");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import: Invalid JSON format");
    }
  }, [resetSimulation]);

  return (
    <AutomatonContext.Provider value={{
      automaton,
      updateAutomaton,
      setAutomaton,
      resetAutomaton,
      testString,
      setTestString,
      result,
      simulation,
      startSimulation,
      stepSimulation,
      resetSimulation,
      pauseSimulation,
      setSimulationSpeed,
      graphElements,
      nodePositions,
      updateNodePositions,
      storeNodePositions,
      isValidAutomaton,
      automatonError,
      exportAutomaton,
      importAutomaton
    }}>
      {children}
    </AutomatonContext.Provider>
  );
};
