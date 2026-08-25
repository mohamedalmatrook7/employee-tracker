import { redirect } from "next/navigation";

// Single-user mode: the profile always exists, so there is no onboarding step.
export default function OnboardingPage() {
  redirect("/dashboard");
}
