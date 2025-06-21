#!/bin/bash
set -e

# Function to check database connection
check_db_connection() {
  echo "Attempting to connect to database at $POSTGRES_SERVER..."
  local max_attempts=30
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt of $max_attempts..."
    
    if PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_SERVER" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c 'SELECT 1' >/dev/null 2>&1; then
      echo "Successfully connected to the database!"
      return 0
    fi
    
    echo "Database not ready yet, retrying in 2 seconds..."
    sleep 2
    ((attempt++))
  done
  
  echo "ERROR: Failed to connect to database after $max_attempts attempts"
  return 1
}

# Wait for database to be ready
check_db_connection || exit 1

# Check if the migrations table exists
if ! PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_SERVER" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c 'SELECT 1 FROM alembic_version LIMIT 1' >/dev/null 2>&1; then
  echo "No migrations table found. Initializing database with first migration..."
  alembic stamp head
else
  echo "Migrations table exists, checking current revision..."
  alembic current
fi

# Create a new migration for the schema changes (if it doesn't exist)
if [ ! -f "/app/migrations/versions/add_display_name_and_theme.py" ]; then
  echo "Creating migration for display_name and theme columns..."
  if ! alembic revision --autogenerate -m "Add display_name and theme to users"; then
    echo "WARNING: Failed to generate migration automatically. Creating an empty migration..."
    alembic revision -m "Add display_name and theme to users (manual)"
    
    # Manually add the ALTER TABLE statements to the new migration
    MIGRATION_FILE=$(find /app/migrations/versions -type f -name "*_add_display_name_and_theme_*.py" | sort -r | head -n 1)
    if [ -n "$MIGRATION_FILE" ]; then
      echo "Manually adding ALTER TABLE statements to $MIGRATION_FILE"
      sed -i.bak '/def upgrade():/a \    # Manually added ALTER TABLE statements\n    op.add_column("users", sa.Column("display_name", sa.String(), nullable=True))\n    op.add_column("users", sa.Column("theme", sa.String(), nullable=True))' "$MIGRATION_FILE"
      sed -i.bak '/def downgrade():/a \    # Manually added DROP COLUMN statements\n    op.drop_column("users", "theme")\n    op.drop_column("users", "display_name")' "$MIGRATION_FILE"
    fi
  fi
fi

# Run any pending migrations
echo "Running migrations..."
if ! alembic upgrade head; then
  echo "ERROR: Failed to apply migrations"
  exit 1
fi

echo "Migrations complete!"
