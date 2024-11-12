#!/bin/bash

# Configuration Variables
DB_NAME="stasks"
DB_USER="stasks"
DB_PASSWORD="your_password"  # replace with a secure password

# Create Database and User
echo "Creating database and user..."
psql -U postgres -c "CREATE DATABASE $DB_NAME;"
psql -U postgres -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"

# Grant All Privileges on the Database
echo "Granting privileges on the database..."
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Connect to the Database and Configure Schema Permissions
echo "Setting up schema permissions..."
psql -U postgres -d $DB_NAME -c "GRANT USAGE ON SCHEMA public TO $DB_USER;"
psql -U postgres -d $DB_NAME -c "GRANT CREATE ON SCHEMA public TO $DB_USER;"
psql -U postgres -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"
psql -U postgres -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
psql -U postgres -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;"

echo "PostgreSQL setup is complete!"