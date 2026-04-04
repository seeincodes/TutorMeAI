/**
 * Types and utilities imported from the forked Chatbox codebase (src/shared/).
 *
 * Rather than re-inventing these foundational types, we import them directly
 * from the original Chatbox source to maintain consistency between the desktop
 * and web platform builds. The web platform extends these types with
 * server-side persistence (PostgreSQL), role-based auth, and K-12 safety
 * features that the Electron client doesn't need.
 *
 * @see src/shared/types/session.ts  — Message & Session schemas
 * @see src/shared/types/provider.ts — Provider enum definitions
 * @see src/shared/types/settings.ts — Settings & theme types
 */

// ─── Message types from Chatbox core ─────────────────────────────────────────
export {
  MessageRoleEnum,
  type MessageRole,
  type MessageContentParts,
  type MessageTextPart,
  type MessageToolCallPart,
  type MessageReasoningPart,
  type MessageImagePart,
  type MessageInfoPart,
  type MessageFile,
  type MessageLink,
  type Session,
  type SessionMeta,
  type SessionThread,
  type SessionType,
} from '@chatbox/shared/types/session'

// ─── Provider enums ──────────────────────────────────────────────────────────
export {
  ModelProviderEnum,
  ModelProviderType,
} from '@chatbox/shared/types/provider'

// ─── Settings types ──────────────────────────────────────────────────────────
export {
  Theme,
  type SessionSettings,
  type ProviderModelInfo,
  type ProviderSettings,
  type GlobalSessionSettings,
} from '@chatbox/shared/types/settings'
