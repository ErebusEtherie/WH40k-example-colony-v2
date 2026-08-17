"""Export a colony and optional representative to a portable save file."""

from __future__ import annotations

from pathlib import Path

from colony_manager.adapters.io.mappers import domain_to_save_file
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.representative import Representative


class ColonyExporter:
    def export(self, colony: Colony, representative: Representative | None = None, path: str | Path | None = None) -> str:
        save_file = domain_to_save_file(colony, representative)
        payload = save_file.model_dump_json()
        if path is not None:
            Path(path).write_text(payload, encoding="utf-8")
        return payload
