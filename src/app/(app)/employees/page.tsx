import { EmployeesList } from "./employees-list";

export const metadata = { title: "Employees" };

// The list fetches its own data on the client (live + no stale Router Cache
// snapshot on navigation), so this page is just the shell.
export default function EmployeesPage() {
  return (
    <div>
      <EmployeesList />
    </div>
  );
}
