import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PlayCircle, CheckCircle2, Bot, ScanText, Calculator, ArrowRight, ShieldCheck, AlertCircle, Loader2, Cpu, FileCheck } from 'lucide-react';

export default function ProcessingView({ activeExam, onComplete }) {
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progressData, setProgressData] = useState({
    percent_complete: 0.0,
    processed_submissions: 0,
    total_submissions: 0,
    current_roll_no: 'Idle',
    status: 'idle'
  });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let intervalId;
    if (processing && activeExam) {
      intervalId = setInterval(async () => {
        try {
          const res = await api.getExamProgress(activeExam.id);
          setProgressData(res.data);
          if (res.data.status === 'completed' || res.data.percent_complete >= 100) {
            setProcessing(false);
            setCompleted(true);
            clearInterval(intervalId);
          } else if (res.data.status === 'error') {
            setProcessing(false);
            setErrorMsg(res.data.error_details || 'Batch assessment pipeline encountered an issue.');
            clearInterval(intervalId);
          }
        } catch (err) {
          console.error('Error polling progress:', err);
        }
      }, 1500);
    }
    return () => clearInterval(intervalId);
  }, [processing, activeExam]);

  const handleStartProcessing = async () => {
    if (!activeExam) return;
    setProcessing(true);
    setCompleted(false);
    setErrorMsg('');
    setProgressData({
      percent_complete: 0.0,
      processed_submissions: 0,
      total_submissions: 0,
      current_roll_no: 'Initiating...',
      status: 'processing'
    });

    try {
      await api.processExam(activeExam.id);
    } catch (err) {
      setErrorMsg('Pipeline execution failed to start: ' + (err.response?.data?.detail || err.message));
      setProcessing(false);
    }
  };

  if (!activeExam) return null;

  const pct = Math.min(Math.max(progressData.percent_complete || 0, 0), 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="academic-card p-6 bg-white space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <PlayCircle className="w-5 h-5 text-blue-600" />
              Automated Examination Assessment Engine
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Execute local AI evaluation pipeline (Qwen 2.5 7B via Ollama / Gemini fallback) for course: <b className="text-slate-800">{activeExam.exam_name}</b>
            </p>
          </div>

          <button
            onClick={handleStartProcessing}
            disabled={processing}
            className="academic-button-primary px-5 py-2.5 flex items-center gap-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            {processing ? 'Assessment in Progress...' : 'Start Automated Assessment'}
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="academic-badge badge-rose p-3 rounded-lg flex items-center gap-2 w-full text-xs">
            <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Real-time Progress Bar & Status */}
        {(processing || completed || pct > 0) && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span className="flex items-center gap-2">
                {processing && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
                {completed ? '✓ Batch Examination Evaluation Complete' : `Evaluating Candidate Script ${progressData.processed_submissions} of ${progressData.total_submissions} (Roll No: ${progressData.current_roll_no})`}
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {pct}%
              </span>
            </div>

            {/* Progress Bar Track */}
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Pipeline Architecture Visualizer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <ScanText className="w-4 h-4 text-blue-600" />
              <span>1. PyMuPDF & OCR</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Extracts high-resolution handwriting and diagram layout regions.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>2. Local Qwen 2.5 (Ollama)</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Processes semantic meaning & technical criteria offline with 0 token limits.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span>3. Rubric & MCQs</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Validates MCQ option keys and applies 70% semantic tolerance threshold.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>4. Faculty Moderation</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Flags items with confidence &lt; 70% or student rechecks for review.
            </p>
          </div>
        </div>

        {completed && (
          <div className="flex justify-end pt-2">
            <button
              onClick={onComplete}
              className="academic-button-primary px-5 py-2.5 flex items-center gap-2 text-xs font-semibold cursor-pointer"
            >
              Proceed to Faculty Moderation (HITL) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
