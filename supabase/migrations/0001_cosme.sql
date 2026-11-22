-- COSME database: run this once in the Supabase SQL editor (or with `supabase db push`).
-- Privacy by design: community cards never store who made them.

-- ---------- Parents (one row per signed-in account) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  consent_at timestamptz,
  consent_version text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Cards in the game (starters + approved community heroes) ----------
create sequence if not exists public.card_number_seq start 37;

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique default nextval('public.card_number_seq'),
  name text not null check (char_length(name) between 1 and 40),
  type text not null check (type in ('Lightning','Fire','Ice','Water','Plant','Wind','Metal','Fist')),
  move text not null check (char_length(move) between 1 and 40),
  description text not null default '',
  art_url text,
  total integer not null check (total > 0),
  spots integer[] not null check (array_length(spots, 1) = 8),
  weaknesses text[] not null default '{}',
  rarity text not null default 'common' check (rarity in ('common','rare','shiny')),
  status text not null default 'review' check (status in ('starter','review','voting','locked','retired')),
  vote_count integer not null default 0,
  vote_score integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Each family's own heroes (private) ----------
create table if not exists public.heroes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  type text not null check (type in ('Lightning','Fire','Ice','Water','Plant','Wind','Metal','Fist')),
  move text not null check (char_length(move) between 1 and 40),
  avatar_url text,
  hero_spots integer[] not null check (array_length(hero_spots, 1) = 8),
  share_in_community boolean not null default false,
  community_card_id uuid references public.cards (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists heroes_owner_idx on public.heroes (owner_id);

-- ---------- Votes on new community cards ----------
create table if not exists public.votes (
  id bigserial primary key,
  card_id uuid not null references public.cards (id) on delete cascade,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  new_card_won boolean not null,
  created_at timestamptz not null default now(),
  unique (card_id, voter_id)
);

-- ---------- Orders ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  hero_id uuid references public.heroes (id) on delete set null,
  surprise_packs integer not null default 0 check (surprise_packs between 0 and 9),
  status text not null default 'pending' check (status in ('pending','paid','printing','shipped','cancelled')),
  stripe_session_id text unique,
  shipping jsonb,
  amount_total integer,
  created_at timestamptz not null default now()
);
create index if not exists orders_owner_idx on public.orders (owner_id);

-- ---------- Row level security ----------
-- All writes go through the site's server code (service role). The browser can only read.
alter table public.profiles enable row level security;
alter table public.cards enable row level security;
alter table public.heroes enable row level security;
alter table public.votes enable row level security;
alter table public.orders enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists "anyone reads game cards" on public.cards;
create policy "anyone reads game cards" on public.cards for select to anon, authenticated
  using (status in ('starter','voting','locked'));

drop policy if exists "read own heroes" on public.heroes;
create policy "read own heroes" on public.heroes for select to authenticated using (owner_id = auth.uid());

drop policy if exists "read own orders" on public.orders;
create policy "read own orders" on public.orders for select to authenticated using (owner_id = auth.uid());

-- votes: no browser access at all; voting goes through cast_vote().

-- ---------- Voting ----------
-- Each signed-in parent can vote once per new card. 52 votes locks the card:
-- every win adds 1, every loss takes 1, so the final total lands between 148 and 252.
create or replace function public.cast_vote(p_card uuid, p_new_card_won boolean)
returns public.cards
language plpgsql security definer set search_path = public as $$
declare
  v_card public.cards;
  v_total integer;
  v_sum integer;
  v_scaled integer[];
  v_i integer;
  v_max_i integer := 1;
begin
  if auth.uid() is null then
    raise exception 'Sign in to vote';
  end if;

  select * into v_card from public.cards where id = p_card for update;
  if not found or v_card.status <> 'voting' then
    raise exception 'This card is not open for voting';
  end if;

  if exists (select 1 from public.heroes where owner_id = auth.uid() and community_card_id = p_card) then
    raise exception 'You cannot vote on your own hero';
  end if;

  insert into public.votes (card_id, voter_id, new_card_won) values (p_card, auth.uid(), p_new_card_won);

  update public.cards
     set vote_count = vote_count + 1,
         vote_score = vote_score + case when p_new_card_won then 1 else -1 end
   where id = p_card
   returning * into v_card;

  if v_card.vote_count >= 52 then
    v_total := 200 + v_card.vote_score;
    select sum(x) into v_sum from unnest(v_card.spots) as x;
    v_scaled := array(select greatest(1, round(x::numeric * v_total / v_sum)::integer) from unnest(v_card.spots) with ordinality as t(x, n) order by n);
    for v_i in 1..8 loop
      if v_scaled[v_i] > v_scaled[v_max_i] then v_max_i := v_i; end if;
    end loop;
    select sum(x) into v_sum from unnest(v_scaled) as x;
    v_scaled[v_max_i] := v_scaled[v_max_i] + (v_total - v_sum);

    update public.cards
       set status = 'locked', total = v_total, spots = v_scaled
     where id = p_card
     returning * into v_card;
  end if;

  return v_card;
end $$;

revoke all on function public.cast_vote(uuid, boolean) from public, anon;
grant execute on function public.cast_vote(uuid, boolean) to authenticated;

-- ---------- Storage: cartoon avatars only (real photos are never stored) ----------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
