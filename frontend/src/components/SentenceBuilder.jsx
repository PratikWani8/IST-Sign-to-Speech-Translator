import React, { useState } from 'react';
import {
  Volume2,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Delete,
  Space,
  Edit3,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const SentenceBuilder = ({
  sentence,
  setSentence,
  onSpeak,
  isSpeaking,
  onUndo,
  canUndo,
  recognizedTokens = [],
  onAddToken,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleCopy = () => {
    if (!sentence || sentence.trim() === '') return;
    navigator.clipboard.writeText(sentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddSpace = () => {
    setSentence((prev) => (prev.endsWith(' ') ? prev : prev + ' '));
  };

  const handleBackspace = () => {
    setSentence((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setSentence('');
  };

  const quickPunctuation = ['.', ',', '?', '!'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
            Aa
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Sentence Construction Ledger</h3>
            <p className="text-xs text-slate-500">Confirmed ISL signs assembled into spoken phrase</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo last sign insertion"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg disabled:opacity-40 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            disabled={!sentence}
            title="Clear entire sentence"
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Sentence Output Display */}
      <div className="relative">
        {isEditing ? (
          <textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            onBlur={() => setIsEditing(false)}
            autoFocus
            rows={3}
            className="w-full p-4 rounded-xl border-2 border-emerald-500 bg-white text-slate-900 font-medium text-lg leading-relaxed focus:outline-hidden resize-none"
            placeholder="Type or sign to construct sentence..."
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="w-full min-h-[90px] p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-text transition-colors flex flex-col justify-between"
          >
            <div className="font-medium text-slate-900 text-lg leading-relaxed break-words">
              {sentence ? (
                sentence
              ) : (
                <span className="text-slate-400 italic text-base">
                  Sign in front of camera or click to enter text manually...
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400 pt-2">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Click to edit text</span>
            </div>
          </div>
        )}
      </div>

      {/* Helper Keys (Space, Backspace, Punctuation) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAddSpace}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium flex items-center gap-1.5 transition-colors"
          >
            <Space className="w-3.5 h-3.5" />
            Space
          </button>

          <button
            onClick={handleBackspace}
            disabled={!sentence}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium flex items-center gap-1.5 disabled:opacity-40 transition-colors"
          >
            <Delete className="w-3.5 h-3.5" />
            Backspace
          </button>

          {quickPunctuation.map((punct) => (
            <button
              key={punct}
              onClick={() => setSentence((prev) => prev + punct + ' ')}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
            >
              {punct}
            </button>
          ))}
        </div>

        {/* Quick Words for common scenarios */}
        <div className="flex items-center gap-1">
          {['HELP', 'YES', 'NO', 'THANK YOU'].map((word) => (
            <button
              key={word}
              onClick={() => setSentence((prev) => (prev ? prev + ' ' + word : word))}
              className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200/60 transition-colors"
            >
              +{word}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={handleCopy}
          disabled={!sentence}
          className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Copied to Clipboard</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Copy Text</span>
            </>
          )}
        </button>

        <button
          onClick={() => onSpeak(sentence)}
          disabled={!sentence || isSpeaking}
          className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
        >
          <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`} />
          <span>{isSpeaking ? 'Speaking...' : 'Speak Aloud'}</span>
        </button>
      </div>
    </div>
  );
};
