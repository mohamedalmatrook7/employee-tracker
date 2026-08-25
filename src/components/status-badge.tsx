import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/lib/database.types";

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge variant={status === "done" ? "done" : "pending"}>
      {status === "done" ? "Done" : "Pending"}
    </Badge>
  );
}
