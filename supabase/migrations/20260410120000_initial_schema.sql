-- MealPlanner: core schema, RLS, triggers
-- Apply via Supabase CLI (`supabase db push`) or SQL editor (single transaction).

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Reference: meal occasions (breakfast / lunch / dinner)
-- -----------------------------------------------------------------------------
create table public.meal_occasions (
  id smallserial primary key,
  code text not null unique,
  label_uk text not null,
  sort_order smallint not null
);

insert into public.meal_occasions (code, label_uk, sort_order) values
  ('breakfast', 'Сніданок', 1),
  ('lunch', 'Обід', 2),
  ('dinner', 'Вечеря', 3);

-- -----------------------------------------------------------------------------
-- Meals catalog (ids match bundled JSON: b1, l2, d3, …)
-- -----------------------------------------------------------------------------
create table public.meals (
  id text primary key,
  meal_occasion_id smallint not null references public.meal_occasions (id),
  name text not null,
  calories integer not null,
  protein integer not null,
  fat integer not null,
  carbs integer not null,
  ingredients jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meals_meal_occasion_id_idx on public.meals (meal_occasion_id);

create trigger meals_set_updated_at
  before update on public.meals
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- User macro goals (one row per auth user)
-- -----------------------------------------------------------------------------
create table public.user_macro_goals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  calories integer not null,
  protein integer not null,
  fat integer not null,
  carbs integer not null,
  updated_at timestamptz not null default now()
);

create trigger user_macro_goals_set_updated_at
  before update on public.user_macro_goals
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Body measurements
-- -----------------------------------------------------------------------------
create table public.body_measurement_entries (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  weight_kg numeric,
  chest_cm numeric,
  underbust_cm numeric,
  waist_cm numeric,
  hips_cm numeric,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create trigger body_measurement_entries_set_updated_at
  before update on public.body_measurement_entries
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Weekly plan header (one row per user per calendar week — week_start = Monday)
-- -----------------------------------------------------------------------------
create table public.week_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start_date)
);

create index week_plans_user_id_idx on public.week_plans (user_id);

create trigger week_plans_set_updated_at
  before update on public.week_plans
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Plan slots: one row per (week × day × occasion)
-- -----------------------------------------------------------------------------
create table public.week_plan_meals (
  id uuid primary key default gen_random_uuid(),
  week_plan_id uuid not null references public.week_plans (id) on delete cascade,
  day_index smallint not null check (day_index >= 0 and day_index <= 6),
  day_label text not null,
  meal_occasion_id smallint not null references public.meal_occasions (id),
  meal_id text not null references public.meals (id),
  unique (week_plan_id, day_index, meal_occasion_id)
);

create index week_plan_meals_week_plan_id_idx on public.week_plan_meals (week_plan_id);
create index week_plan_meals_meal_id_idx on public.week_plan_meals (meal_id);

create or replace function public.enforce_week_plan_meal_occasion_match()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.meals m
    where m.id = new.meal_id
      and m.meal_occasion_id = new.meal_occasion_id
  ) then
    raise exception 'meal % does not match meal_occasion_id %', new.meal_id, new.meal_occasion_id;
  end if;
  return new;
end;
$$;

create trigger week_plan_meals_enforce_occasion
  before insert or update on public.week_plan_meals
  for each row execute function public.enforce_week_plan_meal_occasion_match();

-- -----------------------------------------------------------------------------
-- Replacement audit log
-- -----------------------------------------------------------------------------
create table public.meal_replacement_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_plan_id uuid not null references public.week_plans (id) on delete cascade,
  day_index smallint not null check (day_index >= 0 and day_index <= 6),
  meal_occasion_id smallint not null references public.meal_occasions (id),
  from_meal_id text references public.meals (id),
  to_meal_id text not null references public.meals (id),
  replaced_at timestamptz not null default now()
);

create index meal_replacement_events_user_replaced_at_idx
  on public.meal_replacement_events (user_id, replaced_at desc);

-- -----------------------------------------------------------------------------
-- Shopping list checkmarks (per week plan + scope + aggregated line key)
-- scope_key: 'week_remaining' | 'day:0' … 'day:6'
-- -----------------------------------------------------------------------------
create table public.shopping_line_states (
  id uuid primary key default gen_random_uuid(),
  week_plan_id uuid not null references public.week_plans (id) on delete cascade,
  scope_key text not null,
  line_key text not null,
  is_checked boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (week_plan_id, scope_key, line_key)
);

create index shopping_line_states_week_scope_idx
  on public.shopping_line_states (week_plan_id, scope_key);

create trigger shopping_line_states_set_updated_at
  before update on public.shopping_line_states
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.meal_occasions enable row level security;
alter table public.meals enable row level security;
alter table public.user_macro_goals enable row level security;
alter table public.body_measurement_entries enable row level security;
alter table public.week_plans enable row level security;
alter table public.week_plan_meals enable row level security;
alter table public.meal_replacement_events enable row level security;
alter table public.shopping_line_states enable row level security;

-- Reference + catalog: readable by any signed-in user
create policy meal_occasions_select_authenticated
  on public.meal_occasions for select
  to authenticated
  using (true);

create policy meals_select_authenticated
  on public.meals for select
  to authenticated
  using (true);

-- Own user data
create policy user_macro_goals_own
  on public.user_macro_goals for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy body_measurement_entries_own
  on public.body_measurement_entries for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy week_plans_own
  on public.week_plans for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy week_plan_meals_by_plan_owner
  on public.week_plan_meals for all
  to authenticated
  using (
    exists (
      select 1 from public.week_plans w
      where w.id = week_plan_meals.week_plan_id
        and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.week_plans w
      where w.id = week_plan_meals.week_plan_id
        and w.user_id = auth.uid()
    )
  );

create policy meal_replacement_events_own
  on public.meal_replacement_events for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy shopping_line_states_by_plan_owner
  on public.shopping_line_states for all
  to authenticated
  using (
    exists (
      select 1 from public.week_plans w
      where w.id = shopping_line_states.week_plan_id
        and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.week_plans w
      where w.id = shopping_line_states.week_plan_id
        and w.user_id = auth.uid()
    )
  );
