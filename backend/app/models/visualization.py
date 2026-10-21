from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.helpers import utcnow


class Visualization(Base):
    __tablename__ = "visualizations"

    id: Mapped[int] = mapped_column(primary_key=True)
    dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    chart_type: Mapped[str] = mapped_column(String(32), nullable=False)
    x_column: Mapped[str | None] = mapped_column(String(255), nullable=True)
    y_column: Mapped[str | None] = mapped_column(String(255), nullable=True)
    configuration: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    dataset = relationship("Dataset", back_populates="visualizations")
    creator = relationship("User", back_populates="visualizations")
