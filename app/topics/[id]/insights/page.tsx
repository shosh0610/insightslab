'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/animated-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { DataPointChart } from '@/components/ui/data-point-chart';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTopic, getInsights, getDataPoints, getRawInsights, getRawDataPoints, type Topic, type Insight, type DataPoint } from '@/lib/api';
import {
  ArrowLeft,
  Sparkles,
  FileText,
  TrendingUp,
  Search,
  Download,
  MessageSquare
} from 'lucide-react';

export default function InsightsPage() {
  const params = useParams();
  const topicId = parseInt(params.id as string);

  const [topic, setTopic] = useState<Topic | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [rawInsights, setRawInsights] = useState<Insight[]>([]);
  const [rawDataPoints, setRawDataPoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [insightView, setInsightView] = useState<'top' | 'all'>('top');
  const [dataPointView, setDataPointView] = useState<'top' | 'all'>('top');

  useEffect(() => {
    async function fetchData() {
      try {
        const [topicData, insightsData, dataPointsData, rawInsightsData, rawDataPointsData] = await Promise.all([
          getTopic(topicId),
          getInsights(topicId),
          getDataPoints(topicId),
          getRawInsights(topicId),
          getRawDataPoints(topicId)
        ]);

        setTopic(topicData);
        setInsights(insightsData);
        setDataPoints(dataPointsData);
        setRawInsights(rawInsightsData);
        setRawDataPoints(rawDataPointsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [topicId]);

  const filteredInsights = insights.filter(insight =>
    insight.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    insight.source_authors?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRawInsights = rawInsights.filter(insight =>
    insight.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    insight.source_authors?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDataPoints = dataPoints.filter(dp =>
    dp.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dp.context?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dp.source_authors?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRawDataPoints = rawDataPoints.filter(dp =>
    dp.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dp.context?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dp.source_authors?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedInsights = insightView === 'top' ? filteredInsights : filteredRawInsights;
  const displayedDataPoints = dataPointView === 'top' ? filteredDataPoints : filteredRawDataPoints;

  const getConfidenceBadge = (confidence: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
      high: { variant: 'default', label: 'High Confidence' },
      medium: { variant: 'secondary', label: 'Medium Confidence' },
      low: { variant: 'outline', label: 'Low Confidence' },
    };

    const badge = variants[confidence.toLowerCase()] || variants.medium;
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  const exportToText = () => {
    // Use currently displayed data based on view toggle
    const insightsToExport = insightView === 'top' ? insights : rawInsights;
    const dataPointsToExport = dataPointView === 'top' ? dataPoints : rawDataPoints;

    const insightsLabel = insightView === 'top'
      ? `Top Ranked Insights (${insights.length})`
      : `All Insights (${rawInsights.length})`;

    const dataPointsLabel = dataPointView === 'top'
      ? `Top Ranked Data Points (${dataPoints.length})`
      : `All Data Points (${rawDataPoints.length})`;

    const content = `# ${topic?.name} - Insights & Data Points\n\n` +
      `## ${insightsLabel}\n\n` +
      insightsToExport.map((insight, i) =>
        `${i + 1}. ${insight.text}\n` +
        `   Confidence: ${insight.confidence}\n` +
        `   Sources: ${insight.source_authors}\n` +
        (insight.note ? `   Note: ${insight.note}\n` : '') +
        '\n'
      ).join('') +
      `\n## ${dataPointsLabel}\n\n` +
      dataPointsToExport.map((dp, i) =>
        `${i + 1}. ${dp.label}: ${dp.value}${dp.unit || ''}\n` +
        (dp.context ? `   Context: ${dp.context}\n` : '') +
        `   Sources: ${dp.source_authors}\n\n`
      ).join('');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `${topic?.slug || 'insights'}-${insightView === 'top' && dataPointView === 'top' ? 'ranked' : 'all'}.txt`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
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
                <h1 className="text-2xl font-bold">{topic?.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {insights.length} insights • {dataPoints.length} data points
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportToText} className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Link href={`/topics/${topicId}/scripts`}>
                <Button size="sm" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Generate Scripts
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search insights and data points..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <AnimatedCard delay={0.1}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                <AnimatedCounter value={insights.length} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Top-ranked insights from all sources
              </p>
            </CardContent>
          </AnimatedCard>

          <AnimatedCard delay={0.2}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Data Points</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                <AnimatedCounter value={dataPoints.length} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Key statistics and facts
              </p>
            </CardContent>
          </AnimatedCard>

          <AnimatedCard delay={0.3}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                <AnimatedCounter
                  value={insights.filter(i => i.confidence.toLowerCase() === 'high').length}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Insights with high confidence
              </p>
            </CardContent>
          </AnimatedCard>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="insights" className="space-y-6">
          <TabsList>
            <TabsTrigger value="insights" className="gap-2">
              <FileText className="h-4 w-4" />
              Insights ({filteredInsights.length})
            </TabsTrigger>
            <TabsTrigger value="data-points" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Data Points ({filteredDataPoints.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4">
            {/* View Toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={insightView === 'top' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInsightView('top')}
                >
                  Top 10 Ranked ({insights.length})
                </Button>
                <Button
                  variant={insightView === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInsightView('all')}
                >
                  All Insights ({rawInsights.length})
                </Button>
              </div>
              {insightView === 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Includes all insights from individual videos
                </Badge>
              )}
            </div>

            {displayedInsights.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  {searchQuery ? 'No insights match your search' : 'No insights found'}
                </CardContent>
              </Card>
            ) : (
              displayedInsights.map((insight, index) => (
                <AnimatedCard key={insight.id} delay={index * 0.05} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="font-mono">
                            #{index + 1}
                          </Badge>
                          {getConfidenceBadge(insight.confidence)}
                        </div>
                        <CardTitle className="text-lg leading-relaxed">
                          {insight.text}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {insight.source_authors && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Sources:</p>
                        <div className="flex flex-wrap gap-2">
                          {insight.source_authors.split(',').map((author, i) => (
                            <Badge key={i} variant="secondary">
                              {author.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {insight.note && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">Note:</span> {insight.note}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </AnimatedCard>
              ))
            )}
          </TabsContent>

          <TabsContent value="data-points" className="space-y-6">
            {/* View Toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={dataPointView === 'top' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDataPointView('top')}
                >
                  Top 8 Ranked ({dataPoints.length})
                </Button>
                <Button
                  variant={dataPointView === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDataPointView('all')}
                >
                  All Data Points ({rawDataPoints.length})
                </Button>
              </div>
              {dataPointView === 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Includes all data points from individual videos
                </Badge>
              )}
            </div>

            {displayedDataPoints.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  {searchQuery ? 'No data points match your search' : 'No data points found'}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {displayedDataPoints.map((dp, index) => (
                  <DataPointChart
                    key={dp.id}
                    label={dp.label}
                    value={dp.value}
                    unit={dp.unit || ''}
                    context={dp.context || undefined}
                    sources={dp.source_authors ? dp.source_authors.split(',').map(s => s.trim()) : []}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
