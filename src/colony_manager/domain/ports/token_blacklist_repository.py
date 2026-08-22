"""Repository port for token blacklist management.

Defines the interface for token blacklist persistence operations. Implementations
should be provided in adapters/persistence/.
"""

from datetime import datetime
from typing import Protocol

from colony_manager.domain.models.token_blacklist import TokenBlacklist


class TokenBlacklistRepository(Protocol):
    """Protocol defining the interface for token blacklist repository operations.
    
    This follows the dependency inversion principle - the domain defines
    what it needs, and adapters provide the implementation.
    """
    
    def create(self, token_blacklist: TokenBlacklist) -> TokenBlacklist:
        """Add a token to the blacklist.
        
        Args:
            token_blacklist: Token blacklist entry to create.
            
        Returns:
            Created entry with ID populated.
        """
        ...
    
    def is_blacklisted(self, token_id: str) -> bool:
        """Check if a token ID is blacklisted.
        
        Args:
            token_id: The JWT 'jti' claim value to check.
            
        Returns:
            True if the token is blacklisted and not yet expired.
        """
        ...
    
    def revoke_all_user_tokens(self, user_id: int, reason: str | None = None) -> int:
        """Revoke all tokens for a user.
        
        Args:
            user_id: ID of the user whose tokens to revoke.
            reason: Optional reason for revocation.
            
        Returns:
            Number of tokens revoked.
        """
        ...
    
    def cleanup_expired(self, before: datetime | None = None) -> int:
        """Remove expired blacklist entries.
        
        Args:
            before: Cutoff datetime (defaults to now). Entries with expires_at
                before this time will be removed.
                
        Returns:
            Number of entries removed.
        """
        ...