"""Repository port for development plan management.

Defines the interface for development plan persistence operations. Implementations
should be provided in adapters/persistence/.
"""

from typing import Protocol

from colony_manager.domain.models.development_plan import DevelopmentPlan


class DevelopmentPlanRepository(Protocol):
    """Protocol defining the interface for development plan repository operations.
    
    This follows the dependency inversion principle - the domain defines
    what it needs, and adapters provide the implementation.
    """
    
    def create(self, plan: DevelopmentPlan) -> DevelopmentPlan:
        """Create a new development plan.
        
        Args:
            plan: Development plan to create.
            
        Returns:
            Created plan with ID populated.
            
        Raises:
            ValueError: If plan data is invalid.
        """
        ...
    
    def get_by_id(self, plan_id: int) -> DevelopmentPlan | None:
        """Get development plan by ID.
        
        Args:
            plan_id: Plan ID to retrieve.
            
        Returns:
            Development plan if found, None otherwise.
        """
        ...
    
    def get_by_colony(self, colony_id: int) -> list[DevelopmentPlan]:
        """Get all development plans for a colony.
        
        Args:
            colony_id: Colony ID to filter by.
            
        Returns:
            List of development plans for the colony.
        """
        ...
    
    def update(self, plan: DevelopmentPlan) -> DevelopmentPlan:
        """Update an existing development plan.
        
        Args:
            plan: Development plan with updated fields (must have id set).
            
        Returns:
            Updated plan.
            
        Raises:
            ValueError: If plan not found.
        """
        ...
    
    def delete(self, plan_id: int) -> None:
        """Delete a development plan.
        
        Args:
            plan_id: ID of plan to delete.
            
        Raises:
            ValueError: If plan not found.
        """
        ...