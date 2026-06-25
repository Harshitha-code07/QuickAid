import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Pause, Square, SkipForward, SkipBack, Info } from "lucide-react";
import { FirstAidGuide } from "../types";

interface AudioPlayerProps {
  guide: FirstAidGuide;
  activeStepIndex: number;
  setActiveStepIndex: (index: number) => void;
}

export default function AudioPlayer({ guide, activeStepIndex, setActiveStepIndex }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.92); // Slightly slower for crisp clear emergency instructions
  const [supportSpeech, setSupportSpeech] = useState(true);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!window.speechSynthesis) {
      setSupportSpeech(false);
    }

    return () => {
      // Clear speech on unmount
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop everything
  const stopSpeech = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  // Speak a specific step
  const speakStep = (index: number) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop active queue

    if (index >= guide.steps.length || index < 0) {
      stopSpeech();
      return;
    }

    const textToSpeak = `Step ${index + 1}: ${guide.steps[index]}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speechRate;
    
    // Attempt to select a calm voice if available on system
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google")) || 
                         voices.find(v => v.lang.startsWith("en"));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setActiveStepIndex(index);
    };

    utterance.onend = () => {
      // Advance automatically to the next step
      if (index + 1 < guide.steps.length) {
        speakStep(index + 1);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
      }
    };

    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePlayPause = () => {
    if (!window.speechSynthesis) return;

    if (isPlaying) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } else {
      speakStep(activeStepIndex);
    }
  };

  const handleNext = () => {
    if (activeStepIndex + 1 < guide.steps.length) {
      const nextIdx = activeStepIndex + 1;
      setActiveStepIndex(nextIdx);
      if (isPlaying) {
        speakStep(nextIdx);
      }
    }
  };

  const handlePrev = () => {
    if (activeStepIndex - 1 >= 0) {
      const prevIdx = activeStepIndex - 1;
      setActiveStepIndex(prevIdx);
      if (isPlaying) {
        speakStep(prevIdx);
      }
    }
  };

  // Re-speak step if speaking rate changes
  useEffect(() => {
    if (isPlaying && !isPaused) {
      speakStep(activeStepIndex);
    }
  }, [speechRate]);

  if (!supportSpeech) {
    return (
      <div className="p-4 bg-slate-55 border border-slate-200/50 rounded-2xl flex items-start gap-2.5 text-xs text-slate-500">
        <VolumeX className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
        <p>Speech synthesis is not supported on your browser. Please review instructions manually.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 md:p-6 shadow-inner">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center animate-pulse shadow-sm">
            {isPlaying && !isPaused ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-800">First Aid Voice Guide</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Listen to step-by-step spoken WHO instructions during high-stress moments.
            </p>
          </div>
        </div>

        {/* Speed Dial Controller */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Speech Tempo:</span>
          <select
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="text-xs bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="0.75">0.75x (Very Slow)</option>
            <option value="0.85">0.85x (Calming)</option>
            <option value="0.92">0.92x (Recommended)</option>
            <option value="1.0">1.00x (Normal)</option>
          </select>
        </div>
      </div>

      {/* Control Buttons Container */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        <button
          onClick={handlePrev}
          disabled={activeStepIndex === 0}
          className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-55 disabled:opacity-40 text-slate-700 transition"
          title="Previous Step"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={handlePlayPause}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition shadow-sm ${
            isPlaying && !isPaused
              ? "bg-slate-800 hover:bg-slate-900 border border-slate-900 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100"
          }`}
        >
          {isPlaying && !isPaused ? (
            <>
              <Pause className="w-4 h-4 text-white fill-white" />
              <span>{`Pause Step ${activeStepIndex + 1}`}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-white fill-white animate-pulse" />
              <span>{isPlaying ? "Resume Guide" : `Speak Step ${activeStepIndex + 1}`}</span>
            </>
          )}
        </button>

        <button
          onClick={stopSpeech}
          disabled={!isPlaying}
          className="flex items-center justify-center h-10 px-4 rounded-xl border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-40 transition"
          title="Stop Spoken Feedback"
        >
          <Square className="w-4 h-4 fill-rose-700 shrink-0 mr-1.5" />
          <span className="text-xs font-semibold">Stop</span>
        </button>

        <button
          onClick={handleNext}
          disabled={activeStepIndex === guide.steps.length - 1}
          className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-55 disabled:opacity-40 text-slate-700 transition"
          title="Next Step"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Active step readout indicator */}
      <div className="mt-5 p-3.5 bg-blue-50/50 border border-blue-50 rounded-2xl flex items-start gap-2.5 text-[11px] leading-relaxed text-blue-800">
        <Info className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
        <p>
          <span className="font-bold">Automated Loop:</span> Highlighting will automatically track the spoken voice. You can manual navigate step numbers to review precise instructions.
        </p>
      </div>
    </div>
  );
}
