"""Application service for representative use cases."""

from __future__ import annotations

from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.representative import Representative
from colony_manager.domain.ports.colony_repository import ColonyRepository
from colony_manager.domain.ports.representative_repository import RepresentativeRepository


class RepresentativeService:
    """Create, update, and manage representatives and their colony assignment.
    
    This service orchestrates representative operations including creation,
    colony assignment, and unassignment. It coordinates between the colony
    and representative repositories to maintain bidirectional consistency.
    """

    def __init__(self, colony_repository: ColonyRepository, representative_repository: RepresentativeRepository) -> None:
        """Initialize the service with repository dependencies.
        
        Args:
            colony_repository: Repository for colony persistence.
            representative_repository: Repository for representative persistence.
        """
        self._colony_repository = colony_repository
        self._representative_repository = representative_repository

    def create_representative(self, representative: Representative) -> Representative:
        """Create a new representative.
        
        Args:
            representative: The representative domain object to create.
            
        Returns:
            The created representative with ID assigned.
        """
        return self._representative_repository.create(representative)

    def get_representative_by_id(self, representative_id: int) -> Representative:
        """Get a representative by ID.
        
        Args:
            representative_id: ID of the representative.
            
        Returns:
            The representative.
            
        Raises:
            NotFoundError: If representative does not exist.
        """
        representative = self._representative_repository.get(representative_id)
        if representative is None:
            raise NotFoundError(f"Representative {representative_id} not found")
        return representative

    def assign_to_colony(self, colony_id: int, representative_id: int) -> Representative:
        """Assign a representative to a colony.
        
        Updates both the colony's representative_id and the representative's
        assigned_to_colony_id to maintain bidirectional consistency.
        
        Args:
            colony_id: ID of the colony to assign to.
            representative_id: ID of the representative to assign.
            
        Returns:
            The updated representative.
            
        Raises:
            NotFoundError: If colony or representative does not exist.
        """
        colony = self._colony_repository.get(colony_id)
        if colony is None:
            raise NotFoundError(f"Colony {colony_id} not found")
        representative = self._representative_repository.get(representative_id)
        if representative is None:
            raise NotFoundError(f"Representative {representative_id} not found")
        colony.representative_id = representative_id
        self._colony_repository.update(colony)
        representative.assigned_to_colony_id = colony_id
        return self._representative_repository.update(representative)

    def unassign_from_colony(self, representative_id: int) -> Representative:
        """Unassign a representative from their colony.
        
        Clears the representative's assigned_to_colony_id and updates the
        colony's representative_id to None.
        
        Args:
            representative_id: ID of the representative to unassign.
            
        Returns:
            The updated representative.
            
        Raises:
            NotFoundError: If representative does not exist.
        """
        representative = self._representative_repository.get(representative_id)
        if representative is None:
            raise NotFoundError(f"Representative {representative_id} not found")
        if representative.assigned_to_colony_id is not None:
            colony = self._colony_repository.get(representative.assigned_to_colony_id)
            if colony is not None:
                colony.representative_id = None
                self._colony_repository.update(colony)
        representative.assigned_to_colony_id = None
        return self._representative_repository.update(representative)
