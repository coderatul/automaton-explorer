
import { useState, useEffect } from "react";
import { Plus, Trash2, Info, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAutomaton } from "@/context/AutomatonContext";
import { State, Symbol, Transition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export function InputSection() {
  const { 
    automaton, 
    updateAutomaton, 
    testString, 
    setTestString, 
    isValidAutomaton,
    automatonError,
    exportAutomaton,
    importAutomaton
  } = useAutomaton();
  
  // Add null check for automaton
  const [statesInput, setStatesInput] = useState("");
  const [alphabetInput, setAlphabetInput] = useState("");

  // Initialize inputs when automaton is available
  useEffect(() => {
    if (automaton) {
      setStatesInput(automaton.states.join(", "));
      setAlphabetInput(automaton.alphabet.join(", "));
    }
  }, [automaton]);
  
  // Exit early if automaton is not defined
  if (!automaton) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-center p-6 space-y-2">
          <h3 className="text-lg font-medium">Loading automaton...</h3>
          <p className="text-sm text-muted-foreground">
            Please wait while the automaton is initialized
          </p>
        </div>
      </div>
    );
  }
  
  const handleStatesInputChange = (value: string) => {
    setStatesInput(value);
  };
  
  const handleStatesBlur = () => {
    const states = parseCommaSeparatedValues(statesInput);
    if (states.length === 0) {
      toast.error("States list cannot be empty");
      return;
    }
    updateAutomaton({ states });
  };
  
  const handleAlphabetInputChange = (value: string) => {
    setAlphabetInput(value);
  };
  
  const handleAlphabetBlur = () => {
    const alphabet = parseCommaSeparatedValues(alphabetInput);
    if (alphabet.length === 0) {
      toast.error("Alphabet cannot be empty");
      return;
    }
    
    // When alphabet changes, validate existing transitions
    const validTransitions = automaton.transitions.filter(
      t => alphabet.includes(t.inputSymbol)
    );
    
    if (validTransitions.length !== automaton.transitions.length) {
      toast.warning("Some transitions were removed because they used symbols no longer in the alphabet");
    }
    
    updateAutomaton({ 
      alphabet,
      transitions: validTransitions 
    });
  };
  
  const handleStartStateChange = (value: string) => {
    updateAutomaton({ startState: value });
  };
  
  const handleAcceptingStateChange = (state: string, isChecked: boolean) => {
    const newAcceptingStates = isChecked
      ? [...automaton.acceptingStates, state]
      : automaton.acceptingStates.filter(s => s !== state);
    
    updateAutomaton({ acceptingStates: newAcceptingStates });
  };
  
  const handleAddTransition = () => {
    if (automaton.states.length === 0 || automaton.alphabet.length === 0) {
      toast.error("You need to define states and alphabet first");
      return;
    }
    
    const defaultTransition: Transition = {
      fromState: automaton.states[0],
      inputSymbol: automaton.alphabet[0],
      toState: automaton.states[0]
    };
    
    updateAutomaton({
      transitions: [...automaton.transitions, defaultTransition]
    });
  };
  
  const handleRemoveTransition = (index: number) => {
    const newTransitions = [...automaton.transitions];
    newTransitions.splice(index, 1);
    updateAutomaton({ transitions: newTransitions });
  };
  
  const handleTransitionChange = (index: number, field: keyof Transition, value: string) => {
    // Validate that the transition uses valid alphabet
    if (field === 'inputSymbol' && !automaton.alphabet.includes(value)) {
      toast.error(`Symbol '${value}' is not in the defined alphabet`);
      return;
    }
    
    const newTransitions = [...automaton.transitions];
    newTransitions[index] = {
      ...newTransitions[index],
      [field]: value
    };
    updateAutomaton({ transitions: newTransitions });
  };
  
  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          importAutomaton(content);
        } catch (error) {
          console.error("Error reading file:", error);
          toast.error("Failed to read file");
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };
  
  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto p-4">
      <div className="flex flex-col space-y-1">
        <h3 className="text-lg font-medium">Define Your Automaton</h3>
        <p className="text-sm text-muted-foreground">
          Enter the components of your finite automaton
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="states">States (comma separated)</Label>
          <Input
            id="states"
            value={statesInput}
            onChange={(e) => handleStatesInputChange(e.target.value)}
            onBlur={handleStatesBlur}
            placeholder="q0, q1, q2, ..."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="alphabet">Alphabet (comma separated)</Label>
          <Input
            id="alphabet"
            value={alphabetInput}
            onChange={(e) => handleAlphabetInputChange(e.target.value)}
            onBlur={handleAlphabetBlur}
            placeholder="a, b, c, ..."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="start-state">Start State</Label>
          <Select
            value={automaton.startState}
            onValueChange={handleStartStateChange}
            disabled={automaton.states.length === 0}
          >
            <SelectTrigger id="start-state">
              <SelectValue placeholder="Select start state" />
            </SelectTrigger>
            <SelectContent>
              {automaton.states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Accepting States</Label>
          <div className="grid grid-cols-3 gap-2 border rounded-md p-2">
            {automaton.states.length === 0 ? (
              <div className="col-span-3 text-sm text-muted-foreground text-center py-2">
                Define states first
              </div>
            ) : (
              automaton.states.map((state) => (
                <div key={state} className="flex items-center space-x-2">
                  <Checkbox
                    id={`accept-${state}`}
                    checked={automaton.acceptingStates.includes(state)}
                    onCheckedChange={(checked) => 
                      handleAcceptingStateChange(state, checked === true)
                    }
                  />
                  <Label htmlFor={`accept-${state}`} className="text-sm cursor-pointer">
                    {state}
                  </Label>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Transitions</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddTransition}
              disabled={automaton.states.length === 0 || automaton.alphabet.length === 0}
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          
          {automaton.transitions.length === 0 ? (
            <div className="border rounded-md p-4 text-center text-sm text-muted-foreground">
              No transitions defined. Click "Add" to create a transition.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto p-1">
              {automaton.transitions.map((transition, index) => (
                <div key={index} className="flex items-center space-x-2 border rounded-md p-2">
                  <Select
                    value={transition.fromState}
                    onValueChange={(value) => handleTransitionChange(index, 'fromState', value)}
                  >
                    <SelectTrigger className="h-8 w-20">
                      <SelectValue placeholder="From" />
                    </SelectTrigger>
                    <SelectContent>
                      {automaton.states.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <span className="text-muted-foreground">→</span>
                  
                  <Select
                    value={transition.inputSymbol}
                    onValueChange={(value) => handleTransitionChange(index, 'inputSymbol', value)}
                  >
                    <SelectTrigger className="h-8 w-16">
                      <SelectValue placeholder="Input" />
                    </SelectTrigger>
                    <SelectContent>
                      {automaton.alphabet.map((symbol) => (
                        <SelectItem key={symbol} value={symbol}>
                          {symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <span className="text-muted-foreground">→</span>
                  
                  <Select
                    value={transition.toState}
                    onValueChange={(value) => handleTransitionChange(index, 'toState', value)}
                  >
                    <SelectTrigger className="h-8 w-20">
                      <SelectValue placeholder="To" />
                    </SelectTrigger>
                    <SelectContent>
                      {automaton.states.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleRemoveTransition(index)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="test-string">Test String</Label>
          <Input
            id="test-string"
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Enter a string to test..."
            className="bg-muted/50"
          />
        </div>
        
        {!isValidAutomaton && automatonError && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/40 text-sm flex items-start space-x-2">
            <Info className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-destructive">{automatonError}</div>
          </div>
        )}
        
        <div className="flex flex-col space-y-2">
          <Label>Import/Export</Label>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={exportAutomaton}
            >
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleImportClick}
            >
              <Upload className="h-4 w-4 mr-1" /> Import
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function parseCommaSeparatedValues(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}
