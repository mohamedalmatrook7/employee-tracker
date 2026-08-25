"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(defaultName);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = fullName.trim();
    if (!name) {
      toast.error("Please enter your name.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      router.replace("/login");
      return;
    }
    // Upsert (not update) so onboarding still works if the profile row
    // somehow doesn't exist yet.
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: name, email: user.email ?? null });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("You're all set!");
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome! What&apos;s your name?</CardTitle>
        <CardDescription>
          This is how you&apos;ll appear in the app and on reports.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              autoFocus
              placeholder="Jane Supervisor"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Continue"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
