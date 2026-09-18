# Persistence Constraints

## Repository Pattern

Repository (runtime storage) and Importer/Exporter (portability) are
separate concerns with separate implementations. Do not force behind one
interface.

## Mapping

Map between persistence schema and domain model explicitly
(`to_domain()` / `to_row()`). Don't rely on Pydantic's `.model_dump()`
matching by accident.

## Schema Evolution

Note assumptions likely to change in code/comments. Do not add migration
tooling prematurely.
