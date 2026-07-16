/*
 * Design: "Ink & Paper" — Document-Inspired Minimalism
 * Loading state uses an indigo scanning line (like a document scanner).
 * Skeleton cards appear below with staggered fade-in.
 */

export function LoadingState() {
  return (
    <div className="w-full space-y-4 animate-fade-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
          Analyzing image&hellip;
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Scanning progress bar */}
      <div className="w-full h-0.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-primary rounded-full scan-line" />
      </div>

      {/* Skeleton cards */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="border border-border rounded-lg overflow-hidden animate-fade-up"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-muted/40">
            <div className="w-4 h-4 rounded bg-muted animate-pulse" />
            <div className="w-28 h-3.5 rounded bg-muted animate-pulse" />
          </div>
          <div className="px-5 py-4 space-y-2.5">
            <div className="w-full h-3 rounded bg-muted/60 animate-pulse" />
            <div className="w-4/5 h-3 rounded bg-muted/60 animate-pulse" />
            <div className="w-3/5 h-3 rounded bg-muted/60 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
