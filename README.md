# Promptory — Prompt Manager

A responsive, multi-user prompt library built with Next.js, React, Supabase and Tailwind-free custom CSS.

## Included
- Public registration/login with email + password (Supabase Auth)
- Private prompt vault for each account (Supabase Row Level Security)
- Create, edit, delete and duplicate prompts
- Search across title, description, content, category, platform and tags
- Categories, AI platform, tags and favorites
- One-click copy, usage counter, responsive layout
- Light / dark / system theme selector (persisted locally)
- Starter data shown in preview mode when Supabase is not configured

## 1. Run locally
Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## 2. Configure Supabase
1. Create a project at https://supabase.com.
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Project Settings → API, copy the Project URL and anon/public key.
4. Add them to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

5. In Authentication → URL Configuration, set the Site URL to your production domain and add local + production redirect URLs.
6. In Authentication → Providers, enable Email. For production, configure SMTP so confirmation emails are reliably delivered.

Never put the Supabase `service_role` key in frontend environment variables.

## 3. Deploy on Vercel
1. Push this folder to a GitHub repository.
2. Import the repository in https://vercel.com/new.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables.
4. Deploy.
5. Add the Vercel domain to Supabase Auth → URL Configuration.

A custom domain can be connected from Vercel → Project → Settings → Domains.

## Security notes
- Every prompt is owned by one authenticated user.
- RLS policies prevent users from reading or changing another user's prompts.
- `is_public` is reserved for a future community-gallery feature and does not expose records.
- Do not disable RLS or expose the service-role key.

## Next production milestones
- Password reset + email verification UX
- Community gallery with explicit publish/unpublish and moderation
- Import/export JSON and Markdown
- Prompt variables and reusable templates
- Team workspaces, billing and usage analytics
- Automated tests, monitoring, privacy policy and terms of service

## Categorie personalizzate

Per abilitare la gestione delle categorie nella versione aggiornata, apri Supabase → SQL Editor, crea una nuova query e incolla il contenuto di `supabase/categories-migration.sql`. Esegui lo script una sola volta. La tabella `categories` usa RLS: ogni account può gestire esclusivamente le proprie categorie.

Dopo aver aggiornato il repository GitHub con questa versione, Vercel avvierà un nuovo deployment. La categoria `Generale` è riservata come destinazione sicura quando si elimina un'altra categoria; i prompt associati vengono spostati in `Generale`, non eliminati.


## Gestione piattaforme AI personalizzate

Per abilitare il salvataggio cloud delle piattaforme AI personalizzate, apri Supabase → SQL Editor e lancia `supabase/platforms-migration.sql`. La tabella `ai_platforms` applica RLS e isola i record tramite `user_id`.

Promptory include alcune piattaforme predefinite non modificabili. Puoi aggiungere, modificare, archiviare, riattivare o eliminare le piattaforme personali. Se una piattaforma è già utilizzata da uno o più prompt, l'eliminazione viene convertita in archiviazione per non perdere i riferimenti; la rinomina aggiorna anche i prompt collegati.

Il menu account in alto a destra mostra l'indirizzo dell'account e consente di uscire. Il logout chiude la sessione Supabase locale e ripristina lo stato della libreria sul client.


## Piattaforme predefinite personalizzabili

Per abilitare la modifica delle piattaforme incluse (ChatGPT, Gemini, Claude, NotebookLM, Midjourney e Sora) eseguire una sola volta `supabase/platforms-defaults-migration.sql` nel SQL Editor di Supabase, dopo la precedente `platforms-migration.sql`. Le piattaforme predefinite vengono create automaticamente per ciascun utente e le personalizzazioni vengono salvate nel database. La piattaforma `Altro` rimane protetta e non modificabile.
