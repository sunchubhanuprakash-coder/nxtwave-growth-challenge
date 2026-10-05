import React, { useState } from 'react';
import {
  Laptop,

  CheckCircle2,
  Clock,

  Copy,
  Check,
  Terminal,
  BarChart2,


  MessageSquare,


} from 'lucide-react';
import { useToast } from './common/Toast';

export const WorkshopStudio: React.FC = () => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'timeline' | 'starter' | 'poll' | 'qa'>('timeline');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Checkbox state for live workshop builder
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    step1: true,
    step2: true,
    step3: false,
    step4: false,
    step5: false
  });

  // Poll voting state
  const [pollVoted, setPollVoted] = useState<number | null>(null);
  const [pollResults, setPollResults] = useState([
    { id: 1, label: 'Connecting Python Backend to React Frontend', votes: 142, percentage: 41 },
    { id: 2, label: 'Managing API Keys & Preventing Rate Limits', votes: 84, percentage: 24 },
    { id: 3, label: 'RAG Embeddings & Vector Chunking', votes: 76, percentage: 22 },
    { id: 4, label: 'Deploying to Free Cloud Hosts (Render/Vercel)', votes: 45, percentage: 13 }
  ]);

  // Q&A questions state
  const [userQuestion, setUserQuestion] = useState('');
  const [questions, setQuestions] = useState([
    { id: 1, author: 'Aditya (CBIT)', question: 'Can we use open-source Ollama models instead of OpenAI keys to keep it 100% free?', upvotes: 24, answered: true, answer: 'Yes! Our starter template supports both local Ollama and cloud APIs via the exact same interface.' },
    { id: 2, author: 'Pooja (VBIT)', question: 'Will this project run on Windows without Docker installed?', upvotes: 18, answered: true, answer: 'Absolutely. It uses standard Python virtualenv and uvicorn on port 8000.' },
    { id: 3, author: 'Rahul (JNTUH)', question: 'How do I add this project to my LinkedIn and resume without sounding generic?', upvotes: 31, answered: true, answer: 'Use our Project Evaluator tool in the sidebar to generate verified ATS-action bullets!' }
  ]);

  const handleToggleChecklist = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleVote = (id: number) => {
    if (pollVoted !== null) return;
    setPollVoted(id);
    setPollResults((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, votes: item.votes + 1 } : item
      )
    );
    toast.success('Vote Recorded!', 'Thank you for participating in the live pulse poll.');
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim()) return;
    setQuestions((prev) => [
      {
        id: Date.now(),
        author: 'You (Live Participant)',
        question: userQuestion.trim(),
        upvotes: 1,
        answered: false,
        answer: ''
      },
      ...prev
    ]);
    setUserQuestion('');
    toast.success('Doubt Posted to Live Q&A Stream', 'The instructor will address your question shortly.');
  };

  const handleCopyCode = (snippet: string, name: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(name);
    toast.success('Starter Template Copied!', name);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const FASTAPI_CODE = `# main.py - 60-Minute AI Project Starter
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Placement AI Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    target_role: str = "Software Engineer"

@app.post("/api/analyze")
async def analyze_query(payload: QueryRequest):
    return {
        "status": "success",
        "role": payload.target_role,
        "recommendation": f"Tailored placement response for: {payload.query}",
        "readiness_score": 92
    }`;

  const REACT_CODE = `// App.tsx - Frontend AI Streaming Connector
import React, { useState } from 'react';

export default function App() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    const res = await fetch('http://127.0.0.1:8000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <div className="p-8 font-sans">
      <h1 className="text-xl font-bold">My AI Placement Assistant</h1>
      <input value={query} onChange={e => setQuery(e.target.value)} className="border p-2 my-2 w-full" />
      <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">Run AI</button>
      {result && <pre className="mt-4 bg-slate-100 p-4">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}`;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl border border-indigo-900/40 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
              <Laptop className="w-3.5 h-3.5" />
              <span>Challenge Asset 3: Workshop Engagement Tools</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Live Masterclass Companion Studio
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Interactive 60-minute student workspace for "Build Your First AI Project in 60 Minutes". Provides live progress tracking, copy-paste starter templates, live pulse polls, and technical Q&A.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <Clock className="w-8 h-8 text-cyan-400" />
            <div>
              <div className="text-xs text-slate-400 font-medium">Session Duration</div>
              <div className="text-base font-bold text-white font-mono">60m Sprint</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 sm:space-x-4">
        {[
          { id: 'timeline', label: '60-Minute Timeline & Checklist', icon: Clock },
          { id: 'starter', label: 'Code Starter Templates', icon: Terminal },
          { id: 'poll', label: 'Live Engagement Poll', icon: BarChart2 },
          { id: 'qa', label: 'Live Q&A Stream', icon: MessageSquare }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition ${
                isActive
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: 60-Minute Timeline & Checklist */}
      {activeTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Timeline Stages */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Structured 60-Minute Workshop Agenda</span>
              </h3>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                {[
                  { time: '00:00 - 15:00', title: 'Phase 1: Architecture & Vector Embeddings', desc: 'Understanding why simple CRUD apps get rejected in placements. Setting up Python virtual environment and FastAPI.' },
                  { time: '15:00 - 35:00', title: 'Phase 2: Live Code Build (FastAPI + LangChain)', desc: 'Writing the query router, connecting LLM prompts, and enforcing structured Pydantic response schemas.' },
                  { time: '35:00 - 50:00', title: 'Phase 3: Frontend Wiring & UI Integration', desc: 'Connecting the React Vite interface, handling loading states, and displaying AI answers.' },
                  { time: '50:00 - 60:00', title: 'Phase 4: Cloud Deployment & Resume Bullets', desc: 'Pushing code to GitHub, 1-click deploy to Vercel/Render, and adding verified project link to resume.' }
                ].map((phase, idx) => (
                  <div key={idx} className="relative flex items-start space-x-4 pl-8 group">
                    <div className="absolute left-2 w-3.5 h-3.5 rounded-full bg-cyan-400 border-4 border-slate-950 top-1 group-hover:scale-125 transition" />
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 w-full space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-cyan-400">{phase.time}</span>
                        <span className="text-[11px] text-slate-500 font-medium">Step {idx + 1} of 4</span>
                      </div>
                      <div className="text-sm font-bold text-white">{phase.title}</div>
                      <p className="text-xs text-slate-400">{phase.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hands-on Interactive Checklist */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-white font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Your Live Hands-on Progress</span>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {Object.values(checklist).filter(Boolean).length}/5 Done
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'step1', title: 'Clone Workshop Starter Repository', desc: 'Git repository cloned to local machine' },
                  { key: 'step2', title: 'Configure API Keys / Local Ollama', desc: 'Setup .env file with authentication credentials' },
                  { key: 'step3', title: 'Run FastAPI Server (Port 8000)', desc: 'Backend health check returns status: healthy' },
                  { key: 'step4', title: 'Connect React Frontend UI', desc: 'Vite dev server running on port 5173' },
                  { key: 'step5', title: 'Push to GitHub & Submit to Evaluator', desc: 'Get verified NxtWave credential badge' }
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => handleToggleChecklist(item.key)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start space-x-3 ${
                      checklist[item.key]
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                      checklist[item.key] ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-700 bg-slate-900'
                    }`}>
                      {checklist[item.key] && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${checklist[item.key] ? 'text-white' : 'text-slate-300'}`}>{item.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Code Starter Templates */}
      {activeTab === 'starter' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Python Starter */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white">Backend: Python FastAPI Starter</span>
              </div>
              <button
                onClick={() => handleCopyCode(FASTAPI_CODE, 'FastAPI Starter')}
                className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition"
              >
                {copiedSnippet === 'FastAPI Starter' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-[360px] leading-relaxed">
              {FASTAPI_CODE}
            </pre>
          </div>

          {/* React Frontend Starter */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Laptop className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-white">Frontend: React Streaming UI</span>
              </div>
              <button
                onClick={() => handleCopyCode(REACT_CODE, 'React UI Starter')}
                className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition"
              >
                {copiedSnippet === 'React UI Starter' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto max-h-[360px] leading-relaxed">
              {REACT_CODE}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Live Engagement Poll */}
      {activeTab === 'poll' && (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-cyan-400">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Live Workshop Pulse Poll</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              What is your single biggest obstacle to completing an AI resume project?
            </h3>
            <p className="text-xs text-slate-400">Cast your vote to see real-time cohort distribution across engineering colleges.</p>
          </div>

          <div className="space-y-3 pt-2">
            {pollResults.map((item) => (
              <div
                key={item.id}
                onClick={() => handleVote(item.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                  pollVoted === item.id
                    ? 'border-cyan-500 bg-cyan-950/20'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                {/* Visual Progress Bar */}
                <div
                  className="absolute inset-0 bg-cyan-500/10 pointer-events-none transition-all duration-700"
                  style={{ width: `${item.percentage}%` }}
                />

                <div className="relative z-10 flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-white">{item.label}</span>
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="text-cyan-400 font-bold">{item.percentage}%</span>
                    <span className="text-slate-500 text-[11px]">({item.votes} votes)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Live Q&A Stream */}
      {activeTab === 'qa' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Post Question Box */}
          <form onSubmit={handleAddQuestion} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
            <h4 className="text-xs font-bold text-slate-300">Ask a Question to the Masterclass Lead</h4>
            <div className="flex gap-3">
              <input
                type="text"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                placeholder="Ask about model deployment, API keys, resume ATS tips..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
              >
                Post Doubt
              </button>
            </div>
          </form>

          {/* Question List */}
          <div className="space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400">{q.author}</span>
                  <span className="text-[11px] text-slate-500 font-mono">? {q.upvotes} upvotes</span>
                </div>
                <div className="text-sm font-medium text-white">{q.question}</div>
                {q.answered && (
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/30 text-xs text-emerald-300 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-400 block mb-0.5">Instructor Answer:</span>
                      <span>{q.answer}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
