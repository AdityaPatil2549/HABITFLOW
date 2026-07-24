/**
 * YouTube Data API v3 Service
 * Fetches habit-relevant motivational video recommendations for the AI Coach.
 * Requires VITE_YOUTUBE_API_KEY in .env.local
 */

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';
const YOUTUBE_SEARCH_BASE = 'https://www.googleapis.com/youtube/v3/search';

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
}

// Map habit categories to curated YouTube search queries
const CATEGORY_QUERIES: Record<string, string> = {
  health: 'healthy habits motivation 2024',
  fitness: 'workout motivation gym tips',
  mindfulness: 'meditation for beginners mindfulness',
  sleep: 'better sleep habits science',
  nutrition: 'healthy eating habits tips',
  learning: 'how to study effectively habits',
  productivity: 'productivity habits successful people',
  finance: 'personal finance habits money tips',
  social: 'building social habits confidence',
  creativity: 'creative habits daily practice',
  default: 'build good habits science motivation',
};

export const youtubeService = {
  isConfigured(): boolean {
    return !!YOUTUBE_API_KEY;
  },

  /**
   * Get motivational YouTube videos for a given habit category.
   * Results are cached in sessionStorage to avoid burning API quota.
   */
  async getMotivationalVideos(category: string, maxResults = 5): Promise<YouTubeVideo[]> {
    if (!YOUTUBE_API_KEY) {
      console.warn('[YouTube] API key not configured. Set VITE_YOUTUBE_API_KEY in .env.local');
      return [];
    }

    const query = CATEGORY_QUERIES[category.toLowerCase()] || CATEGORY_QUERIES.default;
    const cacheKey = `yt_cache_${category}`;

    // Check session cache first (valid for the current session)
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* ignore stale cache */ }
    }

    try {
      const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: String(maxResults),
        relevanceLanguage: 'en',
        safeSearch: 'strict',
        videoDuration: 'short', // Prefer short videos (< 4 min)
        key: YOUTUBE_API_KEY,
      });

      const res = await fetch(`${YOUTUBE_SEARCH_BASE}?${params}`);
      if (!res.ok) throw new Error(`YouTube API error: ${res.statusText}`);

      const data = await res.json();
      const videos: YouTubeVideo[] = (data.items || []).map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
        publishedAt: item.snippet.publishedAt,
      }));

      sessionStorage.setItem(cacheKey, JSON.stringify(videos));
      return videos;
    } catch (e) {
      console.error('[YouTube] Failed to fetch videos:', e);
      return [];
    }
  },

  /** Get the embed URL for a video to display in an iframe */
  getEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
  },

  /** Get the full YouTube watch URL */
  getWatchUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  },
};
