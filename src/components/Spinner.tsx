import { Loader2 } from "lucide-react";

export function Spinner({ label = "Yuklanmoqda..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-dark/60">
      <Loader2 className="h-7 w-7 animate-spin text-teal" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
