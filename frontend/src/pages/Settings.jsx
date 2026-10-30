import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/api';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Volume2,
  Check,
  AlertCircle,
  Cpu,
  Info,
  Server,
  Activity,
} from 'lucide-react';

export const Settings = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [preferredSpeechLanguage, setPreferredSpeechLanguage] = useState(
    user?.preferredSpeechLanguage || 'en-IN'
  );
  const [saveHistoryEnabled, setSaveHistoryEnabled] = useState(
    user?.saveHistoryEnabled !== undefined ? user.saveHistoryEnabled : true
  );

  const [modelInfo, setModelInfo] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      if (user.preferredSpeechLanguage) setPreferredSpeechLanguage(user.preferredSpeechLanguage);
      if (user.saveHistoryEnabled !== undefined) setSaveHistoryEnabled(user.saveHistoryEnabled);
    }
  }, [user]);

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        const [info, health] = await Promise.all([
          aiService.getModelInfo(),
          aiService.getHealth(),
        ]);
        setModelInfo(info);
        setHealthStatus(health);
      } catch (err) {
        console.warn('Diagnostics fetch warning:', err);
      }
    };
    fetchDiagnostics();
  }, []);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updateProfile({
        name,
        preferredSpeechLanguage,
        saveHistoryEnabled,
      });
      setSuccessMessage('Preferences updated successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-emerald-800" />
          System Settings & Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your account preferences, speech synthesis settings, and AI microservice parameters
        </p>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Preferences Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-emerald-700" />
            User Preferences
          </h2>

          <form onSubmit={handleSavePreferences} className="space-y-4 text-xs sm:text-sm">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Account Email</label>
              <input
                type="email"
                disabled
                value={user?.email || 'Guest User'}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Default Speech Accent / Language</label>
              <select
                value={preferredSpeechLanguage}
                onChange={(e) => setPreferredSpeechLanguage(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              >
                <option value="en-IN">Indian English (en-IN)</option>
                <option value="hi-IN">Hindi (hi-IN)</option>
                <option value="en-US">US English (en-US)</option>
                <option value="en-GB">UK English (en-GB)</option>
              </select>
            </div>

            {/* Privacy: Toggle Save History */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-700" />
                    Archive Translation History
                  </div>
                  <p className="text-slate-500 text-xs leading-normal">
                    When enabled, confirmed translations are securely stored in your personal account ledger.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={saveHistoryEnabled}
                  onChange={(e) => setSaveHistoryEnabled(e.target.checked)}
                  className="mt-1 rounded-sm text-emerald-700 focus:ring-emerald-600 w-4 h-4"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving Changes...' : 'Save Preferences'}
            </button>
          </form>
        </div>

        {/* AI Microservice Diagnostics */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Cpu className="w-4 h-4 text-emerald-700" />
            AI Microservice Diagnostics
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Service Status:</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {healthStatus?.status?.toUpperCase() || 'ONLINE'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Checkpoint Model:</span>
              <span className="font-mono font-medium text-slate-900">
                {modelInfo?.model_name || 'Hemg/Indian-sign-language-classification'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Architecture:</span>
              <span className="font-medium text-slate-900 text-right">
                Vision Transformer (ViT-Base-16)
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Inference Hardware:</span>
              <span className="font-mono font-bold text-emerald-800 uppercase">
                {modelInfo?.inference_device || 'CPU'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Supported Vocabulary:</span>
              <span className="font-semibold text-slate-900">
                {modelInfo?.supported_vocabulary_count || 35} Classes (A-Z, 1-9)
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Input Geometry:</span>
              <span className="font-mono text-slate-900">224 x 224 RGB</span>
            </div>

            {/* Model Limitations Disclosure */}
            <div className="pt-2 space-y-1">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Operational Constraints:
              </span>
              <ul className="list-disc pl-4 space-y-1 text-slate-500 text-[11px] leading-relaxed">
                <li>Requires adequate ambient lighting and steady hand alignment.</li>
                <li>Isolated static fingerspelling; dynamic phrases use multi-frame temporal confirmation.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
