'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { startResearch } from '@/lib/api';
import { ArrowLeft, Sparkles, Clock, DollarSign, Lightbulb, Flame } from 'lucide-react';

export default function CreateTopicPage() {
  const router = useRouter();
  const [topicName, setTopicName] = useState('');
  const [videoCount, setVideoCount] = useState(10);
  const [researchMode, setResearchMode] = useState<'strategy_insights' | 'viral_content'>('strategy_insights');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate estimates based on video count
  const estimates = {
    time: Math.ceil(videoCount * 0.2), // ~12 seconds per video
    cost: (videoCount * 0.05).toFixed(2), // ~$0.05 per video
    words: videoCount * 3000, // ~3000 words per video
    insights: videoCount * 40, // ~40 raw insights per video
  };

  const handleStartResearch = async () => {
    if (!topicName.trim()) {
      setError('Please enter a topic name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await startResearch(topicName, videoCount, researchMode);

      // Store research results in sessionStorage to access on review page
      sessionStorage.setItem('research_result', JSON.stringify(result));
      sessionStorage.setItem('topic_name', topicName);
      sessionStorage.setItem('video_count', videoCount.toString());
      sessionStorage.setItem('research_mode', researchMode);

      // Navigate to review page (we'll build this next)
      router.push('/topics/new/review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start research');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Create New Topic</h1>
              <p className="text-sm text-muted-foreground">Let AI research the best sources for you</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Research Configuration
            </CardTitle>
            <CardDescription>
              Our AI will search trusted sources and recommend the best content for your topic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Topic Name Input */}
            <div className="space-y-2">
              <Label htmlFor="topic-name">Topic Name</Label>
              <Input
                id="topic-name"
                placeholder="e.g., Personal Finance, Climate Science, Artificial Intelligence"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className="text-lg"
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Be specific for better results (e.g., &quot;Index Fund Investing&quot; vs &quot;Finance&quot;)
              </p>
            </div>

            {/* Research Mode Selection */}
            <div className="space-y-4">
              <Label>Research Mode</Label>
              <RadioGroup
                value={researchMode}
                onValueChange={(value) => setResearchMode(value as 'strategy_insights' | 'viral_content')}
                disabled={loading}
                className="grid gap-4"
              >
                {/* Strategy Insights Mode */}
                <div className="relative">
                  <RadioGroupItem value="strategy_insights" id="strategy" className="peer sr-only" />
                  <Label
                    htmlFor="strategy"
                    className="flex items-start gap-4 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-semibold">Strategy Insights</div>
                      <p className="text-sm text-muted-foreground">
                        Extract strategic insights, data points, and production notes for educational content.
                        Perfect for creating in-depth, value-driven videos.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">Insights</Badge>
                        <Badge variant="outline" className="text-xs">Data Points</Badge>
                        <Badge variant="outline" className="text-xs">Notes</Badge>
                      </div>
                    </div>
                  </Label>
                </div>

                {/* Viral Content Mode */}
                <div className="relative">
                  <RadioGroupItem value="viral_content" id="viral" className="peer sr-only" />
                  <Label
                    htmlFor="viral"
                    className="flex items-start gap-4 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-semibold">Viral Content Mode <Badge className="ml-2 bg-orange-500">RotLabHQ</Badge></div>
                      <p className="text-sm text-muted-foreground">
                        Extract viral content ideas: video prompts, reaction ideas, shocking facts, and trending formats.
                        Perfect for creating attention-grabbing viral videos.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">Hooks</Badge>
                        <Badge variant="outline" className="text-xs">Reactions</Badge>
                        <Badge variant="outline" className="text-xs">Facts</Badge>
                        <Badge variant="outline" className="text-xs">Formats</Badge>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Video Count Slider */}
            <div className="space-y-4">
              <div>
                <Label>Number of Sources to Analyze</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  More sources = more comprehensive insights, but takes longer
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600">{videoCount}</span>
                  <span className="text-sm text-muted-foreground">sources</span>
                </div>

                <Slider
                  value={[videoCount]}
                  onValueChange={(value) => setVideoCount(value[0])}
                  min={5}
                  max={50}
                  step={1}
                  disabled={loading}
                  className="py-4"
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 (Quick)</span>
                  <span>25 (Balanced)</span>
                  <span>50 (Comprehensive)</span>
                </div>
              </div>
            </div>

            {/* Estimates Card */}
            <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Estimated Resources</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Time</span>
                  </div>
                  <p className="text-lg font-semibold">~{estimates.time} min</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Cost</span>
                  </div>
                  <p className="text-lg font-semibold">${estimates.cost}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Content</p>
                  <p className="text-lg font-semibold">{(estimates.words / 1000).toFixed(0)}K words</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Raw Insights</p>
                  <p className="text-lg font-semibold">~{estimates.insights}</p>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <div className="space-y-2">
              <Label>Recommended Source Count by Topic Type</Label>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-900">
                  <span className="text-muted-foreground">Simple Topic (e.g., &quot;Compound Interest&quot;)</span>
                  <Badge variant="outline">8-12 sources</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-900">
                  <span className="text-muted-foreground">Medium Topic (e.g., &quot;Personal Finance&quot;)</span>
                  <Badge variant="outline">12-20 sources</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-900">
                  <span className="text-muted-foreground">Complex Topic (e.g., &quot;Macroeconomics&quot;)</span>
                  <Badge variant="outline">20-40 sources</Badge>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button
                onClick={handleStartResearch}
                disabled={loading || !topicName.trim()}
                className="flex-1 gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Researching...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Start Research
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Note */}
        <Card className="mt-6 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">How it works:</strong> Our AI research agent will analyze our database of
              trusted YouTube channels, research papers, and articles to find the most relevant and high-quality sources for your topic.
              You&apos;ll then review and select which sources to include in the final synthesis.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
