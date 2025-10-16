'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createTopic, triggerSynthesis, type ResearchResult, type DiscoveredVideo } from '@/lib/api';
import { ArrowLeft, Sparkles, CheckCircle2, ExternalLink, FileText, Clock, Video } from 'lucide-react';

export default function ReviewResearchPage() {
  const router = useRouter();
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load research results from sessionStorage
    const storedResult = sessionStorage.getItem('research_result');

    if (!storedResult) {
      router.push('/topics/new');
      return;
    }

    const result = JSON.parse(storedResult) as ResearchResult;
    setResearchResult(result);

    // Pre-select videos that are already selected
    const preSelectedIds = result.videos
      .filter(v => v.is_selected)
      .map(v => v.id);
    setSelectedVideoIds(preSelectedIds);
  }, [router]);

  const toggleVideoSelection = (videoId: number) => {
    setSelectedVideoIds(prev => {
      if (prev.includes(videoId)) {
        return prev.filter(id => id !== videoId);
      } else {
        return [...prev, videoId];
      }
    });
  };

  const isVideoSelected = (videoId: number): boolean => {
    return selectedVideoIds.includes(videoId);
  };

  const handleSynthesize = async () => {
    if (!researchResult || selectedVideoIds.length === 0) {
      setError('Please select at least one video');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Send selected video IDs to backend for synthesis
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/research/${researchResult.research_session_id}/select-videos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_ids: selectedVideoIds }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to select videos');
      }

      // Trigger synthesis
      const synthesisResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/research/${researchResult.research_session_id}/synthesize`,
        {
          method: 'POST',
        }
      );

      if (!synthesisResponse.ok) {
        throw new Error('Failed to start synthesis');
      }

      // Clear session storage
      sessionStorage.removeItem('research_result');
      sessionStorage.removeItem('topic_name');
      sessionStorage.removeItem('video_count');

      // Navigate to synthesis progress page
      router.push(`/topics/research/${researchResult.research_session_id}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start synthesis');
      setLoading(false);
    }
  };

  if (!researchResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedVideos = researchResult?.videos.filter(v => selectedVideoIds.includes(v.id)) || [];
  const estimatedWords = selectedVideos.length * 3000;
  const estimatedTime = Math.ceil(selectedVideos.length * 0.2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/topics/new">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">{researchResult.topic_name}</h1>
                <p className="text-sm text-muted-foreground">Review and select sources • {researchResult.category}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Selected</p>
                <p className="text-lg font-bold text-blue-600">{selectedVideos.length}</p>
              </div>
              <Button
                onClick={handleSynthesize}
                disabled={loading || selectedVideos.length === 0}
                size="lg"
                className="gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Synthesize {selectedVideos.length > 0 && `(${selectedVideos.length})`}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Research Summary */}
        <Card className="mb-6 border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              Research Complete
            </CardTitle>
            <CardDescription className="text-foreground/80">
              {researchResult.search_strategy}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Category:</span>
                <Badge variant="secondary" className="ml-2">{researchResult.category}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Videos Found:</span>
                <span className="ml-2 font-semibold">{researchResult.total_videos_found}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discovered Videos */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Discovered Videos</h2>
            <p className="text-muted-foreground">
              AI has found {researchResult.total_videos_found} relevant videos. Select which ones to synthesize.
            </p>
          </div>

          {researchResult.videos.map((video) => (
            <Card key={video.id} className={isVideoSelected(video.id) ? 'border-blue-500 shadow-md' : ''}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={isVideoSelected(video.id)}
                    onCheckedChange={() => toggleVideoSelection(video.id)}
                    disabled={loading}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-3">
                    {/* Video Thumbnail and Info */}
                    <div className="flex gap-4">
                      {video.thumbnail_url && (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-40 h-24 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <CardTitle className="text-lg leading-snug">{video.title}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {video.channel_name} • {video.duration}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            Score: {video.selection_score.toFixed(1)}
                          </Badge>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                          <span>{(video.view_count / 1000).toFixed(1)}K views</span>
                          {video.like_count > 0 && (
                            <span>{(video.like_count / 1000).toFixed(1)}K likes</span>
                          )}
                          {video.published_at && (
                            <span>{new Date(video.published_at).toLocaleDateString()}</span>
                          )}
                        </div>

                        {/* Selection Reasoning */}
                        {video.selection_reasoning && (
                          <p className="text-sm text-foreground/80 mt-2 leading-relaxed">
                            {video.selection_reasoning}
                          </p>
                        )}

                        {/* Synthesis Value */}
                        {video.synthesis_value && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {video.synthesis_value}
                            </Badge>
                          </div>
                        )}

                        {/* Video Link */}
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={video.url} target="_blank" rel="noopener noreferrer" className="gap-2">
                              <ExternalLink className="h-3 w-3" />
                              Watch on YouTube
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Selection Summary */}
        {selectedVideos.length > 0 && (
          <Card className="mt-6 sticky bottom-4 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base">Ready to Synthesize</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  <span>Sources</span>
                </div>
                <p className="text-lg font-semibold">{selectedVideos.length}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span>Est. Time</span>
                </div>
                <p className="text-lg font-semibold">~{estimatedTime} min</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Content</p>
                <p className="text-lg font-semibold">{(estimatedWords / 1000).toFixed(0)}K words</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}
