-- Нормалізація інгредієнтів: довідник + звʼязок зі стравами (кількість; для «г» також поле grams)

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create unique index ingredients_name_lower_idx on public.ingredients (lower(trim(name)));

create table public.meal_ingredients (
  id uuid primary key default gen_random_uuid(),
  meal_id text not null references public.meals (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  sort_order smallint not null default 0,
  quantity numeric not null check (quantity > 0),
  unit text not null default 'г',
  grams numeric,
  note text,
  unique (meal_id, sort_order)
);

create index meal_ingredients_meal_id_idx on public.meal_ingredients (meal_id);
create index meal_ingredients_ingredient_id_idx on public.meal_ingredients (ingredient_id);

insert into public.ingredients (name)
select distinct trim((x ->> 'name')::text)
from public.meals m
cross join lateral jsonb_array_elements(m.ingredients) as el(x)
where not exists (
  select 1
  from public.ingredients i
  where lower(trim(i.name)) = lower(trim((x ->> 'name')::text))
);

insert into public.meal_ingredients (meal_id, ingredient_id, sort_order, quantity, unit, grams, note)
select
  m.id,
  i.id,
  (ord - 1)::smallint,
  (x ->> 'amount')::numeric,
  coalesce(nullif(trim(x ->> 'unit'), ''), 'г'),
  case
    when coalesce(nullif(trim(x ->> 'unit'), ''), 'г') = 'г' then (x ->> 'amount')::numeric
    else null
  end,
  nullif(trim(x ->> 'note'), '')
from public.meals m
cross join lateral jsonb_array_elements(m.ingredients) with ordinality as el(x, ord)
join public.ingredients i on lower(trim(i.name)) = lower(trim((x ->> 'name')::text));

alter table public.meals drop column if exists ingredients;

alter table public.ingredients enable row level security;
alter table public.meal_ingredients enable row level security;

create policy ingredients_select_authenticated
  on public.ingredients for select
  to authenticated
  using (true);

create policy meal_ingredients_select_authenticated
  on public.meal_ingredients for select
  to authenticated
  using (true);
