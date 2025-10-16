'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getResearchSession, getSynthesisStatus, type ResearchResult, type SynthesisStatus } from '@/lib/api';
import { ArrowLeft, Brain, CheckCircle2, AlertCircle, Sparkles, FileText, BarChart3, Loader2 } from 'lucide-react';

export default function ResearchResultsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = Number(params.id);

  const [session, setSession] = useState<ResearchResult | null>(null);
  const [synthesisStatus, setSynthesisStatus] = useState<SynthesisStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getResearchSession(sessionId);
        setSession(result);

        // If there's a topic ID from synthesis, get synthesis status
        // Note: We'd need to add topic_id to ResearchResult or get it from the session
        // For now, just check the session status

        if (result.status === 'ready_for_selection') {
          // Redirect to review page if not yet selected
          router.push(`/topics/research/${sessionId}/review`);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Poll every 3 seconds if still synthesizing
    const interval = setInterval(async () => {
      if (!session) return;

      const result = await getResearchSession(sessionId);
      setSession(result);

      // Stop polling if completed
      if (result.status === 'completed') {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, router]);

  if (loading && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20 max-w-md">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 mt-1" />
              <div>
                <CardTitle className="text-red-900 dark:text-red-100">Failed to Load</CardTitle>
                <CardDescription className="text-red-700 dark:text-red-300 mt-2">
                  {error}
                </CardDescription>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" onClick={() => router.push('/')}>
                    Go to Dashboard
                  </Button>
                  <Button onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isSynthesizing = session.status === 'synthesizing';
  const isCompleted = session.status === 'completed';
  const isFailed = session.status === 'failed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">{session.topic_name}</h1>
                <p className="text-sm text-muted-foreground">{session.category}</p>
              </div>
            </div>
            {isCompleted && (
              <Badge variant="default" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Synthesis Progress */}
          {isSynthesizing && (
            <Card className="border-2 border-purple-200 dark:border-purple-900">
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-6">
                  <div className="p-6 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                    <Brain className="h-10 w-10 text-purple-600 animate-pulse" />
                  </div>
                </div>
                <CardTitle className="text-3xl mb-2">AI Synthesis in Progress</CardTitle>
                <CardDescription className="text-base">
                  Analyzing and extracting insights from selected videos
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing</span>
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  </div>
                  <Progress value={50} className="h-2" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Extracting</p>
                        <p className="font-semibold">Key Insights</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Collecting</p>
                        <p className="font-semibold">Data Points</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    This process may take 5-10 minutes depending on the number of videos.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Page refreshes automatically every 3 seconds
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Synthesis Complete */}
          {isCompleted && (
            <div className="space-y-6">
              <Card className="border-2 border-green-200 dark:border-green-900 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl mb-2">Research Complete!</CardTitle>
                  <CardDescription>
                    Your insights are ready to view
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    AI has finished analyzing all selected videos and extracted key insights and data points.
                  </p>
                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Note: Topic viewing is being updated. Please check the main dashboard for completed topics.
                    </p>
                    <Button onClick={() => router.push('/')} size="lg" className="gap-2">
                      <Sparkles className="h-5 w-5" />
                      View on Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Research Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Research Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Topic</span>
                    <span className="font-medium">{session.topic_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Category</span>
                    <Badge variant="secondary">{session.category}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Videos Analyzed</span>
                    <span className="font-medium">{session.total_videos_found}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Classification Confidence</span>
                    <span className="font-medium">{(session.classification.confidence * 100).toFixed(0)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Failed State */}
          {isFailed && (
            <Card className="border-2 border-red-200 dark:border-red-900">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertCircle className="h-12 w-12 text-red-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl mb-2">Synthesis Failed</CardTitle>
                <CardDescription>
                  Something went wrong during the synthesis process
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Please try starting a new research session or contact support if the issue persists.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => router.push('/')}>
                    Go to Dashboard
                  </Button>
                  <Button onClick={() => router.push('/topics/new')}>
                    Start New Research
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
