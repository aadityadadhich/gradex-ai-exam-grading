import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PlayCircle, CheckCircle2, Bot, ScanText, Calculator, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

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
            setErrorMsg(res.data.error_details || 'Batch processing encountered an error.');
            clearInterval(intervalId);
          }
        } catch (err) {
          console.error('Error fetching progress:', err);
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
      current_roll_no: 'Starting...',
      status: 'processing'
    });

    try {
      await api.processExam(activeExam.id);
    } catch (err) {
      setErrorMsg('Processing failed to launch: ' + (err.response?.data?.detail || err.message));
      setProcessing(false);
    }
  };

  if (!activeExam) return null;

  const pct = Math.min(Math.max(progressData.percent_complete || 0, 0), 100);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="neo-box p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <PlayCircle className="w-7 h-7 text-slate-900" />
              Automated AI Pipeline Execution
            </h2>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              Trigger background evaluation for exam: <b className="text-slate-900">{activeExam.exam_name}</b>
            </p>
          </div>

          <button
            onClick={handleStartProcessing}
            disabled={processing}
            className="neo-button-primary px-6 py-3 flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
          >
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
            {processing ? 'Pipeline Executing...' : 'Start AI Batch Grading'}
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="bg-rose-200 border-2 border-slate-900 rounded-xl p-4 flex items-center gap-3 text-xs font-bold text-slate-900 neo-badge">
            <AlertCircle className="w-5 h-5 text-rose-700 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Real-time Progress Bar & Status */}
        {(processing || completed || pct > 0) && (
          <div className="bg-yellow-100 border-2 border-slate-900 rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex items-center justify-between text-xs font-black text-slate-900">
              <span className="flex items-center gap-2">
                {processing && <Loader2 className="w-4 h-4 animate-spin text-purple-700" />}
                {completed ? '✓ Batch Evaluation Complete!' : `Checking Copy ${progressData.processed_submissions} of ${progressData.total_submissions} (Roll No: ${progressData.current_roll_no})`}
              </span>
              <span className="text-base font-black bg-white px-3 py-1 border-2 border-slate-900 rounded-lg">
                {pct}%
              </span>
            </div>

            {/* Outer Progress Bar Track */}
            <div className="w-full bg-white border-2 border-slate-900 rounded-xl h-6 p-0.5 overflow-hidden shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              {/* Inner Filled Progress Bar */}
              <div
                className="bg-emerald-400 border-r-2 border-slate-900 h-full rounded-lg transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Pipeline Execution Flow Visualizer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="bg-purple-100 border-2 border-slate-900 rounded-xl p-5 space-y-2 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border-2 border-slate-900 flex items-center justify-center font-bold">
                <ScanText className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">1. PyMuPDF + PaddleOCR Layout</h4>
            </div>
            <p className="text-xs text-slate-700 font-medium pl-11">Extracts handwritten text and detects diagram bounding boxes.</p>
          </div>

          <div className="bg-cyan-100 border-2 border-slate-900 rounded-xl p-5 space-y-2 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border-2 border-slate-900 flex items-center justify-center font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">2. Multi-Provider AI (Gemini / Mistral)</h4>
            </div>
            <p className="text-xs text-slate-700 font-medium pl-11">Parses core technical concepts, ignoring handwriting variations.</p>
          </div>

          <div className="bg-emerald-100 border-2 border-slate-900 rounded-xl p-5 space-y-2 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border-2 border-slate-900 flex items-center justify-center font-bold">
                <Calculator className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">3. MCQ & Fuzzy Rubric Evaluator</h4>
            </div>
            <p className="text-xs text-slate-700 font-medium pl-11">Evaluates MCQ options (1 mark) and fuzzy concept weights (2 marks).</p>
          </div>

          <div className="bg-rose-100 border-2 border-slate-900 rounded-xl p-5 space-y-2 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border-2 border-slate-900 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">4. Confidence Scoring & HITL Router</h4>
            </div>
            <p className="text-xs text-slate-700 font-medium pl-11">Calculates confidence. Flags evaluations with Sc &lt; 70% for teacher review.</p>
          </div>
        </div>

        {completed && (
          <div className="flex justify-end pt-4">
            <button
              onClick={onComplete}
              className="neo-button-primary px-6 py-3 flex items-center gap-2 text-sm cursor-pointer"
            >
              Proceed to HITL Review Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
