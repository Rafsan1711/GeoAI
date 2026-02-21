"""
Data Loader - Loads and processes game data
"""

import json
import os
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

# In HF Space, this file lives at /app/utils/data_loader.py
# Data files are at /app/data/
# So BASE_DIR = /app  (two levels up from this file)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class DataLoader:

    def __init__(self, data_dir: str = 'data'):
        self.data_dir = data_dir
        self.cache = {}

    def load_json(self, filename: str):
        if filename in self.cache:
            return self.cache[filename]

        filepath = os.path.join(BASE_DIR, self.data_dir, filename)

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self.cache[filename] = data
            logger.info(f"Loaded {filename}: {len(data) if isinstance(data, list) else 'dict'} items from {filepath}")
            return data
        except FileNotFoundError:
            logger.error(f"File not found: {filepath}")
            return [] if filename != 'questions.json' else {}
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error in {filepath}: {e}")
            return [] if filename != 'questions.json' else {}

    def load_countries(self) -> List[Dict]:
        return self.load_json('countries.json')

    def load_cities(self) -> List[Dict]:
        return self.load_json('cities.json')

    def load_places(self) -> List[Dict]:
        return self.load_json('places.json')

    def load_questions(self) -> Dict:
        return self.load_json('questions.json')

    def get_category_data(self, category: str) -> List[Dict]:
        category_map = {
            'country': 'countries.json',
            'city':    'cities.json',
            'place':   'places.json'
        }
        filename = category_map.get(category)
        if not filename:
            logger.error(f"Unknown category: {category}")
            return []
        return self.load_json(filename)

    def get_all_questions(self) -> Dict:
        return self.load_questions()

    def get_data_stats(self) -> Dict:
        return {
            'country': {'count': len(self.load_countries())},
            'city':    {'count': len(self.load_cities())},
            'place':   {'count': len(self.load_places())},
        }

    def clear_cache(self):
        self.cache.clear()
        logger.info("Data cache cleared")
