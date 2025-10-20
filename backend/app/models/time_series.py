from __future__ import annotations
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, Date, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.extensions import Base

if TYPE_CHECKING:
    from app.models import Stock


class TimeSeries(Base):
    """
    Represents a time-series data point for a stock in the 'time_series' table.
    """

    __tablename__ = "time_series"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, init=False)
    stock_id: Mapped[int] = mapped_column(ForeignKey("stocks.stock_id"), nullable=False)
    date: Mapped[Date] = mapped_column(Date, nullable=False)
    open: Mapped[float] = mapped_column(Float, nullable=False)
    high: Mapped[float] = mapped_column(Float, nullable=False)
    low: Mapped[float] = mapped_column(Float, nullable=False)
    close: Mapped[float] = mapped_column(Float, nullable=False)
    volume: Mapped[int] = mapped_column(nullable=False)

    # Relationships
    stock: Mapped["Stock"] = relationship(back_populates="time_series", init=False)

    def __repr__(self):
        return f"<TimeSeries(stock_id={self.stock_id}, date='{self.date}')>"

    def to_dict(self):
        return {
            "date": self.date.isoformat(),  # type: ignore
            "open": self.open,
            "high": self.high,
            "low": self.low,
            "close": self.close,
            "volume": self.volume,
        }
