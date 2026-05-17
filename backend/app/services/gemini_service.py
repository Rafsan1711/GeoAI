"""
Gemini Service — AtlasMind data + fun question generation.
Model: gemini-2.5-pro
"""

import json
import re
from typing import Optional
import google.generativeai as genai
from app.core.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY or "")

# ── Place data generation system prompt ───────────────────────
PLACE_DATA_SYSTEM = """You are AtlasMind, a world-class geographic intelligence curator for GuessMyPlace — an AI geography guessing game.

Your mission: Generate ACCURATE, RICH, and INTERESTING structured data about any place on Earth.

CRITICAL OUTPUT RULES:
1. Return ONLY valid JSON. Zero markdown. Zero backticks. Zero explanation.
2. Every field must be present. Use null for unknown/not-applicable.
3. Facts must be 100% verifiable. Never hallucinate.
4. fun_fact must be genuinely surprising — the kind that makes someone say "wait, really?!"
5. interesting_facts must be specific, not generic ("home to 160 million people" is generic, "has more mosques per square kilometer than any other country" is interesting)
6. description: factual, vivid, 2-3 sentences. Make the reader feel they know the place.
7. famousFor: be specific and interesting, not obvious (e.g., NOT "Eiffel Tower" for France, but DO include iconic things)

JSON SCHEMA (follow exactly):
{
  "name": "official name",
  "type": "country|city|landmark|natural|historical|religious|geographic|tourist_spot",
  "subtype": "mountain|river|temple|beach|mosque|etc or null",
  "emoji": "most relevant single emoji",
  "name_aliases": ["alternate name 1", "alternate name 2"],
  "description": "2-3 factual, vivid sentences",
  "fun_fact": "ONE genuinely surprising, specific, memorable fact",
  "interesting_facts": ["fact1", "fact2", "fact3", "fact4", "fact5"],
  "attributes": {
    "continent": "asia|europe|africa|northamerica|southamerica|oceania",
    "subRegion": "precise sub-region (e.g. South Asia, Western Europe)",
    "country": "which country (null if it IS a country)",
    "located_in": "city/district/region it belongs to (for landmarks/natural)",
    "landlocked": true|false,
    "hasCoast": true|false,
    "isIsland": true|false,
    "isArchipelago": true|false,
    "hasMountains": true|false,
    "hasRivers": true|false,
    "hasDelta": true|false,
    "climate": "tropical|desert|temperate|mediterranean|cold|monsoon|varied",
    "avgTemperature": "hot|warm|moderate|cool|freezing",
    "elevation_m": number_or_null,
    "area_km2": number_or_null,
    "length_km": number_or_null,
    "population": "micro|small|medium|large|verylarge|megacity",
    "mainReligion": "islam|christianity|hinduism|buddhism|judaism|secular|mixed",
    "language": "primary official language",
    "languageFamily": "indo-european|afro-asiatic|sino-tibetan|dravidian|austronesian|etc",
    "scriptDirection": "ltr|rtl|boustrophedon",
    "government": "democracy|monarchy|republic|authoritarian|theocracy|etc",
    "driveSide": "left|right",
    "currency": "currency name",
    "capital": "capital city or null",
    "colonizedBy": "colonial power or null",
    "independenceYear": number_or_null,
    "unMember": true|false,
    "euMember": true|false,
    "natoMember": true|false,
    "g20Member": true|false,
    "hasWonder": true|false,
    "hasUNESCO": true|false,
    "hasNobel": true|false,
    "famousFor": ["item1", "item2", "item3", "item4"],
    "exports": ["export1", "export2", "export3"],
    "neighbors": ["neighbor1", "neighbor2"],
    "naturalType": "for natural places: mountain|river|lake|ocean|delta|forest|island|haor|waterfall|canyon|etc",
    "religion_type": "for religious sites: mosque|temple|church|shrine|etc",
    "builtYear": number_or_null,
    "visaFreeFor": ["country1", "country2"],
    "flagColors": ["color1", "color2"],
    "nationalAnimal": "national animal if exists",
    "gdpLevel": "low|lower-middle|upper-middle|high",
    "touristRating": "hidden-gem|popular|iconic|unmissable"
  }
}"""

# ── Fun question generation system prompt ─────────────────────
QUESTION_GEN_SYSTEM = """You are the Question Architect for GuessMyPlace — a geography AI guessing game inspired by Akinator.

Your job: Generate BRILLIANT, FUN, DISCRIMINATING yes/no questions that players ENJOY answering.

PHILOSOPHY:
The best questions make players think "I never thought about it that way!"
They should feel like trivia night, not a geography exam.
Mix the obvious with the surprising. Include cultural, historical, and human angles.
Every question should be fun to answer even if you don't know the answer.

QUESTION QUALITY RULES:
✅ GOOD: "🌊 Could you swim to another country from its beaches?"
✅ GOOD: "🕌 Is the call to prayer heard publicly in this place?"
✅ GOOD: "🚗 Do people drive on the left side of the road here?"
✅ GOOD: "🍜 Is it world-famous for a specific noodle dish?"
✅ GOOD: "🏆 Has it ever hosted the Olympics?"
✅ GOOD: "📍 Is it smaller in area than the city of London?"
✅ GOOD: "🌙 Does its flag feature a crescent moon?"
✅ GOOD: "🛂 Can Bangladeshi citizens visit without a visa?"
✅ GOOD: "💰 Is it one of the top 20 richest countries by GDP per capita?"
✅ GOOD: "🎭 Is it the birthplace of a globally famous artistic tradition?"

❌ BAD: "Is it in Asia?" (too broad)
❌ BAD: "Does it have mountains?" (boring, generic)
❌ BAD: "Is it a large country?" (vague)
❌ BAD: "Is it famous?" (meaningless)
❌ BAD: "Does it have a coast?" (dull)

EMOJI RULE: Start EVERY question with a relevant emoji. It makes the game feel alive.

OUTPUT FORMAT:
Return ONLY a valid JSON array. No markdown. No explanation. No backticks.
Each item: {"question": "emoji + question text", "attribute": "attribute_key", "value": answer_value, "weight": 1.0-2.0, "stage": 0-7}

Stage guidelines:
  0 = continent/type (very broad, ask first)
  1-2 = region, geographic basics
  3-4 = size, climate, religion, government
  5-6 = culture, famous for, exports, fun facts
  7 = very specific (capital, exact features)

Weight guidelines:
  1.0 = standard
  1.5 = very discriminating
  2.0 = highly unique to this place"""


class GeminiService:

    def __init__(self):
        self._place_model    = None
        self._question_model = None

    def _get_place_model(self):
        if not settings.GEMINI_API_KEY:
            return None
        if self._place_model is None:
            self._place_model = genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                system_instruction=PLACE_DATA_SYSTEM,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.25,
                    max_output_tokens=2048,
                    response_mime_type="application/json",
                ),
            )
        return self._place_model

    def _get_question_model(self):
        if not settings.GEMINI_API_KEY:
            return None
        if self._question_model is None:
            self._question_model = genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                system_instruction=QUESTION_GEN_SYSTEM,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.55,   # slightly higher for creative questions
                    max_output_tokens=2048,
                    response_mime_type="application/json",
                ),
            )
        return self._question_model

    def _parse_json(self, text: str) -> dict | list | None:
        text = text.strip()
        text = re.sub(r"^```json\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error("JSON parse failed", error=str(e), raw=text[:200])
            return None

    # ── Place data generation ─────────────────────────────────

    def generate_place_data(self, place_name: str, place_type: str | None = None) -> dict | None:
        model = self._get_place_model()
        if not model:
            return None

        type_hint = f"\nType hint: {place_type}" if place_type else ""
        prompt = (
            f"Generate complete GuessMyPlace data for: {place_name}{type_hint}\n"
            f"Be maximally specific, accurate, and interesting. "
            f"The fun_fact must be something most people don't know."
        )

        for attempt in range(2):
            try:
                response = model.generate_content(prompt)
                data     = self._parse_json(response.text)
                if data and isinstance(data, dict) and data.get("name"):
                    logger.info("Place generated", name=place_name, type=data.get("type"), attempt=attempt+1)
                    return data
            except Exception as e:
                logger.warning("Gemini place gen failed", name=place_name, attempt=attempt+1, error=str(e))

        return None

    # ── Fun question generation ───────────────────────────────

    def generate_fun_questions(
        self,
        place_data: dict,
        count: int = 10,
        existing_questions: list[str] | None = None,
    ) -> list[dict]:
        """
        Generate fun, Akinator-style questions for a specific place.
        Returns list of question dicts ready for DB insertion.
        """
        model = self._get_question_model()
        if not model:
            return []

        name     = place_data.get("name", "Unknown")
        ptype    = place_data.get("type", "place")
        attrs    = place_data.get("attributes", {})
        existing = existing_questions or []

        # Build rich context for Gemini
        context_parts = [
            f"Place: {name}",
            f"Type: {ptype}",
            f"Description: {place_data.get('description', '')}",
            f"Fun fact: {place_data.get('fun_fact', '')}",
            f"Famous for: {attrs.get('famousFor', [])}",
            f"Interesting facts: {place_data.get('interesting_facts', [])}",
            f"Key attributes: continent={attrs.get('continent')}, "
            f"subRegion={attrs.get('subRegion')}, "
            f"climate={attrs.get('climate')}, "
            f"mainReligion={attrs.get('mainReligion')}, "
            f"language={attrs.get('language')}, "
            f"population={attrs.get('population')}, "
            f"gdpLevel={attrs.get('gdpLevel')}, "
            f"isIsland={attrs.get('isIsland')}, "
            f"landlocked={attrs.get('landlocked')}, "
            f"hasUNESCO={attrs.get('hasUNESCO')}, "
            f"hasWonder={attrs.get('hasWonder')}, "
            f"driveSide={attrs.get('driveSide')}, "
            f"independenceYear={attrs.get('independenceYear')}",
        ]

        avoid_section = ""
        if existing:
            avoid_section = f"\n\nALREADY EXISTING QUESTIONS (do NOT duplicate):\n" + "\n".join(f"- {q}" for q in existing[:20])

        prompt = f"""Generate exactly {count} brilliant, fun, Akinator-style yes/no questions for this place.

PLACE CONTEXT:
{chr(10).join(context_parts)}
{avoid_section}

REQUIREMENTS:
1. Each question must be genuinely fun and surprising — not obvious or boring
2. Cover diverse angles: geography, culture, history, economy, language, flag, food, sports, religion
3. Questions must be accurately answerable YES for this specific place
4. Include emoji at start of each question
5. Mix easy and challenging questions
6. Some questions should work even if you've never been there but know world trivia
7. Make players go "Oh interesting! I didn't know that!"

Return JSON array of exactly {count} questions."""

        for attempt in range(2):
            try:
                response  = self._get_question_model().generate_content(prompt)
                questions = self._parse_json(response.text)

                if not questions or not isinstance(questions, list):
                    continue

                # Validate and clean each question
                valid = []
                for q in questions:
                    if not isinstance(q, dict):
                        continue
                    if not q.get("question") or not q.get("attribute"):
                        continue
                    if len(q["question"]) < 10:
                        continue
                    # Ensure emoji prefix
                    if not q["question"][0].isascii() or q["question"].startswith("Is"):
                        # Add generic emoji if missing
                        q["question"] = "🌍 " + q["question"] if not q["question"][0] in "🌍🗺️🏔️🌊🕌🏆💰🎭🚗🛂📍🌙🍜🎵🏛️⛩️🌋🏖️🌿🎪" else q["question"]
                    valid.append(q)

                if valid:
                    logger.info(f"Questions generated: {len(valid)} for {name}", attempt=attempt+1)
                    return valid

            except Exception as e:
                logger.warning("Question gen failed", name=name, attempt=attempt+1, error=str(e))

        return []

    def check_duplicates_fuzzy(
        self, names: list[str], existing_names: list[str]
    ) -> dict[str, bool]:
        existing_lower = {n.lower().strip() for n in existing_names}
        return {name: name.lower().strip() in existing_lower for name in names}


# Singleton
gemini_service = GeminiService()