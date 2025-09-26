create or replace function set_booster_expiry()
returns trigger language plpgsql as $$
begin
  if new.expiry_at is null then
    new.expiry_at := new.awarded_at + interval '5 days';
  end if;
  return new;
end;$$;

drop trigger if exists trg_booster_expiry on boosters;
create trigger trg_booster_expiry before insert on boosters
for each row execute procedure set_booster_expiry();

create index if not exists idx_boosters_active_future
  on boosters (expiry_at)
  where active = true and expiry_at > now();

alter table viewers add constraint viewers_user_unique unique (user_id);
alter table creators add constraint creators_user_unique unique (user_id);
alter table agencies add constraint agencies_user_unique unique (user_id);
