"""Shared constants — importable from both pipeline and question_selector."""

STAGE_MAP: dict[str, int] = {
    "continent": 0, "type": 0,
    "region": 1, "subRegion": 1, "subtype": 1,
    "hasCoast": 2, "landlocked": 2, "isIsland": 2,
    "hasMountains": 2, "hasRivers": 2, "climate": 2,
    "country": 2, "located_in": 2,
    "population": 3, "size": 3,
    "government": 4, "mainReligion": 4, "driveSide": 4,
    "language": 5, "flagColors": 5, "formerColony": 5,
    "hasNobel": 5, "hasUNESCO": 5, "hasWonder": 5,
    "elevation_m": 5, "length_km": 5, "area_km2": 5,
    "exports": 6, "famousFor": 6, "neighbors": 6,
    "capital": 7, "currency": 7,
    "builtYear": 6, "religion_type": 5, "naturalType": 3,
}