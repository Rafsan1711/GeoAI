"""
GeoAI Backend — Flask REST API
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from config import DEPLOYMENT_CONFIG
from core.inference_engine import InferenceEngine
from utils.data_loader import DataLoader
from utils.logger import setup_logger

logger = setup_logger('geoai', level=DEPLOYMENT_CONFIG['log_level'])

app = Flask(__name__)
CORS(app)

data_loader      = DataLoader(data_dir='data')
inference_engine = InferenceEngine()


# ── Utility ───────────────────────────────────────────────────────────────────

def _get_game_state(session_id: str):
    if not session_id:
        return None, jsonify({'error': 'session_id required'}), 400
    game_state = inference_engine.get_game_state(session_id)
    if not game_state:
        inference_engine.active_games.pop(session_id, None)
        return None, jsonify({'error': 'Invalid or expired session'}), 400
    return game_state, None, None


def _top_countries(game_state, n: int = 10):
    active = game_state.get_active_items()
    ranked = sorted(active, key=lambda x: x.probability, reverse=True)
    return [
        {'name': item.name, 'prob': round(item.probability * 100, 2)}
        for item in ranked[:n]
    ]


# ── Data endpoints (for frontend to load JSON) ────────────────────────────────

@app.route('/api/data/countries', methods=['GET'])
def get_countries():
    data = data_loader.get_category_data('country')
    return jsonify(data)

@app.route('/api/data/cities', methods=['GET'])
def get_cities():
    data = data_loader.get_category_data('city')
    return jsonify(data)

@app.route('/api/data/places', methods=['GET'])
def get_places():
    data = data_loader.get_category_data('place')
    return jsonify(data)

@app.route('/api/data/questions', methods=['GET'])
def get_questions():
    data = data_loader.get_all_questions()
    return jsonify(data)


# ── Health ────────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status':     'healthy',
        'version':    DEPLOYMENT_CONFIG['version'],
        'engine':     'GeoAI Bayesian AI v1.3.0',
        'data_stats': data_loader.get_data_stats()
    })


# ── Game endpoints ────────────────────────────────────────────────────────────

@app.route('/api/start-game', methods=['POST'])
def start_game():
    try:
        body      = request.json
        category  = body.get('category')
        questions = body.get('questions', [])

        if not category:
            return jsonify({'error': 'category required'}), 400

        items = data_loader.get_category_data(category)
        if not items:
            return jsonify({'error': f'No data for category: {category}'}), 400
        if not questions:
            return jsonify({'error': 'Question bank required from frontend'}), 400

        game_state = inference_engine.start_new_game(category, items, questions)
        logger.info(f"Game started: {game_state.session_id} | {len(items)} items")

        return jsonify({
            'session_id':          game_state.session_id,
            'category':            category,
            'total_items':         len(items),
            'questions_available': len(questions),
            'message':             'Game started successfully'
        })

    except Exception as e:
        logger.error(f"start_game error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/question', methods=['POST'])
def get_next_question():
    try:
        session_id = request.json.get('session_id')
        game_state, err, status = _get_game_state(session_id)
        if err:
            return err, status

        question     = inference_engine.get_next_question(game_state)
        active_items = game_state.get_active_items()
        confidence   = inference_engine.confidence_calculator.calculate(active_items)
        top_item     = game_state.get_top_prediction()
        ready        = question is None

        return jsonify({
            'question':           question,
            'ready_to_guess':     ready,
            'confidence':         round(confidence, 1),
            'questions_asked':    game_state.questions_asked,
            'active_items_count': len(active_items),
            'top_guess':          top_item.name if top_item else None,
            'top_countries':      _top_countries(game_state),
        })

    except Exception as e:
        logger.error(f"get_next_question error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/answer', methods=['POST'])
def process_answer():
    try:
        body       = request.json
        session_id = body.get('session_id')
        answer     = body.get('answer')

        game_state, err, status = _get_game_state(session_id)
        if err:
            return err, status

        if not answer:
            return jsonify({'error': 'answer required'}), 400

        result = inference_engine.process_answer(game_state, answer)
        result['top_countries'] = _top_countries(game_state)

        return jsonify(result)

    except Exception as e:
        logger.error(f"process_answer error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/predict', methods=['POST'])
def get_prediction():
    try:
        session_id = request.json.get('session_id')
        game_state, err, status = _get_game_state(session_id)
        if err:
            return err, status

        result = inference_engine.get_final_prediction(game_state)
        inference_engine.firebase_service.delete_game_state(session_id)

        return jsonify(result)

    except Exception as e:
        logger.error(f"get_prediction error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    try:
        body               = request.json
        session_id         = body.get('session_id')
        actual_answer_name = body.get('actual_answer')

        game_state, err, status = _get_game_state(session_id)
        if err:
            return err, status

        top_item    = game_state.get_top_prediction()
        actual_item = next(
            (i for i in game_state.items
             if i.name.lower() == (actual_answer_name or '').lower()),
            None
        )

        if actual_item:
            inference_engine.firebase_service.log_game_result(
                game_state,
                top_item.name if top_item else 'None',
                inference_engine.confidence_calculator.calculate(game_state.get_active_items()),
                was_correct=False,
                failure_reason='user_correction',
                actual_answer=actual_answer_name
            )
            for item in game_state.items:
                if item.id == actual_item.id:
                    item.probability *= 20.0
                    item.eliminated   = False
                else:
                    item.probability *= 0.05

            inference_engine.probability_manager.normalize_probabilities(game_state.items)
            inference_engine.probability_manager.soft_filter(game_state.items)

        inference_engine.firebase_service.save_game_state(game_state)

        return jsonify({
            'status':          'learning_in_progress',
            'message':         'AI learned from the mistake and will continue.',
            'questions_asked': game_state.questions_asked,
            'top_countries':   _top_countries(game_state),
        })

    except Exception as e:
        logger.error(f"submit_feedback error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        return jsonify({
            'local_session_stats': inference_engine.get_session_stats(),
            'data_stats':          data_loader.get_data_stats(),
            'config': {
                'version':       DEPLOYMENT_CONFIG['version'],
                'max_questions': DEPLOYMENT_CONFIG.get('max_questions', 'unlimited'),
            }
        })
    except Exception as e:
        logger.error(f"get_stats error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ── Error handlers ────────────────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    logger.error("Internal Server Error: %s", e, exc_info=True)
    return jsonify({'error': 'Internal server error'}), 500


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    port  = DEPLOYMENT_CONFIG['port']
    debug = DEPLOYMENT_CONFIG['debug']
    logger.info(f"Starting GeoAI Backend on port {port} (debug={debug})")
    app.run(host='0.0.0.0', port=port, debug=debug)
