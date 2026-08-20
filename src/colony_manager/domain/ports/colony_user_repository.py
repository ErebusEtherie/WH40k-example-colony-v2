"""Repository port for colony user membership management.

Defines the interface for colony user membership persistence operations. Implementations
should be provided in adapters/persistence/.
"""

from typing import Protocol

from colony_manager.domain.models.colony_user import ColonyUser


class ColonyUserRepository(Protocol):
    """Protocol defining the interface for colony user repository operations.
    
    This follows the dependency inversion principle - the domain defines
    what it needs, and adapters provide the implementation.
    """
    
    def create(self, colony_user: ColonyUser) -> ColonyUser:
        """Create a new colony-user membership.
        
        Args:
            colony_user: ColonyUser to create.
            
        Returns:
            Created ColonyUser with ID populated.
            
        Raises:
            ValueError: If membership already exists or data is invalid.
        """
        ...
    
    def get_by_id(self, membership_id: int) -> ColonyUser | None:
        """Get colony-user membership by ID.
        
        Args:
            membership_id: Membership ID to retrieve.
            
        Returns:
            ColonyUser if found, None otherwise.
        """
        ...
    
    def get_by_colony_and_user(self, colony_id: int, user_id: int) -> ColonyUser | None:
        """Get colony-user membership by colony and user IDs.
        
        Args:
            colony_id: Colony ID.
            user_id: User ID.
            
        Returns:
            ColonyUser if found, None otherwise.
        """
        ...
    
    def get_by_colony(self, colony_id: int) -> list[ColonyUser]:
        """Get all memberships for a colony.
        
        Args:
            colony_id: Colony ID to filter by.
            
        Returns:
            List of ColonyUser memberships for the colony.
        """
        ...
    
    def get_by_user(self, user_id: int) -> list[ColonyUser]:
        """Get all memberships for a user.
        
        Args:
            user_id: User ID to filter by.
            
        Returns:
            List of ColonyUser memberships for the user.
        """
        ...
    
    def update(self, colony_user: ColonyUser) -> ColonyUser:
        """Update an existing colony-user membership.
        
        Args:
            colony_user: ColonyUser with updated fields (must have id set).
            
        Returns:
            Updated ColonyUser.
            
        Raises:
            ValueError: If membership not found.
        """
        ...
    
    def delete(self, membership_id: int) -> None:
        """Delete a colony-user membership.
        
        Args:
            membership_id: ID of membership to delete.
            
        Raises:
            ValueError: If membership not found.
        """
        ...