# app/event_models.py
import json
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from .database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    profile = Column(String(100), nullable=False, default="wedding_default")

    # Store raw JSON blobs as TEXT
    guests_json = Column(Text, nullable=False)
    tables_json = Column(Text, nullable=False)
    weights_json = Column(Text, nullable=True)
    last_plan_json = Column(Text, nullable=True)

    # ---- NEW METRICS (Iteration 7) ----
    attempts_made = Column(Integer, nullable=True)

    must_not_violations = Column(Integer, nullable=True)
    wants_satisfied = Column(Integer, nullable=True)
    adjacent_singles = Column(Integer, nullable=True)
    same_gender_adjacencies = Column(Integer, nullable=True)
    alternating_tables = Column(Integer, nullable=True)
    split_couples = Column(Integer, nullable=True)

    # -----------------------------------

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Convenience helpers to keep your API code cleaner:
    # -----------------------------------------------

    def set_guests(self, guests_list):
        """Serialise Python list → TEXT."""
        self.guests_json = json.dumps(guests_list)

    def get_guests(self):
        """Return Python list."""
        return json.loads(self.guests_json or "[]")

    def set_tables(self, tables_list):
        self.tables_json = json.dumps(tables_list)

    def get_tables(self):
        return json.loads(self.tables_json or "[]")

    def set_weights(self, weights_dict):
        self.weights_json = json.dumps(weights_dict) if weights_dict else None

    def get_weights(self):
        return json.loads(self.weights_json) if self.weights_json else None

    def set_last_plan(self, plan_dict):
        self.last_plan_json = json.dumps(plan_dict) if plan_dict else None

    def get_last_plan(self):
        return json.loads(self.last_plan_json) if self.last_plan_json else None
