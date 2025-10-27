'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTopics, getResearchSessions, getAllViralInsights, type Topic, type ResearchSession, type Insight } from '@/lib/api';
import {
  Plus, FileText, TrendingUp, Sparkles, Brain,
  Zap, Target, Search, BarChart3, AlertCircle, Clock, PlayCircle, Flame, Filter, Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [researchSessions, setResearchSessions] = useState<ResearchSession[]>([]);
  const [viralInsights, setViralInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for viral insights
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('viral_score'); // viral_score | created_at

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch topics (required)
        const topicsData = await getTopics();
        setTopics(topicsData);

        // Fetch research sessions (optional - gracefully handle failure)
        try {
          const sessionsData = await getResearchSessions();
          setResearchSessions(sessionsData);
        } catch (sessionsErr) {
          console.log('Research sessions not available yet:', sessionsErr);
          setResearchSessions([]);
        }

        // Fetch all viral insights
        try {
          const viralData = await getAllViralInsights();
          setViralInsights(viralData);
        } catch (viralErr) {
          console.log('Viral insights not available yet:', viralErr);
          setViralInsights([]);
        }
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

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      'A': 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      'B': 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
      'C': 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      'D': 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
      'F': 'bg-gradient-to-r from-slate-400 to-slate-500 text-white',
    };

    return (
      <Badge className={colors[tier] || 'bg-gray-500 text-white'}>
        {tier}-Tier
      </Badge>
    );
  };

  // Filter and sort viral insights
  const filteredInsights = viralInsights
    .filter(insight => {
      if (tierFilter !== 'all' && insight.viral_tier !== tierFilter) return false;
      if (topicFilter !== 'all' && insight.topic_id?.toString() !== topicFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'viral_score') {
        return (b.viral_score || 0) - (a.viral_score || 0);
      } else {
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      }
    });

  // Get unique topics from viral insights
  const topicsWithInsights = Array.from(
    new Set(viralInsights.map(i => i.topic_id?.toString()).filter(Boolean))
  ).map(topicId => {
    const insight = viralInsights.find(i => i.topic_id?.toString() === topicId);
    return {
      id: topicId,
      name: insight?.topic_name || 'Unknown'
    };
  });

  // Export filtered viral insights to CSV
  const exportViralInsightsToCSV = () => {
    // Prepare CSV headers
    const headers = [
      'Rank',
      'Insight Text',
      'Viral Score',
      'Tier',
      'Type',
      'Topic',
      'Confidence',
      'Hook Strength',
      'Emotional Resonance',
      'Specificity',
      'Counterintuitiveness',
      'Universal Relatability',
      'Story Potential',
      'Shareability',
      'Source Authors',
      'Production Notes'
    ];

    // Prepare CSV rows from filtered insights
    const rows = filteredInsights.map((insight, index) => {
      const viralBreakdown = insight.viral_breakdown || {};
      const productionNote = insight.production_note || {};

      return [
        index + 1,
        `"${(insight.insight || insight.text || '').replace(/"/g, '""')}"`,
        insight.viral_score || 0,
        insight.viral_tier || 'F',
        insight.is_viral_only ? 'Viral-Only' : 'Production',
        `"${(insight.topic_name || '').replace(/"/g, '""')}"`,
        insight.confidence || '',
        viralBreakdown.hook_strength?.score || '',
        viralBreakdown.emotional_resonance?.score || '',
        viralBreakdown.specificity?.score || '',
        viralBreakdown.counterintuitiveness?.score || '',
        viralBreakdown.universal_relatability?.score || '',
        viralBreakdown.story_potential?.score || '',
        viralBreakdown.shareability?.score || '',
        `"${(insight.source_authors || '').replace(/"/g, '""')}"`,
        `"${Object.entries(productionNote).map(([key, value]) => `${key}: ${value}`).join('; ').replace(/"/g, '""')}"`
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const filterSuffix = tierFilter !== 'all' ? `-tier-${tierFilter}` : '';
    const topicSuffix = topicFilter !== 'all' ? `-topic-${topicFilter}` : '';
    link.setAttribute('download', `viral-insights-all${filterSuffix}${topicSuffix}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

        {/* Error State */}
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

        {/* Tabs: Topics and Viral Insights */}
        {!loading && !error && topics.length > 0 && (
          <Tabs defaultValue="topics" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="topics" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Topics
                  <Badge variant="secondary" className="ml-1">{topics.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="viral" className="gap-2">
                  <Flame className="h-4 w-4" />
                  Viral Insights
                  <Badge variant="secondary" className="ml-1">{viralInsights.length}</Badge>
                </TabsTrigger>
              </TabsList>
              <Link href="/topics/new">
                <Button size="lg" variant="outline" className="gap-2">
                  <Plus className="h-5 w-5" />
                  New Topic
                </Button>
              </Link>
            </div>

            {/* Topics Tab */}
            <TabsContent value="topics" className="space-y-6">
              <div className="mb-4">
                <h2 className="text-3xl font-bold mb-2">Your Research Topics</h2>
                <p className="text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {topics.length} {topics.length === 1 ? 'topic' : 'topics'} • AI-powered insights ready
                </p>
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
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </TabsContent>

            {/* Viral Insights Tab */}
            <TabsContent value="viral" className="space-y-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Viral Insights</h2>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Flame className="h-4 w-4" />
                    {viralInsights.length} insights across all topics • Sorted by viral potential
                  </p>
                </div>
                {viralInsights.length > 0 && (
                  <Button
                    onClick={exportViralInsightsToCSV}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export to CSV ({filteredInsights.length})
                  </Button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-4 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>

                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Tiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="A">A-Tier (85-100)</SelectItem>
                    <SelectItem value="B">B-Tier (70-84)</SelectItem>
                    <SelectItem value="C">C-Tier (55-69)</SelectItem>
                    <SelectItem value="D">D-Tier (40-54)</SelectItem>
                    <SelectItem value="F">F-Tier (&lt;40)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Topics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {topicsWithInsights.map(topic => (
                      <SelectItem key={topic.id} value={topic.id || ''}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viral_score">Viral Score (High to Low)</SelectItem>
                    <SelectItem value="created_at">Recently Added</SelectItem>
                  </SelectContent>
                </Select>

                <div className="ml-auto text-sm text-muted-foreground">
                  Showing {filteredInsights.length} of {viralInsights.length} insights
                </div>
              </div>

              {/* Viral Insights Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredInsights.map((insight) => (
                  <Link key={insight.id} href={`/topics/${insight.topic_id}/insights`}>
                    <Card className="h-full hover:shadow-xl hover:scale-105 transition-all cursor-pointer group border-2 hover:border-purple-500">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getTierBadge(insight.viral_tier || 'F')}
                            <Badge variant="outline" className="text-xs">
                              {insight.viral_score}/100
                            </Badge>
                          </div>
                          {insight.is_viral_only && (
                            <Badge variant="secondary" className="gap-1">
                              <Flame className="h-3 w-3" />
                              Viral
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="group-hover:text-purple-600 transition-colors text-base line-clamp-2">
                          {insight.insight || insight.text}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <Target className="h-3 w-3" />
                          {insight.topic_name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {insight.sources && insight.sources.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Sources:</span> {insight.sources.slice(0, 2).join(', ')}
                              {insight.sources.length > 2 && ` +${insight.sources.length - 2} more`}
                            </div>
                          )}
                          {insight.supporting_data && insight.supporting_data.length > 0 && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" />
                              {insight.supporting_data.length} data points
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {filteredInsights.length === 0 && (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No viral insights found with the selected filters.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setTierFilter('all');
                        setTopicFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State */}
        {!loading && topics.length === 0 && !error && (
          <div className="text-center py-12">
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
