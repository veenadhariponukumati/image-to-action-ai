/*
 * Design: "Ink & Paper" — Document-Inspired Minimalism
 * Cards use thin borders, monochrome palette, indigo accents only on icons.
 * Typography: Geist Sans body, tight spacing, clear hierarchy.
 */

import { type ReactNode } from "react";

interface ResultCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  delay?: number;
}

export function ResultCard({ title, icon, children, delay = 0 }: ResultCardProps) {
  return (
    <div
      className="animate-fade-up border border-border bg-card rounded-lg overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-muted/40">
        <span className="text-primary flex-shrink-0">{icon}</span>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
