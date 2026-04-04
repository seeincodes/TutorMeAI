"""
AI-powered app review pipeline for K-12 marketplace.

When a developer submits an app, this module uses GPT-4.1-mini to evaluate
whether the app is appropriate for children, checking:
- Name and description for age-appropriateness
- Tool schemas for dangerous capabilities
- Auth type and OAuth scopes for overreaching permissions
- Content category and age rating accuracy

Returns a structured verdict: approve, reject, or flag for human review.
"""
import json
import logging
from dataclasses import dataclass

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.config import settings

logger = logging.getLogger("chatbridge.marketplace.ai_review")

REVIEW_SYSTEM_PROMPT = """You are an AI safety reviewer for a K-12 educational platform called ChatBridge (TutorMeAI).
Your job is to review third-party app submissions to determine if they are appropriate for children ages 5-18.

You MUST evaluate the following criteria:

## 1. Content Safety (Critical)
- Is the app name appropriate for children?
- Is the description free of violent, sexual, hateful, or otherwise harmful content?
- Could this app expose children to inappropriate material?
- Does the description suggest age-appropriate educational content?

## 2. Tool Schema Safety (Critical)
- Do the tool schemas request access to dangerous capabilities? (e.g., file system access, network requests to arbitrary URLs, executing code, accessing personal data)
- Are the tool parameters reasonable and well-scoped?
- Could any tool be misused to harm students or extract personal information?

## 3. Authentication & Permissions (Important)
- If OAuth: are the requested scopes minimal and necessary?
- If API key: is there a risk of credential exposure?
- Does the auth type match what the app claims to do?

## 4. Educational Value (Important)
- Does the app provide clear educational value for K-12 students?
- Is it appropriate for the claimed age rating?
- Does it fit into a school environment?

## 5. Developer Trust (Advisory)
- Is developer information complete (name, email)?
- Is there a privacy policy URL?
- Does the website URL look legitimate?

Respond with a JSON object (and nothing else) with these exact fields:
{
  "decision": "approve" | "reject" | "human_review",
  "approved": true | false,
  "age_rating": "all" | "elementary" | "middle_school" | "high_school" | "mature",
  "suggested_min_grade": 0,
  "suggested_max_grade": 12,
  "risk_level": "low" | "medium" | "high" | "critical",
  "risk_flags": ["list of specific concerns"],
  "reasoning": "2-3 sentence explanation of the decision",
  "content_safe": true | false,
  "tools_safe": true | false,
  "auth_appropriate": true | false,
  "educational_value": "high" | "medium" | "low" | "none"
}

Rules:
- REJECT if any content is violent, sexual, hateful, or clearly inappropriate for children
- REJECT if tool schemas request dangerous capabilities (file access, code execution, arbitrary network)
- FLAG FOR HUMAN REVIEW if you're uncertain about safety or appropriateness
- APPROVE only if the app is clearly safe and educationally valuable
- Be strict — when in doubt, flag for human review rather than approving
- "mature" age_rating means the app should NOT be on a K-12 platform (auto-reject)
"""


@dataclass
class AIReviewResult:
    decision: str  # "approve" | "reject" | "human_review"
    approved: bool
    age_rating: str
    suggested_min_grade: int
    suggested_max_grade: int
    risk_level: str
    risk_flags: list[str]
    reasoning: str
    content_safe: bool
    tools_safe: bool
    auth_appropriate: bool
    educational_value: str


async def review_app_submission(
    app_id: str,
    name: str,
    description: str,
    tool_schemas: list[dict],
    auth_type: str,
    oauth_config: dict | None,
    developer_name: str | None,
    developer_email: str | None,
    website_url: str | None,
    privacy_policy_url: str | None,
    age_rating: str,
) -> AIReviewResult:
    """Run AI review on an app submission. Returns structured verdict."""

    # Build the review prompt with all app details
    app_details = {
        "app_id": app_id,
        "name": name,
        "description": description,
        "auth_type": auth_type,
        "age_rating_claimed": age_rating,
        "tool_schemas": tool_schemas,
        "developer_name": developer_name,
        "developer_email": developer_email,
        "website_url": website_url,
        "privacy_policy_url": privacy_policy_url,
    }

    if oauth_config:
        app_details["oauth_scopes"] = oauth_config.get("scopes", "")

    review_prompt = f"""Review this app submission for our K-12 educational platform:

```json
{json.dumps(app_details, indent=2)}
```

Evaluate all criteria and respond with ONLY a JSON object."""

    llm = ChatOpenAI(
        model="gpt-4.1-mini",
        api_key=settings.openai_api_key,
        temperature=0,  # Deterministic for safety decisions
    )

    try:
        response = await llm.ainvoke([
            SystemMessage(content=REVIEW_SYSTEM_PROMPT),
            HumanMessage(content=review_prompt),
        ])

        # Parse the JSON response
        content = response.content.strip()
        # Handle markdown code blocks
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        result = json.loads(content)

        return AIReviewResult(
            decision=result.get("decision", "human_review"),
            approved=result.get("approved", False),
            age_rating=result.get("age_rating", "all"),
            suggested_min_grade=result.get("suggested_min_grade", 0),
            suggested_max_grade=result.get("suggested_max_grade", 12),
            risk_level=result.get("risk_level", "medium"),
            risk_flags=result.get("risk_flags", []),
            reasoning=result.get("reasoning", "AI review could not determine safety."),
            content_safe=result.get("content_safe", False),
            tools_safe=result.get("tools_safe", False),
            auth_appropriate=result.get("auth_appropriate", True),
            educational_value=result.get("educational_value", "none"),
        )

    except json.JSONDecodeError as e:
        logger.error(f"AI review JSON parse error for {app_id}: {e}")
        return AIReviewResult(
            decision="human_review",
            approved=False,
            age_rating="all",
            suggested_min_grade=0,
            suggested_max_grade=12,
            risk_level="medium",
            risk_flags=["AI review returned unparseable response"],
            reasoning="AI review failed to return valid JSON. Flagged for human review.",
            content_safe=False,
            tools_safe=False,
            auth_appropriate=True,
            educational_value="none",
        )
    except Exception as e:
        logger.error(f"AI review error for {app_id}: {e}")
        return AIReviewResult(
            decision="human_review",
            approved=False,
            age_rating="all",
            suggested_min_grade=0,
            suggested_max_grade=12,
            risk_level="medium",
            risk_flags=[f"AI review error: {str(e)}"],
            reasoning="AI review encountered an error. Flagged for human review.",
            content_safe=False,
            tools_safe=False,
            auth_appropriate=True,
            educational_value="none",
        )
