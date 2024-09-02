from flask import Flask, request, jsonify
from flask_cors import CORS
from recommendations import get_job_recommendations, generate_resume
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)

@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Flask server is running correctly!"}), 200

@app.route('/get_recommendations', methods=['POST'])
def get_recommendations():
    try:
        data = request.json
        app.logger.debug(f"Received data: {data}")
        
        pdf_url = data.get('pdfUrl')
        jobs = data.get('jobs')

        if not pdf_url or not jobs:
            return jsonify({"error": "Missing PDF URL or jobs data"}), 400

        recommendations = get_job_recommendations(pdf_url, jobs)
        
        if isinstance(recommendations, str) and recommendations.startswith("Error"):
            return jsonify({"error": recommendations}), 500

        return jsonify(recommendations)
    except Exception as e:
        app.logger.error(f"An error occurred: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route('/generate_resume', methods=['POST'])
def create_resume():
    try:
        data = request.json
        app.logger.debug(f"Received data for resume generation: {data}")

        if not data:
            return jsonify({"error": "Missing user input data"}), 400

        resume = generate_resume(data)

        if isinstance(resume, str) and resume.startswith("Error"):
            return jsonify({"error": resume}), 500

        return jsonify({"resume": resume})
    except Exception as e:
        app.logger.error(f"An error occurred during resume generation: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

if __name__ == '__main__':
    app.run(host='192.168.0.106', port=5000, debug=True)