"""Repository port for audit log management.

Defines the interface for audit log persistence operations. Implementations
should be provided in adapters/persistence/.
"""

from datetime import datetime
from typing import Protocol

from colony_manager.domain.models.audit_log import AuditLog


class AuditLogRepository(Protocol):
    """Protocol defining the interface for audit log repository operations.
    
    This follows the dependency inversion principle - the domain defines
    what it needs, and adapters provide the implementation.
    """
    
    def create(self, audit_log: AuditLog) -> AuditLog:
        """Create a new audit log entry.
        
        Args:
            audit_log: Audit log entry to create.
            
        Returns:
            Created audit log with ID populated.
        """
        ...
    
    def get_by_id(self, log_id: int) -> AuditLog | None:
        """Get an audit log entry by ID.
        
        Args:
            log_id: ID of the audit log entry.
            
        Returns:
            Audit log entry if found, None otherwise.
        """
        ...
    
    def get_by_colony(
        self,
        colony_id: int,
        limit: int = 100,
        offset: int = 0,
        entity_type: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[AuditLog]:
        """Get audit log entries for a colony with filtering and pagination.
        
        Args:
            colony_id: Colony ID to filter by.
            limit: Maximum number of entries to return.
            offset: Number of entries to skip.
            entity_type: Optional filter by entity type (e.g., "colony", "infrastructure").
            start_date: Optional filter for entries after this date.
            end_date: Optional filter for entries before this date.
            
        Returns:
            List of audit log entries, ordered by changed_at descending.
        """
        ...
    
    def get_by_entity(self, entity_type: str, entity_id: int) -> list[AuditLog]:
        """Get audit log entries for a specific entity.
        
        Args:
            entity_type: Type of entity (e.g., "colony", "infrastructure").
            entity_id: ID of the entity.
            
        Returns:
            List of audit log entries for the entity.
        """
        ...