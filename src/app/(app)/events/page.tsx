import { EventsList } from "./events-list";

export const metadata = { title: "Events" };

// The list fetches its own data on the client (live + no stale Router Cache
// snapshot on navigation), so this page is just the shell.
export default function EventsPage() {
  return <EventsList />;
}
