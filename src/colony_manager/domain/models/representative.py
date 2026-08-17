"""Domain model for representatives."""

from pydantic import BaseModel, Field

from colony_manager.domain.enums import (
    DynastyOutcome,
    ModifierStat,
    RepresentativeType,
    SkillLevel,
)


class RepresentativeStats(BaseModel):
    ws: int = Field(gt=0)
    bs: int = Field(gt=0)
    s: int = Field(gt=0)
    t: int = Field(gt=0)
    ag: int = Field(gt=0)
    int_: int = Field(gt=0, alias="int")
    per: int = Field(gt=0)
    wp: int = Field(gt=0)
    fel: int = Field(gt=0)
    
    model_config = {"populate_by_name": True}
    
    @property
    def int_bonus(self) -> int:
        """Calculate Intelligence bonus (stat / 10, floor)."""
        return self.int_ // 10
    
    @property
    def per_bonus(self) -> int:
        """Calculate Perception bonus (stat / 10, floor)."""
        return self.per // 10
    
    @property
    def fel_bonus(self) -> int:
        """Calculate Fellowship bonus (stat / 10, floor)."""
        return self.fel // 10
    
    @property
    def highest_leadership_bonus(self) -> int:
        """Get highest of Int, Per, Fel bonus for Leadership modifier."""
        return max(self.int_bonus, self.per_bonus, self.fel_bonus)


class PersonalityEffect(BaseModel):
    """A single stat effect from a personality."""
    stat: ModifierStat
    value: int
    condition: str | None = None


class Personality(BaseModel):
    """Representative personality with mechanical effects."""
    name: str
    description: str
    stat_effects: list[PersonalityEffect] = Field(default_factory=list)
    calamitous_modifier: int = 0
    special_rule: str | None = None


class Skill(BaseModel):
    name: str
    level: SkillLevel
    description: str


class Talent(BaseModel):
    name: str
    description: str


class Representative(BaseModel):
    id: int | None = None
    name: str
    type: RepresentativeType
    personalities: list[Personality] = Field(min_length=1)
    stats: RepresentativeStats
    skills: list[Skill] = Field(default_factory=list)
    talents: list[Talent] = Field(default_factory=list)
    # For Dynasty Member: chosen outcome from Consequences of Nepotism
    dynasty_outcome: DynastyOutcome | None = None
    # Cumulative calamitous events modifier from all sources
    calamitous_modifier: int = 0
    
    @property
    def loss_mitigation_stat(self) -> ModifierStat | None:
        """Get the stat this representative type protects from losses."""
        mitigation_map = {
            RepresentativeType.JUDGE: ModifierStat.ORDER,
            RepresentativeType.CARDINAL: ModifierStat.PIETY,
            RepresentativeType.COLONIST_REPRESENTATIVE: ModifierStat.COMPLACENCY,
            RepresentativeType.MILITARY_COMMANDER: ModifierStat.PRODUCTIVITY,
        }
        return mitigation_map.get(self.type)
    
    def get_total_personality_calamity_modifier(self) -> int:
        """Sum calamitous modifiers from all personalities."""
        total = 0
        for personality in self.personalities:
            if personality.special_rule and "roll twice" in personality.special_rule.lower():
                continue
            total += personality.calamitous_modifier
        return total
    
    def update_calamitous_modifier(self) -> None:
        """Recalculate total calamitous modifier from personalities and dynasty outcome."""
        total = self.get_total_personality_calamity_modifier()
        
        # Add dynasty outcome modifier if applicable
        if self.dynasty_outcome:
            dynasty_modifiers = {
                DynastyOutcome.THAT_ONE_HAS_POTENTIAL: 0,
                DynastyOutcome.ONE_TO_KEEP_AN_EYE_ON: 2,
                DynastyOutcome.THRILLING_HEROICS: 3,
                DynastyOutcome.COME_ON_ITS_JUST_A_GROX: 4,
                DynastyOutcome.YOU_BUILT_THE_PALACE_ON_A_VOLCANO: 5,
            }
            total += dynasty_modifiers.get(self.dynasty_outcome, 0)
        
        self.calamitous_modifier = total