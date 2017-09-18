"""Adding metric warning_text

Revision ID: 19a814813610
Revises: ca69c70ec99b
Create Date: 2017-09-15 15:09:40.495345

"""

# revision identifiers, used by Alembic.
revision = '19a814813610'
down_revision = 'ca69c70ec99b'

from alembic import op
import sqlalchemy as sa


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('metrics', sa.Column('warning_text', sa.Text(), nullable=True))
    op.add_column('sql_metrics', sa.Column('warning_text', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('sql_metrics', 'warning_text')
    op.drop_column('metrics', 'warning_text')
