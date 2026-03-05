
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { TrendPanel } from './components/TrendPanel';
import { IdeaCard } from './components/IdeaCard';
import { ExploreTrends } from './components/ExploreTrends';
import { SuccessStories } from './components/SuccessStories';
import { ApiDocs } from './components/ApiDocs';
import { Login } from './components/Login';
import { UserProfile, HackathonIdea, Trend, View } from './types';
import { getTrends, generateHackathonIdea } from './services/geminiService';

const AVAILABLE_SKILLS = [
  // Software
  "React", "Node.js", "Python", "Solidity", "Rust", "Go", "Kubernetes", "Docker",
  "TensorFlow", "Swift", "Flutter", "TailwindCSS", "AWS", "Firebase", "PostgreSQL",
  "Unity", "Three.js", "Figma", "WebGL", "C#", "TypeScript",
  // Electronics
  "PCB Design (Altium/KiCad)", "Embedded C/C++", "FPGA (Verilog/VHDL)", "RTOS", 
  "Signal Processing", "LoRaWAN", "Zigbee", "VLSI", "Power Electronics", "Arduino", 
  "Raspberry Pi", "ESP32", "Sensors & Actuators", "Analog Circuits",
  // Mechanical
  "CAD (SolidWorks)", "AutoCAD", "3D Printing (SLA/FDM)", "FEA (Ansys)", 
  "Mechatronics", "Robotic Kinematics", "CNC Machining", "Thermodynamics", 
  "Pneumatics", "Fluid Dynamics", "Materials Science", "Industrial Design"
];

const AVAILABLE_INTERESTS = [
  "Social Good", "HealthTech", "FinTech", "GameDev", "Environment", "Privacy",
  "Productivity", "AI Art", "Cybersecurity", "EduTech", "Accessibility", 
  "SpaceTech", "AgriTech", "BioTech", "Logistics", "DefenseTech", "Web3 Gaming",
  // Engineering Focused
  "Consumer Electronics", "Industrial IoT", "Automotive Tech", "Smart Grids", 
  "Aerospace Eng", "Wearables", "Medical Devices", "Humanoid Robotics", 
  "Renewable Energy", "Smart Home Automation", "Deep Sea Exploration"
];

const PROMPT_TEMPLATES = [
  { label: "Hardware Constraint", text: "Must use STM32 microcontroller and prioritize ultra-low power consumption for battery longevity." },
  { label: "Social Impact", text: "Focus on accessibility for users with visual impairments in low-bandwidth rural environments." },
  { label: "Enterprise Scale", text: "Architecture must support horizontal scaling with a focus on zero-trust security and data encryption." },
  { label: "Robotics/Kinematics", text: "Emphasize real-time control loops and sensor fusion for high-precision autonomous movement." },
  { label: "Sustainability", text: "Prioritize biodegradable materials and life-cycle sustainability in the mechanical design." }
];

const LOADING_STEPS = [
  "Initializing Forge-Core...",
  "Analyzing skill synergy...",
  "Scanning market trends...",
  "Brainstorming novel solutions...",
  "Evaluating project feasibility...",
  "Constructing execution roadmap...",
  "Optimizing winning strategy..."
];

const STORAGE_KEY = 'ideaforge_custom_context';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [loadingIdea, setLoadingIdea] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedIdea, setGeneratedIdea] = useState<HackathonIdea | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const [profile, setProfile] = useState<UserProfile>(() => {
    // Initial state setup with localStorage check
    const savedContext = localStorage.getItem(STORAGE_KEY);
    return {
      skills: [],
      interests: [],
      experienceLevel: 'Intermediate',
      teamSize: 1,
      timeConstraint: '24 hours',
      customContext: savedContext || ''
    };
  });

  const lastSavedRef = useRef(profile.customContext);

  // Load trends
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const data = await getTrends();
        setTrends(data);
      } catch (e) {
        console.error("Error fetching trends", e);
      } finally {
        setLoadingTrends(false);
      }
    };
    fetchTrends();
  }, []);

  // Handle loading step animation
  useEffect(() => {
    let interval: number;
    if (loadingIdea) {
      interval = window.setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loadingIdea]);

  // Autosave Logic - Every 30 seconds
  useEffect(() => {
    const autosaveInterval = setInterval(() => {
      if (profile.customContext !== lastSavedRef.current) {
        performSave();
      }
    }, 30000);

    return () => clearInterval(autosaveInterval);
  }, [profile.customContext]);

  const performSave = () => {
    setSaveStatus('saving');
    localStorage.setItem(STORAGE_KEY, profile.customContext);
    lastSavedRef.current = profile.customContext;
    
    // Smooth transition between status states
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 600);
  };

  const handleGenerate = async () => {
    if (profile.skills.length === 0) {
      alert("Please select at least one skill to forge an idea.");
      return;
    }
    setLoadingIdea(true);
    setCurrentStep(0);
    try {
      const idea = await generateHackathonIdea(profile);
      setGeneratedIdea(idea);
      setTimeout(() => {
        document.getElementById('idea-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch (e) {
      console.error("Error generating idea", e);
      alert("Something went wrong during generation. Please try again.");
    } finally {
      setLoadingIdea(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleInterest = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest) 
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const applyTemplate = (text: string) => {
    setProfile(prev => ({
      ...prev,
      customContext: prev.customContext ? `${prev.customContext}\n\n${text}` : text
    }));
  };

  const renderHome = () => (
    <div className="max-w-6xl mx-auto space-y-24 pb-24">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-12">
        <div className="inline-block bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full text-indigo-400 text-xs font-black uppercase tracking-[0.3em] mb-4">
          Powered by Gemini 3 Native Reasoning
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] text-white">
          FORGE YOUR<br /><span className="bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">LEGACY.</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
          Don't just build. Build what matters. Our engine synthesizes your DNA with real-time market needs to create winning project blueprints across Software, Electronics, and Mechanical domains.
        </p>
      </section>

      {/* Quick Trends Carousel */}
      <TrendPanel trends={trends} loading={loadingTrends} />

      {/* Main Generator Section */}
      <div className="space-y-12">
        <div className="glass p-1 md:p-12 rounded-[3.5rem] relative overflow-hidden border border-white/5">
          <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-indigo-600/10 blur-[120px] pointer-events-none" />
          
          {loadingIdea && (
            <div className="absolute inset-0 z-30 bg-slate-900/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
              <div className="relative w-24 h-24 mb-10">
                <div className="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin" />
                <div className="absolute inset-4 border-b-2 border-indigo-400 rounded-full animate-spin-slow" />
              </div>
              <div className="text-center space-y-4">
                <p className="text-2xl font-black text-white tracking-tight uppercase">
                  {LOADING_STEPS[currentStep]}
                </p>
                <div className="flex gap-1 justify-center">
                  {LOADING_STEPS.map((_, i) => (
                    <div key={i} className={`h-1 w-8 rounded-full transition-all duration-500 ${i === currentStep ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                  ))}
                </div>
                <p className="text-slate-500 text-xs font-bold tracking-widest uppercase">
                  Hyper-Parameter Tuning Active
                </p>
              </div>
            </div>
          )}

          <div className="relative z-10 p-8 md:p-0">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-black text-white flex items-center gap-4">
                <span className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-sm shadow-xl shadow-indigo-600/20 italic">01</span>
                Project Config
              </h2>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Gemini 3 Connected
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 space-y-10">
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Engineering & Dev Skills</label>
                  <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {AVAILABLE_SKILLS.map(skill => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`text-[10px] px-3 py-1.5 rounded-xl border font-bold transition-all ${
                          profile.skills.includes(skill)
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Market Domains</label>
                  <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {AVAILABLE_INTERESTS.map(interest => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`text-[10px] px-3 py-1.5 rounded-xl border font-bold transition-all ${
                          profile.interests.includes(interest)
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center justify-between ml-1">
                  <div className="flex items-center gap-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Custom Context & Nuance</label>
                    {/* Save Status Indicator */}
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        saveStatus === 'saving' ? 'bg-amber-500 animate-pulse' : 
                        saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-slate-700'
                      }`} />
                      <span className={`text-[8px] font-bold uppercase tracking-widest transition-opacity duration-300 ${
                        saveStatus === 'idle' ? 'opacity-30' : 'opacity-100'
                      } ${
                        saveStatus === 'saving' ? 'text-amber-500' : 
                        saveStatus === 'saved' ? 'text-emerald-500' : 'text-slate-600'
                      }`}>
                        {saveStatus === 'saving' ? 'Syncing...' : saveStatus === 'saved' ? 'Vault Updated' : 'Idle'}
                      </span>
                    </div>
                  </div>
                  <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                    {profile.customContext.length} / 2000
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {PROMPT_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        onClick={() => applyTemplate(tmpl.text)}
                        className="text-[9px] font-black bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 hover:border-indigo-500/30 text-indigo-400 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 group"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 group-hover:scale-125 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        {tmpl.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative group">
                    <textarea
                      value={profile.customContext}
                      onChange={(e) => setProfile(p => ({ ...p, customContext: e.target.value }))}
                      placeholder="Tell Gemini about your specific goals, hardware constraints, or mechanical themes..."
                      className="w-full h-[300px] bg-slate-950/40 border border-slate-800 group-hover:border-slate-700 rounded-[2rem] p-8 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none transition-all leading-relaxed font-medium scrollbar-hide"
                    />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                      <button 
                        onClick={() => setProfile(p => ({ ...p, customContext: '' }))}
                        className="p-2 bg-slate-900/80 hover:bg-rose-500/10 rounded-xl text-slate-600 hover:text-rose-400 transition-all border border-white/5 backdrop-blur-md"
                        title="Clear Context"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button 
                        onClick={performSave}
                        className="p-2 bg-slate-900/80 hover:bg-indigo-500/10 rounded-xl text-slate-600 hover:text-indigo-400 transition-all border border-white/5 backdrop-blur-md"
                        title="Manual Save"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 flex flex-col justify-between">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Difficulty Level</label>
                    <div className="grid grid-cols-1 gap-2">
                      {['Beginner', 'Intermediate', 'Expert'].map((level) => (
                        <button
                          key={level}
                          onClick={() => setProfile(p => ({ ...p, experienceLevel: level as any }))}
                          className={`px-6 py-4 rounded-2xl text-sm font-bold border transition-all ${
                            profile.experienceLevel === level
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Timebox</label>
                    <select 
                      value={profile.timeConstraint}
                      onChange={(e) => setProfile(p => ({ ...p, timeConstraint: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none text-slate-300"
                    >
                      <option>12 hours</option>
                      <option>24 hours</option>
                      <option>48 hours</option>
                      <option>72 hours</option>
                      <option>1 week</option>
                    </select>
                  </div>
                </div>

                <div className="pt-12">
                  <button
                    onClick={handleGenerate}
                    disabled={loadingIdea}
                    className="w-full py-6 rounded-2xl font-black text-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_20px_40px_-15px_rgba(79,70,229,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    FORGE PROJECT
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div id="idea-result" className="min-h-[100px] transition-all duration-1000">
          {generatedIdea && !loadingIdea && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-sm shadow-xl shadow-indigo-600/20 italic">02</span>
                <h2 className="text-3xl font-black text-white">Forged Blueprint</h2>
              </div>
              <IdeaCard idea={generatedIdea} />
            </div>
          )}
          
          {!generatedIdea && !loadingIdea && (
            <div className="text-center py-32 border-2 border-dashed border-slate-800 rounded-[3rem] bg-slate-900/20">
              <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-sm">Waiting for input...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(currentView) {
      case 'trends': return <ExploreTrends trends={trends} loading={loadingTrends} />;
      case 'stories': return <SuccessStories />;
      case 'docs': return <ApiDocs />;
      case 'login': return <Login onLogin={() => { setIsLoggedIn(true); setCurrentView('home'); }} />;
      default: return renderHome();
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      setView={setCurrentView} 
      isLoggedIn={isLoggedIn}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
