"""Password hashing utilities.

Uses bcrypt for secure password hashing. This is a domain utility that
can be used by both domain services and adapters.
"""

import bcrypt


def hash_password(password: str) -> str:
    """Hash a password using bcrypt.
    
    Args:
        password: Plain text password to hash
        
    Returns:
        Hashed password as string
        
    Note:
        bcrypt automatically generates a salt and includes it in the hash.
        The hash includes the salt, so we don't need to store them separately.
    """
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)  # 12 rounds is a good balance of security/speed
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Previously hashed password to compare against
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        password_bytes = plain_password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except (ValueError, TypeError):
        # Invalid hash format or encoding issues
        return False