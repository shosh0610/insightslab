'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTopics, getResearchSessions, type Topic, type ResearchSession } from '@/lib/api';
import {
  Plus, FileText, TrendingUp, Sparkles, Brain,
  Zap, Target, Search, BarChart3, AlertCircle, Clock, PlayCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [researchSessions, setResearchSessions] = useState<ResearchSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [topicsData, sessionsData] = await Promise.all([
          getTopics(),
          getResearchSessions()
        ]);
        setTopics(topicsData);
        setResearchSessions(sessionsData);
      } catch (err) {
        console.error('API Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to backend');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      active: { variant: 'default', label: 'Ready' },
      synthesized: { variant: 'default', label: 'Ready' },
      processing: { variant: 'secondary', label: 'Processing' },
      pending: { variant: 'outline', label: 'Pending' },
      failed: { variant: 'destructive', label: 'Failed' },
    };

    const badge = variants[status] || variants.pending;
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  InsightsLab
                </h1>
                <p className="text-xs text-muted-foreground">AI-Powered Research Platform</p>
              </div>
            </div>
            <Link href="/topics/new">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-5 w-5" />
                Start Research
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        {!loading && topics.length === 0 && !error && (
          <div className="text-center py-12 mb-12">
            <div className="inline-block p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6">
              <Brain className="h-16 w-16 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Research Made Intelligent
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Let AI discover, analyze, and synthesize knowledge from the world&apos;s best sources.
              Save hundreds of hours on research.
            </p>
            <Link href="/topics/new">
              <Button size="lg" className="gap-2 text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Sparkles className="h-6 w-6" />
                Create Your First Topic
              </Button>
            </Link>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
              <Brain className="h-8 w-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-4 text-muted-foreground">Connecting to InsightsLab...</p>
          </div>
        )}

        {/* Error State with Debug Info */}
        {error && (
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 max-w-3xl mx-auto">
            <CardHeader>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-amber-600 mt-1" />
                <div className="flex-1">
                  <CardTitle className="text-amber-900 dark:text-amber-100">Connection Issue</CardTitle>
                  <CardDescription className="text-amber-700 dark:text-amber-300 mt-2">
                    {error}
                  </CardDescription>
                  <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-lg border">
                    <p className="text-sm font-mono text-muted-foreground">
                      API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not configured'}
                    </p>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => window.location.reload()}
                      className="gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Retry Connection
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Features Section (shown when no topics) */}
        {!loading && topics.length === 0 && !error && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-2 hover:border-blue-500 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Auto-Discovery</CardTitle>
                <CardDescription>
                  AI automatically finds and evaluates the best sources across YouTube, research papers, and articles
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-purple-500 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Smart Classification</CardTitle>
                <CardDescription>
                  Topics are automatically categorized and matched with domain experts and credible sources
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-indigo-500 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle>AI Synthesis</CardTitle>
                <CardDescription>
                  Get key insights, data points, and comprehensive analysis from all sources combined
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Research Sessions in Progress */}
        {!loading && !error && researchSessions.length > 0 && researchSessions.some(s => s.status !== 'completed') && (
          <div className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Research in Progress</h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Resume your ongoing research sessions
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {researchSessions
                .filter(session => session.status !== 'completed')
                .map((session) => {
                  const getStatusInfo = (status: string) => {
                    switch (status) {
                      case 'researching':
                        return {
                          variant: 'secondary' as const,
                          label: 'Discovering Videos',
                          action: 'View Progress',
                          icon: <PlayCircle className="h-4 w-4" />
                        };
                      case 'ready_for_selection':
                        return {
                          variant: 'default' as const,
                          label: 'Ready to Review',
                          action: 'Review Videos',
                          icon: <Sparkles className="h-4 w-4" />
                        };
                      case 'synthesizing':
                        return {
                          variant: 'secondary' as const,
                          label: 'Synthesizing',
                          action: 'View Progress',
                          icon: <Brain className="h-4 w-4" />
                        };
                      case 'failed':
                        return {
                          variant: 'destructive' as const,
                          label: 'Failed',
                          action: 'Retry',
                          icon: <AlertCircle className="h-4 w-4" />
                        };
                      default:
                        return {
                          variant: 'outline' as const,
                          label: 'Pending',
                          action: 'Continue',
                          icon: <Clock className="h-4 w-4" />
                        };
                    }
                  };

                  const statusInfo = getStatusInfo(session.status);

                  return (
                    <Card key={session.id} className="hover:shadow-lg transition-all border-2 hover:border-purple-500">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            {statusInfo.icon}
                          </div>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                        <CardTitle className="text-xl">{session.topic_name}</CardTitle>
                        <CardDescription className="capitalize flex items-center gap-2">
                          <Target className="h-3 w-3" />
                          {session.category}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Search className="h-4 w-4 text-blue-600" />
                            <span>{session.total_videos_found || 0} videos found</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 text-purple-600" />
                            <span>Started {new Date(session.created_at).toLocaleDateString()}</span>
                          </div>
                          <Button
                            onClick={() => {
                              if (session.status === 'ready_for_selection') {
                                router.push(`/topics/research/${session.id}/review`);
                              } else if (session.status === 'synthesizing' || session.status === 'completed') {
                                router.push(`/topics/research/${session.id}/results`);
                              } else {
                                router.push(`/topics/research/${session.id}/status`);
                              }
                            }}
                            className="w-full gap-2 mt-2"
                            variant={session.status === 'ready_for_selection' ? 'default' : 'outline'}
                          >
                            {statusInfo.icon}
                            {statusInfo.action}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        )}

        {/* Topics Grid */}
        {!loading && !error && topics.length > 0 && (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Your Research Topics</h2>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    {topics.length} {topics.length === 1 ? 'topic' : 'topics'} • AI-powered insights ready
                  </p>
                </div>
                <Link href="/topics/new">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Plus className="h-5 w-5" />
                    New Topic
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => (
                <Link key={topic.id} href={`/topics/${topic.id}/insights`}>
                  <Card className="h-full hover:shadow-xl hover:scale-105 transition-all cursor-pointer group border-2 hover:border-blue-500">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        {getStatusBadge(topic.status)}
                      </div>
                      <CardTitle className="group-hover:text-blue-600 transition-colors text-xl">
                        {topic.name}
                      </CardTitle>
                      <CardDescription className="capitalize flex items-center gap-2">
                        <Target className="h-3 w-3" />
                        {topic.category}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span>Version {topic.version}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span>Created {new Date(topic.created_at).toLocaleDateString()}</span>
                        </div>
                        {/* @ts-expect-error - synthesized_summary exists in DB but not in type */}
                        {topic.synthesized_summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-3 pt-3 border-t">
                            {/* @ts-expect-error - synthesized_summary exists in DB but not in type */}
                            {topic.synthesized_summary}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* How it Works Section */}
        {!loading && topics.length === 0 && !error && (
          <div className="mt-16 pt-16 border-t">
            <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { num: '1', icon: Plus, title: 'Create Topic', desc: 'Enter any research topic you want to explore' },
                { num: '2', icon: Search, title: 'AI Discovery', desc: 'Our AI finds the best sources automatically' },
                { num: '3', icon: Brain, title: 'Synthesis', desc: 'AI analyzes and extracts key insights' },
                { num: '4', icon: Sparkles, title: 'Get Results', desc: 'Access comprehensive research instantly' },
              ].map((step) => (
                <div key={step.num} className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border-2 border-blue-600 font-bold text-blue-600">
                      {step.num}
                    </div>
                  </div>
                  <h4 className="font-semibold text-lg mb-2">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-20 py-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>InsightsLab • AI-Powered Research Platform</p>
        </div>
      </footer>
    </div>
  );
}
