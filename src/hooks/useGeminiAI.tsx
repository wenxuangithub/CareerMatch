import { useState } from 'react';
import axios from 'axios';

type Job = {
  companyName: string;
  role: string;
  tags: string[];
  classification?: string;
  descriptions?: string;
  location?: string;
  time?: string;
};

type UserInput = {
  fullName: string;
  email: string;
  phone: string;
  education: string;
  experience: string;
  skills: string;
  targetIndustry: string;
};

const API_BASE_URL = 'http://192.168.0.106:5000';

export const useGeminiAI = () => {
  const [recommendation, setRecommendation] = useState<Job[]>([]);
  const [generatedResume, setGeneratedResume] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendation = async (pdfUrl: string, jobs: Job[]) => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        pdfUrl,
        jobs: jobs.map(job => ({
          ...job,
          tags: Array.isArray(job.tags) ? job.tags : [job.tags].filter(Boolean)
        }))
      };

      console.log('Sending request to:', `${API_BASE_URL}/get_recommendations`);
      console.log('Request payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(`${API_BASE_URL}/get_recommendations`, payload);

      console.log('Received response:', JSON.stringify(response.data, null, 2));
      setRecommendation(response.data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const generateResume = async (userInput: UserInput) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Sending request to:', `${API_BASE_URL}/generate_resume`);
      console.log('Request payload:', JSON.stringify(userInput, null, 2));

      const response = await axios.post(`${API_BASE_URL}/generate_resume`, userInput);

      console.log('Received response:', JSON.stringify(response.data, null, 2));
      setGeneratedResume(response.data.resume);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err: any) => {
    if (axios.isAxiosError(err)) {
      console.error('Axios error:', err.response?.data || err.message);
      setError(`An error occurred: ${err.response?.data?.error || err.message}`);
    } else {
      console.error('Unknown error:', err);
      setError('An unknown error occurred. Please try again.');
    }
  };

  return { recommendation, generatedResume, loading, error, getRecommendation, generateResume };
};