import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class District(Base):
    __tablename__ = "districts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    state: Mapped[str | None] = mapped_column(Text)
    settings: Mapped[dict | None] = mapped_column(JSONB)
    daily_token_budget: Mapped[int] = mapped_column(Integer, default=100000)
    tokens_used_today: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    users: Mapped[list["User"]] = relationship(back_populates="district")
    app_approvals: Mapped[list["DistrictAppApproval"]] = relationship(back_populates="district", cascade="all, delete-orphan")
    schools: Mapped[list["School"]] = relationship(back_populates="district", cascade="all, delete-orphan")


class School(Base):
    __tablename__ = "schools"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    district_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("districts.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    district: Mapped["District"] = relationship(back_populates="schools")
    classrooms: Mapped[list["Classroom"]] = relationship(back_populates="school")


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    display_name: Mapped[str | None] = mapped_column(Text)
    role: Mapped[str] = mapped_column(Text, nullable=False, default="student")
    grade: Mapped[int | None] = mapped_column(Integer)
    allowed_levels: Mapped[list | None] = mapped_column(JSONB)  # e.g. ["K-2", "3-5"]
    district_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("districts.id"), nullable=True)
    school_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("schools.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    capability_tier_override: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    district: Mapped["District | None"] = relationship(back_populates="users")
    school: Mapped["School | None"] = relationship()
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    oauth_tokens: Mapped[list["OAuthToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    @property
    def age_tier(self) -> int:
        """Return the capability tier: override if set, else derived from grade."""
        if self.capability_tier_override is not None:
            return self.capability_tier_override
        if self.grade is None:
            return 1
        if self.grade <= 2:
            return 1
        if self.grade <= 5:
            return 2
        if self.grade <= 8:
            return 3
        return 4

    __table_args__ = (
        CheckConstraint("role IN ('student', 'teacher', 'admin', 'district_admin')", name="ck_users_role"),
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str | None] = mapped_column(Text)
    active_app_id: Mapped[str | None] = mapped_column(Text)
    starred: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")
    tool_invocations: Mapped[list["ToolInvocation"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str | None] = mapped_column(Text)
    tool_call_id: Mapped[str | None] = mapped_column(Text)
    tool_name: Mapped[str | None] = mapped_column(Text)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")

    __table_args__ = (
        CheckConstraint("role IN ('user', 'assistant', 'tool', 'system')", name="ck_messages_role"),
    )


class AppRegistration(Base):
    __tablename__ = "app_registrations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    app_id: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    auth_type: Mapped[str] = mapped_column(Text, nullable=False)
    iframe_url: Mapped[str] = mapped_column(Text, nullable=False)
    tool_schemas: Mapped[dict] = mapped_column(JSONB, nullable=False)
    schema_hash: Mapped[str | None] = mapped_column(Text)
    schema_version: Mapped[int] = mapped_column(Integer, default=1)
    oauth_config: Mapped[dict | None] = mapped_column(JSONB)
    platform_status: Mapped[str] = mapped_column(Text, default="allowed")
    requires_admin_approval: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(Text, default="pending_review")
    age_rating: Mapped[str] = mapped_column(Text, default="all")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    approved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    # Marketplace metadata
    developer_name: Mapped[str | None] = mapped_column(Text)
    developer_email: Mapped[str | None] = mapped_column(Text)
    website_url: Mapped[str | None] = mapped_column(Text)
    privacy_policy_url: Mapped[str | None] = mapped_column(Text)
    logo_url: Mapped[str | None] = mapped_column(Text)
    trust_tier: Mapped[str] = mapped_column(Text, default="new")
    # Server-side relay
    server_api_url: Mapped[str | None] = mapped_column(Text)
    signing_secret: Mapped[str | None] = mapped_column(Text)
    # Content screening
    flag_count: Mapped[int] = mapped_column(Integer, default=0)
    auto_suspend_threshold: Mapped[int] = mapped_column(Integer, default=10)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("auth_type IN ('none', 'api_key', 'oauth2')", name="ck_app_registrations_auth_type"),
        CheckConstraint("platform_status IN ('allowed', 'blocked', 'pending_review')", name="ck_app_registrations_platform_status"),
        CheckConstraint("trust_tier IN ('new', 'classroom', 'school', 'district', 'verified')", name="ck_app_registrations_trust_tier"),
    )


class ToolInvocation(Base):
    __tablename__ = "tool_invocations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    app_id: Mapped[str] = mapped_column(Text, nullable=False)
    tool_name: Mapped[str] = mapped_column(Text, nullable=False)
    params: Mapped[dict | None] = mapped_column(JSONB)
    result: Mapped[dict | None] = mapped_column(JSONB)
    duration_ms: Mapped[int | None] = mapped_column(Integer)
    input_tokens: Mapped[int | None] = mapped_column(Integer)
    output_tokens: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation: Mapped["Conversation"] = relationship(back_populates="tool_invocations")

    __table_args__ = (
        CheckConstraint("status IN ('success', 'error', 'timeout')", name="ck_tool_invocations_status"),
    )


class OAuthToken(Base):
    __tablename__ = "oauth_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    app_id: Mapped[str] = mapped_column(Text, nullable=False)
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str | None] = mapped_column(Text)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="oauth_tokens")

    __table_args__ = (
        UniqueConstraint("user_id", "app_id", name="uq_oauth_tokens_user_app"),
    )


class ContentFlag(Base):
    __tablename__ = "content_flags"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    app_id: Mapped[str] = mapped_column(Text, nullable=False)
    flagged_content: Mapped[str] = mapped_column(Text, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    conversation_id: Mapped[str | None] = mapped_column(Text)
    reviewed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship()


class AppSchemaAudit(Base):
    __tablename__ = "app_schema_audit"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    app_id: Mapped[str] = mapped_column(Text, nullable=False)
    old_schema: Mapped[dict | None] = mapped_column(JSONB)
    new_schema: Mapped[dict | None] = mapped_column(JSONB)
    old_hash: Mapped[str | None] = mapped_column(Text)
    new_hash: Mapped[str | None] = mapped_column(Text)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    decision: Mapped[str] = mapped_column(Text, default="pending")
    reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "decision IN ('approved', 'rejected', 'pending', 'auto_suspended')",
            name="ck_app_schema_audit_decision",
        ),
    )


class DistrictAppApproval(Base):
    __tablename__ = "district_app_approvals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    district_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("districts.id", ondelete="CASCADE"), nullable=False)
    app_id: Mapped[str] = mapped_column(Text, nullable=False)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(Text, default="approved")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    district: Mapped["District"] = relationship(back_populates="app_approvals")

    __table_args__ = (
        UniqueConstraint("district_id", "app_id", name="uq_district_app_approvals_district_app"),
        CheckConstraint("status IN ('approved', 'revoked', 'pending')", name="ck_district_app_approvals_status"),
    )


class Classroom(Base):
    __tablename__ = "classrooms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    school_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("schools.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    teacher: Mapped["User"] = relationship()
    school: Mapped["School | None"] = relationship(back_populates="classrooms")
    memberships: Mapped[list["ClassroomMembership"]] = relationship(back_populates="classroom", cascade="all, delete-orphan")
    app_whitelist: Mapped[list["ClassroomAppWhitelist"]] = relationship(back_populates="classroom", cascade="all, delete-orphan")


class ClassroomMembership(Base):
    __tablename__ = "classroom_memberships"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    classroom_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    classroom: Mapped["Classroom"] = relationship(back_populates="memberships")
    student: Mapped["User"] = relationship()

    __table_args__ = (
        UniqueConstraint("classroom_id", "student_id", name="uq_classroom_memberships_classroom_student"),
    )


class ClassroomAppWhitelist(Base):
    __tablename__ = "classroom_app_whitelist"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    classroom_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    app_id: Mapped[str] = mapped_column(Text, nullable=False)
    added_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    classroom: Mapped["Classroom"] = relationship(back_populates="app_whitelist")

    __table_args__ = (
        UniqueConstraint("classroom_id", "app_id", name="uq_classroom_app_whitelist_classroom_app"),
    )


class AppContentScreen(Base):
    __tablename__ = "app_content_screens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    app_id: Mapped[str] = mapped_column(Text, nullable=False)
    screen_type: Mapped[str] = mapped_column(Text, nullable=False)
    result: Mapped[str] = mapped_column(Text, nullable=False)
    flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    details: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("screen_type IN ('moderation_api', 'screenshot_diff', 'manual_review', 'ai_submission_review')", name="ck_app_content_screens_type"),
        CheckConstraint("result IN ('pass', 'fail', 'review_needed')", name="ck_app_content_screens_result"),
    )
