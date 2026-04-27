import { useState } from "react";
import Header from "@/components/Header";
import PromptRenderWizard from "@/components/PromptRenderWizard";
import HistoryPanel from "@/components/HistoryPanel";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const { credits } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header 
        credits={credits} 
        onHistoryOpen={() => setHistoryOpen(true)} 
        showStepper={true}
      />

      {/* Main Content */}
      <main className="px-6 py-10 max-w-5xl mx-auto">
        <PromptRenderWizard />
      </main>

      {/* History Panel */}
      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
