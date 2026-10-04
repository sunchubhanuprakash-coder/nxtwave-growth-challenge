"""
Database models and session package for AI Student Growth Engine.
Exports all 15 core entities, Base declarative, and session generators.
"""
from database.base import Base
from database.session import engine, SessionLocal, get_db
from database.models import (
    College,
    Club,
    Student,
    Campaign,
    CampaignSource,
    Event,
    Registration,
    Referral,
    DailyMetric,
    BudgetTransaction,
    Experiment,
    ExperimentResult,
    AutomationRule,
    AutomationEvent,
    AIInsight,
    GrowthAlert,
    SimulationState,
)

__all__ = [
    "Base",
    "engine",
    "SessionLocal",
    "get_db",
    "College",
    "Club",
    "Student",
    "Campaign",
    "CampaignSource",
    "Event",
    "Registration",
    "Referral",
    "DailyMetric",
    "BudgetTransaction",
    "Experiment",
    "ExperimentResult",
    "AutomationRule",
    "AutomationEvent",
    "AIInsight",
    "GrowthAlert",
    "SimulationState",
]
