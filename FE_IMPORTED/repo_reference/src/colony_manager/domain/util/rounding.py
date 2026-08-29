"""Rounding utilities for the colony manager."""

from decimal import ROUND_HALF_UP, Decimal


def round_half_up(value: float) -> int:
    """Round a float using round-half-up semantics."""
    decimal_value = Decimal(value)
    rounded = decimal_value.quantize(Decimal(1), rounding=ROUND_HALF_UP)
    return int(rounded)
