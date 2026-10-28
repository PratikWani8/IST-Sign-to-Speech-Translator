import React from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  Square,
  Sliders,
  Globe,
  Gauge,
} from 'lucide-react';

export const SpeechControls = ({
  isSupported,
  voices = [],
  selectedVoice,
  onVoiceChange,
  selectedLang,
  onLangChange,
  rate = 1.0,
  onRateChange,
  isSpeaking,
  isPaused,
  onSpeak,
  onPause,
  onResume,
  onStop,
  currentText = '',
}) => {
  if (!isSupported) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
        <VolumeX className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Speech synthesis is not supported on this browser. Text will remain displayed visually.</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-emerald-700" />
          <h3 className="font-semibold text-slate-900 text-sm">Speech Audio Synthesis</h3>
        </div>

        {/* State Pill */}
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            isSpeaking
              ? 'bg-emerald-100 text-emerald-800 animate-pulse'
              : isPaused
              ? 'bg-amber-100 text-amber-800'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {isSpeaking ? 'Speaking Now' : isPaused ? 'Audio Paused' : 'Ready'}
        </span>
      </div>

      {/* Voice & Language Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Voice Select */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <Globe className="w-3 h-3 text-slate-400" />
            Synthesizer Voice
          </label>
          <select
            value={selectedVoice ? selectedVoice.name : ''}
            onChange={(e) => {
              const v = voices.find((item) => item.name === e.target.value);
              if (v) onVoiceChange(v);
            }}
            className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
          >
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>

        {/* Rate Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
            <span className="flex items-center gap-1">
              <Gauge className="w-3 h-3 text-slate-400" />
              Speaking Speed
            </span>
            <span className="font-mono text-emerald-700">{rate}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.75"
            step="0.05"
            value={rate}
            onChange={(e) => onRateChange(parseFloat(e.target.value))}
            className="w-full accent-emerald-700 cursor-pointer"
          />
        </div>
      </div>

      {/* Playback Transport Buttons */}
      <div className="flex items-center justify-center gap-2 pt-1">
        {!isSpeaking && !isPaused && (
          <button
            onClick={() => onSpeak(currentText)}
            disabled={!currentText || currentText.trim() === ''}
            className="flex-1 py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Play className="w-3.5 h-3.5" />
            Play Audio
          </button>
        )}

        {isSpeaking && (
          <button
            onClick={onPause}
            className="flex-1 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause
          </button>
        )}

        {isPaused && (
          <button
            onClick={onResume}
            className="flex-1 py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Resume
          </button>
        )}

        {(isSpeaking || isPaused) && (
          <button
            onClick={onStop}
            className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Square className="w-3.5 h-3.5 text-slate-500" />
            Stop
          </button>
        )}
      </div>
    </div>
  );
};
