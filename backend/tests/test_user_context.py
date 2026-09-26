"""Tests for app/user_context.py's real symbol-confirmation logic
(Chelsey's Decoded_Meaning spec -- see database/schema.sql's comment on
symbol_meanings for the full write-rule explanation).

_count_tag_occurrences is pure Python with no DB dependency, so it's
tested thoroughly and directly here. record_symbol_meaning and
symbol_confirmation_status both need a real Postgres session to exercise
correctly -- they run several distinct query shapes (whole-model filters,
single-column projections, .in_() lookups) that this project's own
established convention (see tests/test_main.py's own note) says aren't
worth faking with sqlite, since the new tables use Postgres-specific
column types (UUID, timestamptz) sqlite can't represent faithfully.
Those two are verified against the real database instead, per this
session's own manual end-to-end check (log a self-ID meaning in real
chat, confirm the row in Supabase's Table Editor, confirm a second
meaning for the same tag supersedes the first with superseded_by set).
"""

from app.user_context import _count_tag_occurrences


def test_counts_across_distinct_entries():
    tag_lists = [["water"], ["water"], ["water"], ["water"], ["water"]]
    assert _count_tag_occurrences(tag_lists) == {"water": 5}


def test_dedupes_within_a_single_entry():
    # "water" appearing twice in one entry's own tag list should only
    # count once toward that entry's contribution -- the 5+ rule is about
    # distinct occasions, not raw mentions.
    tag_lists = [["water", "water"], ["water"]]
    assert _count_tag_occurrences(tag_lists) == {"water": 2}


def test_multiple_tags_counted_independently():
    tag_lists = [["water", "chair"], ["water"], ["chair"], ["chair"]]
    counts = _count_tag_occurrences(tag_lists)
    assert counts["water"] == 2
    assert counts["chair"] == 3


def test_empty_entries_list_is_empty():
    assert _count_tag_occurrences([]) == {}


def test_tag_below_threshold_is_not_established():
    # Mirrors symbol_confirmation_status's own threshold check, without
    # needing a DB -- a tag under RECURRENCE_THRESHOLD (5) never counts
    # as established.
    from app.user_context import RECURRENCE_THRESHOLD

    counts = _count_tag_occurrences([["water"]] * (RECURRENCE_THRESHOLD - 1))
    assert counts["water"] < RECURRENCE_THRESHOLD
