create or replace function set_powerup_expiry()
returns trigger language plpgsql as $$
begin
  if new.expiry_at is null then
    new.expiry_at := new.awarded_at + interval '5 days';
  end if;
  return new;
end;$$;

drop trigger if exists trg_powerup_expiry on powerups;
create trigger trg_powerup_expiry before insert on powerups
for each row execute procedure set_powerup_expiry();

create index if not exists idx_powerups_active_future
  on powerups (expiry_at)
  where active = true and expiry_at > now();

alter table viewers add constraint viewers_user_unique unique (user_id);
alter table creators add constraint creators_user_unique unique (user_id);
alter table agencies add constraint agencies_user_unique unique (user_id);
