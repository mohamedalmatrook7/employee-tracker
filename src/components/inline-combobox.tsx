"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";

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
 * A combobox shell whose dropdown floats as a portaled overlay anchored to the
 * trigger — same positioning as the native Select (`avoidCollisions={false}`,
 * always opens below) — so opening it never reflows the surrounding form, the
 * way an inline expand-in-place list used to. Uses `PopoverAnchor` rather than
 * `PopoverTrigger`: each caller's own trigger button already toggles `open` via
 * its own onClick, so Anchor avoids double-toggling on click.
 */
export function InlineCombobox({
  open,
  onOpenChange,
  trigger,
  children,
  className,
}: InlineComboboxProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <div className={cn("relative", className)}>{trigger}</div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
        className="w-[var(--radix-popper-anchor-width)] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
