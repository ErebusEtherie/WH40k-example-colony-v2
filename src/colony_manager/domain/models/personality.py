"""Domain models for representative personalities."""

from pydantic import BaseModel, Field

from colony_manager.domain.enums import ModifierStat


class PersonalityEffect(BaseModel):
    """A single stat effect from a personality."""

    stat: str
    value: int
    condition: str | None = None
    choices: list[str] | None = None
    dice: str | None = None


class Personality(BaseModel):
    """Representative personality template with mechanical effects.
    
    This is the template definition loaded from config/personalities.yaml.
    For actual assignments to a Representative, use PersonalityAssignment.
    """

    name: str
    display_name: str
    description: str
    stat_effects: list[PersonalityEffect] = Field(default_factory=list)
    calamitous_modifier: int = 0
    special_rule: str | None = None


class PersonalityAssignment(BaseModel):
    """A personality assigned to a Representative with roll/choice data.
    
    Per Rogue Trader Colony Rules, certain personalities require GM input
    at the time of assignment:
    - Mad: Requires a 1d5 roll that determines the Order penalty (-1d5)
    - Scholarly: Requires choosing which stat gets +1 (lowest stat at time of installation)
    - Ties With...: Requires choosing which stat gets +1 (based on organization)
    
    The mad_order_roll and chosen_stat fields must be set when assigning
    these personalities, and cleared if the personality is removed/reassigned.
    """

    personality_type: str  # References Personality.name from config
    mad_order_roll: int | None = Field(None, ge=1, le=5)
    chosen_stat: ModifierStat | None = None

    def get_effective_order_penalty(self) -> int | None:
        """Get the Order penalty for Mad personality based on the roll.
        
        Returns:
            Negative value (-1 to -5) if Mad with a roll, None otherwise.
        """
        if self.mad_order_roll is not None:
            return -self.mad_order_roll
        return None

    def get_chosen_stat_effect(self) -> tuple[ModifierStat | None, int]:
        """Get the chosen stat and its value.
        
        Returns:
            Tuple of (stat, value) where value is typically 1.
            Returns (None, 0) if no chosen_stat is set.
        """
        if self.chosen_stat is not None:
            return (self.chosen_stat, 1)
        return (None, 0)