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
import { getTopic, getViralContent, generateAIScript, type Topic, type ViralContentIdea, type ViralContentResponse, type AIVideoScriptResponse } from '@/lib/api';
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
  Check,
  Sparkles,
  Film,
  Mic,
  FileText,
  X,
  Loader2
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
  const [generatingScript, setGeneratingScript] = useState<number | null>(null);
  const [selectedScript, setSelectedScript] = useState<AIVideoScriptResponse | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);

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

  const handleGenerateScript = async (ideaId: number) => {
    try {
      setGeneratingScript(ideaId);
      const script = await generateAIScript(topicId, ideaId, 'explainer', 45, 'enthusiastic');
      setSelectedScript(script);
      setShowScriptModal(true);
    } catch (err) {
      console.error('Failed to generate script:', err);
      alert('Failed to generate script. Please try again.');
    } finally {
      setGeneratingScript(null);
    }
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
                        <Button
                          className="w-full mt-4"
                          onClick={() => handleGenerateScript(item.id)}
                          disabled={generatingScript === item.id}
                        >
                          {generatingScript === item.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating AI Script...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generate AI Script
                            </>
                          )}
                        </Button>
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
                              {data.view_count ? (
                                <Badge variant="outline">{String(data.view_count)} views</Badge>
                              ) : null}
                            </div>
                            <CardTitle className="text-lg">{String(data.mentioned_video_title || '')}</CardTitle>
                            {data.original_creator ? (
                              <CardDescription>by {String(data.original_creator)}</CardDescription>
                            ) : null}
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
                        <Button
                          className="w-full mt-4"
                          onClick={() => handleGenerateScript(item.id)}
                          disabled={generatingScript === item.id}
                        >
                          {generatingScript === item.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating AI Script...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generate AI Script
                            </>
                          )}
                        </Button>
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
                        {data.source_credibility ? (
                          <div>
                            <p className="text-sm font-semibold mb-1">Source:</p>
                            <p className="text-sm text-muted-foreground">{String(data.source_credibility)}</p>
                          </div>
                        ) : null}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
                          <span>From: {item.source_channel}</span>
                          <span>·</span>
                          <span>{item.source_video_title.substring(0, 50)}...</span>
                        </div>
                        <Button
                          className="w-full mt-4"
                          onClick={() => handleGenerateScript(item.id)}
                          disabled={generatingScript === item.id}
                        >
                          {generatingScript === item.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating AI Script...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generate AI Script
                            </>
                          )}
                        </Button>
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
                        {data.examples_mentioned ? (
                          <div>
                            <p className="text-sm font-semibold mb-1">Examples:</p>
                            <p className="text-sm text-muted-foreground">{String(data.examples_mentioned)}</p>
                          </div>
                        ) : null}
                        <div>
                          <p className="text-sm font-semibold mb-1">Adaptation Notes:</p>
                          <p className="text-sm text-muted-foreground">{String(data.adaptation_notes || '')}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
                          <span>From: {item.source_channel}</span>
                          <span>·</span>
                          <span>{item.source_video_title.substring(0, 50)}...</span>
                        </div>
                        <Button
                          className="w-full mt-4"
                          onClick={() => handleGenerateScript(item.id)}
                          disabled={generatingScript === item.id}
                        >
                          {generatingScript === item.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating AI Script...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generate AI Script
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </TabsContent>
        </Tabs>
      </main>

      {/* Script Modal */}
      {showScriptModal && selectedScript && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Film className="h-6 w-6" />
                  {selectedScript.script.video_title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedScript.duration}s {selectedScript.script_type} • {selectedScript.voice_tone} tone
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowScriptModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <Tabs defaultValue="full-script" className="p-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="full-script">
                  <FileText className="h-4 w-4 mr-2" />
                  Full Script
                </TabsTrigger>
                <TabsTrigger value="ai-prompts">
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Prompts
                </TabsTrigger>
                <TabsTrigger value="voiceover">
                  <Mic className="h-4 w-4 mr-2" />
                  Voiceover
                </TabsTrigger>
                <TabsTrigger value="production">
                  <Zap className="h-4 w-4 mr-2" />
                  Production
                </TabsTrigger>
              </TabsList>

              <div className="mt-6 max-h-[calc(90vh-240px)] overflow-y-auto">
                {/* Full Script Tab */}
                <TabsContent value="full-script" className="space-y-4">
                  {selectedScript.script.shots.map((shot) => (
                    <Card key={shot.shot_number}>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>Shot {shot.shot_number} ({shot.duration})</span>
                          {shot.text_overlay && (
                            <Badge variant="outline">{shot.text_position}</Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">AI PROMPT:</p>
                          <p className="text-sm">{shot.ai_prompt}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">VOICEOVER:</p>
                          <p className="text-sm italic">{shot.voiceover}</p>
                        </div>
                        {shot.text_overlay && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">TEXT OVERLAY:</p>
                            <p className="text-sm font-bold">{shot.text_overlay}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">MUSIC:</p>
                          <p className="text-sm">{shot.music_note}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                {/* AI Prompts Only Tab */}
                <TabsContent value="ai-prompts" className="space-y-4">
                  {selectedScript.script.shots.map((shot) => (
                    <Card key={shot.shot_number}>
                      <CardHeader>
                        <CardTitle className="text-sm">Shot {shot.shot_number} ({shot.duration})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm font-mono bg-muted p-3 rounded">{shot.ai_prompt}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => copyToClipboard(shot.ai_prompt, shot.shot_number)}
                        >
                          {copiedId === shot.shot_number ? (
                            <><Check className="h-3 w-3 mr-1" /> Copied</>
                          ) : (
                            <><Copy className="h-3 w-3 mr-1" /> Copy</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                {/* Voiceover Only Tab */}
                <TabsContent value="voiceover" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Complete Voiceover Script</CardTitle>
                      <CardDescription>
                        Duration: {selectedScript.duration}s • Tone: {selectedScript.voice_tone}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedScript.script.full_voiceover}
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => copyToClipboard(selectedScript.script.full_voiceover, 999)}
                      >
                        {copiedId === 999 ? (
                          <><Check className="h-4 w-4 mr-2" /> Copied</>
                        ) : (
                          <><Copy className="h-4 w-4 mr-2" /> Copy Full Script</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Shot-by-Shot Breakdown:</h3>
                    {selectedScript.script.shots.map((shot) => (
                      <Card key={shot.shot_number}>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground mb-1">
                            Shot {shot.shot_number} ({shot.duration})
                          </p>
                          <p className="text-sm italic">{shot.voiceover}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Production Notes Tab */}
                <TabsContent value="production" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Production Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold mb-2">AI Tools Needed:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedScript.script.production_notes.ai_tools_needed.map((tool, i) => (
                            <Badge key={i} variant="secondary">{tool}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1">Editing Software:</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedScript.script.production_notes.editing_software}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1">Estimated Time:</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedScript.script.production_notes.estimated_production_time}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1">Difficulty:</p>
                        <Badge>{selectedScript.script.production_notes.difficulty}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-2">Pro Tips:</p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {selectedScript.script.production_notes.tips.map((tip, i) => (
                            <li key={i}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Music Suggestion</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedScript.script.music_suggestion}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Hook Strategy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedScript.script.hook_strategy}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </motion.div>
        </div>
      )}
    </div>
  );
}
