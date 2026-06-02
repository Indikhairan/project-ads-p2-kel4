"""update kategori layanan to informasi

Revision ID: 9f2e3c1a7d4b
Revises: fd73d14b3a0b
Create Date: 2026-06-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9f2e3c1a7d4b'
down_revision: Union[str, Sequence[str], None] = 'fd73d14b3a0b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - update kategori from 'Layanan' to 'Informasi'."""
    op.execute("UPDATE tiket_layanan SET kategori = 'Informasi' WHERE kategori = 'Layanan'")


def downgrade() -> None:
    """Downgrade schema - revert kategori from 'Informasi' to 'Layanan'."""
    op.execute("UPDATE tiket_layanan SET kategori = 'Layanan' WHERE kategori = 'Informasi'")
