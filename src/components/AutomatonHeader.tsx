
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AutomatonHeader() {
  return (
    <header className="w-full h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-medium">Automaton Explorer</h1>
      </div>
      <div className="flex items-center space-x-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
