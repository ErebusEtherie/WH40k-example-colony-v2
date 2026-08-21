"""Import a portable save file back into domain models."""

from __future__ import annotations

from pathlib import Path

from colony_manager.adapters.io.mappers import save_file_to_domain
from colony_manager.adapters.io.save_file_schema import ColonySaveFile
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.colony_user import ColonyUser
from colony_manager.domain.models.development_plan import DevelopmentPlan
from colony_manager.domain.models.event import Event
from colony_manager.domain.models.representative import Representative


class ColonyImporter:
    """Import colony data from a portable JSON format."""
    
    def import_from_path(self, path: str | Path) -> dict:
        """Import colony from a file path.
        
        Returns:
            Dictionary with 'colony', 'representative', 'events', 'development_plans', 'colony_users'
        """
        payload = Path(path).read_text(encoding="utf-8")
        return self.import_from_string(payload)

    def import_from_string(self, payload: str) -> dict:
        """Import colony from a JSON string.
        
        Returns:
            Dictionary with 'colony', 'representative', 'events', 'development_plans', 'colony_users'
        """
        save_file = ColonySaveFile.model_validate_json(payload)
        return save_file_to_domain(save_file)
