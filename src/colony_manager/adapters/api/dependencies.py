"""Dependency injection for the API."""

from pathlib import Path
from typing import Annotated

from fastapi import Depends

from colony_manager.adapters.config.loader import FileRuleConfigProvider
from colony_manager.adapters.persistence.colony_repository_impl import SqlAlchemyColonyRepository
from colony_manager.adapters.persistence.db import build_database_url
from colony_manager.adapters.persistence.representative_repository_impl import (
    SqlAlchemyRepresentativeRepository,
)
from colony_manager.adapters.persistence.user_repository_impl import SqlAlchemyUserRepository
from colony_manager.application.services.colony_service import ColonyService
from colony_manager.application.services.representative_service import RepresentativeService
from colony_manager.domain.ports.colony_repository import ColonyRepository
from colony_manager.domain.ports.representative_repository import RepresentativeRepository
from colony_manager.domain.ports.rule_config_provider import RuleConfigProvider
from colony_manager.domain.ports.user_repository import UserRepository

# Default paths - config is at project root, not src/config
DEFAULT_CONFIG_DIR = Path(__file__).resolve().parents[3].parent / "config"
DEFAULT_DB_PATH = DEFAULT_CONFIG_DIR.parent / "colony_manager.sqlite"


def get_config_dir() -> Path:
    """Get the config directory path."""
    return DEFAULT_CONFIG_DIR


def get_db_path() -> Path:
    """Get the database file path."""
    return DEFAULT_DB_PATH


def get_colony_repository(db_path: Annotated[Path, Depends(get_db_path)]) -> ColonyRepository:
    """Get colony repository instance."""
    return SqlAlchemyColonyRepository(build_database_url(db_path))


def get_representative_repository(db_path: Annotated[Path, Depends(get_db_path)]) -> RepresentativeRepository:
    """Get representative repository instance."""
    return SqlAlchemyRepresentativeRepository(build_database_url(db_path))


def get_rule_config_provider() -> RuleConfigProvider:
    """Get rule config provider instance."""
    return FileRuleConfigProvider(config_dir=get_config_dir())


def get_colony_service(
    colony_repository: Annotated[ColonyRepository, Depends(get_colony_repository)],
    representative_repository: Annotated[RepresentativeRepository, Depends(get_representative_repository)],
    rule_config_provider: Annotated[RuleConfigProvider, Depends(get_rule_config_provider)],
) -> ColonyService:
    """Get colony service instance with dependencies."""
    return ColonyService(colony_repository, representative_repository, rule_config_provider)


def get_representative_service(
    colony_repository: Annotated[ColonyRepository, Depends(get_colony_repository)],
    representative_repository: Annotated[RepresentativeRepository, Depends(get_representative_repository)],
) -> RepresentativeService:
    """Get representative service instance with dependencies."""
    return RepresentativeService(colony_repository, representative_repository)


def get_user_repository(db_path: Annotated[Path, Depends(get_db_path)]) -> UserRepository:
    """Get user repository instance."""
    return SqlAlchemyUserRepository(build_database_url(db_path))