"""
Keyword-based need-type detection.

Used as a fallback when a CSV row (or manual entry) does not carry an explicit
`need_type` column — we infer it from the free-text problem description so an
upload of raw community reports still produces correctly categorised tasks.
"""

# Ordered by priority: the first category with a keyword hit wins. Electricity is
# checked before the generic fallback so "power cut" maps to electricity.
_KEYWORDS = [
    ("medical", (
        "medical", "medicine", "doctor", "injur", "sick", "ill ", "illness",
        "health", "hospital", "ambulance", "emergency", "blood", "fever",
    )),
    ("water", ("water", "thirst", "drinking", "dehydrat")),
    ("food", ("food", "hunger", "hungry", "meal", "ration", "starv", "eat")),
    ("shelter", ("shelter", "homeless", "displaced", "roof", "tent", "house", "home")),
    ("electricity", ("electric", "power cut", "powercut", "power-cut", "current", "outage", "light")),
]


def detect_need_type(text):
    """Return a Need.NeedType value inferred from free text; 'general' if none match."""
    if not text:
        return "general"
    t = text.lower()
    for need_type, keywords in _KEYWORDS:
        if any(k in t for k in keywords):
            return need_type
    return "general"


# Backward-compatible alias used elsewhere in the codebase.
def detect_need_types_from_text(text):
    return detect_need_type(text)
