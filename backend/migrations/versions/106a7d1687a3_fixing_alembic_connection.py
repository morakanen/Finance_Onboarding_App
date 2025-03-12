"""Fixing Alembic connection

Revision ID: 106a7d1687a3
Revises: 01520513d0ac
Create Date: 2025-03-11 16:57:12.709886

"""


"""Fixing Alembic Connection - Safely Dropping Tables"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# Revision identifiers
revision = '106a7d1687a3'
down_revision = '01520513d0ac'  # Replace with the correct previous migration ID
branch_labels = None
depends_on = None


def upgrade():
    """Apply migration: Drop foreign keys first, then drop tables."""

    # Step 1: Drop foreign key constraints (in the correct order)
    op.drop_constraint("onboarding_processes_client_id_fkey", "onboarding_processes", type_="foreignkey")
    op.drop_constraint("risk_assessments_client_id_fkey", "risk_assessments", type_="foreignkey")
    op.drop_constraint("form_progress_client_id_fkey", "form_progress", type_="foreignkey")

    # Step 2: Drop indexes for the users table
    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_users_id', table_name='users')
    op.drop_index('ix_users_name', table_name='users')

    # Step 3: Drop tables in the correct order
    op.drop_table('onboarding_processes')
    op.drop_table('form_progress')
    op.drop_table('risk_assessments')
    op.drop_table('clients')
    op.drop_table('users')


def downgrade():
    """Reverse migration: Recreate tables and add constraints back."""

    # Step 1: Recreate users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('email', sa.String(), unique=True, nullable=True),
        sa.Column('hashed_password', sa.String(), nullable=True),
        sa.Column('role', postgresql.ENUM('user', 'admin', name='roleenum'), nullable=True)
    )
    op.create_index('ix_users_name', 'users', ['name'], unique=False)
    op.create_index('ix_users_id', 'users', ['id'], unique=False)
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Step 2: Recreate clients table
    op.create_table(
        'clients',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), unique=True, nullable=False),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True)
    )

    # Step 3: Recreate risk_assessments table
    op.create_table(
        'risk_assessments',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('client_id', sa.UUID(), nullable=True),
        sa.Column('risk_score', sa.Integer(), nullable=False),
        sa.Column('classification', postgresql.ENUM('high', 'standard', name='riskenum'), nullable=False),
        sa.Column('details', postgresql.JSON(), nullable=True)
    )
    op.create_foreign_key("risk_assessments_client_id_fkey", "risk_assessments", "clients", ["client_id"], ["id"])

    # Step 4: Recreate form_progress table
    op.create_table(
        'form_progress',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('client_id', sa.UUID(), nullable=True),
        sa.Column('step', sa.String(), nullable=False),
        sa.Column('data', postgresql.JSON(), nullable=True),
        sa.Column('last_updated', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True)
    )
    op.create_foreign_key("form_progress_client_id_fkey", "form_progress", "clients", ["client_id"], ["id"])

    # Step 5: Recreate onboarding_processes table
    op.create_table(
        'onboarding_processes',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('client_id', sa.UUID(), nullable=True),
        sa.Column('status', postgresql.ENUM('pending', 'in_progress', 'completed', name='statusenum'), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True)
    )
    op.create_foreign_key("onboarding_processes_client_id_fkey", "onboarding_processes", "clients", ["client_id"], ["id"])