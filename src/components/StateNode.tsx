
import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";

interface StateNodeProps {
  id: string;
  data: {
    label: string;
    isStart: boolean;
    isAccepting: boolean;
    isActive: boolean;
  };
}

function StateNode({ id, data }: StateNodeProps) {
  const activeColor = data.isActive ? 'animate-pulse-light text-accent' : '';
  
  return (
    <div className="relative flex items-center justify-center">
      {data.isStart && (
        <div className="absolute -left-10 top-1/2 transform -translate-y-1/2">
          <svg width="30" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12H19M19 12L12 5M19 12L12 19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={data.isActive ? "text-accent" : "text-primary"}
            />
          </svg>
        </div>
      )}
      
      <div className="flex flex-col items-center">
        <svg width="70" height="70" className="relative">
          <circle
            cx="35"
            cy="35"
            r="32"
            className={`${data.isActive ? 'animate-pulse-light' : ''} fill-white dark:fill-slate-800 ${data.isActive ? 'stroke-accent' : 'stroke-primary dark:stroke-slate-300'}`}
            strokeWidth="1.5"
          />
          {data.isAccepting && (
            <circle
              cx="35"
              cy="35"
              r="26"
              fill="none"
              className={`${data.isActive ? 'stroke-accent' : 'stroke-primary dark:stroke-slate-300'}`}
              strokeWidth="1.5"
            />
          )}
        </svg>
        
        <div 
          className={`absolute text-xl font-semibold ${data.isActive ? 'text-accent' : 'text-primary dark:text-slate-200'}`}
        >
          {data.label}
        </div>
        
        {/* State data structure indicator */}
        <div className={`absolute -bottom-6 text-xs ${data.isActive ? 'text-accent' : 'text-muted-foreground'}`}>
          {data.isStart && 'Start'}
          {data.isStart && data.isAccepting && ' & '}
          {data.isAccepting && 'Accepting'}
          {!data.isStart && !data.isAccepting && 'Normal'}
        </div>
      </div>
      
      {/* We need handles in all directions for better edge connections */}
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ visibility: 'hidden' }} 
        id="right"
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ visibility: 'hidden' }} 
        id="left"
      />
      <Handle 
        type="source" 
        position={Position.Top} 
        style={{ visibility: 'hidden' }} 
        id="top"
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ visibility: 'hidden' }} 
        id="top-target"
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ visibility: 'hidden' }} 
        id="bottom"
      />
      <Handle 
        type="target" 
        position={Position.Bottom} 
        style={{ visibility: 'hidden' }} 
        id="bottom-target"
      />
    </div>
  );
}

export default memo(StateNode);
