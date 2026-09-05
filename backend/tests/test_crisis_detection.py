"""Pure-function tests for Track B crisis detection. No database needed --
see protocols/03_Crisis_Escalation_Protocol.md for what these tiers mean.
"""

from app.crisis_detection import CrisisTier, classify_crisis_tier, requires_override


def test_no_match_on_ordinary_text():
    assert classify_crisis_tier("Had a strange dream about flying over the ocean.") == CrisisTier.NONE


def test_idiom_does_not_match_kill_some_time():
    assert classify_crisis_tier("Just trying to kill some time before the meeting.") == CrisisTier.NONE


def test_idiom_does_not_match_deadline_killing_me():
    assert classify_crisis_tier("This deadline is killing me, I'm so stressed.") == CrisisTier.NONE


def test_idiom_does_not_match_dying_to_see_you():
    assert classify_crisis_tier("I'm dying to see you this weekend!") == CrisisTier.NONE


def test_tier_2_active_ideation_no_plan():
    tier = classify_crisis_tier("I want to kill myself.")
    assert tier == CrisisTier.TIER_2_ACTIVE
    assert requires_override(tier) is True


def test_tier_3_active_ideation_with_timeframe():
    tier = classify_crisis_tier("I want to kill myself tonight.")
    assert tier == CrisisTier.TIER_3_ACTIVE_WITH_PLAN
    assert requires_override(tier) is True


def test_tier_3_active_ideation_with_means():
    tier = classify_crisis_tier("I want to end my life, I have the pills ready.")
    assert tier == CrisisTier.TIER_3_ACTIVE_WITH_PLAN


def test_tier_1_passive_ideation_does_not_override():
    tier = classify_crisis_tier("I don't want to be here anymore, everything feels heavy.")
    assert tier == CrisisTier.TIER_1_PASSIVE
    assert requires_override(tier) is False


def test_harm_to_others():
    tier = classify_crisis_tier("I am going to kill him, I mean it this time.")
    assert tier == CrisisTier.HARM_TO_OTHERS
    assert requires_override(tier) is True


def test_empty_text():
    assert classify_crisis_tier("") == CrisisTier.NONE
