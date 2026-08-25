"use client";

import { Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PrintToolbar({ pdfHref }: { pdfHref?: string }) {
  return (
    <div className="no-print mb-6 flex items-center justify-between border-b pb-4">
      <p className="text-sm text-muted-foreground">
        Print-friendly report. Use your browser&apos;s print dialog or save as
        PDF.
      </p>
      <div className="flex gap-2">
        {pdfHref && (
          <Button variant="outline" size="sm" asChild>
            <a href={pdfHref} download>
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          </Button>
        )}
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>
    </div>
  );
}
