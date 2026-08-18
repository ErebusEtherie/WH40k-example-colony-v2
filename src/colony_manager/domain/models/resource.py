"""Domain model for planetary resources."""

from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from colony_manager.domain.enums import ResourceType


class ColonyResource(BaseModel):
    """
    A planetary resource that a colony can exploit.
    
    Resources are tracked manually by players - the system does not
    automatically calculate depletion or harvesting yields. Players
    update abundance values as they see fit based on their campaign.
    
    Attributes:
        id: Database ID (None for transient/new resources)
        colony_id: ID of the colony that owns this resource
        resource_type: Type of resource (mineral, organic, archeotech, etc.)
        name: Custom name for this specific deposit (e.g., "Krontek Iron Veins")
        abundance: Raw abundance value (typically 1-100+, player-set)
        notes: Optional player notes about the resource
        discovered_date: When the resource was discovered/added
    """
    model_config = ConfigDict(validate_assignment=True)
    
    id: int | None = None
    colony_id: int
    resource_type: ResourceType
    name: str
    abundance: int = Field(ge=0)
    notes: str = ""
    discovered_date: date
    
    @property
    def abundance_level(self) -> str:
        """
        Get the descriptive abundance level label based on the abundance value.
        
        Per Rogue Trader resource rules:
        - 0-15: Minimal (trace amounts, not sustainable)
        - 16-40: Limited (several years of exploitation)
        - 41-65: Sustainable (viable long-term source)
        - 66-85: Significant (rich and accessible)
        - 86-98: Major (vast potential, requires investment)
        - 99+: Plentiful (seemingly limitless)
        """
        if self.abundance <= 15:
            return "Minimal"
        elif self.abundance <= 40:
            return "Limited"
        elif self.abundance <= 65:
            return "Sustainable"
        elif self.abundance <= 85:
            return "Significant"
        elif self.abundance <= 98:
            return "Major"
        else:
            return "Plentiful"