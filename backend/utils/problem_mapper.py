KEYWORDS = {
    "food": ["food", "hungry", "ration"],
    "medical": ["doctor", "medicine", "hospital", "injury"],
    "water": ["water", "drinking", "thirst"],
    "shelter": ["house", "shelter", "home", "roof"],
    "electricity": ["electricity", "power", "light"],
}

def extract_need_types(problem):
    problem = problem.lower()
    detected = []

    for need_type, words in KEYWORDS.items():
        for word in words:
            if word in problem:
                detected.append(need_type)
                break

    if not detected:
        detected.append("general")

    return detected