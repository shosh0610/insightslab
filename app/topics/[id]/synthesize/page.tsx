'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getSynthesisStatus, getTopic, type SynthesisStatus, type Topic } from '@/lib/api';
import { CheckCircle2, Loader2, AlertCircle, FileText, TrendingUp } from 'lucide-react';

export default function SynthesisProgressPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = parseInt(params.id as string);

  const [topic, setTopic] = useState<Topic | null>(null);
  const [status, setStatus] = useState<SynthesisStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch topic details
    const fetchTopic = async () => {
      try {
        const data = await getTopic(topicId);
        setTopic(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load topic');
      }
    };

    fetchTopic();
  }, [topicId]);

  useEffect(() => {
    // Poll synthesis status
    const pollStatus = async () => {
      try {
        const data = await getSynthesisStatus(topicId);
        setStatus(data);

        if (data.status === 'completed') {
          // Redirect to insights page after 2 seconds
          setTimeout(() => {
            router.push(`/topics/${topicId}/insights`);
          }, 2000);
        } else if (data.status === 'failed') {
          setError(data.message || 'Synthesis failed');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get status');
      }
    };

    // Poll immediately and then every 3 seconds
    pollStatus();
    const interval = setInterval(pollStatus, 3000);

    return () => clearInterval(interval);
  }, [topicId, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Error</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!topic || !status) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'completed':
        return <CheckCircle2 className="h-8 w-8 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-8 w-8 text-destructive" />;
      default:
        return <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'completed':
        return 'bg-green-600';
      case 'failed':
        return 'bg-destructive';
      case 'processing':
        return 'bg-blue-600';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{topic.name}</h1>
              <p className="text-sm text-muted-foreground">
                {status.status === 'completed' ? 'Synthesis Complete' : 'Synthesis in Progress'}
              </p>
            </div>
            <Badge variant={status.status === 'completed' ? 'default' : 'secondary'}>
              {status.status === 'completed' ? 'Ready' : 'Processing'}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Card className="border-2">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-3xl mb-2">
              {status.status === 'completed' ? 'Synthesis Complete!' : 'Analyzing Sources...'}
            </CardTitle>
            <CardDescription className="text-base">
              {status.message || 'Claude is processing your content'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress Bar */}
            {status.status !== 'completed' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{status.progress}%</span>
                </div>
                <Progress value={status.progress} className="h-3" />
              </div>
            )}

            {/* Status Steps */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  status.progress >= 25 ? getStatusColor() : 'bg-slate-200 dark:bg-slate-800'
                }`}>
                  {status.progress >= 25 ? (
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">Fetching Transcripts</p>
                  <p className="text-sm text-muted-foreground">Downloading video content</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  status.progress >= 50 ? getStatusColor() : 'bg-slate-200 dark:bg-slate-800'
                }`}>
                  {status.progress >= 50 ? (
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  ) : status.progress >= 25 ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">First Pass Extraction</p>
                  <p className="text-sm text-muted-foreground">Extracting raw insights from each source</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  status.progress >= 75 ? getStatusColor() : 'bg-slate-200 dark:bg-slate-800'
                }`}>
                  {status.progress >= 75 ? (
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  ) : status.progress >= 50 ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">Ranking & Deduplication</p>
                  <p className="text-sm text-muted-foreground">Identifying top insights across all sources</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  status.progress >= 100 ? getStatusColor() : 'bg-slate-200 dark:bg-slate-800'
                }`}>
                  {status.progress >= 100 ? (
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  ) : status.progress >= 75 ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">Finalizing Results</p>
                  <p className="text-sm text-muted-foreground">Creating final insights and data points</p>
                </div>
              </div>
            </div>

            {/* Results Summary */}
            {status.status === 'completed' && (
              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                        <FileText className="h-4 w-4" />
                        <span>Insights</span>
                      </div>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {status.insights_count || 10}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>Data Points</span>
                      </div>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {status.data_points_count || 8}
                      </p>
                    </div>
                  </div>
                  <p className="text-center mt-4 text-sm text-muted-foreground">
                    Redirecting to insights page...
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Info Note */}
        {status.status !== 'completed' && (
          <Card className="mt-6 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Please wait:</strong> The synthesis process typically takes 1-3 minutes
                depending on the number of sources. Don&apos;t close this page - you&apos;ll be automatically redirected when complete.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
