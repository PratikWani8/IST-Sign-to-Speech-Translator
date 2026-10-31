import '@testing-library/jest-dom';

// Polyfill window.speechSynthesis for test environment
if (typeof window !== 'undefined') {
  window.speechSynthesis = {
    speak: () => {},
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    getVoices: () => [
      { name: 'Indian English', lang: 'en-IN' },
      { name: 'Hindi', lang: 'hi-IN' },
    ],
  };

  window.SpeechSynthesisUtterance = function (text) {
    this.text = text;
    this.lang = 'en-IN';
    this.rate = 1;
    this.pitch = 1;
  };
}
