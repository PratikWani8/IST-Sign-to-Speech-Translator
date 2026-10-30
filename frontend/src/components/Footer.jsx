import React from 'react';
import { ShieldCheck, Heart, Sparkles, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-lg">SanketISL</span>
              <span className="text-xs font-semibold bg-emerald-900/60 text-emerald-400 border border-emerald-700/50 px-2 py-0.5 rounded-full">
                AI Sign-to-Speech
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
              Bridging the communication barrier for deaf and hard-of-hearing signers across India.
              Powered by real-time computer vision and machine learning inference for Indian Sign Language (ISL).
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Camera frames are processed in-memory. No raw video is recorded or stored.</span>
            </div>
          </div>

          {/* Supported Contexts */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Key Scenarios</h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-slate-200 transition-colors">Hospitals & Healthcare</li>
              <li className="hover:text-slate-200 transition-colors">Banking & ATM Services</li>
              <li className="hover:text-slate-200 transition-colors">Government Service Centers</li>
              <li className="hover:text-slate-200 transition-colors">Education & Schools</li>
              <li className="hover:text-slate-200 transition-colors">Everyday Conversations</li>
            </ul>
          </div>

          {/* Model Architecture & Attribution */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Technology</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5">
                <span>ViT Transformer (ISL 35 Classes)</span>
              </li>
              <li>FastAPI Python Microservice</li>
              <li>Node.js / Express Gateway</li>
              <li>MongoDB Translation Ledger</li>
              <li>Browser Web SpeechSynthesis API</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SanketISL. Dedicated to accessible, dignifying communication.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for India's Deaf Community
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
