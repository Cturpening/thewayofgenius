"""Output-side backstop for the DSM-5/Jungian language line.

See protocols/04_DSM5_Jungian_Language_Line.md's "Enforcement" section:
a system prompt alone isn't a guarantee, because a model can miss an
instruction on any single generation. This is the deterministic check
that runs on every generated Edin response before it reaches a user.

This is a separate concern from app/crisis_detection.py, which scans
*user* input for crisis language. This module scans *Edin's own
generated output* for banned clinical/diagnostic language.
"""

import re

# Draft list from 04_DSM5_Jungian_Language_Line.md -- explicitly a living
# document there, not a one-time constant. Word-boundary matched so this
# doesn't false-positive on unrelated substrings.
_BANNED_TERMS = [
    "depression", "anxiety disorder", "ptsd", "c-ptsd", "ocd", "bipolar",
    "adhd", "dissociative disorder", "personality disorder",
    "schizophrenia", "psychosis", "borderline", "eating disorder",
    "panic disorder", "chemical imbalance", "diagnose", "diagnosis",
    "treat your", "disorder", "syndrome",
]

_BANNED_PATTERNS = [re.compile(rf"\b{re.escape(term)}\b", re.IGNORECASE) for term in _BANNED_TERMS]


def find_banned_terms(text: str) -> list[str]:
    """Returns which banned terms (if any) appear in the text."""
    if not text:
        return []
    return [term for term, pattern in zip(_BANNED_TERMS, _BANNED_PATTERNS) if pattern.search(text)]


def passes_language_line(text: str) -> bool:
    return not find_banned_terms(text)
