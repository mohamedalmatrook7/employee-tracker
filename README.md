# Application & Feedback Tracker

A multi-tenant web app for supervisors to track applications assigned to their
employees and record feedback on each one. Every supervisor sees **only** their
own employees, managements, and applications — isolation is enforced by
Postgres Row Level Security.

Built with **Next.js 14 (App Router) · TypeScript · Supabase (Postgres + Auth +
RLS) · Tailwind CSS + shadcn/ui · @react-pdf/renderer**. Deploys to Vercel with
Supabase as the hosted backend.

---

## Features

- **Auth** — email/password sign up, log in, log out, password reset. First
  login sends you to a quick name onboarding. All app routes are protected by
  middleware.
- **Dashboard** — totals, pending vs. done, recent pending applications, and a
  per-management breakdown chart.
- **Employees** — list with per-employee application/pending counts; add / edit
  / delete; detail page with a sortable, filterable application list.
- **Managements** — reusable per-supervisor list; also creatable on the fly from
  the application form (combobox "pick or create"). Deleting one detaches past
  applications but keeps their management-name snapshot.
- **Applications** — create/edit (employee, management, content, date). Status
  is **derived** from whether feedback exists (a generated DB column — it can't
  drift). Detail page with the feedback workflow.
- **Reports** — print-friendly on-screen views (`/applications/[id]/print`,
  `/employees/[id]/print`) and downloadable PDFs generated server-side with
  `@react-pdf/renderer` (no headless browser — works on Vercel serverless).

---

## Prerequisites

- Node.js 18.17+ (tested on Node 24)
- A Supabase project — either **local** (Supabase CLI + Docker) or **hosted**
  (free tier). You don't need both.

---

## 1. Install

```bash
npm install
```

## 2. Set up the database

You have two options. **Option A (hosted)** is the simplest way to test locally.

### Option A — Hosted Supabase (recommended)

1. Create a project at <https://supabase.com/dashboard>.
2. In the dashboard, open **SQL Editor**, paste the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), and
   run it. This creates the tables, the generated `status` column, the
   `updated_at` trigger, the new-user → profile trigger, and all RLS policies.
3. In **Project Settings → API**, copy the **Project URL** and the **anon
   public** key.
4. (Optional, for frictionless testing) In **Authentication → Providers →
   Email**, turn **Confirm email** off so new signups can log in immediately.

### Option B — Local Supabase (Docker)

Requires Docker Desktop and the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
supabase start           # boots Postgres + Auth + Studio locally
supabase db reset        # applies supabase/migrations/0001_init.sql
```

`supabase start` prints the local **API URL** (`http://127.0.0.1:54321`) and the
**anon key** to use below. Confirmation emails are disabled locally (see
`supabase/config.toml`) and land in Inbucket at <http://127.0.0.1:54324>.

## 3. Configure environment variables

Copy the template and fill in the two values from step 2:

```bash
cp .env.local.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>, sign up, and you're in.

---

## Deploying to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket and import it in Vercel.
2. In **Vercel → Project → Settings → Environment Variables**, add
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from your
   hosted Supabase project).
3. In **Supabase → Authentication → URL Configuration**, set the **Site URL** to
   your Vercel domain and add it to the redirect allow-list (so email links and
   password resets point at production).
4. Deploy. To sync the env vars back to your machine later:

   ```bash
   vercel env pull .env.local
   ```

No `vercel.json` is required — the PDF routes run on the Node.js serverless
runtime (declared via `export const runtime = "nodejs"`).

---

## How status stays correct

`applications.status` is a **generated column**:

```sql
status text generated always as (
  case when feedback_text is null then 'pending' else 'done' end
) stored
```

Writing feedback flips an application to **Done**; clearing it returns it to
**Pending**. The app never sets status directly, so it can't get out of sync.

## Data isolation

Every table has RLS enabled. `employees`, `managements`, and `applications` use
`supervisor_id = auth.uid()` for all operations; `profiles` is keyed on the
user's own id. A trigger on `auth.users` inserts the matching `profiles` row on
signup.

---

## Project structure

```
src/
  app/
    (auth)/            login, signup, forgot/reset password
    (app)/             protected app (dashboard, employees, managements, applications)
    (reports)/         nav-free printable report pages
    api/reports/       PDF generation routes (@react-pdf/renderer)
    auth/              callback + signout route handlers
    onboarding/        first-login name capture
  components/          shadcn/ui + app components (dialogs, combobox, nav…)
  lib/
    supabase/          browser / server / middleware clients
    actions/           server actions (employees, managements, applications)
    pdf/               PDF report documents
    validation.ts      zod schemas
supabase/
  migrations/0001_init.sql   schema + RLS + triggers
  config.toml                local dev config
```

## Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint
```
