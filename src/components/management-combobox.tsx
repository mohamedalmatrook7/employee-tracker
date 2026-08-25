"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
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
  placeholder,
  disabled,
}: ManagementComboboxProps) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const resolvedPlaceholder = placeholder ?? t("combobox.placeholder");

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
            {value.name || resolvedPlaceholder}
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
            placeholder={t("combobox.searchOrCreate")}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {!showCreate && (
              <CommandEmpty>{t("combobox.notFound")}</CommandEmpty>
            )}
            {managements.length > 0 && (
              <CommandGroup heading={t("combobox.yourManagements")}>
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
                        "me-2 h-4 w-4",
                        value.id === m.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {m.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showCreate && (
              <CommandGroup heading={t("combobox.createNew")}>
                <CommandItem
                  value={`__create__${trimmed}`}
                  onSelect={() => {
                    onChange({ id: null, name: trimmed });
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <Plus className="me-2 h-4 w-4" />
                  {t("combobox.create", { name: trimmed })}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
