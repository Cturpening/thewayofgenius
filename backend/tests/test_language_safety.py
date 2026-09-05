from app.language_safety import find_banned_terms, passes_language_line


def test_clean_text_passes():
    assert passes_language_line("This pattern has been intensifying over the last week.") is True
    assert find_banned_terms("This pattern has been intensifying.") == []


def test_diagnostic_term_fails():
    assert passes_language_line("This looks like depression.") is False
    assert "depression" in find_banned_terms("This looks like depression.")


def test_diagnose_verb_fails():
    assert passes_language_line("I can't diagnose that, but here's what I notice.") is False


def test_empty_text_passes():
    assert passes_language_line("") is True
