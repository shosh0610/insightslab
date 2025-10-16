'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getResearchSession, type ResearchResult } from '@/lib/api';
import { ArrowLeft, Brain, Search, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function ResearchStatusPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = Number(params.id);

  const [session, setSession] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const result = await getResearchSession(sessionId);
        setSession(result);

        // If research is complete, redirect to review
        if (result.status === 'ready_for_selection') {
          router.push(`/topics/research/${sessionId}/review`);
        }
        // If synthesis is complete, redirect to results
        else if (result.status === 'completed') {
          router.push(`/topics/research/${sessionId}/results`);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    }

    loadSession();

    // Poll every 5 seconds for status updates
    const interval = setInterval(loadSession, 5000);

    return () => clearInterval(interval);
  }, [sessionId, router]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'researching':
        return {
          icon: <Search className="h-8 w-8 text-blue-500" />,
          title: 'Discovering Videos',
          description: 'AI is searching YouTube for the best sources',
          color: 'blue',
        };
      case 'synthesizing':
        return {
          icon: <Brain className="h-8 w-8 text-purple-500" />,
          title: 'Synthesizing Insights',
          description: 'AI is analyzing and extracting key insights from selected videos',
          color: 'purple',
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-8 w-8 text-red-500" />,
          title: 'Research Failed',
          description: 'Something went wrong during the research process',
          color: 'red',
        };
      default:
        return {
          icon: <Clock className="h-8 w-8 text-slate-500" />,
          title: 'Processing',
          description: 'Working on your research...',
          color: 'slate',
        };
    }
  };

  if (loading && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
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

  const statusInfo = getStatusInfo(session.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{session.topic_name}</h1>
              <p className="text-sm text-muted-foreground">{session.category}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Status Card */}
          <Card className="border-2">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-6">
                <div className={`p-6 bg-${statusInfo.color}-100 dark:bg-${statusInfo.color}-900/20 rounded-full`}>
                  {session.status === 'researching' || session.status === 'synthesizing' ? (
                    <div className="animate-pulse">{statusInfo.icon}</div>
                  ) : (
                    statusInfo.icon
                  )}
                </div>
              </div>
              <CardTitle className="text-3xl mb-2">{statusInfo.title}</CardTitle>
              <CardDescription className="text-base">{statusInfo.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Progress Details */}
              {session.status === 'researching' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Search className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Videos Discovered</p>
                        <p className="text-sm text-muted-foreground">Searching YouTube</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {session.total_videos_found || 0}
                    </div>
                  </div>

                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      This usually takes 1-2 minutes...
                    </div>
                  </div>
                </div>
              )}

              {session.status === 'synthesizing' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">Analyzing Content</p>
                        <p className="text-sm text-muted-foreground">Extracting insights</p>
                      </div>
                    </div>
                    <Sparkles className="h-6 w-6 text-purple-600 animate-pulse" />
                  </div>

                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      This may take several minutes...
                    </div>
                  </div>
                </div>
              )}

              {session.status === 'failed' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      The research process encountered an error. Please try starting a new research session.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
                      Go to Dashboard
                    </Button>
                    <Button onClick={() => router.push('/topics/new')} className="flex-1">
                      Start New Research
                    </Button>
                  </div>
                </div>
              )}

              {/* Session Info */}
              <div className="pt-6 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Research ID</span>
                  <span className="font-mono">#{sessionId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Started</span>
                  <span>{new Date(session.status === 'researching' ? Date.now() : Date.now()).toLocaleTimeString()}</span>
                </div>
                {session.total_videos_found > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Videos Found</span>
                    <span className="font-semibold">{session.total_videos_found}</span>
                  </div>
                )}
              </div>

              {/* Auto-refresh indicator */}
              <div className="text-center text-xs text-muted-foreground pt-2">
                <p>Page refreshes automatically every 5 seconds</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
