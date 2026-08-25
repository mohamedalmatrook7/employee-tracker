import { redirect } from "next/navigation";

export default function Home() {
  // Single-user mode: no login, go straight to the dashboard.
  redirect("/dashboard");
}
