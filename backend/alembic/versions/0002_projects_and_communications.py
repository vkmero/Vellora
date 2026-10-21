"""Add projects, summaries, presentations, report delivery metadata, and client communications

Revision ID: 0002_projects_and_communications
Revises: 0001_initial
Create Date: 2026-10-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_projects_and_communications"
down_revision: Union[str, Sequence[str], None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Projects table
    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("business_objective", sa.Text(), nullable=True),
        sa.Column("client_name", sa.String(255), nullable=True),
        sa.Column("client_email", sa.String(255), nullable=True),
        sa.Column("assigned_analyst_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("assigned_manager_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", sa.String(40), nullable=False, server_default="active"),
        sa.Column("approval_policy", sa.String(40), nullable=False, server_default="mandatory"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_projects_assigned_analyst_id", "projects", ["assigned_analyst_id"])
    op.create_index("ix_projects_assigned_manager_id", "projects", ["assigned_manager_id"])
    op.create_index("ix_projects_status", "projects", ["status"])
    op.create_index("ix_projects_created_at", "projects", ["created_at"])

    # 2. Add project_id to datasets
    op.add_column("datasets", sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True))
    op.create_index("ix_datasets_project_id", "datasets", ["project_id"])

    # 3. Summaries table
    op.create_table(
        "summaries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=True),
        sa.Column("dataset_id", sa.Integer(), sa.ForeignKey("datasets.id", ondelete="CASCADE"), nullable=True),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("summary_type", sa.String(64), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 4. Presentations table
    op.create_table(
        "presentations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=True),
        sa.Column("dataset_id", sa.Integer(), sa.ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("generated_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("slide_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("delivered_to_manager_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("delivery_status", sa.String(40), nullable=False, server_default="pending"),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 5. Add columns to reports
    op.add_column("reports", sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=True))
    op.add_column("reports", sa.Column("format", sa.String(32), server_default="pdf", nullable=False))
    op.add_column("reports", sa.Column("delivered_to_manager_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True))
    op.add_column("reports", sa.Column("delivery_status", sa.String(40), server_default="pending", nullable=False))
    op.add_column("reports", sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("reports", sa.Column("delivery_error", sa.Text(), nullable=True))
    op.add_column("reports", sa.Column("manager_review_status", sa.String(40), server_default="pending_review", nullable=False))
    op.add_column("reports", sa.Column("manager_feedback", sa.Text(), nullable=True))
    op.add_column("reports", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True))

    # 6. Client Communications table
    op.create_table(
        "client_communications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("manager_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("client_name", sa.String(255), nullable=True),
        sa.Column("client_email", sa.String(255), nullable=False),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("body_text", sa.Text(), nullable=False),
        sa.Column("communication_type", sa.String(64), nullable=False, server_default="progress_update"),
        sa.Column("report_id", sa.Integer(), sa.ForeignKey("reports.id", ondelete="SET NULL"), nullable=True),
        sa.Column("presentation_id", sa.Integer(), sa.ForeignKey("presentations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", sa.String(40), nullable=False, server_default="draft"),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("gmail_message_id", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_communications_project_id", "client_communications", ["project_id"])
    op.create_index("ix_communications_manager_id", "client_communications", ["manager_id"])
    op.create_index("ix_communications_status", "client_communications", ["status"])
    op.create_index("ix_communications_created_at", "client_communications", ["created_at"])


def downgrade() -> None:
    op.drop_table("client_communications")
    op.drop_column("reports", "reviewed_at")
    op.drop_column("reports", "manager_feedback")
    op.drop_column("reports", "manager_review_status")
    op.drop_column("reports", "delivery_error")
    op.drop_column("reports", "delivered_at")
    op.drop_column("reports", "delivery_status")
    op.drop_column("reports", "delivered_to_manager_id")
    op.drop_column("reports", "format")
    op.drop_column("reports", "project_id")
    op.drop_table("presentations")
    op.drop_table("summaries")
    op.drop_index("ix_datasets_project_id", "datasets")
    op.drop_column("datasets", "project_id")
    op.drop_table("projects")
