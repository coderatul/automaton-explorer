
import { Play, Pause, StepForward, RotateCcw } from "lucide-react";
import { useAutomaton } from "@/context/AutomatonContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SimulationStatus, SimulationSpeed } from "@/lib/types";

export function ControlsSection() {
  const { 
    simulation, 
    startSimulation, 
    stepSimulation, 
    resetSimulation, 
    pauseSimulation, 
    setSimulationSpeed,
    result
  } = useAutomaton();
  
  // Add null checks
  if (!simulation) {
    return (
      <div className="p-3 flex items-center justify-between bg-background/80 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <Button
            variant="default"
            size="sm"
            onClick={startSimulation}
            className="min-w-[5rem]"
          >
            <Play className="h-4 w-4 mr-1" /> Play
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={stepSimulation}
            disabled={true}
          >
            <StepForward className="h-4 w-4 mr-1" /> Step
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetSimulation}
            disabled={true}
          >
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Speed:</span>
          <Select
            value={SimulationSpeed.MEDIUM.toString()}
            onValueChange={(value) => setSimulationSpeed(parseInt(value) as SimulationSpeed)}
          >
            <SelectTrigger className="w-24 h-8">
              <SelectValue placeholder="Speed" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SimulationSpeed.SLOW.toString()}>Slow</SelectItem>
              <SelectItem value={SimulationSpeed.MEDIUM.toString()}>Medium</SelectItem>
              <SelectItem value={SimulationSpeed.FAST.toString()}>Fast</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }
  
  const isRunning = simulation.status === SimulationStatus.RUNNING;
  const isPaused = simulation.status === SimulationStatus.PAUSED;
  const isFinished = simulation.status === SimulationStatus.FINISHED;
  const hasResult = result !== null;
  
  const handlePlayPause = () => {
    if (isRunning) {
      pauseSimulation();
    } else {
      startSimulation();
    }
  };
  
  const handleStepClick = () => {
    stepSimulation();
  };
  
  const handleResetClick = () => {
    resetSimulation();
  };
  
  const handleSpeedChange = (value: string) => {
    setSimulationSpeed(parseInt(value) as SimulationSpeed);
  };
  
  return (
    <div className="p-3 flex items-center justify-between bg-background/80 backdrop-blur-sm">
      <div className="flex items-center space-x-2">
        <Button
          variant={isRunning ? "secondary" : "default"}
          size="sm"
          onClick={handlePlayPause}
          disabled={isFinished}
          className="min-w-[5rem]"
        >
          {isRunning ? (
            <>
              <Pause className="h-4 w-4 mr-1" /> Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1" /> {isPaused ? "Resume" : "Play"}
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleStepClick}
          disabled={isRunning || isFinished}
        >
          <StepForward className="h-4 w-4 mr-1" /> Step
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetClick}
          disabled={!hasResult}
        >
          <RotateCcw className="h-4 w-4 mr-1" /> Reset
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">Speed:</span>
        <Select
          value={simulation.speed.toString()}
          onValueChange={handleSpeedChange}
        >
          <SelectTrigger className="w-24 h-8">
            <SelectValue placeholder="Speed" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SimulationSpeed.SLOW.toString()}>Slow</SelectItem>
            <SelectItem value={SimulationSpeed.MEDIUM.toString()}>Medium</SelectItem>
            <SelectItem value={SimulationSpeed.FAST.toString()}>Fast</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
