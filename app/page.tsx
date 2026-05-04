"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { ChatInterface } from "@/components/chat/chat-interface";
import { SummaryPanel } from "@/components/preview/summary-panel";
import { ArtifactPanel } from "@/components/preview/artifact-panel";
import { RotateCcw, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";

export default function Page() {
  const { project, initProject, resetProject, _hasHydrated } = useAppStore();

  // Initialize project only after hydration and if none exists
  useEffect(() => {
    if (_hasHydrated && !project) {
      initProject("New Video Project");
    }
  }, [_hasHydrated, project, initProject]);

  const handleNewProject = () => {
    if (confirm("Start a new project? This will clear all current progress.")) {
      resetProject();
      initProject("New Video Project");
    }
  };

  // Show loading state while hydrating
  if (!_hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/images/tataAI_logo.png"
            alt="TataAI"
            width={48}
            height={48}
            className="rounded-xl"
          />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading your project...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
        <Image
          src="/images/tataAI_logoText.png"
          alt="TataAI"
          width={140}
          height={32}
          className="h-12 w-auto"
          priority
        />
        <div className="flex items-center gap-2">
          <Link href="/test-ig">
            <Button variant="secondary" size="sm" className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white border-0 hover:opacity-90">
              Test IG Upload
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleNewProject}>
            <RotateCcw className="mr-2 h-4 w-4" />
            New Project
          </Button>
          <ModeToggle />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Chat */}
        <div className="flex w-full flex-col border-r border-border lg:w-[55%] xl:w-[60%]">
          <ChatInterface />
        </div>

        {/* Right panel - Preview */}
        <div className="hidden w-[45%] flex-col lg:flex xl:w-[40%] overflow-hidden">
          {/* Top - Summary/Checklist (compact, auto height) */}
          <div className="shrink-0 border-b border-border">
            <SummaryPanel />
          </div>

          {/* Bottom - Current Artifact (scrollable) */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ArtifactPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
