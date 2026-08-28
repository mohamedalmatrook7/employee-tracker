"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface InlineComboboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The trigger button (wired by the caller to toggle `open`). */
  trigger: React.ReactNode;
  /** The dropdown body — typically a <Command> with input + list. */
  children: React.ReactNode;
  className?: string;
}

/**
 * A combobox shell whose dropdown is rendered INLINE in the form flow rather
 * than in a floating portal. On phones and iPad the on-screen keyboard covers a
 * portaled popover and neither the form nor the list can be scrolled to reach
 * the options while typing. Keeping the list in the document flow lets the
 * dialog scroll it up above the keyboard. Closes on an outside tap (this closes
 * only the dropdown, not the surrounding form).
 */
export function InlineCombobox({
  open,
  onOpenChange,
  trigger,
  children,
  className,
}: InlineComboboxProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, onOpenChange]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {trigger}
      {open && (
        <div className="mt-1 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
          {children}
        </div>
      )}
    </div>
  );
}
