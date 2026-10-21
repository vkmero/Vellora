from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.helpers import utcnow


class Presentation(Base):
    __tablename__ = "presentations"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    generated_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    slide_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    delivered_to_manager_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    delivery_status: Mapped[str] = mapped_column(String(40), default="pending", nullable=False)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    project = relationship("Project", back_populates="presentations")
    dataset = relationship("Dataset")
    generator = relationship("User", foreign_keys=[generated_by], back_populates="presentations")
    delivered_manager = relationship("User", foreign_keys=[delivered_to_manager_id])
    communications = relationship("ClientCommunication", back_populates="presentation")
