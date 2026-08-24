"""Domain models for representative personalities."""

from pydantic import BaseModel, Field, model_validator


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
    Personalities are assigned directly to Representatives as Personality
    objects. Variable effects (Mad's Order penalty, Scholarly/Ties With...
    stat choices) are handled via Custom Modifiers applied by the GM rather
    than tracked in the domain model.
    """

    name: str
    display_name: str | None = None
    description: str
    stat_effects: list[PersonalityEffect] = Field(default_factory=list)
    calamitous_modifier: int = 0
    special_rule: str | None = None

    @model_validator(mode='after')
    def set_default_display_name(self):
        """Default display_name to name if not provided."""
        if self.display_name is None:
            self.display_name = self.name
        return self