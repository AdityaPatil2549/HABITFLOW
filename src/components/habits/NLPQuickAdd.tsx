import { useState, useMemo, useEffect, useRef } from 'react';
import { nlpParserService } from '@/services/nlpParserService';
import type { ParsedHabitIntent, Habit } from '@/types';
import { Wand2, Clock, Calendar, Target, Tag, Check, X, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicIcon } from '../ui/DynamicIcon';

interface Props {
  onHabitCreated: (habit: Partial<Habit>) => void;
  onClose: () => void;
}

const FREQ_LABELS: Record<string, string> = {
  daily: 'Every Day',
  weekly: 'Weekly',
  custom: 'Custom',
};

const CATEGORY_COLORS: Record<string, string> = {
  health: 'bg-emerald-500/20 text-emerald-400',
  mindfulness: 'bg-purple-500/20 text-purple-400',
  learning: 'bg-blue-500/20 text-blue-400',
  productivity: 'bg-amber-500/20 text-amber-400',
  social: 'bg-pink-500/20 text-pink-400',
  general: 'bg-slate-500/20 text-slate-400',
};

const CATEGORY_ICONS: Record<string, string> = {
  health: '💪',
  mindfulness: '🧘',
  learning: '📚',
  productivity: '⚡',
  social: '👋',
  general: '✨',
};

export function NLPQuickAdd({ onHabitCreated, onClose }: Props) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [hasRecognition, setHasRecognition] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setInput(finalTranscriptRef.current + interimTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setTimeout(() => setHasRecognition(true), 0);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      finalTranscriptRef.current = input ? input + ' ' : '';
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Speech recognition already started', e);
      }
    }
  };

  const parsed = useMemo<ParsedHabitIntent | null>(() => {
    if (input.trim().length < 3) return null;
    return nlpParserService.parseHabitIntent(input);
  }, [input]);

  const confidenceColor = !parsed
    ? 'bg-slate-500/20'
    : parsed.confidence >= 0.7
      ? 'bg-emerald-500/20'
      : parsed.confidence >= 0.4
        ? 'bg-amber-500/20'
        : 'bg-red-500/20';

  const confidenceText = !parsed
    ? ''
    : parsed.confidence >= 0.7
      ? 'text-emerald-400'
      : parsed.confidence >= 0.4
        ? 'text-amber-400'
        : 'text-red-400';

  function handleCreate() {
    if (!parsed) return;
    const habit: Partial<Habit> = {
      name: parsed.name,
      icon: parsed.icon || CATEGORY_ICONS[parsed.category || 'general'] || '✨',
      color: '#6366f1',
      category: parsed.category || 'general',
      type: parsed.type,
      frequency: parsed.frequency,
      frequencyDays: parsed.frequencyDays,
      frequencyInterval: parsed.frequencyInterval,
      targetValue: parsed.targetValue,
      unit: parsed.unit,
      reminderTime: parsed.reminderTime,
    };
    onHabitCreated(habit);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Wand2 size={16} className="text-purple-400" />
          <span className="text-xs font-bold text-white">Smart Add</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Input */}
      <div className="px-4 pb-3 relative">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder='Try: "Read 20 pages every night at 9 PM"'
          autoFocus
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/40 transition-all"
          onKeyDown={e => {
            if (e.key === 'Enter' && parsed) handleCreate();
          }}
        />
        {hasRecognition && (
          <button
            onClick={toggleListening}
            className={`absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
              isListening
                ? 'bg-red-500/20 text-red-400 animate-pulse'
                : 'hover:bg-white/10 text-slate-400 hover:text-white'
            }`}
            title={isListening ? 'Stop listening' : 'Start listening'}
          >
            <Mic size={16} />
          </button>
        )}
      </div>

      {/* Preview */}
      <AnimatePresence>
        {parsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/5"
          >
            <div className="px-4 py-3 space-y-3">
              {/* Parsed name */}
              <div className="flex items-center gap-2">
                <DynamicIcon tiltIntensity={15} size={24} interactive={true}>
                  <span className="text-lg">{CATEGORY_ICONS[parsed.category || 'general']}</span>
                </DynamicIcon>
                <span className="text-sm font-bold text-white">{parsed.name}</span>
              </div>

              {/* Pills */}
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${CATEGORY_COLORS[parsed.category || 'general']}`}
                >
                  <Tag size={10} />
                  {parsed.category || 'general'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-blue-500/20 text-blue-400">
                  <Calendar size={10} />
                  {FREQ_LABELS[parsed.frequency]}
                  {parsed.frequencyDays &&
                    ` (${parsed.frequencyDays.map(d => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d]).join(', ')})`}
                  {parsed.frequencyInterval && ` (every ${parsed.frequencyInterval} days)`}
                </span>
                {parsed.reminderTime && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-500/20 text-amber-400">
                    <Clock size={10} />
                    {parsed.reminderTime}
                  </span>
                )}
                {parsed.type !== 'boolean' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                    <Target size={10} />
                    {parsed.targetValue} {parsed.unit || (parsed.type === 'duration' ? 'min' : '')}
                  </span>
                )}
              </div>

              {/* Confidence bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${parsed.confidence * 100}%` }}
                    className={`h-full rounded-full ${confidenceColor.replace('/20', '/60')}`}
                  />
                </div>
                <span className={`text-[10px] font-bold ${confidenceText}`}>
                  {Math.round(parsed.confidence * 100)}%
                </span>
              </div>

              {/* Create button */}
              <button
                onClick={handleCreate}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-bold hover:shadow-lg hover:shadow-purple-500/20 transition-all active:scale-[0.98]"
              >
                <Check size={16} />
                Create Habit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
