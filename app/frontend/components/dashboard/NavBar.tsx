"use client";

import React from "react";
import {
  PanelRightOpen,
  PanelRightClose,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface NavBarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  aiOpen: boolean;
  setAiOpen: React.Dispatch<React.SetStateAction<boolean>>;
  copilotWidth?: number;
  isCopilotDragging?: boolean;
}

export function NavBar({
  sidebarOpen,
  setSidebarOpen,
  aiOpen,
  setAiOpen,
  copilotWidth = 446,
  isCopilotDragging = false,
}: NavBarProps) {
  return (
    <header
      style={{
        marginRight: aiOpen ? `${copilotWidth}px` : 0,
        transition: isCopilotDragging
          ? "none"
          : "margin-right 200ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      className="sticky top-0 z-40 bg-card border-b border-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          className="group relative flex items-center justify-center rounded-lg border border-border bg-muted/80 h-7 w-7 p-0 text-foreground transition-all hover:border-primary/60 hover:text-primary"
        >
          <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-popover px-1.5 py-0.5 text-[10px] text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
            {sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          </span>
          {sidebarOpen ? (
            <PanelLeftClose className="h-3.5 w-3.5 text-foreground" />
          ) : (
            <PanelLeftOpen className="h-3.5 w-3.5 text-foreground" />
          )}
        </button>

      </div>
      {/* Right Action Controls */}
      <div className="flex items-center gap-3 font-mono text-xs">
        <button
          type="button"
          onClick={() => setAiOpen((open) => !open)}
          aria-label={aiOpen ? "Close secondary sidebar" : "Open secondary sidebar"}
          title={aiOpen ? "Close secondary sidebar" : "Open secondary sidebar"}
          className="group relative flex items-center justify-center rounded-lg border border-border/80 bg-muted/90 h-8 w-8 p-0 text-zinc-100 transition-all hover:border-primary/60 hover:text-primary hover:bg-muted"
        >
          <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 font-semibold">
            {aiOpen ? "Close secondary sidebar" : "Open secondary sidebar"}
          </span>
          {aiOpen ? (
            <PanelRightClose className="h-4 w-4 text-zinc-100 group-hover:text-primary" />
          ) : (
            <PanelRightOpen className="h-4 w-4 text-zinc-100 group-hover:text-primary" />
          )}
        </button>
      </div>
    </header>
  );
}
