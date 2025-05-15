"""update users to uuid

Revision ID: 8466c973cba3
Revises: 106a7d1687a3
Create Date: 2025-05-15 21:14:51.123456

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = '8466c973cba3'
down_revision = '106a7d1687a3'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create a new UUID column
    op.add_column('users', sa.Column('uuid_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Create a temporary function to generate UUIDs
    op.execute("""
    CREATE OR REPLACE FUNCTION generate_uuid_v4()
    RETURNS uuid AS $$
    BEGIN
        RETURN uuid_generate_v4();
    END;
    $$ LANGUAGE plpgsql;
    """)
    
    # Update existing rows with new UUIDs
    op.execute("""
    UPDATE users SET uuid_id = generate_uuid_v4();
    """)
    
    # Make the new UUID column not nullable
    op.alter_column('users', 'uuid_id', nullable=False)
    
    # Drop the old integer ID column and rename the UUID column
    op.drop_constraint('users_pkey', 'users', type_='primary')
    op.drop_column('users', 'id')
    op.alter_column('users', 'uuid_id', new_column_name='id')
    
    # Add primary key constraint to the UUID column
    op.create_primary_key('users_pkey', 'users', ['id'])
    
    # Drop the temporary function
    op.execute('DROP FUNCTION generate_uuid_v4();')

def downgrade() -> None:
    # Create a new integer ID column
    op.add_column('users', sa.Column('int_id', sa.Integer(), nullable=True))
    
    # Generate sequential IDs
    op.execute("""
    UPDATE users SET int_id = row_number() OVER (ORDER BY id)
    """)
    
    # Make the integer column not nullable
    op.alter_column('users', 'int_id', nullable=False)
    
    # Drop the UUID column and rename the integer column
    op.drop_constraint('users_pkey', 'users', type_='primary')
    op.drop_column('users', 'id')
    op.alter_column('users', 'int_id', new_column_name='id')
    
    # Add primary key constraint to the integer column
    op.create_primary_key('users_pkey', 'users', ['id'])
