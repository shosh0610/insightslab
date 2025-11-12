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
import { getTopic, getViralContent, type Topic, type ViralContentIdea, type ViralContentResponse } from '@/lib/api';
import {
  ArrowLeft,
  Flame,
  Video,
  MessageSquare,
  Zap,
  TrendingUp,
  Search,
  Download,
  Copy,
  Check
} from 'lucide-react';

export default function ViralContentPage() {
  const params = useParams();
  const topicId = parseInt(params.id as string);

  const [topic, setTopic] = useState<Topic | null>(null);
  const [viralContent, setViralContent] = useState<ViralContentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [topicData, viralData] = await Promise.all([
          getTopic(topicId),
          getViralContent(topicId)
        ]);

        setTopic(topicData);
        setViralContent(viralData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load viral content');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [topicId]);

  const copyToClipboard = async (text: string, id: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportToCSV = () => {
    if (!viralContent) return;

    let csv = 'Type,Title,Content,Viral Score,Source Channel,Source Video\n';

    // Add video prompts
    viralContent.video_prompts.forEach(item => {
      const data = item.content_data;
      csv += `"Video Prompt","${data.hook_type || 'N/A'}","${data.hook_text || ''}",${item.viral_score},"${item.source_channel}","${item.source_video_title}"\n`;
    });

    // Add reaction ideas
    viralContent.reaction_ideas.forEach(item => {
      const data = item.content_data;
      csv += `"Reaction Idea","${data.mentioned_video_title || 'N/A'}","${data.video_prompt_idea || ''}",${item.viral_score},"${item.source_channel}","${item.source_video_title}"\n`;
    });

    // Add viral facts
    viralContent.viral_facts.forEach(item => {
      const data = item.content_data;
      csv += `"Viral Fact","Shocking Fact","${data.fact_text || ''}",${item.shock_score},"${item.source_channel}","${item.source_video_title}"\n`;
    });

    // Add trending formats
    viralContent.trending_formats.forEach(item => {
      const data = item.content_data;
      csv += `"Trending Format","${data.format_pattern || 'N/A'}","${data.structure || ''}",${item.viral_score},"${item.source_channel}","${item.source_video_title}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic?.name || 'viral-content'}-ideas.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Flame className="h-12 w-12 text-orange-500 animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading viral content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Content</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/topics/${topicId}/insights`}>
              <Button variant="outline" className="w-full">
                Back to Insights
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/topics/${topicId}/insights`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Flame className="h-6 w-6 text-orange-500" />
                  {topic?.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Viral Content Ideas · {viralContent?.total_ideas} total ideas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <AnimatedCard delay={0}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video Prompts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedCounter value={viralContent?.video_prompts.length || 0} />
              </div>
              <p className="text-xs text-muted-foreground">Content hooks & prompts</p>
            </CardContent>
          </AnimatedCard>

          <AnimatedCard delay={0.1}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Reaction Ideas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedCounter value={viralContent?.reaction_ideas.length || 0} />
              </div>
              <p className="text-xs text-muted-foreground">Viral topics to react to</p>
            </CardContent>
          </AnimatedCard>

          <AnimatedCard delay={0.2}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Viral Facts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedCounter value={viralContent?.viral_facts.length || 0} />
              </div>
              <p className="text-xs text-muted-foreground">Shocking stats & facts</p>
            </CardContent>
          </AnimatedCard>

          <AnimatedCard delay={0.3}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trending Formats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedCounter value={viralContent?.trending_formats.length || 0} />
              </div>
              <p className="text-xs text-muted-foreground">Viral format patterns</p>
            </CardContent>
          </AnimatedCard>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search viral content ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="video-prompts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="video-prompts" className="gap-2">
              <Video className="h-4 w-4" />
              Video Prompts
            </TabsTrigger>
            <TabsTrigger value="reaction-ideas" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Reactions
            </TabsTrigger>
            <TabsTrigger value="viral-facts" className="gap-2">
              <Zap className="h-4 w-4" />
              Viral Facts
            </TabsTrigger>
            <TabsTrigger value="trending-formats" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Formats
            </TabsTrigger>
          </TabsList>

          {/* Video Prompts Tab */}
          <TabsContent value="video-prompts" className="space-y-4">
            {viralContent?.video_prompts
              .filter(item =>
                searchQuery === '' ||
                JSON.stringify(item.content_data).toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((item, index) => {
                const data = item.content_data;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="capitalize">
                                {String(data.hook_type || 'Hook')}
                              </Badge>
                              <Badge className="bg-orange-500">
                                {item.viral_score}/100
                              </Badge>
                            </div>
                            <CardTitle className="text-lg">{String(data.hook_text || '')}</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(String(data.hook_text || ''), item.id)}
                          >
                            {copiedId === item.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold mb-1">Why It Works:</p>
                          <p className="text-sm text-muted-foreground">{String(data.why_it_works || '')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-1">Usage Example:</p>
                          <p className="text-sm text-muted-foreground">{String(data.usage_example || '')}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
                          <span>From: {item.source_channel}</span>
                          <span>·</span>
                          <span>{item.source_video_title.substring(0, 50)}...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </TabsContent>

          {/* Reaction Ideas Tab */}
          <TabsContent value="reaction-ideas" className="space-y-4">
            {viralContent?.reaction_ideas
              .filter(item =>
                searchQuery === '' ||
                JSON.stringify(item.content_data).toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((item, index) => {
                const data = item.content_data;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-orange-500">
                                {item.viral_score}/100
                              </Badge>
                              {data.view_count && (
                                <Badge variant="outline">{String(data.view_count)} views</Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg">{String(data.mentioned_video_title || '')}</CardTitle>
                            {data.original_creator && (
                              <CardDescription>by {String(data.original_creator)}</CardDescription>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(String(data.video_prompt_idea || ''), item.id)}
                          >
                            {copiedId === item.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold mb-1">Why It Went Viral:</p>
                          <p className="text-sm text-muted-foreground">{String(data.why_viral || '')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-1">How RotLabHQ Can Use It:</p>
                          <p className="text-sm text-muted-foreground">{String(data.video_prompt_idea || '')}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
                          <span>From: {item.source_channel}</span>
                          <span>·</span>
                          <span>{item.source_video_title.substring(0, 50)}...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </TabsContent>

          {/* Viral Facts Tab */}
          <TabsContent value="viral-facts" className="space-y-4">
            {viralContent?.viral_facts
              .filter(item =>
                searchQuery === '' ||
                JSON.stringify(item.content_data).toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((item, index) => {
                const data = item.content_data;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-orange-500">
                                Shock: {item.shock_score}/100
                              </Badge>
                            </div>
                            <CardTitle className="text-lg">{String(data.fact_text || '')}</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(String(data.fact_text || ''), item.id)}
                          >
                            {copiedId === item.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold mb-1">Shock Value:</p>
                          <p className="text-sm text-muted-foreground">{String(data.shock_value || '')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-1">Video Angle:</p>
                          <p className="text-sm text-muted-foreground">{String(data.video_angle || '')}</p>
                        </div>
                        {data.source_credibility && (
                          <div>
                            <p className="text-sm font-semibold mb-1">Source:</p>
                            <p className="text-sm text-muted-foreground">{String(data.source_credibility)}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
                          <span>From: {item.source_channel}</span>
                          <span>·</span>
                          <span>{item.source_video_title.substring(0, 50)}...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </TabsContent>

          {/* Trending Formats Tab */}
          <TabsContent value="trending-formats" className="space-y-4">
            {viralContent?.trending_formats
              .filter(item =>
                searchQuery === '' ||
                JSON.stringify(item.content_data).toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((item, index) => {
                const data = item.content_data;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-orange-500">
                                Trending: {item.viral_score}/100
                              </Badge>
                            </div>
                            <CardTitle className="text-lg">{String(data.format_pattern || '')}</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(String(data.format_pattern || '') + '\n\n' + String(data.structure || ''), item.id)}
                          >
                            {copiedId === item.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold mb-1">Structure:</p>
                          <p className="text-sm text-muted-foreground">{String(data.structure || '')}</p>
                        </div>
                        {data.examples_mentioned && (
                          <div>
                            <p className="text-sm font-semibold mb-1">Examples:</p>
                            <p className="text-sm text-muted-foreground">{String(data.examples_mentioned)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold mb-1">Adaptation Notes:</p>
                          <p className="text-sm text-muted-foreground">{String(data.adaptation_notes || '')}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
                          <span>From: {item.source_channel}</span>
                          <span>·</span>
                          <span>{item.source_video_title.substring(0, 50)}...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
