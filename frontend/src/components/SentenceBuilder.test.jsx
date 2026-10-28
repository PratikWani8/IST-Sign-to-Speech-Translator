import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SentenceBuilder } from './SentenceBuilder';

describe('SentenceBuilder Component', () => {
  it('renders correctly with an empty sentence placeholder', () => {
    render(
      <SentenceBuilder
        sentence=""
        setSentence={() => {}}
        onSpeak={() => {}}
        isSpeaking={false}
        onUndo={() => {}}
        canUndo={false}
      />
    );
    expect(screen.getByText(/Sentence Construction Ledger/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign in front of camera/i)).toBeInTheDocument();
  });

  it('displays the constructed sentence', () => {
    render(
      <SentenceBuilder
        sentence="DOCTOR IN ROOM 4"
        setSentence={() => {}}
        onSpeak={() => {}}
        isSpeaking={false}
        onUndo={() => {}}
        canUndo={true}
      />
    );
    expect(screen.getByText('DOCTOR IN ROOM 4')).toBeInTheDocument();
  });

  it('calls onSpeak when Speak Aloud button is clicked', () => {
    const handleSpeak = vi.fn();
    render(
      <SentenceBuilder
        sentence="HELP NEEDED"
        setSentence={() => {}}
        onSpeak={handleSpeak}
        isSpeaking={false}
        onUndo={() => {}}
        canUndo={true}
      />
    );

    const speakButton = screen.getByRole('button', { name: /Speak Aloud/i });
    fireEvent.click(speakButton);
    expect(handleSpeak).toHaveBeenCalledWith('HELP NEEDED');
  });

  it('triggers quick word insertion', () => {
    const handleSetSentence = vi.fn();
    render(
      <SentenceBuilder
        sentence=""
        setSentence={handleSetSentence}
        onSpeak={() => {}}
        isSpeaking={false}
        onUndo={() => {}}
        canUndo={false}
      />
    );

    const helpQuickBtn = screen.getByRole('button', { name: /\+HELP/i });
    fireEvent.click(helpQuickBtn);
    expect(handleSetSentence).toHaveBeenCalled();
  });
});
