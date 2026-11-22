# COSME

The card game where you are a card. Kids (with a parent) turn a photo into a cartoon hero card, order packs, battle online, and vote on new heroes.

Built with Next.js, Supabase (sign-in, database, image storage) and Stripe (checkout). Hosts on Vercel.

## What works

| Page | What it does |
| --- | --- |
| `/` | Home: how to join, how to play, the 8 types, starter squad, shop, safety |
| `/cards` | Card library: every card with its number, search and type filter |
| `/play` | Free battle against the computer: random 10-card decks, spin, most wins out of 10 |
| `/login` | Parents sign in with an emailed link (no passwords) |
| `/make` | Parent permission, then pick type, make the cartoon from a photo, name and move, live 8,000 hero card preview |
| `/order` | Hero pack (2 hero cards + 8 surprise) plus extra surprise packs, then Stripe checkout |
| `/parents` | Heroes, "include in other kids' packs" switch, orders, delete account and all data |
| `/vote` | Vote on new community heroes; 52 votes locks a card (each win +1, each loss -1) |
| `/admin` | Approve new community cards before voting; see paid orders to print |

Game rules live in `src/lib/game.ts`. The 36 starter cards live in `src/lib/starter-cards.ts`.

## Privacy rules built in

- Only parents sign in. A parent gives permission before any photo is used.
- The real photo is only held in memory while the cartoon is made. It is never saved.
- Community cards store no owner. Nobody can look up who made a card. No messages, no locations.
- New community cards are checked by an admin before anyone votes on them.
- Parents can pull a hero out of packs or delete everything.
- Have a lawyer review the privacy page and the under-13 rules (COPPA) before launch.

## Setup (about 30 minutes)

### 1. Run it on your computer

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Home, cards and play work right away, even before the keys are in.

### 2. Supabase

1. Create a project at supabase.com.
2. SQL Editor: paste and run `supabase/migrations/0001_cosme.sql`, then `supabase/seed.sql` (the 36 starter cards).
3. Project Settings > API: copy the URL, anon key and service role key into `.env.local`.
4. Authentication > URL Configuration: set Site URL to your site and add `http://localhost:3000/auth/callback` and `https://YOUR-DOMAIN/auth/callback` to Redirect URLs.
5. Make yourself an admin: sign in once on the site, then in the SQL Editor run
   `update profiles set is_admin = true where email = 'you@example.com';`

### 3. Stripe

1. Products: create "Hero pack" and "Surprise pack", each with a one-time price. Copy the two price IDs (`price_...`) into `.env.local`.
2. Developers > API keys: copy the secret key.
3. Developers > Webhooks: add `https://YOUR-DOMAIN/api/stripe/webhook`, event `checkout.session.completed`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
   For local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

Prices live only in Stripe, so you can change them without touching code.

### 4. Cartoon maker (optional)

Add an OpenAI API key as `OPENAI_API_KEY`. Without it, hero cards show their type symbol instead of a cartoon. Each account can make up to 30 cartoons.

### 5. GitHub and Vercel

```bash
git add -A && git commit -m "COSME v1"
git remote add origin https://github.com/YOUR-NAME/cosme.git
git push -u origin main
```

On vercel.com: New Project > import the repo > add every variable from `.env.local` (set `NEXT_PUBLIC_SITE_URL` to the live address) > Deploy.

## Changing cards

Edit `src/lib/starter-cards.ts`, then run `npx tsx scripts/make-seed.ts` and run the new `supabase/seed.sql` again. It's safe to re-run. Card art goes in `public/cards/`.

## Printing the starter cards at home

`npx tsx scripts/make-print-sheets.ts` makes `print/cosme-starter-cards.pdf`: 8 pages, fronts then backs, 9 cards per letter sheet at real trading card size (2.5 x 3.5 in). Print double-sided, flip on long edge, actual size (100%, not "fit to page"), on 250 to 300 gsm cardstock. Cut on the gray marks.

## Not built yet

- Printing: paid orders show in `/admin` and Stripe; sending them to a print company (like QPMN or MakePlayingCards) is still manual.
- Ordering a single card from the library.
- Playing a friend online (play is against the computer for now).
- Trading.
