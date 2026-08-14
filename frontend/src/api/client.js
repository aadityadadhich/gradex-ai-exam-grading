import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Exams
  createExam: (data) => client.post('/exam/create', data),
  listExams: () => client.get('/exam/list'),
  getExam: (examId) => client.get(`/exam/${examId}`),
  processExam: (examId) => client.post(`/exam/${examId}/process`),
  getExamProgress: (examId) => client.get(`/exam/${examId}/progress`),

  // Rubrics & Rubric Bot
  saveRubric: (examId, rubricData) => client.put(`/exam/${examId}/rubric`, { rubric_data: rubricData }),
  getRubric: (examId) => client.get(`/exam/${examId}/rubric`),
  generateRubricBot: (examId, formData) => client.post(`/exam/${examId}/rubric-bot`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Uploads
  submitStudentPdf: (examId, formData) => client.post(`/exam/${examId}/submit-pdf`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  listSubmissions: (examId) => client.get(`/exam/${examId}/submissions`),

  // HITL Dashboard
  getNextHitlItem: (examId) => client.get(`/exam/${examId}/hitl-queue`),
  getHitlCount: (examId) => client.get(`/exam/${examId}/hitl-queue/count`),
  submitHitlReview: (examId, evalId, reviewData) => client.put(`/exam/${examId}/hitl/${evalId}`, reviewData),

  // Results & Downloads
  getResults: (examId) => client.get(`/exam/${examId}/results`),
  getDownloadCsvUrl: (examId) => `${API_BASE_URL}/exam/${examId}/download-csv`,
  getDownloadPdfUrl: (examId, rollNo) => `${API_BASE_URL}/exam/${examId}/download-pdf/${rollNo}`
};

export default client;
