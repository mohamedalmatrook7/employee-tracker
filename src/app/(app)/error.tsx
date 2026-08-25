"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold">{t("error.title")}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {error.message || t("error.desc")}
      </p>
      <Button className="mt-5" onClick={() => reset()}>
        {t("error.retry")}
      </Button>
    </div>
  );
}
