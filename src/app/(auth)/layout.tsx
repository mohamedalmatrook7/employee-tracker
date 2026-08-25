import { redirect } from "next/navigation";

// Single-user mode: there is no login or registration. Any /login, /signup,
// /forgot-password or /reset-password visit just goes to the app.
export default function AuthLayout() {
  redirect("/dashboard");
}
