"""
AtlasMind Pipeline — Production-grade place data generation.

Pipeline stages:
  validate → deduplicate → generate → quality_check → embed → insert → generate_questions

Usage (from admin API):
  pipeline = AtlasMindPipeline()
  results = await pipeline.run(
      names=["Dhaka", "Cox's Bazar"],
      place_type="city",
      admin_email="admin@example.com",
      generate_questions=True,
  )
"""

import asyncio
from dataclasses import dataclass, field
from typing import Optional
import re

from app.services.supabase_service import SupabaseService, get_client
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

# ── Config ────────────────────────────────────────────────────
GENERATION_CONCURRENCY = 3      # parallel Gemini calls at once
MIN_QUALITY_SCORE      = 0.40   # reject below this
GEMINI_RETRY_COUNT     = 2      # retries per place on failure
BATCH_SLEEP_SECONDS    = 1.5    # sleep between individual place generations


# ── Result dataclasses ────────────────────────────────────────

@dataclass
class PipelineResult:
    name:                str
    status:              str        # inserted | duplicate | failed | low_quality
    place_id:            Optional[str] = None
    quality:             float = 0.0
    error:               Optional[str] = None
    similar_to:          Optional[str] = None
    questions_generated: int = 0


@dataclass
class PipelineReport:
    total:       int = 0
    inserted:    int = 0
    duplicates:  int = 0
    failed:      int = 0
    low_quality: int = 0
    results:     list[PipelineResult] = field(default_factory=list)

    def summary(self) -> str:
        return (
            f"✅ {self.inserted} inserted | "
            f"⚠️  {self.duplicates} duplicates | "
            f"❌ {self.failed} failed | "
            f"🔴 {self.low_quality} low quality"
        )


# ── Pipeline ──────────────────────────────────────────────────

class AtlasMindPipeline:

    # ── Stage 1: Validate ─────────────────────────────────────

    def _validate(
        self, names: list[str]
    ) -> tuple[list[str], list[PipelineResult]]:
        """
        Filter out obviously invalid names.
        Returns (valid_names, rejected_results).
        """
        valid   = []
        results = []

        for raw in names:
            name = raw.strip()

            if not name:
                continue

            if len(name) < 2:
                results.append(PipelineResult(
                    name=name, status="failed", error="Name too short (min 2 chars)"
                ))
                continue

            if len(name) > 120:
                results.append(PipelineResult(
                    name=name, status="failed", error="Name too long (max 120 chars)"
                ))
                continue

            # Reject if ONLY digits/punctuation — no letters at all
            if re.match(r'^[\d\W_]+$', name):
                results.append(PipelineResult(
                    name=name, status="failed", error="Name contains no letters"
                ))
                continue

            valid.append(name)

        if results:
            logger.info(f"Validation rejected {len(results)} names")
        return valid, results

    # ── Stage 2: Deduplicate ──────────────────────────────────

    def _deduplicate(
        self, names: list[str]
    ) -> tuple[list[str], list[PipelineResult]]:
        """
        Check each name against existing DB places.
        Checks: exact name match + alias match (case-insensitive).
        Returns (new_names, duplicate_results).
        """
        try:
            client = get_client()
            # Load all place names and aliases
            res = client.table("places").select(
                "id, name, name_aliases"
            ).execute()
            rows = res.data or []
        except Exception as e:
            logger.error("Dedup DB query failed", error=str(e))
            # On DB failure: don't block — treat all as new
            return names, []

        # Build lookup map: normalized_name → row
        existing: dict[str, dict] = {}
        for row in rows:
            existing[row["name"].lower().strip()] = row
            for alias in (row.get("name_aliases") or []):
                if alias:
                    existing[alias.lower().strip()] = row

        new_names  = []
        duplicates = []

        for name in names:
            norm = name.lower().strip()
            if norm in existing:
                match = existing[norm]
                duplicates.append(PipelineResult(
                    name=name,
                    status="duplicate",
                    place_id=match["id"],
                    similar_to=match["name"],
                ))
                logger.debug(f"Duplicate: '{name}' → '{match['name']}'")
            else:
                new_names.append(name)

        logger.info(
            f"Dedup: {len(new_names)} new, {len(duplicates)} duplicates"
        )
        return new_names, duplicates

    # ── Stage 3: Generate with Gemini ─────────────────────────

    async def _generate_batch(
        self,
        names:      list[str],
        place_type: Optional[str],
    ) -> list[tuple[str, Optional[dict]]]:
        """
        Run Gemini generation in parallel (max GENERATION_CONCURRENCY at once).
        Returns list of (name, data_dict_or_None).
        """
        from app.services.gemini_service import gemini_service

        semaphore = asyncio.Semaphore(GENERATION_CONCURRENCY)

        async def generate_one(name: str) -> tuple[str, Optional[dict]]:
            async with semaphore:
                loop   = asyncio.get_event_loop()
                result = await loop.run_in_executor(
                    None,
                    gemini_service.generate_place_data,
                    name,
                    place_type,
                )
                await asyncio.sleep(BATCH_SLEEP_SECONDS)
                return (name, result)

        tasks = [generate_one(name) for name in names]
        pairs = await asyncio.gather(*tasks, return_exceptions=False)
        return list(pairs)

    # ── Stage 4: Quality score ────────────────────────────────

    def _quality_score(self, data: dict) -> float:
        """
        Score 0.0–1.0 based on data completeness and richness.
        Rejects below MIN_QUALITY_SCORE.
        """
        score = 0.0
        attrs = data.get("attributes", {})

        # Core required fields
        if data.get("name"):                              score += 0.15
        if data.get("type"):                              score += 0.10
        if data.get("description") and len(data["description"]) > 30:
                                                          score += 0.12
        if data.get("emoji"):                             score += 0.03
        if data.get("fun_fact"):                          score += 0.08
        if data.get("interesting_facts") and len(data["interesting_facts"]) >= 3:
                                                          score += 0.07

        # Attributes completeness
        if attrs.get("continent"):                        score += 0.10
        if attrs.get("subRegion"):                        score += 0.06
        if attrs.get("famousFor") and len(attrs["famousFor"]) >= 2:
                                                          score += 0.08
        if attrs.get("mainReligion") or attrs.get("religion_type"):
                                                          score += 0.04
        if attrs.get("climate"):                          score += 0.04
        if attrs.get("population") or attrs.get("elevation_m") or attrs.get("area_km2"):
                                                          score += 0.04
        if attrs.get("country") or attrs.get("located_in") or attrs.get("capital"):
                                                          score += 0.05
        if attrs.get("language"):                         score += 0.04

        return round(min(1.0, score), 3)

    # ── Stage 5: Generate embedding ───────────────────────────

    def _generate_embedding(self, place_data: dict) -> Optional[list[float]]:
        try:
            from atlas_engine.embeddings import embed_place
            vec = embed_place(place_data)
            if vec is not None:
                return vec.tolist()
        except Exception as e:
            logger.warning(
                "Embedding failed",
                name=place_data.get("name"),
                error=str(e),
            )
        return None

    # ── Stage 6: Insert to Supabase ───────────────────────────

    def _insert_place(
        self,
        data:        dict,
        quality:     float,
        admin_email: str,
    ) -> Optional[str]:
        """
        Upsert place row into Supabase.
        Returns place_id on success, None on failure.
        """
        embedding = self._generate_embedding(data)

        row: dict = {
            "name":              data.get("name"),
            "type":              data.get("type", "place"),
            "subtype":           data.get("subtype"),
            "emoji":             data.get("emoji"),
            "description":       data.get("description"),
            "fun_fact":          data.get("fun_fact"),
            "interesting_facts": data.get("interesting_facts", []),
            "attributes":        data.get("attributes", {}),
            "name_aliases":      data.get("name_aliases", []),
            "data_quality_score": quality,
            "is_active":         True,
            "is_verified":       False,
            "created_by":        f"atlasmind:{admin_email}",
        }

        if embedding:
            row["embedding"] = embedding

        result = SupabaseService.upsert_place(row)
        if result:
            place_id = result.get("id")
            logger.info(
                "Place inserted",
                name=data.get("name"),
                id=place_id,
                quality=quality,
                has_embedding=bool(embedding),
            )
            return place_id

        return None

    # ── Stage 7: Generate questions ───────────────────────────

    def _generate_questions(
        self,
        place_data:  dict,
        place_type:  Optional[str],
    ) -> int:
        """
        Generate fun Akinator-style questions for this place via Gemini.
        Inserts into questions table, avoids exact duplicates.
        Returns count of inserted questions.
        """
        from app.services.gemini_service import gemini_service
        from app.utils.question_selector_helper import STAGE_MAP

        name  = place_data.get("name", "")
        ptype = place_type or place_data.get("type", "place")

        # Load existing question texts to avoid duplicates
        try:
            existing_q = get_client().table("questions").select(
                "question_text"
            ).limit(2000).execute()
            existing_texts: set[str] = {
                r["question_text"] for r in (existing_q.data or [])
            }
        except Exception:
            existing_texts = set()

        # Generate fun questions via Gemini
        questions = gemini_service.generate_fun_questions(
            place_data=place_data,
            count=10,
            existing_questions=list(existing_texts),
        )

        if not questions:
            logger.warning("No questions generated", name=name)
            return 0

        client   = get_client()
        inserted = 0

        for q in questions:
            q_text = (q.get("question") or "").strip()
            attr   = (q.get("attribute") or "").strip()

            if not q_text or not attr:
                continue
            if len(q_text) < 10:
                continue
            if q_text in existing_texts:
                continue

            stage  = q.get("stage")
            if stage is None:
                stage = STAGE_MAP.get(attr, 5)

            try:
                client.table("questions").upsert(
                    {
                        "question_text":    q_text,
                        "attribute":        attr,
                        "value":            q.get("value"),
                        "applicable_types": [ptype],
                        "stage":            int(stage),
                        "base_weight":      float(q.get("weight", 1.0)),
                        "learned_weight":   float(q.get("weight", 1.0)),
                        "is_active":        True,
                    },
                    on_conflict="question_text",
                ).execute()
                inserted += 1
                existing_texts.add(q_text)   # prevent same-batch duplicates
            except Exception as e:
                logger.warning(
                    "Question insert failed",
                    q=q_text[:60],
                    error=str(e),
                )

        logger.info(
            f"Questions inserted: {inserted}/{len(questions)} for '{name}'"
        )
        return inserted

    # ── Main runner ───────────────────────────────────────────

    async def run(
        self,
        names:              list[str],
        place_type:         Optional[str] = None,
        admin_email:        str = "admin",
        generate_questions: bool = True,
    ) -> PipelineReport:
        """
        Full AtlasMind pipeline.

        Args:
            names:              List of place name strings to generate
            place_type:         Optional type hint for Gemini
            admin_email:        Who triggered this (stored in created_by)
            generate_questions: Whether to auto-generate questions after insert

        Returns:
            PipelineReport with per-place results and summary stats
        """
        report = PipelineReport(total=len(names))

        logger.info(
            "AtlasMind pipeline started",
            total=len(names),
            place_type=place_type or "auto",
            admin=admin_email,
            generate_questions=generate_questions,
        )

        # ── Stage 1: Validate ──────────────────────────────────
        valid_names, validation_failures = self._validate(names)
        report.results.extend(validation_failures)
        report.failed += len(validation_failures)

        if not valid_names:
            logger.warning("No valid names after validation")
            return report

        # ── Stage 2: Deduplicate ───────────────────────────────
        new_names, dup_results = self._deduplicate(valid_names)
        report.results.extend(dup_results)
        report.duplicates += len(dup_results)

        if not new_names:
            logger.info("All names already in database")
            return report

        # ── Stage 3: Generate (parallel) ──────────────────────
        logger.info(f"Generating data for {len(new_names)} places...")
        pairs = await self._generate_batch(new_names, place_type)

        # ── Stages 4–7: Per place ─────────────────────────────
        for name, data in pairs:

            if data is None:
                report.results.append(PipelineResult(
                    name=name,
                    status="failed",
                    error="Gemini generation returned no data",
                ))
                report.failed += 1
                logger.warning("Generation failed", name=name)
                continue

            # Stage 4: Quality check
            quality = self._quality_score(data)

            if quality < MIN_QUALITY_SCORE:
                report.results.append(PipelineResult(
                    name=name,
                    status="low_quality",
                    quality=quality,
                    error=(
                        f"Quality score {quality:.2f} below "
                        f"threshold {MIN_QUALITY_SCORE}"
                    ),
                ))
                report.low_quality += 1
                logger.warning(
                    "Low quality data rejected",
                    name=name,
                    quality=quality,
                )
                continue

            # Stages 5 + 6: Embed + Insert
            place_id = self._insert_place(data, quality, admin_email)

            if not place_id:
                report.results.append(PipelineResult(
                    name=name,
                    status="failed",
                    error="Database insert failed",
                ))
                report.failed += 1
                continue

            # Stage 7: Question generation (optional)
            q_count = 0
            if generate_questions:
                q_count = self._generate_questions(data, place_type)

            report.results.append(PipelineResult(
                name=name,
                status="inserted",
                place_id=place_id,
                quality=quality,
                questions_generated=q_count,
            ))
            report.inserted += 1

        logger.info(
            "AtlasMind pipeline complete",
            summary=report.summary(),
        )
        return report


# ── Singleton ─────────────────────────────────────────────────
atlasmind_pipeline = AtlasMindPipeline()