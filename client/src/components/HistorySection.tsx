import { trpc, type ExtractionListItem } from "@/lib/trpc";
import { History as HistoryIcon } from "lucide-react";

interface HistorySectionProps {
  onSelect: (extraction: ExtractionListItem) => void;
  activeId?: number | null;
}

export function HistorySection({ onSelect, activeId }: HistorySectionProps) {
  const { data, isLoading } = trpc.extractions.list.useQuery();

  if (isLoading || !data || data.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
          <HistoryIcon size={12} />
          History
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-2">
        {data.map(extraction => {
          const completedCount = extraction.tasks.filter(t => t.completed).length;
          const isActive = activeId === extraction.id;

          return (
            <button
              key={extraction.id}
              onClick={() => onSelect(extraction)}
              className={`w-full text-left border rounded-lg px-4 py-3 transition-colors hover:bg-muted/40 ${
                isActive ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <p className="text-sm font-medium text-foreground truncate">{extraction.summary}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(extraction.createdAt).toLocaleString()} &middot; {completedCount}/
                {extraction.tasks.length} tasks done
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
