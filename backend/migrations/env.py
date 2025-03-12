import os
from sqlalchemy import create_engine
from alembic import context
from database import Base
from dotenv import load_dotenv

# ✅ Load environment variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL is missing from .env file")

# ✅ Use the same engine as the FastAPI app
engine = create_engine(DATABASE_URL)
target_metadata = Base.metadata

def run_migrations_offline():
    """Run migrations in 'offline' mode with the correct environment variable."""
    context.configure(
        url=DATABASE_URL,  # ✅ Use .env variable instead of alembic.ini
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Run migrations in 'online' mode with the correct engine."""
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()