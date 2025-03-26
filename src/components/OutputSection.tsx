import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useAutomaton } from "@/context/AutomatonContext";
import { SimulationStatus, TransitionStep } from "@/lib/types";
import { ConfettiEffect } from "./ConfettiEffect";

export function OutputSection() {
  const { result, simulation } = useAutomaton();
  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const activeStepRef = useRef<HTMLDivElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Auto-scroll to keep the active step in view
  useEffect(() => {
    if (!simulation || simulation.stepIndex === undefined) return;
    
    if (activeStepRef.current && stepsContainerRef.current) {
      const container = stepsContainerRef.current;
      const activeStep = activeStepRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeStep.getBoundingClientRect();
      
      // Check if active step is fully in view
      if (
        activeRect.top < containerRect.top ||
        activeRect.bottom > containerRect.bottom
      ) {
        // Smooth scroll to element
        activeStep.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [simulation?.stepIndex]);
  
  // Trigger confetti when simulation finishes with accepted state
  useEffect(() => {
    if (
      simulation?.status === SimulationStatus.FINISHED && 
      result?.accepted
    ) {
      setShowConfetti(true);
      // Reset confetti after a delay to allow it to be triggered again
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [simulation?.status, result?.accepted]);
  
  if (!result || !simulation) {
    return (
      <div className="h-full flex flex-col p-4">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">Output & Feedback</h3>
          <p className="text-sm text-muted-foreground">
            Step-by-step simulation results
          </p>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <div className="text-center space-y-3 max-w-xs">
            <p>No simulation results yet</p>
            <p className="text-xs">
              Define your automaton and run the simulation to see results here
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const currentStep = result.steps[simulation.stepIndex];
  const isFinished = simulation.status === SimulationStatus.FINISHED || 
    simulation.stepIndex >= result.steps.length - 1;
  
  return (
    <div className="h-full flex flex-col relative">
      {/* Confetti effect when accepted */}
      <ConfettiEffect active={showConfetti} />
      
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">Output & Feedback</h3>
        <p className="text-sm text-muted-foreground">
          Step-by-step simulation results
        </p>
      </div>
      
      <div className="p-4">
        {isFinished ? (
          <div className={`p-4 rounded-md flex items-center space-x-3 animate-fade-in ${
            result.accepted ? 'bg-success/10' : 'bg-destructive/10'
          }`}>
            {result.accepted ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-success" />
                <div>
                  <p className="font-medium">Accepted!</p>
                  <p className="text-sm text-muted-foreground">
                    The string "{result.inputString}" is accepted by this automaton
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-destructive" />
                <div>
                  <p className="font-medium">Rejected!</p>
                  <p className="text-sm text-muted-foreground">
                    The string "{result.inputString}" is rejected by this automaton
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-md bg-info/10 flex items-center space-x-3">
            <div className="h-3 w-3 rounded-full bg-info animate-pulse" />
            <p className="text-sm">Processing input "{result.inputString}"...</p>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden p-4">
        <div className="text-sm font-medium mb-2">Transition Steps</div>
        
        <div 
          ref={stepsContainerRef}
          className="h-full overflow-y-auto space-y-2 pr-2"
        >
          {result.steps.map((step, index) => (
            <StepItem
              key={index}
              step={step}
              index={index}
              isActive={index === simulation.stepIndex}
              ref={index === simulation.stepIndex ? activeStepRef : null}
            />
          ))}
          
          {result.steps.length === 0 && (
            <div className="text-sm text-muted-foreground text-center p-4">
              No steps to display
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StepItemProps {
  step: TransitionStep;
  index: number;
  isActive: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

const StepItem = React.forwardRef<HTMLDivElement, StepItemProps>(
  ({ step, index, isActive }, ref) => {
    return (
      <div
        ref={ref}
        className={`p-3 rounded-md border transition-all ${
          isActive 
            ? 'bg-accent/10 border-accent shadow-sm' 
            : 'bg-background border-border'
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="text-xs font-medium text-muted-foreground">
            Step {index + 1}
          </div>
          {isActive && (
            <div className="px-2 py-0.5 rounded-full bg-accent/20 text-xs text-accent-foreground">
              Current
            </div>
          )}
        </div>
        <div className="mt-1 font-mono text-sm flex items-center space-x-2">
          <span className={isActive ? 'text-accent font-medium' : ''}>{step.fromState}</span>
          <span className="text-muted-foreground">→</span>
          <span className="px-1.5 py-0.5 bg-muted rounded">{step.inputSymbol}</span>
          <span className="text-muted-foreground">→</span>
          <span className={isActive ? 'text-accent font-medium' : ''}>{step.toState}</span>
        </div>
      </div>
    );
  }
);

StepItem.displayName = 'StepItem';
