-- ═══════════════════════════════════════════════════════════════
--  ESSYN STUDIO — Migration v4: Financial Module Improvements
--  1. Fix sync_project_paid trigger to also handle DELETE
--  2. Add recurring field to installments
--  3. Add expense_categories reference table
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════
--  1. Fix sync_project_paid — handle UPDATE and DELETE
-- ═══════════════════════════════════════

-- Drop old trigger (only fired on UPDATE)
drop trigger if exists sync_paid_on_installment on public.installments;

-- Replace function to handle both UPDATE and DELETE
create or replace function public.sync_project_paid()
returns trigger
language plpgsql
security definer
as $$
declare
  _project_id uuid;
begin
  -- Determine which project to recalculate
  if tg_op = 'DELETE' then
    _project_id := old.project_id;
  else
    _project_id := new.project_id;
    -- Also recalc old project if project_id changed
    if tg_op = 'UPDATE' and old.project_id is distinct from new.project_id and old.project_id is not null then
      update public.projects
      set paid = (
        select coalesce(sum(paid_amount), 0)
        from public.installments
        where project_id = old.project_id and status = 'pago'
      )
      where id = old.project_id;
    end if;
  end if;

  -- Recalculate for the target project
  if _project_id is not null then
    update public.projects
    set paid = (
      select coalesce(sum(paid_amount), 0)
      from public.installments
      where project_id = _project_id and status = 'pago'
    )
    where id = _project_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Recreate trigger for UPDATE (when status changes)
create trigger sync_paid_on_installment_update
  after update on public.installments
  for each row
  when (old.status is distinct from new.status)
  execute function public.sync_project_paid();

-- New trigger for DELETE
create trigger sync_paid_on_installment_delete
  after delete on public.installments
  for each row
  execute function public.sync_project_paid();


-- ═══════════════════════════════════════
--  2. Add recurring field to installments
-- ═══════════════════════════════════════

alter table public.installments
  add column if not exists recurring boolean not null default false;

comment on column public.installments.recurring
  is 'Whether this installment repeats monthly (e.g. rent, software subscriptions)';


-- ═══════════════════════════════════════
--  3. Expense categories reference table
-- ═══════════════════════════════════════

create table if not exists public.expense_categories (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_expense_categories_studio
  on public.expense_categories(studio_id);

-- RLS
alter table public.expense_categories enable row level security;

create policy "expense_categories_studio" on public.expense_categories
  for all using (studio_id = public.get_user_studio_id());

-- Seed default categories for existing studios
insert into public.expense_categories (studio_id, name, sort_order)
select s.id, cat.name, cat.sort_order
from public.studios s
cross join (values
  ('Aluguel', 0),
  ('Equipamento', 1),
  ('Software', 2),
  ('Transporte', 3),
  ('Alimentação', 4),
  ('Marketing', 5),
  ('Seguro', 6),
  ('Impostos', 7),
  ('Assistente', 8),
  ('Manutenção', 9),
  ('Outros', 10)
) as cat(name, sort_order)
on conflict do nothing;
