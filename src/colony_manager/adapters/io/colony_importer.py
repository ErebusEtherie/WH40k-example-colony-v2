"""Import a portable save file back into domain models."""

from __future__ import annotations

import json
from pathlib import Path

from colony_manager.adapters.io.mappers import save_file_to_domain
from colony_manager.adapters.io.save_file_schema import ColonySaveFile
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.representative import Representative


class ColonyImporter:
    def import_from_path(self, path: str | Path) -> tuple[Colony, Representative | None]:
        payload = Path(path).read_text(encoding="utf-8")
        return self.import_from_string(payload)

    def import_from_string(self, payload: str) -> tuple[Colony, Representative | None]:
        save_file = ColonySaveFile.model_validate_json(payload)
        return save_file_to_domain(save_file)
