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

interface CreatableSelectProps {
  /** Existing string options, offered for reuse. */
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Heading shown above the existing-options group. */
  optionsHeading?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Combobox for free-text-with-reuse fields (e.g. نوع المشكلة, or a school name
 * that shouldn't touch the fixed events school list). Pick a previously used
 * value or type a new one; new values are stored as plain text on the record so
 * they show up here for reuse next time. Always opens below the trigger.
 */
export function CreatableSelect({
  options,
  value,
  onChange,
  placeholder,
  optionsHeading,
  disabled,
  id,
}: CreatableSelectProps) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const trimmed = query.trim();
  const exactMatch = options.find(
    (o) => o.toLowerCase() === trimmed.toLowerCase()
  );
  const showCreate = trimmed.length > 0 && !exactMatch;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || placeholder || t("combobox.selectOrType")}
          </span>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
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
              <CommandEmpty>{t("combobox.noResults")}</CommandEmpty>
            )}
            {options.length > 0 && (
              <CommandGroup heading={optionsHeading}>
                {options.map((o) => (
                  <CommandItem
                    key={o}
                    value={o}
                    onSelect={() => {
                      onChange(o);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "me-2 h-4 w-4",
                        value === o ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {o}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showCreate && (
              <CommandGroup heading={t("combobox.createNew")}>
                <CommandItem
                  value={`__create__${trimmed}`}
                  onSelect={() => {
                    onChange(trimmed);
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
