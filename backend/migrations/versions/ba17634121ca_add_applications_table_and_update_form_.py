"""add applications table and update form progress

Revision ID: ba17634121ca
Revises: 106a7d1687a3
Create Date: 2025-05-15 21:10:18.123456

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'ba17634121ca'
down_revision = '8466c973cba3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create applications table
    op.create_table(
        'applications',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.Column('status', sa.String(), server_default='in_progress', nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add application_id to form_progress
    op.add_column('form_progress',
        sa.Column('application_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.create_foreign_key(
        'fk_form_progress_application_id',
        'form_progress', 'applications',
        ['application_id'], ['id']
    )
    
    # Make application_id nullable for now to allow existing records,
    # but new records will require it (handled in application logic)


def downgrade() -> None:
    # Remove foreign key first
    op.drop_constraint('fk_form_progress_application_id', 'form_progress', type_='foreignkey')
    
    # Remove application_id column
    op.drop_column('form_progress', 'application_id')
    
    # Drop applications table
    op.drop_table('applications')
