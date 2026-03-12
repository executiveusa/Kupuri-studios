"""
Migration v4: Skills Database Schema

Creates tables for the searchable skills catalog with categories
and autocomplete support.
"""

import aiosqlite
import logging

logger = logging.getLogger(__name__)

VERSION = 4
DESCRIPTION = "Add skills catalog with categories and search indexes"


async def upgrade(db: aiosqlite.Connection) -> None:
    """Create skills-related tables."""

    # Main skills table
    await db.execute("""
        CREATE TABLE IF NOT EXISTS skills (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            owner TEXT NOT NULL,
            repo TEXT NOT NULL,
            description TEXT,
            long_description TEXT,
            category_id TEXT,
            subcategory TEXT,
            install_command TEXT NOT NULL,
            install_count INTEGER DEFAULT 0,
            is_official BOOLEAN DEFAULT FALSE,
            is_verified BOOLEAN DEFAULT FALSE,
            is_featured BOOLEAN DEFAULT FALSE,
            tags TEXT,
            supported_agents TEXT,
            dependencies TEXT,
            version TEXT,
            documentation_url TEXT,
            source_url TEXT,
            icon_url TEXT,
            rating REAL DEFAULT 0.0,
            rating_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (category_id) REFERENCES skill_categories(id)
        )
    """)

    # Categories table
    await db.execute("""
        CREATE TABLE IF NOT EXISTS skill_categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            slug TEXT NOT NULL UNIQUE,
            description TEXT,
            icon TEXT,
            color TEXT,
            parent_id TEXT,
            sort_order INTEGER DEFAULT 0,
            skill_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (parent_id) REFERENCES skill_categories(id)
        )
    """)

    # Search terms table for autocomplete
    await db.execute("""
        CREATE TABLE IF NOT EXISTS skill_search_terms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            term TEXT NOT NULL,
            skill_id TEXT NOT NULL,
            term_type TEXT NOT NULL,
            weight INTEGER DEFAULT 1,
            FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
        )
    """)

    # User installed skills
    await db.execute("""
        CREATE TABLE IF NOT EXISTS user_installed_skills (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            skill_id TEXT NOT NULL,
            installed_at TEXT NOT NULL,
            last_used_at TEXT,
            usage_count INTEGER DEFAULT 0,
            is_enabled BOOLEAN DEFAULT TRUE,
            config TEXT,
            FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
            UNIQUE(user_id, skill_id)
        )
    """)

    # Skill ratings
    await db.execute("""
        CREATE TABLE IF NOT EXISTS skill_ratings (
            id TEXT PRIMARY KEY,
            skill_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            review TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
            UNIQUE(skill_id, user_id)
        )
    """)

    # Create indexes for fast search
    await db.execute("CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name)")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_skills_slug ON skills(slug)")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category_id)")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_skills_owner ON skills(owner)")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_skills_install_count ON skills(install_count DESC)")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_skills_rating ON skills(rating DESC)")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_skills_featured ON skills(is_featured)")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_skills_official ON skills(is_official)")

    # Full-text search index for autocomplete
    await db.execute("CREATE INDEX IF NOT EXISTS idx_search_terms ON skill_search_terms(term)")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_search_skill ON skill_search_terms(skill_id)")

    # User installed skills indexes
    await db.execute("CREATE INDEX IF NOT EXISTS idx_user_skills ON user_installed_skills(user_id)")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_installed_skill ON user_installed_skills(skill_id)")

    await db.commit()
    logger.info(f"Migration v{VERSION} upgrade completed: {DESCRIPTION}")


async def downgrade(db: aiosqlite.Connection) -> None:
    """Remove skills-related tables."""
    await db.execute("DROP TABLE IF EXISTS skill_ratings")
    await db.execute("DROP TABLE IF EXISTS user_installed_skills")
    await db.execute("DROP TABLE IF EXISTS skill_search_terms")
    await db.execute("DROP TABLE IF EXISTS skills")
    await db.execute("DROP TABLE IF EXISTS skill_categories")
    await db.commit()
    logger.info(f"Migration v{VERSION} downgrade completed")
