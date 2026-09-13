"""
Canonical volunteer skill taxonomy.

Each need type has a fixed, tiered set of relevant skills (HIGH / MEDIUM / LOW —
how directly useful that skill is for that specific need). Volunteers may only
select skills from this list (enforced in VolunteerSerializer.validate_skills);
matching scores a volunteer against a task by the highest tier they hold for
that task's need type, instead of a free-text substring match.

Keys are plain strings (not apps.needs.models.Need.NeedType) to match the rest
of core/constants/ and avoid importing an app model into a constants module
before the app registry is ready.
"""

HIGH = "HIGH"
MEDIUM = "MEDIUM"
LOW = "LOW"

# need_type -> tier -> [(skill_id, human label), ...]
SKILL_TAXONOMY = {
    "medical": {
        HIGH: [
            ("doctor", "Doctor"),
            ("nurse", "Nurse"),
            ("paramedic", "Paramedic"),
        ],
        MEDIUM: [
            ("first_aid", "First Aid Certified"),
            ("cpr", "CPR Certified"),
        ],
        LOW: [
            ("patient_care_support", "Patient Care Support"),
        ],
    },
    "food": {
        HIGH: [
            ("chef", "Chef / Professional Cook"),
            ("nutritionist", "Nutritionist"),
        ],
        MEDIUM: [
            ("home_cooking", "Home Cooking"),
            ("food_safety", "Food Safety Handling"),
        ],
        LOW: [
            ("food_packing", "Food Packing & Distribution"),
        ],
    },
    "water": {
        HIGH: [
            ("water_engineer", "Water / Sanitation Engineer"),
            ("plumber", "Plumber"),
        ],
        MEDIUM: [
            ("water_purification", "Water Purification"),
        ],
        LOW: [
            ("water_transport", "Water Transport & Delivery"),
        ],
    },
    "shelter": {
        HIGH: [
            ("civil_engineer", "Civil Engineer"),
            ("carpenter", "Carpenter"),
        ],
        MEDIUM: [
            ("construction_labor", "Construction Labor"),
        ],
        LOW: [
            ("tent_setup", "Tent / Shelter Setup Helper"),
        ],
    },
    "electricity": {
        HIGH: [
            ("electrician", "Licensed Electrician"),
        ],
        MEDIUM: [
            ("generator_repair", "Generator Repair"),
            ("basic_wiring", "Basic Wiring"),
        ],
        LOW: [
            ("equipment_transport", "Equipment Transport"),
        ],
    },
    "general": {
        HIGH: [
            ("coordinator", "Volunteer Coordinator"),
            ("driver", "Licensed Driver"),
        ],
        MEDIUM: [
            ("translator", "Translator / Interpreter"),
            ("communications", "Communications"),
        ],
        LOW: [
            ("general_labor", "General Labor"),
        ],
    },
}


def _all_skill_ids():
    ids = set()
    for tiers in SKILL_TAXONOMY.values():
        for skills in tiers.values():
            ids.update(skill_id for skill_id, _ in skills)
    return ids


def _skill_labels():
    labels = {}
    for tiers in SKILL_TAXONOMY.values():
        for skills in tiers.values():
            labels.update(dict(skills))
    return labels


# Flat set of every valid skill id — used by VolunteerSerializer to reject
# anything not in the taxonomy.
ALL_SKILL_IDS = _all_skill_ids()

# skill_id -> human label, for anywhere that needs to display one id.
SKILL_LABELS = _skill_labels()
