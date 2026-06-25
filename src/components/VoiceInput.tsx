import React, { useState, useEffect, useRef } from "react";
import { Mic, VolumeX, AlertCircle, Sparkles, Loader2, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VoiceInputProps {
  onTranscriptionComplete: (text: string) => void;
  isLoading: boolean;
}

export default function VoiceInput({ onTranscriptionComplete, isLoading }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [supportSpeech, setSupportSpeech] = useState(true);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSupportSpeech(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false; // Stop listening automatically on pause
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setErrorMessage(null);
    };

    rec.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const activeText = finalTranscript || interimTranscript;
      setTranscript(activeText);
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error:", event);
      setIsListening(false);
      
      if (event.error === "not-allowed") {
        setErrorMessage("Microphone access was denied. Please allow mic permissions in your browser.");
      } else if (event.error === "no-speech") {
        setErrorMessage("No speech was detected. Please try speaking slowly again.");
      } else {
        setErrorMessage(`Voice recognition failed: ${event.error}`);
      }
    };

    rec.onend = () => {
      setIsListening(false);
      // Wait for a brief moment then fire callback if we got text
      setTranscript((prev) => {
        const cleanText = prev.trim();
        if (cleanText) {
          onTranscriptionComplete(cleanText);
        }
        return prev;
      });
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscriptionComplete]);

  const toggleListening = () => {
    if (!supportSpeech) {
      // Simulate standard speech detection for testing or when using in incompatible frames/browsers
      simulateSpeech();
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        setTranscript("");
        setErrorMessage(null);
        recognitionRef.current.start();
      } catch (err: any) {
        console.error("Voice start error", err);
        setErrorMessage("Speech instance busy. Try again in a second.");
        setIsListening(false);
      }
    }
  };

  // Graceful simulation fallback for iframe environments where mic access might be blocked by iframe permissions
  const simulateSpeech = () => {
    setIsListening(true);
    setTranscript("Simulating microphone...");
    setErrorMessage(null);

    const simulationSymptomOptions = [
      "I have severe burns on my arm from boiling water",
      "Someone is choking on food and cannot breathe",
      "Possible leg fracture from sliding downstairs",
      "Heavy bleeding cut on the hand",
      "Suspected heart attack, crushing chest pain",
      "Stung by a swarm of wasps and feels dizzy",
    ];

    const chosen = simulationSymptomOptions[Math.floor(Math.random() * simulationSymptomOptions.length)];

    let currentLength = 0;
    const interval = setInterval(() => {
      currentLength += Math.ceil(Math.random() * 3) + 1;
      if (currentLength >= chosen.length) {
        clearInterval(interval);
        setTranscript(chosen);
        setIsListening(false);
        onTranscriptionComplete(chosen);
      } else {
        setTranscript(chosen.substring(0, currentLength) + "...");
      }
    }, 150);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-blue-50/40 rounded-2xl border border-blue-100/50">
      <div className="flex items-center gap-4">
        {/* Record Button Container */}
        <div className="relative">
          <AnimatePresence>
            {isListening && (
              <>
                <motion.span
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                  className="absolute inset-0 bg-blue-500 rounded-full"
                />
                <motion.span
                  initial={{ scale: 0.8, opacity: 0.3 }}
                  animate={{ scale: 1.9, opacity: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.4 }}
                  className="absolute inset-0 bg-blue-400 rounded-full"
                />
              </>
            )}
          </AnimatePresence>

          <button
            onClick={toggleListening}
            disabled={isLoading}
            className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200"
                : "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white shadow-md shadow-blue-100"
            }`}
            title={supportSpeech ? "Tap to record emergency description" : "Simulate emergency voice input"}
          >
            {isListening ? (
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <div className="flex gap-0.5 items-center justify-center">
                  <span className="w-1 h-4 bg-white rounded-full animate-bounce duration-300" />
                  <span className="w-1 h-6 bg-white rounded-full animate-bounce duration-500" />
                  <span className="w-1 h-3 bg-white rounded-full animate-bounce duration-200" />
                </div>
              </motion.div>
            ) : isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        </div>

        <div>
          <h4 className="font-semibold text-slate-800 text-sm">
            {isListening ? "Listening closely..." : "Tap to speak symptoms"}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {isListening
              ? "Tell us what happened..."
              : supportSpeech
              ? "Use your mic to describe symptoms in detail"
              : "Microphone blocked or not supported on iframe. Click to simulate."}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full mt-4 p-3 bg-white border border-blue-50/80 rounded-xl text-center select-none"
          >
            <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Transcribed Voice Input
            </span>
            <p className="text-sm font-medium text-slate-700 italic mt-1 leading-relaxed">
              "{transcript}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full mt-4 p-3 bg-amber-50 border border-amber-200/50 rounded-xl text-amber-800 flex items-start gap-2 text-xs"
          >
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Speech Alert</p>
              <p className="mt-0.5 text-amber-700">{errorMessage}</p>
              {!supportSpeech && (
                <button
                  onClick={simulateSpeech}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 underline"
                >
                  <Play className="w-3 h-3" /> Simulate emergency symptom anyway
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
