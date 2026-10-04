"""
Database Schema Initialization Script.
Creates all database tables defined in the SQLAlchemy declarative base.
"""
import os
import sys
from pathlib import Path

# Ensure root project is on python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database.session import engine
from database.base import Base
import database.models  # Ensure all models are registered on Base.metadata
from backend.app.core.logging import logger


def init_db(drop_all: bool = False):
    """
    Initializes the database schema.
    If drop_all is True, drops all existing tables before recreating.
    """
    if drop_all:
        logger.warning("Dropping all existing database tables...")
        Base.metadata.drop_all(bind=engine)
    
    logger.info("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema initialized successfully.")


if __name__ == "__main__":
    drop_flag = "--drop" in sys.argv
    init_db(drop_all=drop_flag)
