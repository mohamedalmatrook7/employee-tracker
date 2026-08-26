"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  createManagement,
  renameManagement,
  deleteManagement,
} from "@/lib/actions/managements";
import { useManagements, type ManagementRow } from "@/lib/use-managements";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Row = ManagementRow;

export function ManagementsManager() {
  const router = useRouter();
  const { t } = useI18n();
  const managements = useManagements();
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState<Row | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    const res = await createManagement({ name });
    setAdding(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(t("managements.added"));
    setNewName("");
  }

  async function handleRename() {
    if (!editing) return;
    setSavingEdit(true);
    const res = await renameManagement(editing.id, { name: editName.trim() });
    setSavingEdit(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(t("managements.renamed"));
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("managements.addCard")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              placeholder={t("managements.namePlaceholder")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={120}
              dir="auto"
            />
            <Button type="submit" disabled={adding || !newName.trim()}>
              <Plus className="h-4 w-4" />
              {t("common.add")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {managements === null ? (
        <div className="space-y-2 rounded-lg border bg-background p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted/60" />
          ))}
        </div>
      ) : managements.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t("managements.none.title")}
          description={t("managements.none.desc")}
        />
      ) : (
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead className="w-32">
                  {t("managements.colApplications")}
                </TableHead>
                <TableHead className="w-16 text-end">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managements.map((m) => (
                <TableRow
                  key={m.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/managements/${m.id}`)}
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/managements/${m.id}`}
                      className="flex items-center justify-center gap-1 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {m.name}
                      <ArrowRight className="h-3 w-3 text-muted-foreground rtl:-scale-x-100" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.usageCount}
                  </TableCell>
                  <TableCell
                    className="text-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t("common.actions")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(m);
                            setEditName(m.name);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          {t("common.rename")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setDeleting(m)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Rename dialog */}
      <Dialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("managements.renameTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="editName">{t("common.name")}</Label>
            <Input
              id="editName"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={120}
              dir="auto"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleRename}
              disabled={savingEdit || !editName.trim()}
            >
              {savingEdit ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("managements.deleteTitle", { name: deleting?.name ?? "" })}
        description={t("managements.deleteDesc")}
        confirmLabel={t("common.delete")}
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteManagement(deleting.id);
          if (res.error) {
            toast.error(res.error);
            throw new Error(res.error);
          }
          toast.success(t("managements.deleted"));
        }}
      />
    </div>
  );
}
