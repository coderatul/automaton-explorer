
import { AutomatonHeader } from "@/components/AutomatonHeader";
import { InputSection } from "@/components/InputSection";
import { AutomatonVisualization } from "@/components/AutomatonVisualization";
import { OutputSection } from "@/components/OutputSection";
import { ControlsSection } from "@/components/ControlsSection";
import { Footer } from "@/components/Footer";
import { AutomatonProvider } from "@/context/AutomatonContext";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const Index = () => {
  return (
    <AutomatonProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <AutomatonHeader />
        
        <main className="flex-1 p-4">
          <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-10rem)]">
            <ResizablePanel defaultSize={25} minSize={20} maxSize={30} className="glass-panel rounded-l-xl shadow-lg">
              <InputSection />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={50} minSize={40} className="flex flex-col">
              <div className="flex-1 glass-panel mb-2 rounded-tr-xl shadow-lg">
                <AutomatonVisualization />
              </div>
              <div className="glass-panel shadow-lg rounded-br-xl">
                <ControlsSection />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={25} minSize={20} maxSize={30} className="glass-panel rounded-r-xl shadow-lg">
              <OutputSection />
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
        
        <Footer />
      </div>
    </AutomatonProvider>
  );
};

export default Index;
