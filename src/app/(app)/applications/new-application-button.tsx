"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { ApplicationDialog } from "@/components/application-dialog";

/**
 * Header action for the applications page. Opens the application form inline as
 * a modal on the current page — unlike the dashboard's button, which navigates
 * to the dedicated /applications/new route. Opening inline avoids the
 * navigate-away-then-router.back() round-trip that made the form appear to flash
 * open/closed twice when triggered from within the applications section.
 */
export function NewApplicationButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {t("dashboard.newApplication")}
      </Button>
      <ApplicationDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
