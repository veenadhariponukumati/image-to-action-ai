/*
 * Design: "Ink & Paper" — Document-Inspired Minimalism
 * Results displayed in stacked full-width cards within a narrow column.
 * Monochrome with indigo accents on icons and priority badges.
 */

import { ResultCard } from "./ResultCard";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/mockData";
import {
  FileText,
  CheckSquare,
  CalendarDays,
  Bell,
  Calendar,
  Sparkles,
} from "lucide-react";

interface ResultsSectionProps {
  results: ActionResult;
  onToggleTask?: (index: number) => void;
}

const priorityStyles = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function ResultsSection({ results, onToggleTask }: ResultsSectionProps) {
  return (
    <section className="w-full space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
          Extracted Actions
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Summary */}
      <ResultCard
        title="Summary"
        icon={<Sparkles size={16} />}
        delay={0}
      >
        <p className="text-sm leading-relaxed text-foreground/80">
          {results.summary}
        </p>
      </ResultCard>

      {/* Extracted Text */}
      <ResultCard
        title="Extracted Text"
        icon={<FileText size={16} />}
        delay={50}
      >
        <pre className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap font-sans">
          {results.extractedText}
        </pre>
      </ResultCard>

      {/* Tasks / Action Items */}
      <ResultCard
        title="Tasks / Action Items"
        icon={<CheckSquare size={16} />}
        delay={100}
      >
        <ul className="space-y-2.5">
          {results.tasks.map((task, i) => (
            <li key={task.id ?? i} className="flex items-start gap-3">
              <Checkbox
                className="mt-0.5"
                checked={task.completed}
                onCheckedChange={() => onToggleTask?.(i)}
              />
              <span
                className={cn(
                  "text-sm flex-1",
                  task.completed ? "text-muted-foreground line-through" : "text-foreground/80"
                )}
              >
                {task.text}
              </span>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${priorityStyles[task.priority]}`}
              >
                {task.priority}
              </span>
            </li>
          ))}
        </ul>
      </ResultCard>

      {/* Dates & Deadlines */}
      <ResultCard
        title="Dates & Deadlines"
        icon={<CalendarDays size={16} />}
        delay={150}
      >
        <div className="space-y-2.5">
          {results.dates.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <span className="text-sm text-foreground/80">{item.label}</span>
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                {item.date}
              </span>
            </div>
          ))}
        </div>
      </ResultCard>

      {/* Reminders */}
      <ResultCard
        title="Reminders"
        icon={<Bell size={16} />}
        delay={200}
      >
        <div className="space-y-2.5">
          {results.reminders.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-foreground/80">{item.text}</p>
                {item.time && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.time}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </ResultCard>

      {/* Calendar Events */}
      <ResultCard
        title="Calendar Events"
        icon={<Calendar size={16} />}
        delay={250}
      >
        <div className="space-y-3">
          {results.calendarEvents.map((event, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-md bg-muted/40 border border-border/50"
            >
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {event.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.date} &middot; {event.time} &middot; {event.duration}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ResultCard>
    </section>
  );
}
