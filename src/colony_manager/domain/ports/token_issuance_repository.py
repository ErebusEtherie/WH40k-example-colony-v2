"""Repository port for token issuance tracking.

Defines the interface for token issuance persistence operations.
"""

from datetime import datetime
from typing import Protocol

from colony_manager.domain.models.token_issuance import TokenIssuance


class TokenIssuanceRepository(Protocol):
    """Protocol defining the interface for token issuance repository operations."""
    
    def create(self, issuance: TokenIssuance) -> TokenIssuance:
        """Record a token issuance.
        
        Args:
            issuance: Token issuance entry to create.
            
        Returns:
            Created entry with ID populated.
        """
        ...
    
    def get_active_tokens(self, user_id: int) -> list[TokenIssuance]:
        """Get all active (non-revoked, non-expired) tokens for a user.
        
        Args:
            user_id: User ID to get tokens for.
            
        Returns:
            List of active token issuances.
        """
        ...
    
    def revoke_token(self, token_id: str, revoked_at: datetime) -> bool:
        """Revoke a specific token.
        
        Args:
            token_id: The token's jti claim.
            revoked_at: When the token was revoked.
            
        Returns:
            True if token was found and revoked, False otherwise.
        """
        ...
    
    def revoke_all_user_tokens(self, user_id: int, revoked_at: datetime) -> int:
        """Revoke all tokens for a user.
        
        Args:
            user_id: User ID whose tokens to revoke.
            revoked_at: When the tokens were revoked.
            
        Returns:
            Number of tokens revoked.
        """
        ...
    
    def cleanup_old_issuances(self, before: datetime) -> int:
        """Remove old token issuance records.
        
        Args:
            before: Remove issuances that expired before this datetime.
            
        Returns:
            Number of records removed.
        """
        ...