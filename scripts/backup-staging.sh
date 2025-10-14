#!/usr/bin/env bash
set -euo pipefail

# scripts/backup-staging.sh
# Create a logical backup (custom format) of a Postgres database given a connection URL.
# Usage:
#   DATABASE_URL="postgresql://user:pass@host:5432/dbname" ./scripts/backup-staging.sh
# or
#   ./scripts/backup-staging.sh "postgresql://user:pass@host:5432/dbname"

TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
BACKUP_DIR="$ROOT_DIR/backups"
mkdir -p "$BACKUP_DIR"

if [ "$#" -ge 1 ]; then
  DATABASE_URL="$1"
elif [ -n "${DATABASE_URL-}" ]; then
  DATABASE_URL="$DATABASE_URL"
else
  echo "Error: DATABASE_URL must be provided as an argument or environment variable." >&2
  echo "Usage: DATABASE_URL=... $0" >&2
  exit 2
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Error: pg_dump is not installed or not in PATH. Install Postgres client tools." >&2
  exit 3
fi

FILENAME="$BACKUP_DIR/toklytics-staging-$TIMESTAMP.dump"

echo "Backing up database to: $FILENAME"

# Use pg_dump with connection string; pg_dump supports the libpq URI format
# Use custom format (-Fc) so we can pg_restore later and preserve indexes, etc.
PGPASSWORD="${PGPASSWORD-}" \
  pg_dump --format=custom --file="$FILENAME" --no-owner --no-privileges "$DATABASE_URL"

echo "Backup complete: $FILENAME"

cat <<EOF
Next steps / verification:

- To verify restore locally into a running Postgres (example using docker):

  # start a temporary Postgres container
  docker run --name toklytics-restore-test -e POSTGRES_PASSWORD=password -d -p 5433:5432 postgres:15

  # create a database and restore (example)
  createdb -h localhost -p 5433 -U postgres toklytics_restore || true
  PGPASSWORD=password pg_restore --clean --no-owner --no-privileges -h localhost -p 5433 -U postgres -d toklytics_restore "$FILENAME"

  # connect and inspect
  PGPASSWORD=password psql -h localhost -p 5433 -U postgres -d toklytics_restore -c "\dt"

- Consider moving the dump off-host (S3, GCP, or secure artifact storage) and encrypting it.

EOF

exit 0
