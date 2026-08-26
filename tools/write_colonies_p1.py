import textwrap

content = textwrap.dedent('''
    """Colony API router."""

    from fastapi import APIRouter, Depends, HTTPException, status

    from colony_manager.adapters.api.dependencies import get_colony_service
    from colony_manager.adapters.api.schemas.colony import (
        ColonyCreate,
        ColonyListItem,
        ColonyResponse,
        ColonyStateNested,
        ColonyStateStat,
        ColonyUpdate,
    )
    from colony_manager.adapters.api.schemas.modifier import ModifierCreate, ModifierResponse
    from colony_manager.application.services.colony_service import ColonyService
    from colony_manager.domain.errors import NotFoundError
    from colony_manager.domain.models.modifier import Modifier

    router = APIRouter(prefix="/colonies", tags=["colonies"])
''').strip()

with open("src/colony_manager/adapters/api/routers/colonies.py", "w", encoding="utf-8") as f:
    f.write(content + "\n")
print("Part 1 done")
