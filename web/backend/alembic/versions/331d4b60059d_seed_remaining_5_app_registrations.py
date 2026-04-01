"""seed remaining 5 app registrations

Revision ID: 331d4b60059d
Revises: 1db865cd7eb6
Create Date: 2026-04-01 00:24:27.416915

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '331d4b60059d'
down_revision: Union[str, Sequence[str], None] = '1db865cd7eb6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

APPS = [
    {
        "app_id": "calculator",
        "name": "Math Calculator",
        "description": "Safe math expression evaluator. Calculate arithmetic, algebra, and more.",
        "auth_type": "none",
        "iframe_url": "/apps/calculator/index.html",
        "tool_schemas": ([
            {"name": "calculate", "description": "Evaluate a math expression safely.", "parameters": [
                {"name": "expression", "type": "string", "description": "Math expression to evaluate (e.g., '2 + 3 * 4')", "required": True}
            ]},
        ]),
    },
    {
        "app_id": "dictionary",
        "name": "Dictionary",
        "description": "Look up word definitions using the Free Dictionary API. Great for vocabulary building.",
        "auth_type": "none",
        "iframe_url": "/apps/dictionary/index.html",
        "tool_schemas": ([
            {"name": "define_word", "description": "Look up the definition of a word.", "parameters": [
                {"name": "word", "type": "string", "description": "The word to define", "required": True}
            ]},
        ]),
    },
    {
        "app_id": "weather",
        "name": "Weather",
        "description": "Get current weather conditions for any city via OpenWeatherMap.",
        "auth_type": "none",
        "iframe_url": "/apps/weather/index.html",
        "tool_schemas": ([
            {"name": "get_weather", "description": "Get current weather for a city.", "parameters": [
                {"name": "city", "type": "string", "description": "City name (e.g., 'Tokyo', 'New York')", "required": True}
            ]},
        ]),
    },
    {
        "app_id": "flashcards",
        "name": "Flashcard Quiz",
        "description": "Interactive flashcard quiz for studying. Start a quiz, submit answers, track your score.",
        "auth_type": "none",
        "iframe_url": "/apps/flashcards/index.html",
        "tool_schemas": ([
            {"name": "start_quiz", "description": "Start a new flashcard quiz.", "parameters": [
                {"name": "cards", "type": "array", "description": "Array of {question, answer} objects. Uses defaults if empty.", "required": False}
            ]},
            {"name": "submit_answer", "description": "Submit an answer to the current quiz question.", "parameters": [
                {"name": "answer", "type": "string", "description": "The student's answer", "required": True}
            ]},
            {"name": "get_score", "description": "Get current quiz score and progress.", "parameters": []},
        ]),
    },
    {
        "app_id": "life-skills",
        "name": "Life Skills Toolkit",
        "description": "Practical life skills tools: budget planner, compound interest calculator, decision matrix, meal planner, schedule optimizer.",
        "auth_type": "none",
        "iframe_url": "/apps/life-skills/index.html",
        "tool_schemas": ([
            {"name": "plan_budget", "description": "Create a budget from income and expenses.", "parameters": [
                {"name": "income", "type": "number", "description": "Monthly income", "required": True},
                {"name": "expenses", "type": "object", "description": "Object of expense categories and amounts", "required": True},
            ]},
            {"name": "calculate_interest", "description": "Calculate compound interest over time.", "parameters": [
                {"name": "principal", "type": "number", "description": "Starting amount", "required": True},
                {"name": "rate", "type": "number", "description": "Annual interest rate (%)", "required": True},
                {"name": "years", "type": "number", "description": "Number of years", "required": True},
            ]},
            {"name": "decision_matrix", "description": "Compare options using weighted criteria.", "parameters": [
                {"name": "options", "type": "array", "description": "List of option names", "required": True},
                {"name": "criteria", "type": "array", "description": "List of criteria names", "required": True},
                {"name": "weights", "type": "array", "description": "Weight for each criterion", "required": False},
                {"name": "scores", "type": "array", "description": "2D array of scores (options × criteria)", "required": False},
            ]},
            {"name": "plan_meals", "description": "Generate a meal plan for a given number of days.", "parameters": [
                {"name": "days", "type": "number", "description": "Number of days to plan", "required": False},
                {"name": "dietary", "type": "string", "description": "Dietary preference (e.g., 'vegetarian')", "required": False},
            ]},
            {"name": "optimize_schedule", "description": "Optimize a daily schedule by priority.", "parameters": [
                {"name": "tasks", "type": "array", "description": "Array of {name, duration (min), priority (1-10)}", "required": True},
            ]},
        ]),
    },
]


def upgrade() -> None:
    app_registrations = sa.table(
        "app_registrations",
        sa.column("app_id", sa.Text),
        sa.column("name", sa.Text),
        sa.column("description", sa.Text),
        sa.column("auth_type", sa.Text),
        sa.column("iframe_url", sa.Text),
        sa.column("tool_schemas", postgresql.JSONB),
        sa.column("status", sa.Text),
        sa.column("age_rating", sa.Text),
        sa.column("is_active", sa.Boolean),
    )
    rows = [
        {**app, "status": "active", "age_rating": "all", "is_active": True}
        for app in APPS
    ]
    op.bulk_insert(app_registrations, rows)


def downgrade() -> None:
    app_ids = [a["app_id"] for a in APPS]
    op.execute(sa.text(f"DELETE FROM app_registrations WHERE app_id IN ({','.join(repr(a) for a in app_ids)})"))
