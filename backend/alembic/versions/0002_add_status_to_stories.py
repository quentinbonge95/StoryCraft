"""Add status to stories

Revision ID: 0002_add_status_to_stories
Revises: 0001_initial
Create Date: 2025-06-15 17:02:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0002_add_status_to_stories'
down_revision = '0001_initial'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add status column with default value 'draft' and make it non-nullable
    op.add_column('stories', 
                 sa.Column('status', sa.String(), nullable=False, server_default='draft'))
    
    # Create index on status for better query performance
    op.create_index(op.f('ix_stories_status'), 'stories', ['status'], unique=False)


def downgrade() -> None:
    # Drop the index and column when rolling back
    op.drop_index(op.f('ix_stories_status'), table_name='stories')
    op.drop_column('stories', 'status')
