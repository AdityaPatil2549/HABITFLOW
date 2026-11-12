import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { aiCoachService } from '../../services/aiCoachService';
import { youtubeService } from '../../services/youtubeService';
import type { AIInsight } from '../../types';
import { Skeleton } from '../ui/Skeleton';
import { EmptyChart } from './shared';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';

export function AICoachInsightsTab() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      aiCoachService.getCoachInsights(),
      youtubeService.getMotivationalVideos('default'),
    ])
      .then(([insightsData, videosData]) => {
        if (isMounted) {
          setInsights(insightsData);
          setVideos(videosData);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load AI coach insights or videos:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (insights.length === 0 && videos.length === 0) {
    return (
      <EmptyChart
        message="No AI insights available right now"
        sub="Keep logging daily completions and check back soon for personalized recommendations."
      />
    );
  }

  return (
    <WidgetErrorBoundary title="AI Coach Recommendations">
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            ✨ AI Insights & Behavioral Guidance
          </h3>
          {insights.length === 0 ? (
            <p className="text-xs text-slate-500">No AI insights generated yet today.</p>
          ) : (
            insights.map(insight => (
              <div key={insight.id} className="p-4 flex gap-4 border border-white/10 bg-neutral-900/60 rounded-2xl">
                <div className="text-3xl select-none">{insight.icon}</div>
                <div>
                  <h4 className="font-bold text-white">{insight.title}</h4>
                  <p className="text-sm text-slate-300 mt-1 leading-relaxed">{insight.body}</p>
                  <span className="text-xs text-slate-500 mt-2 block font-mono">
                    {format(new Date(insight.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {videos.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              📺 Recommended Mindset & Flow Sessions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {videos.map(video => (
                <a
                  key={video.videoId}
                  href={youtubeService.getWatchUrl(video.videoId)}
                  target="_blank"
                  rel="noreferrer"
                  className="block group cursor-pointer"
                >
                  <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10 relative hover:border-emerald-500/40 transition-colors">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white pl-1 shadow-lg">
                        ▶
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-emerald-300 transition-colors">
                        {video.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">{video.channelTitle}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </WidgetErrorBoundary>
  );
}
