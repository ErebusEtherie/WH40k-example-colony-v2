"""CLI entrypoint for the colony manager prototype."""

from __future__ import annotations

from pathlib import Path

import typer

from colony_manager.adapters.config.loader import FileRuleConfigProvider
from colony_manager.adapters.io.colony_exporter import ColonyExporter
from colony_manager.adapters.io.colony_importer import ColonyImporter
from colony_manager.adapters.persistence.colony_repository_impl import SqlAlchemyColonyRepository
from colony_manager.adapters.persistence.db import build_database_url
from colony_manager.adapters.persistence.representative_repository_impl import (
    SqlAlchemyRepresentativeRepository,
)
from colony_manager.application.services.colony_service import ColonyService
from colony_manager.application.services.representative_service import RepresentativeService
from colony_manager.domain.enums import (
    RepresentativeType,
    SkillLevel,
)
from colony_manager.domain.errors import ColonyManagerError
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.representative import (
    Personality,
    Representative,
    RepresentativeStats,
    Skill,
    Talent,
)

app = typer.Typer(add_completion=False)
colony_app = typer.Typer(help="Colony commands")
representative_app = typer.Typer(help="Representative commands")
app.add_typer(colony_app, name="colony")
app.add_typer(representative_app, name="representative")


def cli() -> None:
    app()


@app.callback()
def main(config_dir: str | None = typer.Option(None, "--config-dir", help="Directory containing YAML config files")) -> None:
    """Colony manager CLI."""
    global _config_dir
    _config_dir = Path(config_dir or Path(__file__).resolve().parents[3] / "config")
    global _db_path
    _db_path = _config_dir.parent / "colony_manager.sqlite"


@colony_app.command("create")
def create_colony(name: str, owner: str, colony_type: str) -> None:
    provider = FileRuleConfigProvider(config_dir=_config_dir)
    colony_repo = SqlAlchemyColonyRepository(build_database_url(_db_path))
    representative_repo = SqlAlchemyRepresentativeRepository(build_database_url(_db_path))
    service = ColonyService(colony_repo, representative_repo, provider)
    colony = Colony(
        name=name,
        owner=owner,
        colony_type=colony_type,
        age_days=0,
        age_last_updated=__import__("datetime").date.today(),
        base_complacency=10,
        base_order=10,
        base_productivity=10,
        base_piety=10,
        base_size=5,
    )
    created = service.create_colony(colony)
    typer.echo(f"Created colony {created.id}: {created.name}")


@colony_app.command("show")
def show_colony(colony_id: int) -> None:
    provider = FileRuleConfigProvider(config_dir=_config_dir)
    colony_repo = SqlAlchemyColonyRepository(build_database_url(_db_path))
    representative_repo = SqlAlchemyRepresentativeRepository(build_database_url(_db_path))
    service = ColonyService(colony_repo, representative_repo, provider)
    try:
        state = service.get_state(colony_id)
    except ColonyManagerError as exc:
        typer.echo(str(exc))
        raise typer.Exit(code=1) from exc
    colony = colony_repo.get(colony_id)
    if colony is None:
        typer.echo(f"Colony {colony_id} not found")
        raise typer.Exit(code=1)

    typer.echo(f"Colony #{colony.id}: {colony.name}")
    typer.echo(f"Owner: {colony.owner}")
    typer.echo(f"Type: {colony.colony_type}")
    typer.echo(f"Age: {colony.age_days} days")
    typer.echo("State:")
    typer.echo(f"  Size: {state['size']}")
    typer.echo(f"  Complacency: {state['complacency']}")
    typer.echo(f"  Order: {state['order']}")
    typer.echo(f"  Productivity: {state['productivity']}")
    typer.echo(f"  Piety: {state['piety']}")
    typer.echo(f"  Leadership modifier: {state['leadership_modifier']}")
    typer.echo(f"  Profit factor: {state['profit_factor']}")
    typer.echo(f"  Lore state: {state['lore_state'].value}")


@colony_app.command("list")
def list_colonies() -> None:
    colony_repo = SqlAlchemyColonyRepository(build_database_url(_db_path))
    colonies = colony_repo.list()
    if not colonies:
        typer.echo("No colonies found")
        return

    typer.echo("Colonies:")
    for colony in colonies:
        typer.echo(f"- #{colony.id}: {colony.name} ({colony.colony_type}) — owner: {colony.owner}")


@representative_app.command("create")
def create_representative(name: str, representative_type: str) -> None:
    colony_repo = SqlAlchemyColonyRepository(build_database_url(_db_path))
    representative_repo = SqlAlchemyRepresentativeRepository(build_database_url(_db_path))
    service = RepresentativeService(colony_repo, representative_repo)
    representative = Representative(
        name=name,
        type=RepresentativeType(representative_type),
        personalities=[Personality(name="Example", description="desc", effect="effect")],
        stats=RepresentativeStats(ws=10, bs=10, s=10, t=10, ag=10, int=10, per=10, wp=10, fel=10),
        skills=[Skill(name="Skill", level=SkillLevel.KNOWN, description="desc")],
        talents=[Talent(name="Talent", description="desc")],
    )
    created = service.create_representative(representative)
    typer.echo(f"Created representative {created.id}: {created.name}")


@representative_app.command("assign")
def assign_representative(colony_id: int, representative_id: int) -> None:
    colony_repo = SqlAlchemyColonyRepository(build_database_url(_db_path))
    representative_repo = SqlAlchemyRepresentativeRepository(build_database_url(_db_path))
    service = RepresentativeService(colony_repo, representative_repo)
    try:
        updated = service.assign_to_colony(colony_id, representative_id)
    except ColonyManagerError as exc:
        typer.echo(str(exc))
        raise typer.Exit(code=1) from exc
    typer.echo(f"Assigned representative {representative_id} to colony {colony_id}: {updated.representative_id}")


@colony_app.command("export")
def export_colony(colony_id: int, path: str) -> None:
    colony_repo = SqlAlchemyColonyRepository(build_database_url(_db_path))
    colony = colony_repo.get(colony_id)
    if colony is None:
        typer.echo(f"Colony {colony_id} not found")
        raise typer.Exit(code=1)
    exporter = ColonyExporter()
    exporter.export(colony, None, path)
    typer.echo(f"Exported colony {colony_id} to {path}")


@colony_app.command("import")
def import_colony(path: str) -> None:
    importer = ColonyImporter()
    colony, representative = importer.import_from_path(path)
    typer.echo(f"Imported colony {colony.name} with representative {representative.name if representative else 'None'}")


_config_dir = Path(__file__).resolve().parents[3] / "config"
_db_path = _config_dir.parent / "colony_manager.sqlite"


if __name__ == "__main__":
    cli()
