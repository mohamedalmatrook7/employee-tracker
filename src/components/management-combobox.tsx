"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type ManagementOption = { id: string; name: string };

export type ManagementValue = {
  /** Existing management id, or null when the user typed a brand-new name. */
  id: string | null;
  /** The snapshot name (either the picked one or the newly typed text). */
  name: string;
};

interface ManagementComboboxProps {
  managements: ManagementOption[];
  value: ManagementValue;
  onChange: (value: ManagementValue) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Combobox that lets the supervisor either pick an existing management from
 * their own list or type a brand-new one. A new name is passed up with
 * `id: null`; the server resolves/creates the management row on submit so it
 * becomes reusable next time.
 */
export function ManagementCombobox({
  managements,
  value,
  onChange,
  placeholder = "Select or type a management…",
  disabled,
}: ManagementComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const trimmed = query.trim();
  const exactMatch = managements.find(
    (m) => m.name.toLowerCase() === trimmed.toLowerCase()
  );
  const showCreate = trimmed.length > 0 && !exactMatch;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!value.name && "text-muted-foreground")}>
            {value.name || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command
          filter={(itemValue, search) =>
            itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput
            placeholder="Search or create…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {!showCreate && (
              <CommandEmpty>No management found.</CommandEmpty>
            )}
            {managements.length > 0 && (
              <CommandGroup heading="Your managements">
                {managements.map((m) => (
                  <CommandItem
                    key={m.id}
                    value={m.name}
                    onSelect={() => {
                      onChange({ id: m.id, name: m.name });
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.id === m.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {m.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showCreate && (
              <CommandGroup heading="Create new">
                <CommandItem
                  value={`__create__${trimmed}`}
                  onSelect={() => {
                    onChange({ id: null, name: trimmed });
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create &ldquo;{trimmed}&rdquo;
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
