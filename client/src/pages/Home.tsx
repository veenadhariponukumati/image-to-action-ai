/*
 * Design: "Ink & Paper" — Document-Inspired Minimalism
 * Single-page layout: narrow centered column (max 720px).
 * Instrument Serif for the main title, Geist Sans for everything else.
 * Pure white canvas, ink-black text, electric indigo (#6366F1) accent.
 * Subtle noise texture overlay. Typographic section dividers.
 */

import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/UploadZone";
import { ResultsSection } from "@/components/ResultsSection";
import { HistorySection } from "@/components/HistorySection";
import { LoadingState } from "@/components/LoadingState";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Zap, ArrowDown, LogOut } from "lucide-react";

export default function Home() {
  const { user, logout } = useAuth();
  const {
    file,
    preview,
    isAnalyzing,
    results,
    isDragOver,
    usedMockData,
    fileInputRef,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleInputChange,
    triggerFileInput,
    extractActions,
    clearFile,
    toggleTask,
    viewExtraction,
  } = useImageUpload();

  return (
    <div className="noise-bg min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="w-full border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Zap size={14} className="text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Image-to-Action
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">
              AI-powered action extraction
            </span>
            {user && (
              <div className="flex items-center gap-2 pl-3 border-l border-border/60">
                <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[140px]">
                  {user.name || user.email}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => logout()}
                  title="Sign out"
                >
                  <LogOut size={14} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-[1]">
        {/* Hero Section */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-foreground">
              Image-to-Action AI
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
              Turn screenshots, handwritten notes, and whiteboards into tasks,
              reminders, and calendar-ready actions.
            </p>
          </div>

          {/* Hero illustration */}
          <div className="mt-10 rounded-xl overflow-hidden border border-border/60">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663465411994/NNeH2ENMCvYd4f5mS7QHaM/hero-abstract-NRroTbk5F9LkWBwcEfgBDs.webp"
              alt="Documents transforming into structured action items"
              className="w-full h-auto"
            />
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-border" />
            <ArrowDown size={14} className="text-muted-foreground" />
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>

        {/* Upload Section */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <div className="mb-6">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Upload an image
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Drop a screenshot, handwritten note, or whiteboard photo to
              extract structured actions.
            </p>
          </div>

          <UploadZone
            preview={preview}
            fileName={file?.name ?? null}
            isDragOver={isDragOver}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClickUpload={triggerFileInput}
            onClear={clearFile}
            fileInputRef={fileInputRef}
            onInputChange={handleInputChange}
          />

          {/* Extract Actions Button */}
          {file && (
            <div className="mt-6 animate-fade-up">
              <Button
                onClick={extractActions}
                disabled={isAnalyzing}
                size="lg"
                className="w-full sm:w-auto px-8 font-medium"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Analyzing image&hellip;
                  </>
                ) : (
                  <>
                    <Zap size={16} className="mr-2" />
                    Extract Actions
                  </>
                )}
              </Button>
            </div>
          )}
        </section>

        {/* Results Section */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
          {isAnalyzing && <LoadingState />}
          {results && !isAnalyzing && (
            <>
              {usedMockData && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 animate-fade-up">
                  <span className="font-medium">Demo mode</span> — Showing sample results. The backend is currently unreachable. Ensure your server is running and accessible.
                </div>
              )}
              <ResultsSection results={results} onToggleTask={toggleTask} />
            </>
          )}
        </section>

        {/* History Section */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
          <HistorySection onSelect={viewExtraction} activeId={results?.id ?? null} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background relative z-[1]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Image-to-Action AI &mdash; Demo
          </p>
          <p className="text-xs text-muted-foreground">
            Ready for backend integration
          </p>
        </div>
      </footer>
    </div>
  );
}
