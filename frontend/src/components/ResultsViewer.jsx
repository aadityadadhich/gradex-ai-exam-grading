import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BarChart3, Download, FileText, Search } from 'lucide-react';

export default function ResultsViewer({ activeExam }) {
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeExam) {
      fetchResults();
    }
  }, [activeExam]);

  const fetchResults = async () => {
    if (!activeExam) return;
    setLoading(true);
    try {
      const res = await api.getResults(activeExam.id);
      setResults(res.data);
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!activeExam) return null;

  const filteredResults = results.filter((r) =>
    r.roll_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgClassScore = results.length > 0
    ? (results.reduce((acc, r) => acc + r.total_marks, 0) / results.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-purple-100 border-2 border-slate-900 rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-800 font-extrabold uppercase block">Class Submissions</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">{results.length}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center">
            <FileText className="w-6 h-6 text-purple-700" />
          </div>
        </div>

        <div className="bg-emerald-100 border-2 border-slate-900 rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-800 font-extrabold uppercase block">Class Average Score</span>
            <span className="text-3xl font-black text-emerald-900 mt-1 block">{avgClassScore} / {activeExam.total_marks}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-emerald-700" />
          </div>
        </div>

        <div className="bg-yellow-100 border-2 border-slate-900 rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-800 font-extrabold uppercase block">Master Export</span>
            <a
              href={api.getDownloadCsvUrl(activeExam.id)}
              download
              className="mt-2 neo-button-primary px-4 py-2 text-xs flex items-center gap-2 inline-flex"
            >
              <Download className="w-4 h-4" /> Export CSV
            </a>
          </div>
        </div>
      </div>

      {/* Results Table Panel */}
      <div className="neo-box p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Master Scoresheet & Grade Reports</h2>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              Exam: <b className="text-slate-900">{activeExam.exam_name}</b> ({activeExam.subject})
            </p>
          </div>

          {/* Search Filter Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-700 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Roll No..."
              className="neo-input pl-10 pr-4 py-2 text-xs font-bold w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-700 font-bold text-sm">Loading Scoresheet...</div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-12 text-slate-600 text-sm font-semibold">No evaluation results found.</div>
        ) : (
          <div className="overflow-x-auto border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
            <table className="w-full text-left text-xs text-slate-900">
              <thead className="bg-yellow-300 text-slate-900 uppercase text-[10px] font-black border-b-2 border-slate-900">
                <tr>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Total Score</th>
                  <th className="px-4 py-3">AI Confidence</th>
                  <th className="px-4 py-3">Auto-Passed Qs</th>
                  <th className="px-4 py-3">HITL Reviews</th>
                  <th className="px-4 py-3 text-right">Grade PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-900 font-semibold bg-white">
                {filteredResults.map((r, idx) => {
                  const confPct = Math.round(r.confidence_average * 100);
                  const isHighConf = confPct >= 70;

                  return (
                    <tr key={idx} className="hover:bg-slate-100 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-black text-slate-900">{r.roll_no}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-black text-emerald-800 text-sm">{r.total_marks}</span>
                        <span className="text-slate-500 text-[10px]"> / {activeExam.total_marks}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black neo-badge ${
                          isHighConf
                            ? 'bg-emerald-200 text-slate-900'
                            : 'bg-rose-200 text-slate-900'
                        }`}>
                          {confPct}% {isHighConf ? '✓ High' : '⚠ Flagged'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-900">{r.num_auto_passed}</td>
                      <td className="px-4 py-3.5 text-slate-900">{r.num_hitl_reviews}</td>
                      <td className="px-4 py-3.5 text-right">
                        <a
                          href={api.getDownloadPdfUrl(activeExam.id, r.roll_no)}
                          download
                          className="neo-button-accent px-3 py-1.5 text-[11px] inline-flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Grade Report
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
