import json
import os
import random
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Define paths to JSON files
OFFERS_FILE = 'offers.json'
SCRATCH_COUNT_FILE = 'scratch_count.json'
# USED_ORDER_NUMBERS_FILE removed


# --- Helper functions to manage JSON files ---

def load_json_file(filepath, default_data=None):
    """Loads JSON data from a file, creating it with default data if it doesn't exist."""
    if not os.path.exists(filepath):
        if default_data is not None:
            with open(filepath, 'w') as f:
                json.dump(default_data, f, indent=4)
        return default_data
    with open(filepath, 'r') as f:
        return json.load(f)

def save_json_file(filepath, data):
    """Saves data to a JSON file."""
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)

# Initial offers data (updated with your new offers and probabilities)
initial_offers = [
    {
        "id": "offer_1",
        "name": "1 Ceramic bowl @ 50% OFF",
        "image": "ceramic_bowls.png",
        "max_usage": 10000000,
        "used_count": 0,
        "probability": 15
    },
    {
        "id": "offer_2",
        "name": "1 Kids bath mat @ 50% OFF",
        "image": "bath_mat.png",
        "max_usage": 10000000,
        "used_count": 0,
        "probability": 10
    },
    {
        "id": "offer_3",
        "name": "1 Wax perfume @ 50% OFF",
        "image": "wax_perfume.png",
        "max_usage": 10000000,
        "used_count": 0,
        "probability": 10
    },
    {
        "id": "offer_4",
        "name": "3 greeting cards @ 50% OFF",
        "image": "greeting_cards.png",
        "max_usage": 10000000,
        "used_count": 0,
        "probability": 7.5
    },
    {
        "id": "offer_5",
        "name": "2 Face sheet masks @ 50% OFF",
        "image": "FSM.png",
        "max_usage": 10000000,
        "used_count": 0,
        "probability": 7.5
    },
    {
        "id": "offer_6",
        "name": "1 Crochet sunflower @ 50% OFF",
        "image": "crochet.png",
        "max_usage": 10000000,
        "used_count": 0,
        "probability": 10
    },
    {
        "id": "offer_7",
        "name": "1 Notebook cartoon @ 50% OFF",
        "image": "notebook_cartoon.png",
        "max_usage": 10000000,
        "used_count": 0,
        "probability": 10
    },
    {
        "id": "offer_8",
        "name": "1 Sip smart tumbler @ 50% OFF",
        "image": "sip_smart_tumbler.png",
        "max_usage": 10000000,
        "used_count": 0,
        "probability": 10
    },
    {
        "id": "offer_9",
        "name": "1 Goodgudi copper bottle @ 50% OFF",
        "image": "copper_bottle.png",
        "max_usage": 10000000,
        "used_count": 0,
        "probability": 10
    }
]

# Ensure JSON files exist with default structures on startup
load_json_file(OFFERS_FILE, initial_offers)
load_json_file(SCRATCH_COUNT_FILE, {"count": 0})


# --- Flask Routes ---

@app.route('/')
def index():
    """Serves the main scratch card page."""
    return render_template('scratch.html') # No longer passing background_image_url

@app.route('/get_offer')
def get_offer():
    """Returns a random available offer based on probability weights."""
    offers = load_json_file(OFFERS_FILE)
    available_offers = [offer for offer in offers if offer['used_count'] < offer['max_usage']]

    if not available_offers:
        return jsonify({
            "name": "No Offers Left!",
            "image": "no_offers_left.png",
            "message": "Sorry, all offers have been redeemed."
        })

    # Calculate total probability of available offers
    total_probability = sum(offer['probability'] for offer in available_offers)

    if total_probability == 0:
        return jsonify({
            "name": "No Offers Left!",
            "image": "no_offers_left.png",
            "message": "No offers available with valid probabilities."
        })

    # Perform weighted random selection
    rand_num = random.uniform(0, total_probability)
    selected_offer = None
    cumulative_probability = 0
    for offer in available_offers:
        cumulative_probability += offer['probability']
        if rand_num <= cumulative_probability:
            selected_offer = offer
            break

    if selected_offer is None:
        selected_offer = random.choice(available_offers) # Fallback to simple random if weighted fails

    # Increment the used count for the selected offer
    for offer in offers:
        if offer['id'] == selected_offer['id']:
            offer['used_count'] += 1
            break
    save_json_file(OFFERS_FILE, offers)

    return jsonify({
        "name": selected_offer['name'],
        "image": selected_offer['image']
    })

@app.route('/increment_scratch', methods=['POST'])
def increment_scratch():
    """Increments the global scratch counter."""
    try:
        scratch_data = load_json_file(SCRATCH_COUNT_FILE)
        scratch_data['count'] += 1
        save_json_file(SCRATCH_COUNT_FILE, scratch_data)
        return jsonify({"success": True, "new_count": scratch_data['count']})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# /validate_order_number route removed

@app.route('/reset_offers', methods=['GET'])
def reset_offers():
    """Resets the used_count for all offers in offers.json to 0."""
    try:
        reset_offers_data = []
        for offer in initial_offers:
            reset_offers_data.append({**offer, "used_count": 0})
        save_json_file(OFFERS_FILE, reset_offers_data)
        save_json_file(SCRATCH_COUNT_FILE, {"count": 0})
        return jsonify({"success": True, "message": "All offers and scratch count have been reset!"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

