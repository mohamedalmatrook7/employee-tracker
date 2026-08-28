"use client";

import { useI18n } from "@/lib/i18n/provider";
import { CreatableSelect } from "@/components/creatable-select";

interface ProblemTypeComboboxProps {
  /** Distinct problem types already used, offered for reuse. */
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Combobox for نوع المشكلة: pick a previously used problem type or type a new
 * one. Thin wrapper over {@link CreatableSelect} — a type becomes reusable here
 * once a notice with it is saved.
 */
export function ProblemTypeCombobox({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  id,
}: ProblemTypeComboboxProps) {
  const { t } = useI18n();
  return (
    <CreatableSelect
      id={id}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder ?? t("noticeDialog.selectProblemType")}
      optionsHeading={t("noticeDialog.problemTypesHeading")}
      disabled={disabled}
    />
  );
}
