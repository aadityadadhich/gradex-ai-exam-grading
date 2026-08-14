import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Bot, FileText, Sparkles, Save, CheckCircle2, AlertCircle, Plus, Trash2, ArrowRight, Loader2, Clock } from 'lucide-react';

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
      alert('Please select or create an exam first.');
      return;
    }
    if (!questionPdf || !answerPdf) {
      alert('Please select both Question Paper (PDF/TXT) and Answer Key (PDF/TXT).');
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
      setErrorMsg('Failed to generate rubric: ' + (err.response?.data?.detail || err.message));
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
      alert('Rubric saved successfully!');
      if (onNext) onNext();
    } catch (err) {
      setErrorMsg('Error saving rubric: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    const questions = rubricData?.questions ? [...rubricData.questions] : [];
    const nextId = `Q${questions.length + 1}`;
    questions.push({
      q_id: nextId,
      question_text: 'Describe concept',
      type: 'Short_Answer',
      marks: 2,
      keywords: ['concept', 'definition'],
      keyword_weights: { concept: 1.0, definition: 1.0 },
      passing_threshold: 1,
      grading_notes: 'Must contain key terms.'
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

  const updateQuestionKeywords = (index, rawStr) => {
    const kws = rawStr.split(',').map((s) => s.trim()).filter(Boolean);
    const questions = [...rubricData.questions];
    questions[index].keywords = kws;

    const weights = {};
    kws.forEach((kw) => {
      weights[kw] = questions[index].keyword_weights?.[kw] || 1.0;
    });
    questions[index].keyword_weights = weights;

    setRubricData({ ...rubricData, questions });
    setSavedStatus(false);
  };

  if (!activeExam) {
    return (
      <div className="neo-box p-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-xl font-black text-slate-900">No Active Exam Selected</h3>
        <p className="text-slate-600 text-sm max-w-md mx-auto font-medium">
          Please go to Step 1 (Exam Setup) to create or select an exam before configuring the rubric.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upload Box */}
      <div className="neo-box p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Bot className="w-7 h-7 text-slate-900" />
              AI Rubric Generator (Rubric Bot)
            </h2>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              Upload Question Paper and Answer Key (PDF or TXT). AI will extract all questions, correct answers, and key criteria.
            </p>
          </div>

          {savedStatus && (
            <span className="flex items-center gap-2 px-3 py-1 bg-emerald-200 text-slate-900 border-2 border-slate-900 text-xs font-black rounded-full neo-badge">
              <CheckCircle2 className="w-4 h-4 text-emerald-800" /> Rubric Saved
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="bg-rose-200 border-2 border-slate-900 rounded-xl p-4 flex items-center gap-3 text-xs font-bold text-slate-900 neo-badge">
            <AlertCircle className="w-5 h-5 text-rose-700 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Question Upload */}
          <div className="bg-purple-50 border-2 border-slate-900 rounded-xl p-6 text-center space-y-3 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
            <FileText className="w-10 h-10 text-purple-700 mx-auto" />
            <h4 className="font-extrabold text-slate-900 text-sm">Question Paper (PDF or TXT)</h4>
            <input
              type="file"
              accept=".pdf,.txt,.csv"
              onChange={(e) => setQuestionPdf(e.target.files[0])}
              className="block w-full text-xs text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-yellow-300 file:text-slate-900 cursor-pointer"
            />
            {questionPdf && <p className="text-xs text-emerald-800 font-bold">Selected: {questionPdf.name}</p>}
          </div>

          {/* Answer Key Upload */}
          <div className="bg-cyan-50 border-2 border-slate-900 rounded-xl p-6 text-center space-y-3 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
            <FileText className="w-10 h-10 text-cyan-700 mx-auto" />
            <h4 className="font-extrabold text-slate-900 text-sm">Answer Key (PDF or TXT)</h4>
            <input
              type="file"
              accept=".pdf,.txt,.csv"
              onChange={(e) => setAnswerPdf(e.target.files[0])}
              className="block w-full text-xs text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-yellow-300 file:text-slate-900 cursor-pointer"
            />
            {answerPdf && <p className="text-xs text-emerald-800 font-bold">Selected: {answerPdf.name}</p>}
          </div>
        </div>

        {/* Wait Timer & Progress Indicator */}
        {loading && (
          <div className="bg-yellow-100 border-2 border-slate-900 rounded-xl p-4 flex items-center justify-between text-xs font-black text-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-purple-700" />
              Extracting all questions from uploaded documents... Please wait.
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1 border-2 border-slate-900 rounded-lg">
              <Clock className="w-4 h-4 text-slate-700" /> {elapsedSeconds}s elapsed
            </span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerateRubric}
            disabled={loading}
            className="neo-button-accent px-6 py-3 flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'AI Extracting Rubric...' : 'Generate Rubric with AI'}
          </button>
        </div>
      </div>

      {/* Editable Rubric Questions Editor */}
      {rubricData && rubricData.questions && (
        <div className="neo-box p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Extracted Rubric Questions ({rubricData.questions.length} Questions)
              </h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Refine question prompts, correct answers for MCQs, or key terms for short answer questions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={addQuestion}
                className="neo-button-yellow px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Question
              </button>
              <button
                type="button"
                onClick={handleSaveRubric}
                disabled={saving}
                className="neo-button-primary px-5 py-2 text-xs flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Rubric'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {rubricData.questions.map((q, idx) => {
              const isMcq = q.type === 'MCQ';
              return (
                <div key={idx} className="bg-slate-50 border-2 border-slate-900 rounded-xl p-5 space-y-4 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={q.q_id}
                        onChange={(e) => updateQuestionField(idx, 'q_id', e.target.value)}
                        className="neo-input font-black text-sm px-3 py-1 w-20 text-center uppercase"
                      />
                      <span className="text-xs font-bold text-slate-700">Type:</span>
                      <select
                        value={q.type || 'Short_Answer'}
                        onChange={(e) => updateQuestionField(idx, 'type', e.target.value)}
                        className="neo-input font-bold text-xs px-2 py-1"
                      >
                        <option value="MCQ">MCQ (Option Match)</option>
                        <option value="Short_Answer">Short Answer (Concept Match)</option>
                      </select>
                      <span className="text-xs font-bold text-slate-700">Marks:</span>
                      <input
                        type="number"
                        value={q.marks}
                        onChange={(e) => updateQuestionField(idx, 'marks', parseFloat(e.target.value) || 1)}
                        className="neo-input font-black text-sm px-3 py-1 w-16 text-center"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      className="text-slate-500 hover:text-red-600 transition-colors p-1"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1">Question Prompt</label>
                    <input
                      type="text"
                      value={q.question_text || ''}
                      onChange={(e) => updateQuestionField(idx, 'question_text', e.target.value)}
                      className="neo-input w-full px-3 py-2 text-xs font-medium"
                    />
                  </div>

                  {isMcq ? (
                    <div>
                      <label className="block text-xs font-extrabold text-slate-800 mb-1">Correct MCQ Option Letter</label>
                      <input
                        type="text"
                        value={q.correct_answer || q.keywords?.[0] || ''}
                        onChange={(e) => updateQuestionField(idx, 'correct_answer', e.target.value.toUpperCase())}
                        placeholder="e.g. B"
                        className="neo-input w-24 px-3 py-2 text-xs font-black uppercase text-center"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-extrabold text-slate-800 mb-1">
                        Expected Keywords (Comma-separated)
                      </label>
                      <input
                        type="text"
                        value={q.keywords?.join(', ') || ''}
                        onChange={(e) => updateQuestionKeywords(idx, e.target.value)}
                        className="neo-input w-full px-3 py-2 text-xs font-semibold text-purple-900"
                      />
                    </div>
                  )}

                  <div className="bg-yellow-200/50 border border-slate-900 rounded-lg p-3 text-xs font-medium text-slate-900">
                    <b>Reference Notes:</b> {q.grading_notes || 'Extracted reference solution.'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleSaveRubric}
              disabled={saving}
              className="neo-button-primary px-6 py-3 flex items-center gap-2 text-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saving ? 'Saving Rubric...' : 'Confirm Rubric & Proceed to Upload'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
