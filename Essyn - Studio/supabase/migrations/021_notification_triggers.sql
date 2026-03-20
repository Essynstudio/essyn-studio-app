-- ═══════════════════════════════════════
--  021: Notification Triggers
-- ═══════════════════════════════════════
-- Cria notificações automaticamente via triggers PostgreSQL.

-- ─── Helper: busca owner_id de um studio ─────────────────────────────────────
create or replace function public.get_studio_owner(p_studio_id uuid)
returns uuid language sql stable security definer as $$
  select owner_id from public.studios where id = p_studio_id limit 1;
$$;

-- ─── Trigger: Lead novo ───────────────────────────────────────────────────────
create or replace function public.notif_on_lead_insert()
returns trigger language plpgsql security definer as $$
declare v_owner uuid;
begin
  v_owner := public.get_studio_owner(NEW.studio_id);
  if v_owner is null then return NEW; end if;
  insert into public.notifications (user_id, type, title, description, read, route)
  values (
    v_owner,
    'lead_novo',
    'Novo lead: ' || NEW.name,
    case when NEW.event_type is not null then NEW.event_type::text else null end,
    false,
    '/crm'
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notif_lead_insert on public.leads;
create trigger trg_notif_lead_insert
  after insert on public.leads
  for each row execute function public.notif_on_lead_insert();

-- ─── Trigger: Pagamento recebido ─────────────────────────────────────────────
create or replace function public.notif_on_installment_paid()
returns trigger language plpgsql security definer as $$
declare v_owner uuid;
begin
  -- Só notifica quando muda para 'pago'
  if NEW.status = 'pago' and (OLD.status is null or OLD.status <> 'pago') then
    v_owner := public.get_studio_owner(NEW.studio_id);
    if v_owner is null then return NEW; end if;
    insert into public.notifications (user_id, type, title, description, read, route)
    values (
      v_owner,
      'pagamento_recebido',
      'Pagamento recebido: ' || 'R$ ' || to_char(NEW.amount, 'FM999G999G990D00'),
      NEW.description,
      false,
      '/financeiro'
    );
  end if;

  -- Notifica quando muda para 'vencido'
  if NEW.status = 'vencido' and (OLD.status is null or OLD.status <> 'vencido') then
    v_owner := public.get_studio_owner(NEW.studio_id);
    if v_owner is null then return NEW; end if;
    insert into public.notifications (user_id, type, title, description, read, route)
    values (
      v_owner,
      'pagamento_vencido',
      'Pagamento vencido: ' || 'R$ ' || to_char(NEW.amount, 'FM999G999G990D00'),
      NEW.description,
      false,
      '/financeiro'
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_notif_installment on public.installments;
create trigger trg_notif_installment
  after update on public.installments
  for each row execute function public.notif_on_installment_paid();

-- ─── Trigger: Galeria publicada (status → entregue) ──────────────────────────
create or replace function public.notif_on_gallery_delivered()
returns trigger language plpgsql security definer as $$
declare v_owner uuid;
begin
  if NEW.status = 'entregue' and (OLD.status is null or OLD.status <> 'entregue') then
    v_owner := public.get_studio_owner(NEW.studio_id);
    if v_owner is null then return NEW; end if;
    insert into public.notifications (user_id, type, title, description, read, route)
    values (
      v_owner,
      'entrega_pronta',
      'Galeria entregue: ' || NEW.name,
      null,
      false,
      '/galeria'
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_notif_gallery on public.galleries;
create trigger trg_notif_gallery
  after update on public.galleries
  for each row execute function public.notif_on_gallery_delivered();

-- ─── Trigger: Pedido novo ─────────────────────────────────────────────────────
create or replace function public.notif_on_order_insert()
returns trigger language plpgsql security definer as $$
declare v_owner uuid;
begin
  v_owner := public.get_studio_owner(NEW.studio_id);
  if v_owner is null then return NEW; end if;
  insert into public.notifications (user_id, type, title, description, read, route)
  values (
    v_owner,
    'pedido_recebido',
    'Novo pedido recebido',
    'R$ ' || to_char(NEW.total_amount, 'FM999G999G990D00'),
    false,
    '/pedidos'
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notif_order_insert on public.orders;
create trigger trg_notif_order_insert
  after insert on public.orders
  for each row execute function public.notif_on_order_insert();
