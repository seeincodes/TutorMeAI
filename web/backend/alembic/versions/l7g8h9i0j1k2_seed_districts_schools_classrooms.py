"""seed districts, schools, classrooms, and richer demo data

Revision ID: l7g8h9i0j1k2
Revises: 29468b5ece2f
Create Date: 2026-04-05 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "l7g8h9i0j1k2"
down_revision: Union[str, Sequence[str], None] = "m8h9i0j1k2l3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Districts ─────────────────────────────────────────────────────
    op.execute(sa.text("""
        INSERT INTO districts (id, name, state, daily_token_budget, tokens_used_today)
        VALUES
            ('a0000000-0000-0000-0000-000000000001', 'Springfield USD', 'IL', 200000, 0),
            ('a0000000-0000-0000-0000-000000000002', 'Riverside USD', 'CA', 150000, 0)
        ON CONFLICT DO NOTHING
    """))

    # ── Schools ───────────────────────────────────────────────────────
    op.execute(sa.text("""
        INSERT INTO schools (id, district_id, name)
        VALUES
            ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Lincoln Elementary'),
            ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Washington Middle School'),
            ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Riverside High'),
            ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Oak Park Elementary')
        ON CONFLICT DO NOTHING
    """))

    # ── New users: teacher2, district_admin1, more students ───────────
    # teacher2 password: teacher123
    # district_admin1 password: district123
    op.execute(sa.text("""
        INSERT INTO users (id, username, password_hash, display_name, role, grade, district_id, school_id, is_active)
        VALUES
            (gen_random_uuid(), 'teacher2', '$2b$12$tNGZw3uTNICVdDLW757PXeN4DTyFg3i9iracjF.gjWLs6EQnPF8uy',
             'Teacher Two', 'teacher', NULL,
             'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', true),
            (gen_random_uuid(), 'district_admin1', '$2b$12$ELocwZUJolh1H.h2w1XYy.FXdQ1MchoAaEyxDQHaJdtSPtnM3xdS.',
             'Springfield Admin', 'district_admin', NULL,
             'a0000000-0000-0000-0000-000000000001', NULL, true)
        ON CONFLICT (username) DO NOTHING
    """))

    # ── Assign existing users to districts/schools ────────────────────
    # teacher1 → Springfield USD / Lincoln Elementary
    op.execute(sa.text("""
        UPDATE users SET
            district_id = 'a0000000-0000-0000-0000-000000000001',
            school_id = 'b0000000-0000-0000-0000-000000000001'
        WHERE username = 'teacher1'
    """))

    # student1, student2 → Springfield USD / Lincoln Elementary
    op.execute(sa.text("""
        UPDATE users SET
            district_id = 'a0000000-0000-0000-0000-000000000001',
            school_id = 'b0000000-0000-0000-0000-000000000001'
        WHERE username IN ('student1', 'student2')
    """))

    # liam_3 → Springfield USD / Washington Middle
    op.execute(sa.text("""
        UPDATE users SET
            district_id = 'a0000000-0000-0000-0000-000000000001',
            school_id = 'b0000000-0000-0000-0000-000000000002'
        WHERE username = 'liam_3'
    """))

    # sofia_6, noah_9 → Riverside USD / Riverside High
    op.execute(sa.text("""
        UPDATE users SET
            district_id = 'a0000000-0000-0000-0000-000000000002',
            school_id = 'b0000000-0000-0000-0000-000000000003'
        WHERE username IN ('sofia_6', 'noah_9')
    """))

    # emma_k → Riverside USD / Oak Park Elementary
    op.execute(sa.text("""
        UPDATE users SET
            district_id = 'a0000000-0000-0000-0000-000000000002',
            school_id = 'b0000000-0000-0000-0000-000000000004'
        WHERE username = 'emma_k'
    """))

    # admin stays with no district (global admin)

    # ── Classrooms ────────────────────────────────────────────────────
    # teacher1's classrooms at Lincoln Elementary
    op.execute(sa.text("""
        INSERT INTO classrooms (id, name, teacher_id, school_id)
        SELECT
            'c0000000-0000-0000-0000-000000000001',
            'Period 1 - Math',
            u.id,
            'b0000000-0000-0000-0000-000000000001'
        FROM users u WHERE u.username = 'teacher1'
        ON CONFLICT DO NOTHING
    """))

    op.execute(sa.text("""
        INSERT INTO classrooms (id, name, teacher_id, school_id)
        SELECT
            'c0000000-0000-0000-0000-000000000002',
            'Period 3 - Science',
            u.id,
            'b0000000-0000-0000-0000-000000000001'
        FROM users u WHERE u.username = 'teacher1'
        ON CONFLICT DO NOTHING
    """))

    # teacher2's classroom at Riverside High
    op.execute(sa.text("""
        INSERT INTO classrooms (id, name, teacher_id, school_id)
        SELECT
            'c0000000-0000-0000-0000-000000000003',
            'AP Biology',
            u.id,
            'b0000000-0000-0000-0000-000000000003'
        FROM users u WHERE u.username = 'teacher2'
        ON CONFLICT DO NOTHING
    """))

    # ── Classroom memberships ─────────────────────────────────────────
    # student1, student2 → Period 1 - Math
    op.execute(sa.text("""
        INSERT INTO classroom_memberships (id, classroom_id, student_id)
        SELECT gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', u.id
        FROM users u WHERE u.username = 'student1'
        ON CONFLICT DO NOTHING
    """))
    op.execute(sa.text("""
        INSERT INTO classroom_memberships (id, classroom_id, student_id)
        SELECT gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', u.id
        FROM users u WHERE u.username = 'student2'
        ON CONFLICT DO NOTHING
    """))

    # student1 also in Period 3 - Science
    op.execute(sa.text("""
        INSERT INTO classroom_memberships (id, classroom_id, student_id)
        SELECT gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', u.id
        FROM users u WHERE u.username = 'student1'
        ON CONFLICT DO NOTHING
    """))

    # sofia_6, noah_9 → AP Biology
    op.execute(sa.text("""
        INSERT INTO classroom_memberships (id, classroom_id, student_id)
        SELECT gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', u.id
        FROM users u WHERE u.username = 'sofia_6'
        ON CONFLICT DO NOTHING
    """))
    op.execute(sa.text("""
        INSERT INTO classroom_memberships (id, classroom_id, student_id)
        SELECT gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', u.id
        FROM users u WHERE u.username = 'noah_9'
        ON CONFLICT DO NOTHING
    """))

    # ── App whitelists per classroom ──────────────────────────────────
    # Period 1 - Math: chess, calculator, flashcards
    for app_id in ['chess', 'calculator', 'flashcards']:
        op.execute(sa.text(f"""
            INSERT INTO classroom_app_whitelist (id, classroom_id, app_id, added_by)
            SELECT gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', '{app_id}', u.id
            FROM users u WHERE u.username = 'teacher1'
            ON CONFLICT DO NOTHING
        """))

    # Period 3 - Science: weather, dictionary, life-skills
    for app_id in ['weather', 'dictionary', 'life-skills']:
        op.execute(sa.text(f"""
            INSERT INTO classroom_app_whitelist (id, classroom_id, app_id, added_by)
            SELECT gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', '{app_id}', u.id
            FROM users u WHERE u.username = 'teacher1'
            ON CONFLICT DO NOTHING
        """))

    # AP Biology: dictionary, weather, flashcards, calculator
    for app_id in ['dictionary', 'weather', 'flashcards', 'calculator']:
        op.execute(sa.text(f"""
            INSERT INTO classroom_app_whitelist (id, classroom_id, app_id, added_by)
            SELECT gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', '{app_id}', u.id
            FROM users u WHERE u.username = 'teacher2'
            ON CONFLICT DO NOTHING
        """))

    # ── District app approvals ────────────────────────────────────────
    # Springfield USD approves all 6 core apps
    for app_id in ['chess', 'calculator', 'dictionary', 'weather', 'flashcards', 'life-skills']:
        op.execute(sa.text(f"""
            INSERT INTO district_app_approvals (id, district_id, app_id, status)
            VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '{app_id}', 'approved')
            ON CONFLICT DO NOTHING
        """))

    # Riverside USD approves 4 apps (no chess, no life-skills)
    for app_id in ['calculator', 'dictionary', 'weather', 'flashcards']:
        op.execute(sa.text(f"""
            INSERT INTO district_app_approvals (id, district_id, app_id, status)
            VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', '{app_id}', 'approved')
            ON CONFLICT DO NOTHING
        """))


def downgrade() -> None:
    # Remove in reverse order of dependencies
    op.execute(sa.text("DELETE FROM classroom_app_whitelist WHERE classroom_id IN ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003')"))
    op.execute(sa.text("DELETE FROM classroom_memberships WHERE classroom_id IN ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003')"))
    op.execute(sa.text("DELETE FROM classrooms WHERE id IN ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003')"))
    op.execute(sa.text("DELETE FROM district_app_approvals WHERE district_id IN ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002')"))
    op.execute(sa.text("UPDATE users SET district_id = NULL, school_id = NULL WHERE username IN ('teacher1', 'teacher2', 'student1', 'student2', 'liam_3', 'sofia_6', 'noah_9', 'emma_k', 'district_admin1')"))
    op.execute(sa.text("DELETE FROM users WHERE username IN ('teacher2', 'district_admin1')"))
    op.execute(sa.text("DELETE FROM schools WHERE district_id IN ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002')"))
    op.execute(sa.text("DELETE FROM districts WHERE id IN ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002')"))
