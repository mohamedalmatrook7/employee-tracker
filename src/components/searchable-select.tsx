"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

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
import { InlineCombobox } from "@/components/inline-combobox";

export type SearchableOption = { value: string; label: string };

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * A dropdown with a search box inside it — pick one option from a (possibly
 * long) list. Unlike ManagementCombobox it does NOT create new items; it's for
 * choosing from an existing set such as schools or employees. Renders inline so
 * it stays usable behind the mobile keyboard (see {@link InlineCombobox}).
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  id,
}: SearchableSelectProps) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);

  const selected = options.find((o) => o.value === value);

  return (
    <InlineCombobox
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected?.label || placeholder || t("combobox.select")}
          </span>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      }
    >
      <Command
        filter={(itemValue, search) =>
          itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
        }
      >
        <CommandInput
          autoFocus
          placeholder={searchPlaceholder ?? t("combobox.search")}
        />
        <CommandList>
          <CommandEmpty>{emptyText ?? t("combobox.noResults")}</CommandEmpty>
          <CommandGroup>
            {options.map((o) => (
              <CommandItem
                key={o.value}
                value={o.label}
                onSelect={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "me-2 h-4 w-4",
                    value === o.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {o.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </InlineCombobox>
  );
}
