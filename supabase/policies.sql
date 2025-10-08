alter table users enable row level security;
alter table creators enable row level security;
alter table agencies enable row level security;
alter table agency_memberships enable row level security;
alter table viewers enable row level security;
alter table battles enable row level security;
alter table powerups enable row level security;
alter table powerup_events enable row level security;
alter table notifications enable row level security;
alter table jobs enable row level security;
alter table webhooks enable row level security;
alter table subscriptions enable row level security;
alter table calendar_tokens enable row level security;

create or replace function auth_user_id() returns uuid language sql stable as $$ select auth.uid() $$;
create or replace function auth_creator_id() returns uuid language sql stable as $$
  select c.id from creators c join users u on u.id = c.user_id where u.id = auth.uid() limit 1;
$$;
create or replace function auth_agency_id() returns uuid language sql stable as $$
  select a.id from agencies a join users u on u.id = a.user_id where u.id = auth.uid() limit 1;
$$;
create or replace function auth_viewer_id() returns uuid language sql stable as $$
  select v.id from viewers v join users u on u.id = v.user_id where u.id = auth.uid() limit 1;
$$;

create policy users_self_select on users for select using (id = auth.uid());
create policy users_admin_all on users for all using (exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin')) with check (exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin'));

create policy viewers_owner on viewers for select using (user_id = auth.uid());
create policy creators_owner on creators for select using (user_id = auth.uid());
create policy agencies_owner on agencies for select using (user_id = auth.uid());

create policy agency_memberships_visible on agency_memberships for select using (creator_id = auth_creator_id() or agency_id = auth_agency_id());

create policy battles_creator on battles for select using (creator_id = auth_creator_id());
create policy battles_agency_roster on battles for select using (exists (select 1 from agency_memberships m where m.creator_id = battles.creator_id and m.agency_id = auth_agency_id() and m.active));
create policy battles_admin on battles for all using (exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin')) with check (true);

create policy powerups_creator on powerups for select using (creator_id = auth_creator_id());
create policy powerups_agency_roster on powerups for select using (exists (select 1 from agency_memberships m where m.creator_id = powerups.creator_id and m.agency_id = auth_agency_id() and m.active));
create policy powerups_viewer on powerups for select using (holder_viewer_id = auth_viewer_id());

create policy powerup_events_visible on powerup_events for select using (
  exists (select 1 from powerups p where p.id = powerup_events.powerup_id and (
    p.creator_id = auth_creator_id() or
    p.holder_viewer_id = auth_viewer_id() or
    exists (select 1 from agency_memberships m where m.creator_id = p.creator_id and m.agency_id = auth_agency_id() and m.active)
  ))
);

create policy notifications_owner on notifications for select using (user_id = auth.uid());
create policy jobs_service on jobs for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy webhooks_service on webhooks for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy subscriptions_owner on subscriptions for select using (user_id = auth.uid());
create policy calendar_tokens_owner on calendar_tokens for select using (owner_user_id = auth.uid());

create policy agencies_verified on agencies for select using ((user_id = auth.uid()) or backstage_verified = true);
