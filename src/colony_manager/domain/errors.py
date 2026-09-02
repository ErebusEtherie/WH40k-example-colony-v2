"""Domain-specific exceptions for the colony manager."""


class ColonyManagerError(Exception):
    """Base exception for the colony manager domain."""


class ConfigurationError(ColonyManagerError):
    """Raised when configuration data is invalid or missing."""


class NotFoundError(ColonyManagerError):
    """Raised when a requested entity is not found."""


class ValidationError(ColonyManagerError):
    """Raised when a requested operation violates domain validation rules."""
