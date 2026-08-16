import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Bot, FileText, Sparkles, Save, CheckCircle2, AlertCircle, Plus, Trash2, ArrowRight, Loader2, Clock, ShieldCheck } from 'lucide-react';

export default function RubricBot({ activeExam, onNext }) {
  const [questionPdf, setQuestionPdf] = useState(null);
  const [answerPdf, setAnswerPdf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rubricData, setRubricData] = useState(null);
  const [savedStatus, setSavedStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (activeExam) {
      loadRubric();
    }
  }, [activeExam]);

  useEffect(() => {
    let timer;
    if (loading) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const loadRubric = async () => {
    try {
      const res = await api.getRubric(activeExam.id);
      if (res.data && res.data.questions) {
        setRubricData(res.data);
        setSavedStatus(true);
      }
    } catch (err) {
      setRubricData(null);
      setSavedStatus(false);
    }
  };

  const handleGenerateRubric = async () => {
    if (!activeExam) {
      alert('Please select an active examination session first.');
      return;
    }
    if (!questionPdf || !answerPdf) {
      alert('Please upload both the Master Question Paper (PDF/TXT) and the Official Answer Key (PDF/TXT/CSV).');
      return;
    }

    setLoading(true);
    setSavedStatus(false);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('question_pdf', questionPdf);
      formData.append('answer_key_pdf', answerPdf);

      const res = await api.generateRubricBot(activeExam.id, formData);
      if (res.data.suggested_rubric) {
        setRubricData(res.data.suggested_rubric);
      }
    } catch (err) {
      setErrorMsg('Failed to extract rubric criteria: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRubric = async () => {
    if (!activeExam || !rubricData) return;

    setSaving(true);
    setErrorMsg('');
    try {
      await api.saveRubric(activeExam.id, rubricData);
      setSavedStatus(true);
      if (onNext) onNext();
    } catch (err) {
      setErrorMsg('Error saving rubric criteria: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    const questions = rubricData?.questions ? [...rubricData.questions] : [];
    const nextId = `Q${questions.length + 1}`;
    questions.push({
      q_id: nextId,
      question_text: 'Assessment question description',
      type: 'Short_Answer',
      marks: 2,
      keywords: ['concept', 'definition'],
      keyword_weights: { concept: 1.0, definition: 1.0 },
      passing_threshold: 1,
      grading_notes: 'Standard technical definition.'
    });
    setRubricData({ ...rubricData, questions });
    setSavedStatus(false);
  };

  const removeQuestion = (index) => {
    const questions = [...rubricData.questions];
    questions.splice(index, 1);
    setRubricData({ ...rubricData, questions });
    setSavedStatus(false);
  };

  const updateQuestionField = (index, field, value) => {
    const questions = [...rubricData.questions];
    questions[index][field] = value;
    setRubricData({ ...rubricData, questions });
    setSavedStatus(false);
  };

  if (!activeExam) {
    return (
      <div className="academic-card p-12 text-center space-y-3 bg-white">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">No Examination Selected</h3>
        <p className="text-slate-500 text-xs max-w-md mx-auto">
          Please navigate to Step 1 (Examination Setup) to select or create a course examination before configuring evaluation criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upload Master Question Paper & Answer Key */}
      <div className="academic-card p-6 bg-white space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-blue-600" />
              Automated Marking Rubric & Key Extraction
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Upload the official Question Paper and Answer Key (PDF, TXT, or CSV). The local AI engine (Qwen 2.5) will generate structured assessment criteria.
            </p>
          </div>

          {savedStatus && (
            <span className="academic-badge badge-green">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Rubric Confirmed
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="academic-badge badge-rose p-3 rounded-lg flex items-center gap-2 w-full text-xs">
            <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Question Upload */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-center space-y-2.5">
            <FileText className="w-7 h-7 text-blue-600 mx-auto" />
            <h4 className="font-semibold text-slate-800 text-xs">Master Question Paper (PDF / TXT)</h4>
            <input
              type="file"
              accept=".pdf,.txt,.csv"
              onChange={(e) => setQuestionPdf(e.target.files[0])}
              className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-300 file:text-xs file:font-semibold file:bg-white file:text-slate-700 cursor-pointer"
            />
            {questionPdf && <p className="text-[11px] text-blue-700 font-semibold">Selected: {questionPdf.name}</p>}
          </div>

          {/* Answer Key Upload */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-center space-y-2.5">
            <FileText className="w-7 h-7 text-slate-700 mx-auto" />
            <h4 className="font-semibold text-slate-800 text-xs">Official Solution Key (PDF / TXT / CSV)</h4>
            <input
              type="file"
              accept=".pdf,.txt,.csv"
              onChange={(e) => setAnswerPdf(e.target.files[0])}
              className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-300 file:text-xs file:font-semibold file:bg-white file:text-slate-700 cursor-pointer"
            />
            {answerPdf && <p className="text-[11px] text-blue-700 font-semibold">Selected: {answerPdf.name}</p>}
          </div>
        </div>

        {/* Wait Timer & Progress Indicator */}
        {loading && (
          <div className="academic-badge badge-amber p-3.5 rounded-lg flex items-center justify-between w-full text-xs">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
              Parsing examination questions and building grading criteria via Qwen 2.5 AI...
            </span>
            <span className="flex items-center gap-1 font-mono font-bold">
              <Clock className="w-3.5 h-3.5" /> {elapsedSeconds}s
            </span>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            onClick={handleGenerateRubric}
            disabled={loading}
            className="academic-button-primary px-5 py-2.5 flex items-center gap-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? 'Extracting Criteria...' : 'Generate Marking Rubric'}
          </button>
        </div>
      </div>

      {/* Editable Rubric Questions */}
      {rubricData && rubricData.questions && (
        <div className="academic-card p-6 bg-white space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Extracted Marking Rubric ({rubricData.questions.length} Questions)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Review question statements, MCQ answer letters, or reference solution guidelines before finalizing.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={addQuestion}
                className="academic-button-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" /> Add Question
              </button>
              <button
                type="button"
                onClick={handleSaveRubric}
                disabled={saving}
                className="academic-button-primary px-4 py-1.5 text-xs flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save Rubric'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {rubricData.questions.map((q, idx) => {
              const isMcq = q.type === 'MCQ';
              return (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="text"
                        value={q.q_id}
                        onChange={(e) => updateQuestionField(idx, 'q_id', e.target.value)}
                        className="academic-input font-bold text-xs px-2 py-1 w-16 text-center uppercase"
                      />
                      <span className="text-xs text-slate-500 font-medium">Type:</span>
                      <select
                        value={q.type || 'Short_Answer'}
                        onChange={(e) => updateQuestionField(idx, 'type', e.target.value)}
                        className="academic-input text-xs px-2 py-1 font-medium"
                      >
                        <option value="MCQ">MCQ (Option Match)</option>
                        <option value="Short_Answer">Short Answer (Semantic Criteria)</option>
                      </select>
                      <span className="text-xs text-slate-500 font-medium">Marks:</span>
                      <input
                        type="number"
                        value={q.marks}
                        onChange={(e) => updateQuestionField(idx, 'marks', parseFloat(e.target.value) || 1)}
                        className="academic-input font-bold text-xs px-2 py-1 w-14 text-center"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Question Prompt</label>
                    <input
                      type="text"
                      value={q.question_text || ''}
                      onChange={(e) => updateQuestionField(idx, 'question_text', e.target.value)}
                      className="academic-input w-full px-3 py-1.5 text-xs"
                    />
                  </div>

                  {isMcq ? (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Correct MCQ Option Key</label>
                      <input
                        type="text"
                        value={q.correct_answer || q.keywords?.[0] || ''}
                        onChange={(e) => updateQuestionField(idx, 'correct_answer', e.target.value.toUpperCase())}
                        placeholder="e.g. B"
                        className="academic-input w-20 px-2.5 py-1 text-xs font-bold uppercase text-center"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Reference Marking Solution Notes
                      </label>
                      <input
                        type="text"
                        value={q.grading_notes || ''}
                        onChange={(e) => updateQuestionField(idx, 'grading_notes', e.target.value)}
                        className="academic-input w-full px-3 py-1.5 text-xs text-slate-800 font-medium"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={handleSaveRubric}
              disabled={saving}
              className="academic-button-primary px-5 py-2.5 flex items-center gap-2 text-xs font-semibold cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {saving ? 'Saving Rubric...' : 'Confirm Rubric & Proceed to Script Upload'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
