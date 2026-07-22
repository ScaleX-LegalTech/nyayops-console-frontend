import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// "backend" is this workspace's core/system-of-record API - labeled "Main" here since
// that's how operators think of it day-to-day, distinct from CDE (the scraper service).
const SERVICE_LABELS: Record<string, string> = {
  backend: "Main",
  cde: "CDE",
};

export function serviceLabel(service: string): string {
  return SERVICE_LABELS[service] ?? service;
}

export function ServiceSection({
  service,
  status,
  children,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
}: {
  service: string;
  status?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 py-1 text-left">
        <ChevronDown className={cn("size-4 transition-transform", !open && "-rotate-90")} />
        <h2 className="text-sm font-medium">{serviceLabel(service)}</h2>
        {status && (
          <Badge variant={status === "ok" ? "success" : "destructive"} className="ml-1">
            {status}
          </Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}
