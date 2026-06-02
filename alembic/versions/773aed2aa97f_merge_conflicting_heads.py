"""merge conflicting heads

Revision ID: 773aed2aa97f
Revises: 5a8ab041b865, 9f2e3c1a7d4b
Create Date: 2026-06-03 03:39:37.287086

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '773aed2aa97f'
down_revision: Union[str, Sequence[str], None] = ('5a8ab041b865', '9f2e3c1a7d4b')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
