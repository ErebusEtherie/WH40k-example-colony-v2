"""Migration script for development_plans table schema update.

This migration updates the development_plans table to support the new
Development Plan workflow with status transitions and INSTALL action.

Changes:
- Added: target_type (VARCHAR(100), NOT NULL)
- Added: notes (TEXT, NULL)
- Added: order (INTEGER, NOT NULL, DEFAULT 0)
- Removed: acquisition_plan (TEXT)
- Removed: progress (INTEGER)
- Removed: completed_at (DATETIME)
- Modified: priority (DEFAULT 1)
- Modified: created_at (DATETIME, was DATE)

Since this is a greenfield project, we recreate the table.
"""

import sqlite3
from pathlib import Path


def migrate(db_path: Path) -> None:
    """Run the migration on the given database.

    Args:
        db_path: Path to the SQLite database file.
    """
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    # Check if development_plans table exists
    cursor.execute("""
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='development_plans'
    """)
    table_exists = cursor.fetchone() is not None

    if not table_exists:
        print("development_plans table does not exist, skipping migration")
        conn.close()
        return

    # Get existing data if any (not migrated due to schema changes)
    cursor.execute("SELECT * FROM development_plans")
    cursor.fetchall()

    # Drop the old table
    cursor.execute("DROP TABLE development_plans")

    # Create the new table with updated schema
    cursor.execute("""
        CREATE TABLE development_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            colony_id INTEGER NOT NULL,
            upgrade_type VARCHAR(50) NOT NULL,
            target_type VARCHAR(100) NOT NULL,
            target_name VARCHAR(200) NOT NULL,
            priority INTEGER NOT NULL DEFAULT 1,
            description TEXT NOT NULL,
            notes TEXT DEFAULT '',
            order INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(50) NOT NULL DEFAULT 'planned',
            created_by INTEGER NOT NULL,
            created_at DATETIME,
            FOREIGN KEY (colony_id) REFERENCES colonies(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    """)

    # Note: We're not migrating existing data since the schema changed significantly
    # The old fields (acquisition_plan, progress, completed_at) are removed
    # and new required fields (target_type) have no sensible defaults

    conn.commit()
    conn.close()
    print(f"Migration completed on {db_path}")
    print("Note: Existing development plan data was not migrated due to schema changes")


if __name__ == "__main__":
    import os
    import sys

    db_path_str = os.environ.get("COLONY_DB_PATH", "colony.db")
    db_path = Path(db_path_str)

    if not db_path.exists():
        print(f"Database not found at {db_path}")
        sys.exit(1)

    migrate(db_path)
