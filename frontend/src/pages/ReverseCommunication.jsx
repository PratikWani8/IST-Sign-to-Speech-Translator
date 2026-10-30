import React, { useState, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { vocabularyService } from '../services/api';
import { SignDemonstration } from '../components/SignDemonstration';
import {
  Mic,
  MicOff,
  Send,
  RotateCcw,
  BookOpen,
  Eye,
  Type,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

export const ReverseCommunication = () => {
  const {
    isSupported: isSpeechRecSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const [inputText, setInputText] = useState('');
  const [displayedMessage, setDisplayedMessage] = useState(
    'HELLO. WELCOME TO OUR HOSPITAL. PLEASE TAKE TOKEN NUMBER 4.'
  );
  const [vocabularyMap, setVocabularyMap] = useState({});
  const [selectedSign, setSelectedSign] = useState(null);
  const [matchingTokens, setMatchingTokens] = useState([]);

  // Fetch verified vocabulary for sign lookup
  useEffect(() => {
    const fetchVocab = async () => {
      try {
        const res = await vocabularyService.getVocabulary();
        if (res.success && res.vocabulary) {
          const map = {};
          res.vocabulary.forEach((item) => {
            map[item.id.toUpperCase()] = item;
          });
          setVocabularyMap(map);
        }
      } catch (err) {
        console.warn('Failed to load vocabulary for reverse mode:', err);
      }
    };
    fetchVocab();
  }, []);

  // Update input text when speech recognition captures speech
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  // Parse matching signs from displayed message
  useEffect(() => {
    if (!displayedMessage) {
      setMatchingTokens([]);
      return;
    }

    const chars = displayedMessage.toUpperCase().split('');
    const tokens = [];

    chars.forEach((ch, idx) => {
      if (ch === ' ') {
        tokens.push({ char: 'SPACE', isSpace: true, id: `space_${idx}` });
      } else if (vocabularyMap[ch]) {
        tokens.push({
          char: ch,
          isSign: true,
          signData: vocabularyMap[ch],
          id: `${ch}_${idx}`,
        });
      } else {
        tokens.push({ char: ch, isSign: false, id: `char_${idx}` });
      }
    });

    setMatchingTokens(tokens);

    // Auto-select first verified sign if none selected
    const firstSign = tokens.find((t) => t.isSign);
    if (firstSign && !selectedSign) {
      setSelectedSign(firstSign.signData);
    }
  }, [displayedMessage, vocabularyMap]);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputText || inputText.trim() === '') return;
    setDisplayedMessage(inputText.trim().toUpperCase());
    setInputText('');
    resetTranscript();
    if (isListening) stopListening();
  };

  const quickPhrases = [
    'PLEASE SIT HERE',
    'DOCTOR IS IN ROOM 2',
    'ENTER YOUR PIN DIGIT 4',
    'GO TO COUNTER B',
    'BLOOD GROUP A',
    'THANK YOU',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Reverse Communication Mode
          </h1>
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
            Hearing to Deaf Signer
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Hearing staff can speak or type responses to communicate clearly with deaf signers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Hearing Staff Input Controls */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Type className="w-4 h-4 text-emerald-700" />
                Hearing Staff Response Input
              </h3>

              {isSpeechRecSupported && (
                <span className="text-xs text-slate-500">Voice or text input</span>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3">
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message or tap the microphone to speak..."
                  rows={3}
                  className="w-full p-4 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-900 text-sm focus:outline-hidden resize-none"
                />

                {isListening && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-md animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    Listening...
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                {isSpeechRecSupported && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs transition-colors ${
                      isListening
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        Stop Voice Input
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-slate-500" />
                        Speak via Microphone
                      </>
                    )}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  Display to Signer
                </button>
              </div>
            </form>

            {/* Quick Common Responses */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Common Desk Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickPhrases.map((phrase) => (
                  <button
                    key={phrase}
                    onClick={() => {
                      setDisplayedMessage(phrase);
                      setInputText('');
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 text-slate-700 transition-colors"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sign Demonstration Guide */}
          <SignDemonstration sign={selectedSign} />
        </div>

        {/* Right Column: High-Contrast Display for Deaf Signer */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-6 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Display for Deaf Signer
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">High-Contrast Mode</span>
            </div>

            {/* Large High-Contrast Text */}
            <div className="min-h-[140px] flex items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <h2 className="text-2xl sm:text-3xl font-black text-amber-300 text-center tracking-wide leading-relaxed">
                {displayedMessage || 'AWAITING RESPONSE...'}
              </h2>
            </div>

            {/* Verified Sign Tokens Breakdown */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Verified ISL Sign Breakdown:
                </span>
                <span>Click any letter to view gesture</span>
              </div>

              <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                {matchingTokens.map((token) => {
                  if (token.isSpace) {
                    return <div key={token.id} className="w-4" />;
                  }
                  if (token.isSign) {
                    const isSelected = selectedSign && selectedSign.id === token.char;
                    return (
                      <button
                        key={token.id}
                        onClick={() => setSelectedSign(token.signData)}
                        className={`w-10 h-10 rounded-xl font-bold font-mono text-base flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-300 scale-105'
                            : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
                        }`}
                      >
                        {token.char}
                      </button>
                    );
                  }
                  return (
                    <div
                      key={token.id}
                      className="w-10 h-10 rounded-xl font-mono text-xs flex items-center justify-center bg-slate-900 text-slate-500"
                    >
                      {token.char}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
