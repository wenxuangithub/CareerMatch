from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from recommendations import get_job_recommendations, generate_resume
from resume_utils import analyze_resume, convert_to_latex, export_to_pdf
import logging
import io

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

@app.route('/analyze_resume', methods=['POST'])
def analyze_resume_route():
    try:
        data = request.json
        app.logger.debug(f"Received data for resume analysis: {data}")

        pdf_url = data.get('resumeUrl')
        if not pdf_url:
            return jsonify({"error": "Missing resume URL"}), 400

        analysis = analyze_resume(pdf_url)

        if isinstance(analysis, str) and analysis.startswith("Error"):
            return jsonify({"error": analysis}), 500

        return jsonify({"analysis": analysis})
    except Exception as e:
        app.logger.error(f"An error occurred during resume analysis: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route('/convert_to_latex', methods=['POST'])
def convert_to_latex_route():
    try:
        data = request.json
        app.logger.debug(f"Received data for LaTeX conversion: {data}")

        pdf_url = data.get('resumeUrl')
        if not pdf_url:
            return jsonify({"error": "Missing resume URL"}), 400

        latex_content = convert_to_latex(pdf_url)

        if isinstance(latex_content, str) and latex_content.startswith("Error"):
            return jsonify({"error": latex_content}), 500

        return jsonify({"latex": latex_content})
    except Exception as e:
        app.logger.error(f"An error occurred during LaTeX conversion: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route('/export_to_pdf', methods=['POST'])
def export_to_pdf_route():
    try:
        data = request.json
        app.logger.debug(f"Received data for PDF export: {data}")

        latex_content = data.get('latex')
        if not latex_content:
            return jsonify({"error": "Missing LaTeX content"}), 400

        pdf_buffer = export_to_pdf(latex_content)

        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='resume.pdf'
        )
    except Exception as e:
        app.logger.error(f"An error occurred during PDF export: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

if __name__ == '__main__':
    app.run(host='192.168.0.106', port=5000, debug=True)