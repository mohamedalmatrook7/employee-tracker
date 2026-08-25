"use client";

import { Languages } from "lucide-react";

import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";

/**
 * Toggles the whole UI between Arabic (RTL) and English (LTR). The label always
 * shows the language you'd switch *to*.
 */
export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  const next = locale === "ar" ? "en" : "ar";
  const label = next === "ar" ? t("nav.switchToArabic") : t("nav.switchToEnglish");

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLocale(next)}
      aria-label={`${t("nav.language")}: ${label}`}
      className="gap-2"
    >
      <Languages className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
}
