import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-dark/20 bg-white/50 px-6 py-14 text-center">
      <Icon className="h-10 w-10 text-teal/60" strokeWidth={1.5} aria-hidden="true" />
      <p className="font-display text-lg font-medium text-dark">{title}</p>
      {description && <p className="max-w-sm text-sm text-dark/60">{description}</p>}
    </div>
  );
}
