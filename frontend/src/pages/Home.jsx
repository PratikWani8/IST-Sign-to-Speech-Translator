import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Hand,
  Volume2,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  HeartPulse,
  Landmark,
  Building2,
  GraduationCap,
  Sparkles,
  Camera,
  Activity,
  CheckCircle,
} from 'lucide-react';

export const Home = () => {
  const sectors = [
    {
      icon: HeartPulse,
      title: 'Hospitals & Healthcare',
      desc: 'Communicate blood groups (A, B, O), ward directions, medication spelling, and emergency symptoms without interpreter delays.',
    },
    {
      icon: Landmark,
      title: 'Banking & Financial Desks',
      desc: 'Verify PIN digits, account letters, token numbers, counter IDs, and KYC forms securely and independently.',
    },
    {
      icon: Building2,
      title: 'Government Service Centers',
      desc: 'Facilitate citizen services, Aadhaar/PAN character entry, queue tracking, and administrative queries.',
    },
    {
      icon: GraduationCap,
      title: 'Education & Classroom',
      desc: 'Spell academic terms, numbers, multiple-choice options (A-D), and facilitate inclusive classroom discussions.',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Webcam Stream Capture',
      desc: 'Local browser MediaDevices API captures clean camera frames without streaming full raw video to external storage.',
    },
    {
      step: '02',
      title: 'Vision Transformer Inference',
      desc: 'PyTorch ViT model processes frame patches and computes calibrated softmax probabilities across 35 verified ISL signs.',
    },
    {
      step: '03',
      title: 'Temporal Stability & Ledger',
      desc: 'Temporal cooldown deduplication filters transient noise and appends confirmed signs into the editable sentence builder.',
    },
    {
      step: '04',
      title: 'Natural Speech Output',
      desc: 'Browser SpeechSynthesis API synthesizes clear, natural Indian English and Hindi speech audio aloud for hearing listeners.',
    },
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI-Powered Indian Sign Language Translation</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]"
          >
            Giving Every Sign <br />
            <span className="text-emerald-800 underline decoration-emerald-300 decoration-wavy decoration-2">
              A Clear Spoken Voice
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal"
          >
            Deaf signers often face communication barriers in hospitals, banks, and public offices.
            SanketISL translates authentic Indian Sign Language gestures into text and natural spoken speech
            using verified computer vision models.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <Link
              to="/translator"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-base shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <Camera className="w-5 h-5" />
              Start Live Translation
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              to="/reverse"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-base transition-colors"
            >
              <Volume2 className="w-5 h-5 text-slate-500" />
              Reverse Hearing Mode
            </Link>
          </motion.div>

          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-200/80 max-w-xl mx-auto">
            <div>
              <div className="text-2xl font-bold text-slate-900">35 Signs</div>
              <div className="text-xs text-slate-500 font-medium">Verified ISL Vocabulary</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-800">Real-Time</div>
              <div className="text-xs text-slate-500 font-medium">ViT Inference Pipeline</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">Zero Cost</div>
              <div className="text-xs text-slate-500 font-medium">Free Client Speech API</div>
            </div>
          </div>
        </div>
      </section>

      {/* Real World Scenarios Section */}
      <section className="bg-white py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Engineered for High-Stakes Public Environments
            </h2>
            <p className="text-slate-600 text-sm">
              Standardized ISL fingerspelling and digits form the operational backbone across vital public sectors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sectors.map((sec, i) => {
              const Icon = sec.icon;
              return (
                <div
                  key={sec.title}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-emerald-300 hover:shadow-xs transition-all space-y-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-base">{sec.title}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{sec.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Architecture Pipeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            System Architecture
          </span>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">How the Translation Pipeline Operates</h2>
          <p className="text-slate-600 text-sm">
            End-to-end integration connecting webcam acquisition to deep Vision Transformers and speech synthesis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((wf) => (
            <div
              key={wf.step}
              className="relative p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
            >
              <span className="text-3xl font-black text-slate-200 font-mono">{wf.step}</span>
              <h3 className="font-semibold text-slate-900 text-base">{wf.title}</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{wf.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy and Accessibility Commitment */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-lg space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Privacy & Ethical AI Commitment</h3>
              <p className="text-xs text-slate-400">Respecting signer autonomy, dignity, and personal biometric data</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-300">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Frames are evaluated solely for sign classification and discarded immediately after prediction.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>No continuous raw video feeds or face recognition data are stored on disks or third parties.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Honest confidence reporting: Ambiguous gestures flag explicit uncertainty rather than guessing.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Accessible controls with keyboard shortcuts, screen-reader support, and speech adjustments.</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Link
              to="/translator"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-300 hover:text-emerald-200 transition-colors"
            >
              Open Live Translation Studio
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
