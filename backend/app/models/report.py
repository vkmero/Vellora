from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.helpers import utcnow


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    report_type: Mapped[str] = mapped_column(String(64), nullable=False)
    format: Mapped[str] = mapped_column(String(32), default="pdf", nullable=False)  # 'pdf', 'xlsx', 'csv'
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    generated_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    delivered_to_manager_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    delivery_status: Mapped[str] = mapped_column(String(40), default="pending", nullable=False)  # 'pending', 'delivered', 'failed'
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivery_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    manager_review_status: Mapped[str] = mapped_column(String(40), default="pending_review", nullable=False)  # 'pending_review', 'reviewed', 'feedback_given'
    manager_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    dataset = relationship("Dataset", back_populates="reports")
    project = relationship("Project", back_populates="reports")
    generator = relationship("User", foreign_keys=[generated_by], back_populates="reports")
    delivered_manager = relationship("User", foreign_keys=[delivered_to_manager_id])
    communications = relationship("ClientCommunication", back_populates="report")
