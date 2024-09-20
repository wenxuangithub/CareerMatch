import re
import requests
import PyPDF2
import io
import json
import logging
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Configure the Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

def process_submitted_resume(resume_url, job):
    try:
        resume_text = extract_text_from_pdf(resume_url)
        
        prompt = f"""
        Analyze the following resume against the provided job description. Provide a detailed analysis including:

        1. Skills match: Identify skills in the resume that match the job requirements.
        2. Education match: Assess if the candidate's education aligns with the job requirements.
        3. Job description keywords: Extract key terms from the job description and check if they appear in the resume.
        4. Interested parts: Identify sections of the resume that are particularly relevant to this job.

        Resume:
        {resume_text}

        Job Description:
        {json.dumps(job, indent=2)}

        Provide the analysis as a JSON object with the following structure:
            
            "skills_match": [list of matching skills],
            "education_match": "description of education alignment",
            "job_description_keywords": [list of key terms found in both],
            "interested_part": "description of relevant resume sections"

        Return only the JSON object, without any additional text or explanation.
        """

        logger.debug(f"Generated prompt for resume processing: {prompt}")

        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,
                "top_p": 1,
                "top_k": 1,
                "max_output_tokens": 2048,
            },
            safety_settings={
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            },
        )

        # Log the raw response for debugging
        logger.debug(f"Raw Gemini API response: {response.text}")

        # Attempt to reconstruct partial JSON
        reconstructed_json = reconstruct_partial_json(response.text)

        if reconstructed_json:
            analysis = reconstructed_json
        else:
            # If reconstruction fails, return a structured error response
            analysis = {
                "error": "Failed to parse JSON",
                "raw_response": response.text,
                "skills_match": [],
                "education_match": "Unable to determine",
                "job_description_keywords": [],
                "interested_part": "Unable to determine"
            }

        logger.debug(f"Processed Gemini API response: {analysis}")

        return analysis
    except Exception as e:
        logger.error(f"Error in process_submitted_resume: {str(e)}")
        return {
            "error": f"Error processing submitted resume: {str(e)}",
            "skills_match": [],
            "education_match": "Unable to determine",
            "job_description_keywords": [],
            "interested_part": "Unable to determine"
        }

def reconstruct_partial_json(text):
    try:
        # Attempt to find and parse the JSON object
        json_match = re.search(r'\{[^}]*\}', text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            # Replace newlines and extra spaces
            json_str = re.sub(r'\s+', ' ', json_str)
            # Parse the JSON
            return json.loads(json_str)
        else:
            # If no JSON object is found, construct one from the text
            skills_match = re.findall(r'"skills_match":\s*\[(.*?)\]', text, re.DOTALL)
            education_match = re.search(r'"education_match":\s*"(.*?)"', text)
            keywords = re.findall(r'"job_description_keywords":\s*\[(.*?)\]', text, re.DOTALL)
            interested_part = re.search(r'"interested_part":\s*"(.*?)"', text)

            return {
                "skills_match": skills_match[0].split(',') if skills_match else [],
                "education_match": education_match.group(1) if education_match else "Unable to determine",
                "job_description_keywords": keywords[0].split(',') if keywords else [],
                "interested_part": interested_part.group(1) if interested_part else "Unable to determine"
            }
    except Exception as e:
        logger.error(f"Error reconstructing JSON: {str(e)}")
        return None


def extract_text_from_pdf(pdf_url):
    try:
        response = requests.get(pdf_url)
        response.raise_for_status()
        pdf_file = io.BytesIO(response.content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        logger.debug(f"Extracted PDF text (first 1000 chars): {text[:1000]}")
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        return f"Error extracting PDF text: {str(e)}"


def get_job_recommendations(pdf_url, jobs):
    try:
        resume_text = extract_text_from_pdf(pdf_url)
        
        prompt = f"""
        Given the following resume and job listings, analyze all job listings and provide a suitability assessment for each job.
        
        Resume:
        {resume_text}

        Job Listings:
        {json.dumps(jobs, indent=2)}

        For each job, provide an assessment as a JSON object with the following fields:
        - companyName: The name of the company
        - role: The job title
        - tags: An array of relevant skills or keywords
        - matchReason: A detailed explanation of why this job is or isn't a good match for the candidate
        - matchScore: A string representing the match quality: "Excellent" (for top matches), "Average" (for decent matches), or "Poor" (for less suitable matches)
        - detailedAnalysis: A more in-depth analysis of the candidate's fit for the role, including strengths and potential areas for improvement

        Return a JSON array containing an assessment for each job listing, without any additional text or explanation.
        """

        logger.debug(f"Generated prompt: {prompt}")

        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,
                "top_p": 1,
                "top_k": 1,
                "max_output_tokens": 8192,  # Increased to handle more job listings
            },
            safety_settings={
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            },
        )

        recommendations = json.loads(response.text)
        logger.debug(f"Gemini API response: {recommendations}")

        return recommendations
    except Exception as e:
        logger.error(f"Error in get_job_recommendations: {str(e)}")
        return f"Error generating recommendations: {str(e)}"
    

def generate_resume(user_input):
    try:
        prompt = f"""
        Generate a professional resume based on the following information:

        Full Name: {user_input['fullName']}
        Email: {user_input['email']}
        Phone: {user_input['phone']}
        Education: {user_input['education']}
        Work Experience: {user_input['experience']}
        Skills: {user_input['skills']}
        Target Industry: {user_input['targetIndustry']}

        Please create a well-structured resume that highlights the candidate's strengths and is tailored to the {user_input['targetIndustry']} industry. 
        The resume should include the following sections:
        1. Contact Information
        2. Professional Summary
        3. Work Experience
        4. Education
        5. Skills

        Format the resume using Markdown for better readability.
        Generate some recommendations as well for in writing a good resume.
        """

        logger.debug(f"Generated resume prompt: {prompt}")

        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.7,
                "top_p": 1,
                "top_k": 1,
                "max_output_tokens": 2048,
            },
            safety_settings={
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            },
        )

        generated_resume = response.text
        logger.debug(f"Generated resume: {generated_resume}")

        return generated_resume
    except Exception as e:
        logger.error(f"Error in generate_resume: {str(e)}")
        return f"Error generating resume: {str(e)}"