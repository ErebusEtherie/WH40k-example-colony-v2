"""SQLAlchemy ORM models for persistence."""

from __future__ import annotations

from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class ColonyORM(Base):
    __tablename__ = "colonies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner: Mapped[str] = mapped_column(String(255), nullable=False)
    colony_type: Mapped[str] = mapped_column(String(255), nullable=False)
    age_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    age_last_updated: Mapped[date] = mapped_column(Date, nullable=False)
    current_event: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    base_complacency: Mapped[int] = mapped_column(Integer, nullable=False)
    base_order: Mapped[int] = mapped_column(Integer, nullable=False)
    base_productivity: Mapped[int] = mapped_column(Integer, nullable=False)
    base_piety: Mapped[int] = mapped_column(Integer, nullable=False)
    base_size: Mapped[int] = mapped_column(Integer, nullable=False)
    representative_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("representatives.id"), nullable=True)

    modifiers: Mapped[list[ModifierORM]] = relationship("ModifierORM", back_populates="colony", cascade="all, delete-orphan")
    infrastructure: Mapped[list[InfrastructureORM]] = relationship("InfrastructureORM", back_populates="colony", cascade="all, delete-orphan")
    support_upgrades: Mapped[list[SupportUpgradeORM]] = relationship("SupportUpgradeORM", back_populates="colony", cascade="all, delete-orphan")
    resources: Mapped[list[ResourceORM]] = relationship("ResourceORM", back_populates="colony", cascade="all, delete-orphan")
    manager: Mapped[UserORM] = relationship("UserORM", back_populates="managed_colony")


class RepresentativeORM(Base):
    __tablename__ = "representatives"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(255), nullable=False)
    personalities: Mapped[str] = mapped_column(Text, nullable=False)
    stats: Mapped[str] = mapped_column(Text, nullable=False)
    skills: Mapped[str] = mapped_column(Text, nullable=False)
    talents: Mapped[str] = mapped_column(Text, nullable=False)
    assigned_to_colony_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("colonies.id"), nullable=True)


class ModifierORM(Base):
    __tablename__ = "modifiers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    colony_id: Mapped[int] = mapped_column(Integer, ForeignKey("colonies.id", ondelete="CASCADE"), nullable=False)
    modifier_source_type: Mapped[str] = mapped_column(String(255), nullable=False)
    modifier_stat: Mapped[str] = mapped_column(String(255), nullable=False)
    modifier_value: Mapped[int] = mapped_column(Integer, nullable=False)
    modifier_description: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    colony: Mapped[ColonyORM] = relationship("ColonyORM", back_populates="modifiers")


class InfrastructureORM(Base):
    __tablename__ = 'infrastructure'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    colony_id: Mapped[int] = mapped_column(Integer, ForeignKey('colonies.id', ondelete='CASCADE'), nullable=False)
    infrastructure_type: Mapped[str] = mapped_column(String(255), nullable=False)
    state: Mapped[str] = mapped_column(String(255), nullable=False, default='planned')

    colony: Mapped[ColonyORM] = relationship('ColonyORM', back_populates='infrastructure')


class SupportUpgradeORM(Base):
    __tablename__ = 'support_upgrades'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    colony_id: Mapped[int] = mapped_column(Integer, ForeignKey('colonies.id', ondelete='CASCADE'), nullable=False)
    upgrade_type: Mapped[str] = mapped_column(String(255), nullable=False)
    custom_stat_choice: Mapped[str | None] = mapped_column(String(255), nullable=True)
    custom_product: Mapped[str | None] = mapped_column(String(255), nullable=True)
    affiliated_group: Mapped[str | None] = mapped_column(String(255), nullable=True)

    colony: Mapped[ColonyORM] = relationship('ColonyORM', back_populates='support_upgrades')


class ResourceORM(Base):
    __tablename__ = 'resources'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    colony_id: Mapped[int] = mapped_column(Integer, ForeignKey('colonies.id', ondelete='CASCADE'), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    abundance: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    discovered_date: Mapped[date] = mapped_column(Date, nullable=False)

    colony: Mapped[ColonyORM] = relationship('ColonyORM', back_populates='resources')


class UserORM(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="viewer")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[date] = mapped_column(Date, nullable=True)
    updated_at: Mapped[date] = mapped_column(Date, nullable=True)
    managed_colony_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("colonies.id"), nullable=True)

    # Relationship to colony this user manages (optional)
    managed_colony: Mapped[ColonyORM] = relationship("ColonyORM", back_populates="manager")
