"""initial migration

Revision ID: 0001_initial
Revises: 
Create Date: 2025-05-28 23:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False, index=True, unique=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('is_superuser', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True, onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Update stories table
    op.add_column('stories', sa.Column('owner_id', sa.Integer(), nullable=True))
    op.add_column('stories', sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()))
    op.add_column('stories', sa.Column('updated_at', sa.DateTime(), nullable=True, onupdate=sa.func.now()))
    
    # Create foreign key
    op.create_foreign_key('fk_story_owner', 'stories', 'users', ['owner_id'], ['id'])
    
    # Create index on owner_id for better query performance
    op.create_index(op.f('ix_stories_owner_id'), 'stories', ['owner_id'], unique=False)


def downgrade() -> None:
    # Drop foreign key and index first
    op.drop_constraint('fk_story_owner', 'stories', type_='foreignkey')
    op.drop_index(op.f('ix_stories_owner_id'), table_name='stories')
    
    # Drop added columns
    op.drop_column('stories', 'owner_id')
    op.drop_column('stories', 'created_at')
    op.drop_column('stories', 'updated_at')
    
    # Drop users table
    op.drop_table('users')
