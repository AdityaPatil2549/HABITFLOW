import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Check, Share2, Flame, Target, CheckCircle2, Zap } from 'lucide-react';
import { toPng } from 'html-to-image';
import { soundService } from '../../../services/soundService';
import { useToast } from '../../common/Toast';
import { cn } from '../../../lib/utils';

interface MilestoneShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  avatarUrl?: string;
  score: number;
  headline: string;
  habitsCompleted: number;
  tasksCompleted: number;
  bestStreak: number;
  weeklyXp: number;
  weekLabel: string;
}

export function MilestoneShareModal({
  isOpen,
  onClose,
  userName,
  avatarUrl,
  score,
  headline,
  habitsCompleted,
  tasksCompleted,
  bestStreak,
  weeklyXp,
  weekLabel,
}: MilestoneShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#08090c',
      });
      soundService.playStreakMilestone();
      const link = document.createElement('a');
      link.download = `habitflow-milestone-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Retrospective milestone image downloaded.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export image.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyText = () => {
    const text = `📊 HabitFlow Weekly Retrospective (${weekLabel})\n• Score: ${score}%\n• Habits Completed: ${habitsCompleted}\n• Tasks Done: ${tasksCompleted}\n• Best Streak: ${bestStreak} days\n• XP Earned: +${weeklyXp} XP\nBuilt with 100% offline precision.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    soundService.playTick();
    toast.success('Retrospective summary copied to clipboard.');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg rounded-2xl bg-[#0b0c10] border border-white/[0.08] shadow-2xl p-6 relative flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} />
          </button>

          <h3 className="text-base font-bold text-white mb-1">
            Export Retrospective Artifact
          </h3>
          <p className="text-xs text-slate-400 mb-6 font-mono">
            High-contrast visual card ready for sharing or archive.
          </p>

          {/* Render Target for html-to-image */}
          <div
            ref={cardRef}
            className="p-6 rounded-2xl bg-[#08090c] border border-white/[0.1] relative overflow-hidden shadow-2xl"
          >
            {/* Ambient hairline gradient */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-purple-500 to-amber-500" />

            {/* Header: User & Brand */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-emerald-400 p-[1px]">
                  <div className="w-full h-full rounded-full bg-[#08090c] flex items-center justify-center text-sm font-bold text-white uppercase">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={userName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      userName.charAt(0) || 'H'
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{userName}</h4>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{weekLabel}</p>
                </div>
              </div>

              {/* Score Chip */}
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs">
                {score}% Velocity
              </div>
            </div>

            {/* Headline */}
            <div className="mb-6">
              <h5 className="text-lg font-black text-white tracking-tight leading-snug">
                {headline}
              </h5>
            </div>

            {/* Metrics 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono mb-1">
                  <Target size={13} className="text-emerald-400" />
                  <span>Habits Logged</span>
                </div>
                <div className="text-2xl font-mono font-bold text-white">
                  {habitsCompleted}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono mb-1">
                  <CheckCircle2 size={13} className="text-blue-400" />
                  <span>Tasks Finished</span>
                </div>
                <div className="text-2xl font-mono font-bold text-white">
                  {tasksCompleted}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono mb-1">
                  <Flame size={13} className="text-amber-400" />
                  <span>Best Streak</span>
                </div>
                <div className="text-2xl font-mono font-bold text-white">
                  {bestStreak}d
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono mb-1">
                  <Zap size={13} className="text-purple-400" />
                  <span>XP Acquired</span>
                </div>
                <div className="text-2xl font-mono font-bold text-purple-300">
                  +{weeklyXp}
                </div>
              </div>
            </div>

            {/* Footer Watermark */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 pt-3 border-t border-white/[0.04]">
              <span>HABITFLOW · HIGH VELOCITY DISCIPLINE</span>
              <span>100% IN-BROWSER</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={handleCopyText}
              className="px-4 py-2.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-slate-300 text-xs font-mono flex items-center gap-2 transition-all active:scale-95"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy Text'}
            </button>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs flex items-center gap-2 hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download size={14} />
              {isExporting ? 'Generating PNG...' : 'Download PNG'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
