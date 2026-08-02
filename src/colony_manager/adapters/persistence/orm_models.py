"""SQLAlchemy ORM models for persistence."""

from __future__ import annotations

from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class ColonyORM(Base):
    __tablename__ = "colonies"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    owner = Column(String(255), nullable=False)
    colony_type = Column(String(255), nullable=False)
    age_days = Column(Integer, nullable=False, default=0)
    age_last_updated = Column(Date, nullable=False)
    event_roll_interval_days = Column(Integer, nullable=False, default=60)
    development_roll_interval_days = Column(Integer, nullable=False, default=90)
    base_complacency = Column(Integer, nullable=False)
    base_order = Column(Integer, nullable=False)
    base_productivity = Column(Integer, nullable=False)
    base_piety = Column(Integer, nullable=False)
    base_size = Column(Integer, nullable=False)
    representative_id = Column(Integer, ForeignKey("representatives.id"), nullable=True)

    modifiers = relationship("ModifierORM", back_populates="colony", cascade="all, delete-orphan")


class RepresentativeORM(Base):
    __tablename__ = "representatives"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    type = Column(String(255), nullable=False)
    personalities = Column(Text, nullable=False)
    stats = Column(Text, nullable=False)
    skills = Column(Text, nullable=False)
    talents = Column(Text, nullable=False)


class ModifierORM(Base):
    __tablename__ = "modifiers"

    id = Column(Integer, primary_key=True)
    colony_id = Column(Integer, ForeignKey("colonies.id", ondelete="CASCADE"), nullable=False)
    modifier_source_type = Column(String(255), nullable=False)
    modifier_stat = Column(String(255), nullable=False)
    modifier_value = Column(Integer, nullable=False)
    modifier_description = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    colony = relationship("ColonyORM", back_populates="modifiers")
