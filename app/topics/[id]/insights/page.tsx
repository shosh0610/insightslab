'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/animated-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTopic, getInsights, getDataPoints, type Topic, type Insight, type DataPoint } from '@/lib/api';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [topicData, insightsData, dataPointsData] = await Promise.all([
          getTopic(topicId),
          getInsights(topicId),
          getDataPoints(topicId)
        ]);

        setTopic(topicData);
        setInsights(insightsData);
        setDataPoints(dataPointsData);
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

  const filteredDataPoints = dataPoints.filter(dp =>
    dp.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dp.source_authors?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    const content = `# ${topic?.name} - Insights & Data Points\n\n` +
      `## Top Insights (${insights.length})\n\n` +
      insights.map((insight, i) =>
        `${i + 1}. ${insight.text}\n` +
        `   Confidence: ${insight.confidence}\n` +
        `   Sources: ${insight.source_authors}\n` +
        (insight.note ? `   Note: ${insight.note}\n` : '') +
        '\n'
      ).join('') +
      `\n## Data Points (${dataPoints.length})\n\n` +
      dataPoints.map((dp, i) =>
        `${i + 1}. ${dp.text}\n` +
        `   Sources: ${dp.source_authors}\n\n`
      ).join('');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic?.slug || 'insights'}.txt`;
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
            {filteredInsights.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  {searchQuery ? 'No insights match your search' : 'No insights found'}
                </CardContent>
              </Card>
            ) : (
              filteredInsights.map((insight, index) => (
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

          <TabsContent value="data-points" className="space-y-4">
            {filteredDataPoints.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  {searchQuery ? 'No data points match your search' : 'No data points found'}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredDataPoints.map((dp, index) => (
                  <AnimatedCard key={dp.id} delay={index * 0.1} className="hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/10 dark:to-purple-950/10">
                    <CardHeader>
                      <motion.div
                        className="flex items-center gap-3 mb-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                      >
                        <Badge variant="outline" className="font-mono">
                          #{index + 1}
                        </Badge>
                        <motion.div
                          initial={{ rotate: -180, scale: 0 }}
                          animate={{ rotate: 0, scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
                        >
                          <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </motion.div>
                      </motion.div>
                      <CardTitle className="text-base leading-relaxed">
                        {dp.text}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dp.source_authors && (
                        <>
                          <p className="text-sm text-muted-foreground mb-1">Sources:</p>
                          <div className="flex flex-wrap gap-2">
                            {dp.source_authors.split(',').map((author, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 + 0.4 + i * 0.05 }}
                              >
                                <Badge variant="secondary" className="text-xs">
                                  {author.trim()}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </AnimatedCard>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
