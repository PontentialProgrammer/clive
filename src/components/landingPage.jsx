import { Wind, Leaf, Droplets, ArrowRight } from 'lucide-react';
import { SignUpButton, SignedOut, SignedIn } from "@clerk/clerk-react";
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';


export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-emerald-50 flex flex-col items-center p-6 pt-8">
        
        {/* HERO SECTION */}
        <div className="max-w-4xl text-center mb-16 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
            <Leaf size={16} />
            <span>Personal & Professional Climate Action</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            Optimize Your Space for <br />
            <span className="text-emerald-600">Resilience & Carbon Sequestration</span>
        </h1>
        
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Whether it's your backyard or a city block, our engine uses <strong>Gemini 3 Vision </strong> 
             to analyze terrain and suggest high-impact nature-based solutions.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <SignedOut>
            <SignUpButton mode="modal">
                <button
                 className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-200">
                    Start Your Audit 
                 <ArrowRight size={20} />
                </button>
            </SignUpButton>
            </SignedOut>
            
            <SignedIn>
            {/* This link would point to your future /audit-dashboard page */}
            <button 
                 onClick={() => {
                    navigate('/dashboard')
                }}
                className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all shadow-lg">
                Go to Audit Dashboard <ArrowRight size={20} />
            </button>
            </SignedIn>
        </div>
        </div>

        {/* FEATURE CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          {/* Card 1: Flood Mitigation */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-emerald-100 flex items-start gap-5 text-left hover:border-emerald-300 transition-colors">
            <div className="bg-emerald-100 p-4 rounded-2xl">
              <Droplets className="text-emerald-600" size={28} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xl">Flood Mitigation</h3>
              <p className="text-slate-600 leading-relaxed mt-2">
                Identify hyper-local runoff risks using high-resolution terrain data. 
                Place bioswales precisely where they intercept the most water.
              </p>
            </div>
          </div>

          {/* Card 2: Carbon Sink */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-emerald-100 flex items-start gap-5 text-left hover:border-emerald-300 transition-colors">
            <div className="bg-emerald-100 p-4 rounded-2xl">
              <Wind className="text-emerald-600" size={28} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xl">Active Carbon Sink</h3>
              <p className="text-slate-600 leading-relaxed mt-2 mb-3">
                Quantify your neighborhood's sequestration. High-efficiency vegetation offsets 
                up to <strong>0.31 kg C/m²/yr</strong>.
              </p>
              <span className="inline-flex items-center text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full uppercase tracking-wider">
                +2.5°C Cooling Effect
              </span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}