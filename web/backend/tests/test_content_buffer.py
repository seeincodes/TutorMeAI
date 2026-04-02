"""Tests for the SSE content buffer and K-12 content filter."""

import pytest

from app.agent.content_filter import ContentBuffer, filter_content, MAX_BUFFER_TOKENS


# ---------------------------------------------------------------------------
# filter_content — blocklist
# ---------------------------------------------------------------------------

class TestFilterContent:
    """Unit tests for the filter_content function."""

    def test_clean_content_passes_unchanged(self):
        text = "Let's learn about addition today!"
        result, modified = filter_content(text, tier=3)
        assert result == text
        assert modified is False

    @pytest.mark.parametrize(
        "phrase, expected_fragment",
        [
            ("you're broke", "you're learning about budgeting"),
            ("can't afford", "might need to save up for"),
            ("you failed", "you can try again"),
            ("too late", "there's still time"),
            ("everyone else", "some people"),
            ("overweight", "growing"),
            ("debt collector", "financial helper"),
            ("eviction", "housing change"),
            ("bankrupt", "financial restart"),
            ("bankruptcy", "financial restart"),
        ],
    )
    def test_universal_blocklist_catches_phrases(self, phrase, expected_fragment):
        text = f"Remember, {phrase} is a real concern."
        result, modified = filter_content(text, tier=3)
        assert modified is True
        assert expected_fragment in result
        assert phrase not in result.lower() or expected_fragment.lower() == phrase.lower()

    def test_healthy_vs_unhealthy_replaced(self):
        text = "Think about healthy vs unhealthy food."
        result, modified = filter_content(text, tier=3)
        assert modified is True
        assert "different choices" in result

    # --- Tier-specific filtering ---

    def test_tier1_blocks_percentages(self):
        text = "The interest is 5.5% per year."
        result, modified = filter_content(text, tier=1)
        assert modified is True
        assert "a portion" in result
        assert "5.5%" not in result

    def test_tier2_blocks_strict_terms(self):
        text = "The stock market crashed and the mortgage rate spiked."
        result, modified = filter_content(text, tier=2)
        assert modified is True
        assert "money world" in result
        assert "home payment" in result

    def test_tier3_allows_percentages(self):
        text = "You scored 85% on the quiz."
        result, modified = filter_content(text, tier=3)
        assert result == text
        assert modified is False

    def test_tier4_allows_financial_terms(self):
        text = "The stock market uses interest rates."
        result, modified = filter_content(text, tier=4)
        assert result == text
        assert modified is False

    def test_tier1_blocks_deadline(self):
        text = "You missed the deadline for the project."
        result, modified = filter_content(text, tier=1)
        assert modified is True
        assert "due date" in result

    def test_tier3_allows_deadline(self):
        text = "You missed the deadline for the project."
        result, modified = filter_content(text, tier=3)
        assert result == text
        assert modified is False


# ---------------------------------------------------------------------------
# ContentBuffer — sentence boundary flushing
# ---------------------------------------------------------------------------

class TestContentBuffer:
    """Unit tests for the ContentBuffer class."""

    def test_flushes_on_period(self):
        buf = ContentBuffer(tier=3)
        result = None
        for token in ["Hello", " world", "."]:
            result = buf.add(token)
        assert result is not None
        text, modified = result
        assert text == "Hello world."
        assert modified is False

    def test_flushes_on_exclamation(self):
        buf = ContentBuffer(tier=3)
        result = None
        for token in ["Great", " job", "!"]:
            result = buf.add(token)
        assert result is not None
        assert result[0] == "Great job!"

    def test_flushes_on_question_mark(self):
        buf = ContentBuffer(tier=3)
        result = None
        for token in ["How", " are", " you", "?"]:
            result = buf.add(token)
        assert result is not None
        assert result[0] == "How are you?"

    def test_no_flush_without_boundary(self):
        buf = ContentBuffer(tier=3)
        for token in ["Hello", " world"]:
            result = buf.add(token)
            assert result is None

    def test_flush_remainder(self):
        buf = ContentBuffer(tier=3)
        buf.add("Hello")
        buf.add(" world")
        result = buf.flush()
        assert result is not None
        assert result[0] == "Hello world"

    def test_flush_empty_returns_none(self):
        buf = ContentBuffer(tier=3)
        assert buf.flush() is None

    def test_flushes_after_max_tokens(self):
        buf = ContentBuffer(tier=3)
        result = None
        for i in range(MAX_BUFFER_TOKENS):
            result = buf.add("word ")
        assert result is not None
        assert "word " in result[0]

    def test_max_token_resets_counter(self):
        buf = ContentBuffer(tier=3)
        # Fill to max
        for i in range(MAX_BUFFER_TOKENS):
            buf.add("a ")
        # Buffer should be empty now; next add shouldn't immediately flush
        result = buf.add("b")
        assert result is None

    def test_filters_during_flush(self):
        buf = ContentBuffer(tier=3)
        buf.add("You failed")
        buf.add(" the test.")
        # The period triggers flush
        result = buf.add("")  # won't trigger, already flushed on period
        # Actually the period was in the previous add:
        buf2 = ContentBuffer(tier=3)
        tokens = ["You failed", " the test", "."]
        last_result = None
        for t in tokens:
            r = buf2.add(t)
            if r is not None:
                last_result = r
        assert last_result is not None
        text, modified = last_result
        assert modified is True
        assert "you can try again" in text

    def test_tier_specific_filtering_through_buffer(self):
        buf = ContentBuffer(tier=1)
        tokens = ["The rate is ", "5.5%", "."]
        last_result = None
        for t in tokens:
            r = buf.add(t)
            if r is not None:
                last_result = r
        assert last_result is not None
        text, modified = last_result
        assert modified is True
        assert "a portion" in text

    def test_multiple_sentences(self):
        buf = ContentBuffer(tier=3)
        results = []
        tokens = ["Hi", ".", " How", " are", " you", "?"]
        for t in tokens:
            r = buf.add(t)
            if r is not None:
                results.append(r)
        assert len(results) == 2
        assert results[0][0] == "Hi."
        assert results[1][0] == " How are you?"
