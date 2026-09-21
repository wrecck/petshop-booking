# Paws & Co. Booking

A multi-tenant booking MVP for pet grooming businesses, built with Next.js and
Supabase.

## Included in V1

- Public booking pages at `/book/[shop-slug]`
- Service, groomer, calendar, and live time-slot selection
- Conflict-safe appointment creation
- Customer and pet records
- Shop-owner email/password authentication
- Automatic shop onboarding with starter services and hours
- Owner dashboard with appointments, customers, and status updates
- PostgreSQL row-level security for tenant isolation
- Responsive desktop and mobile layouts

The home page runs as a no-database product demo. Tenant booking pages and the
owner dashboard use Supabase after it is configured.

## Supabase setup

### 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com). Save the database
password somewhere secure.

### 2. Create the database

In the Supabase dashboard, open **SQL Editor**, create a new query, paste the
entire contents of:

```text
supabase/migrations/202609210001_initial_schema.sql
```

Run the query once. It creates the tables, indexes, row-level security policies,
availability function, booking function, and owner onboarding function.

If you use the Supabase CLI instead, link the project and run:

```bash
npx supabase db push
```

### 3. Configure authentication

In **Authentication → URL Configuration**:

- Set **Site URL** to `http://localhost:3000` while developing.
- Add `http://localhost:3000/auth/callback` under **Redirect URLs**.
- After deploying, add `https://YOUR-VERCEL-DOMAIN/auth/callback`.
- Change the Site URL to your production URL when ready to launch.

Email/password authentication is enabled by default. For faster local testing,
you can temporarily disable **Confirm email** under Authentication settings.

### 4. Add environment variables

In **Project Settings → API**, copy the project URL and publishable/anon key.
Create `.env.local`:

```bash
cp .env.example .env.local
```

Then set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-PUBLISHABLE-ANON-KEY
```

Do not use or expose the Supabase service-role key. This app does not need it:
privileged public booking operations are limited by audited database functions.

### 5. Create the first shop

Start the app, open `/login`, and choose **Create an owner account**. After
confirming the email, sign in and complete shop onboarding.

The dashboard will show the public URL:

```text
/book/your-shop-slug
```

The onboarding function creates:

- One owner/groomer profile
- Three starter grooming services
- Monday–Saturday, 9 AM–5 PM business hours
- Service assignments for the owner

You can edit these rows in Supabase Table Editor for V1.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Before pushing:

```bash
npm run lint
npm run build
```

## Vercel configuration

When you deploy, add the same two environment variables to the Vercel project.
No service-role key is required. Remember to add the deployed callback URL to
Supabase Authentication before testing signup.

## V1 boundaries

This version intentionally does not include payments, SMS/email reminders,
custom staff working hours, multi-location shops, or a visual service editor.
The database supports extending these features without changing tenant
ownership or appointment records.
