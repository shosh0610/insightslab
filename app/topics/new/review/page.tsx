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
import { createTopic, triggerSynthesis, type ResearchResult, type ResearchRecommendation } from '@/lib/api';
import { ArrowLeft, Sparkles, CheckCircle2, ExternalLink, FileText, Clock } from 'lucide-react';

interface SelectedVideo {
  url: string;
  title: string;
  author: string;
  recommendation: ResearchRecommendation;
}

export default function ReviewResearchPage() {
  const router = useRouter();
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [topicName, setTopicName] = useState('');
  const [selectedVideos, setSelectedVideos] = useState<SelectedVideo[]>([]);
  const [videoInputs, setVideoInputs] = useState<Record<number, { url: string; title: string }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load research results from sessionStorage
    const storedResult = sessionStorage.getItem('research_result');
    const storedTopicName = sessionStorage.getItem('topic_name');

    if (!storedResult || !storedTopicName) {
      router.push('/topics/new');
      return;
    }

    setResearchResult(JSON.parse(storedResult));
    setTopicName(storedTopicName);

    // Pre-select all recommendations
    const result = JSON.parse(storedResult) as ResearchResult;
    const initialInputs: Record<number, { url: string; title: string }> = {};
    result.recommended_videos.forEach((_, index) => {
      initialInputs[index] = { url: '', title: '' };
    });
    setVideoInputs(initialInputs);
  }, [router]);

  const handleVideoUrlChange = (index: number, url: string) => {
    setVideoInputs(prev => ({
      ...prev,
      [index]: { ...prev[index], url }
    }));
  };

  const handleVideoTitleChange = (index: number, title: string) => {
    setVideoInputs(prev => ({
      ...prev,
      [index]: { ...prev[index], title }
    }));
  };

  const toggleVideoSelection = (index: number, recommendation: ResearchRecommendation) => {
    const input = videoInputs[index];

    // If URL is empty, don't allow selection
    if (!input.url) {
      return;
    }

    const existingIndex = selectedVideos.findIndex(v => v.url === input.url);

    if (existingIndex >= 0) {
      // Remove from selection
      setSelectedVideos(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      // Add to selection
      const title = input.title || `${recommendation.channel_name} - ${recommendation.search_query}`;
      setSelectedVideos(prev => [...prev, {
        url: input.url,
        title,
        author: recommendation.channel_name,
        recommendation
      }]);
    }
  };

  const isVideoSelected = (index: number): boolean => {
    const input = videoInputs[index];
    return selectedVideos.some(v => v.url === input.url);
  };

  const handleSynthesize = async () => {
    if (selectedVideos.length === 0) {
      setError('Please add at least one video');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create topic with selected sources
      const topic = await createTopic(
        topicName,
        selectedVideos.map(v => ({
          url: v.url,
          title: v.title,
          author: v.author,
          source_type: 'youtube'
        }))
      );

      // Trigger synthesis
      await triggerSynthesis(topic.id);

      // Clear session storage
      sessionStorage.removeItem('research_result');
      sessionStorage.removeItem('topic_name');
      sessionStorage.removeItem('video_count');

      // Navigate to synthesis progress page
      router.push(`/topics/${topic.id}/synthesize`);
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
                <h1 className="text-xl font-bold">{topicName}</h1>
                <p className="text-sm text-muted-foreground">Review and select sources</p>
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
            <div className="space-y-2">
              <Label>Coverage Areas:</Label>
              <div className="flex flex-wrap gap-2">
                {researchResult.coverage_areas.map((area, i) => (
                  <Badge key={i} variant="secondary">{area}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Recommendations */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Recommended Sources</h2>
            <p className="text-muted-foreground">
              Add YouTube URLs for each recommendation. The AI has identified the best videos to search for.
            </p>
          </div>

          {researchResult.recommended_videos.map((rec, index) => (
            <Card key={index} className={isVideoSelected(index) ? 'border-blue-500 shadow-md' : ''}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={isVideoSelected(index)}
                    onCheckedChange={() => toggleVideoSelection(index, rec)}
                    disabled={!videoInputs[index]?.url || loading}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <CardTitle className="text-lg">{rec.channel_name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Search: &quot;<span className="italic">{rec.search_query}</span>&quot;
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          Priority: {rec.priority}/10
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground/80 mt-2">{rec.why_selected}</p>
                      {rec.expected_topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {rec.expected_topics.map((topic, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`url-${index}`}>YouTube URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`url-${index}`}
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={videoInputs[index]?.url || ''}
                          onChange={(e) => handleVideoUrlChange(index, e.target.value)}
                          disabled={loading}
                        />
                        {videoInputs[index]?.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={videoInputs[index].url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>

                      <Label htmlFor={`title-${index}`}>Video Title (optional)</Label>
                      <Input
                        id={`title-${index}`}
                        placeholder="Leave empty to auto-generate"
                        value={videoInputs[index]?.title || ''}
                        onChange={(e) => handleVideoTitleChange(index, e.target.value)}
                        disabled={loading}
                      />
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
