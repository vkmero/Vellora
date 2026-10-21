"""Add manager access requests table

Revision ID: 0003_manager_access_requests
Revises: 0002_projects_and_communications
Create Date: 2026-10-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003_manager_access_requests"
down_revision: Union[str, Sequence[str], None] = "0002_projects_and_communications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "manager_access_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("organization_or_team", sa.String(255), nullable=True),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(40), nullable=False, server_default="pending"),
        sa.Column("reviewed_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_manager_requests_user_id", "manager_access_requests", ["user_id"])
    op.create_index("ix_manager_requests_status", "manager_access_requests", ["status"])
    op.create_index("ix_manager_requests_created_at", "manager_access_requests", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_manager_requests_created_at", "manager_access_requests")
    op.drop_index("ix_manager_requests_status", "manager_access_requests")
    op.drop_index("ix_manager_requests_user_id", "manager_access_requests")
    op.drop_table("manager_access_requests")
