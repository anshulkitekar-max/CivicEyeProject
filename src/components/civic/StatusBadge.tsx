import { STATUS_STYLES, type ReportStatus } from "@/lib/civic";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: ReportStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_STYLES[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
