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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getTopic, getInsights, getDataPoints, getRawInsights, getRawDataPoints, getViralInsights, generateViralScript, getViralScripts, getLatestViralScript, generateCompositeScript, getCompositeScripts, type Topic, type Insight, type DataPoint, type GeneratedScript, type SavedViralScript, type CompositeScript } from '@/lib/api';
import {
  ArrowLeft,
  Sparkles,
  FileText,
  TrendingUp,
  Search,
  Download,
  MessageSquare,
  Flame,
  Video,
  Copy,
  Check
} from 'lucide-react';

export default function InsightsPage() {
  const params = useParams();
  const topicId = parseInt(params.id as string);

  const [topic, setTopic] = useState<Topic | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [rawInsights, setRawInsights] = useState<Insight[]>([]);
  const [rawDataPoints, setRawDataPoints] = useState<DataPoint[]>([]);
  const [viralInsights, setViralInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [insightView, setInsightView] = useState<'top' | 'all'>('top');
  const [dataPointView, setDataPointView] = useState<'top' | 'all'>('top');
  const [generatingScript, setGeneratingScript] = useState<number | null>(null);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [scriptCounts, setScriptCounts] = useState<Record<number, number>>({});
  const [availableVersions, setAvailableVersions] = useState<SavedViralScript[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number>(1);
  const [loadingScripts, setLoadingScripts] = useState(false);

  // Multi-insight selection state
  const [selectedInsightIds, setSelectedInsightIds] = useState<number[]>([]);
  const [generatingCompositeScript, setGeneratingCompositeScript] = useState(false);
  const [compositeScript, setCompositeScript] = useState<CompositeScript | null>(null);
  const [showLongFormModal, setShowLongFormModal] = useState(false);
  const [showShortFormModal, setShowShortFormModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [topicData, insightsData, dataPointsData, rawInsightsData, rawDataPointsData, viralInsightsData] = await Promise.all([
          getTopic(topicId),
          getInsights(topicId),
          getDataPoints(topicId),
          getRawInsights(topicId),
          getRawDataPoints(topicId),
          getViralInsights(topicId)
        ]);

        setTopic(topicData);
        setInsights(insightsData);
        setDataPoints(dataPointsData);
        setRawInsights(rawInsightsData);
        setRawDataPoints(rawDataPointsData);
        setViralInsights(viralInsightsData);

        // Load script counts for viral insights
        const counts: Record<number, number> = {};
        await Promise.all(
          viralInsightsData.map(async (insight) => {
            try {
              const scripts = await getViralScripts(topicId, insight.id);
              counts[insight.id] = scripts.length;
            } catch {
              counts[insight.id] = 0;
            }
          })
        );
        setScriptCounts(counts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [topicId]);

  const filteredInsights = insights.filter(insight => {
    const insightText = insight.insight || insight.text || '';
    const sources = insight.sources?.join(', ') || insight.source_authors || '';
    return insightText.toLowerCase().includes(searchQuery.toLowerCase()) ||
           sources.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredRawInsights = rawInsights.filter(insight => {
    const insightText = insight.insight || insight.text || '';
    const sources = insight.sources?.join(', ') || insight.source_authors || '';
    return insightText.toLowerCase().includes(searchQuery.toLowerCase()) ||
           sources.toLowerCase().includes(searchQuery.toLowerCase());
  });

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

  const getViralTierBadge = (tier: string) => {
    const tierConfig: Record<string, { className: string; label: string; emoji: string }> = {
      A: { className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0', label: 'A-Tier', emoji: '🔥' },
      B: { className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0', label: 'B-Tier', emoji: '⭐' },
      C: { className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0', label: 'C-Tier', emoji: '✨' },
      D: { className: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0', label: 'D-Tier', emoji: '💡' },
      F: { className: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white border-0', label: 'F-Tier', emoji: '📝' },
    };

    const config = tierConfig[tier] || tierConfig.F;
    return (
      <Badge className={config.className}>
        {config.emoji} {config.label}
      </Badge>
    );
  };

  const handleGenerateScript = async (insightId: number, forceNew = false) => {
    setGeneratingScript(insightId);
    setLoadingScripts(true);

    try {
      // Check if scripts already exist (unless forcing new)
      if (!forceNew) {
        const existingScripts = await getViralScripts(topicId, insightId);

        if (existingScripts && existingScripts.length > 0) {
          // Scripts exist - load the latest one
          setAvailableVersions(existingScripts);
          setSelectedVersion(existingScripts[0].version); // Latest version
          setGeneratedScript({
            id: existingScripts[0].id,
            insight_id: insightId,
            insight_text: '',
            viral_score: existingScripts[0].viral_score,
            viral_tier: existingScripts[0].viral_tier,
            version: existingScripts[0].version,
            total_versions: existingScripts.length,
            created_at: existingScripts[0].created_at,
            script: existingScripts[0].script_json
          });
          setShowScriptModal(true);
          return;
        }
      }

      // No existing scripts or forcing new - generate fresh
      const script = await generateViralScript(topicId, insightId);
      setGeneratedScript(script);

      // Reload scripts to get updated versions
      const updatedScripts = await getViralScripts(topicId, insightId);
      setAvailableVersions(updatedScripts);
      setSelectedVersion(script.version || 1);

      // Update script count
      setScriptCounts(prev => ({
        ...prev,
        [insightId]: updatedScripts.length
      }));

      setShowScriptModal(true);
    } catch (err) {
      console.error('Failed to generate script:', err);
      alert('Failed to generate script. Please try again.');
    } finally {
      setGeneratingScript(null);
      setLoadingScripts(false);
    }
  };

  const handleRegenerateScript = async (insightId: number) => {
    await handleGenerateScript(insightId, true);
  };

  const handleVersionChange = (version: number) => {
    const selectedScript = availableVersions.find(v => v.version === version);
    if (selectedScript && generatedScript) {
      setSelectedVersion(version);
      setGeneratedScript({
        id: selectedScript.id,
        insight_id: generatedScript.insight_id,
        insight_text: generatedScript.insight_text,
        viral_score: selectedScript.viral_score,
        viral_tier: selectedScript.viral_tier,
        version: selectedScript.version,
        total_versions: availableVersions.length,
        created_at: selectedScript.created_at,
        script: selectedScript.script_json
      });
    }
  };

  const handleCopySection = (text: string, sectionName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleCopyFullScript = () => {
    if (generatedScript?.script?.full_script_text) {
      navigator.clipboard.writeText(generatedScript.script.full_script_text);
      setCopiedSection('full');
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  // Multi-insight selection handlers
  const toggleInsightSelection = (insightId: number) => {
    setSelectedInsightIds(prev => {
      if (prev.includes(insightId)) {
        return prev.filter(id => id !== insightId);
      } else {
        // No max limit - users can select as many as they want
        return [...prev, insightId];
      }
    });
  };

  const clearSelection = () => {
    setSelectedInsightIds([]);
  };

  const handleGenerateCompositeScript = async (scriptType: 'long-form' | 'short-form') => {
    // Short-form: 3-5 insights, Long-form: 3+ insights (no max)
    if (selectedInsightIds.length < 3) {
      return;
    }
    if (scriptType === 'short-form' && selectedInsightIds.length > 5) {
      return;
    }

    setGeneratingCompositeScript(true);
    try {
      const script = await generateCompositeScript(topicId, selectedInsightIds, scriptType);
      setCompositeScript(script);

      if (scriptType === 'long-form') {
        setShowLongFormModal(true);
      } else {
        setShowShortFormModal(true);
      }
    } catch (err) {
      console.error('Failed to generate composite script:', err);
    } finally {
      setGeneratingCompositeScript(false);
    }
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
      insightsToExport.map((insight, i) => {
        const insightText = insight.insight || insight.text || '';
        const sources = insight.sources?.join(', ') || insight.source_authors || '';
        let text = `${i + 1}. ${insightText}\n` +
                  `   Confidence: ${insight.confidence}\n` +
                  `   Sources: ${sources}\n`;

        if (insight.production_note) {
          text += '\n   📝 PRODUCTION NOTES:\n';
          if (insight.production_note.why_it_matters) {
            text += `   💡 Why It Matters: ${insight.production_note.why_it_matters}\n`;
          }
          if (insight.production_note.what_to_do) {
            text += `   ✅ What To Do: ${insight.production_note.what_to_do}\n`;
          }
          if (insight.production_note.when_it_applies) {
            text += `   🎯 When It Applies: ${insight.production_note.when_it_applies}\n`;
          }
          if (insight.production_note.common_mistakes) {
            text += `   ⚠️ Common Mistakes: ${insight.production_note.common_mistakes}\n`;
          }
        } else if (insight.note) {
          text += `   Note: ${insight.note}\n`;
        }

        if (insight.supporting_data && insight.supporting_data.length > 0) {
          text += '\n   📊 SUPPORTING DATA:\n';
          insight.supporting_data.forEach(dp => {
            text += `   - ${dp.label}: ${dp.value} ${dp.unit}\n`;
            text += `     ${dp.context}\n`;
          });
        }

        return text + '\n';
      }).join('') +
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
            <TabsTrigger value="viral" className="gap-2">
              <Flame className="h-4 w-4" />
              Viral Potential ({viralInsights.length})
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

            {/* Multi-Insight Script Generation */}
            {selectedInsightIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
                      {selectedInsightIds.length}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        {selectedInsightIds.length} insight{selectedInsightIds.length !== 1 ? 's' : ''} selected
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        {selectedInsightIds.length < 3 ? `Select ${3 - selectedInsightIds.length} more to generate scripts` :
                         selectedInsightIds.length > 5 ? 'Long-form ready • Short-form max (5) exceeded' :
                         'Ready to generate scripts'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      className="gap-2"
                    >
                      Clear Selection
                    </Button>
                    <Button
                      onClick={() => handleGenerateCompositeScript('short-form')}
                      disabled={selectedInsightIds.length < 3 || selectedInsightIds.length > 5 || generatingCompositeScript}
                      size="sm"
                      className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                    >
                      {generatingCompositeScript ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4" />
                          Short-Form (1:30-1:45)
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleGenerateCompositeScript('long-form')}
                      disabled={selectedInsightIds.length < 3 || generatingCompositeScript}
                      size="sm"
                      className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                    >
                      {generatingCompositeScript ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Long-Form (8-15 min)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {displayedInsights.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  {searchQuery ? 'No insights match your search' : 'No insights found'}
                </CardContent>
              </Card>
            ) : (
              displayedInsights.map((insight, index) => {
                const insightText = insight.insight || insight.text || '';
                const sources = insight.sources || (insight.source_authors ? insight.source_authors.split(',').map(s => s.trim()) : []);
                const hasProductionNote = insight.production_note && Object.keys(insight.production_note).length > 0;

                return (
                  <AnimatedCard key={insight.id} delay={index * 0.05} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedInsightIds.includes(insight.id)}
                            onCheckedChange={() => toggleInsightSelection(insight.id)}
                            disabled={!selectedInsightIds.includes(insight.id) && selectedInsightIds.length >= 5}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="font-mono">
                              #{index + 1}
                            </Badge>
                            {getConfidenceBadge(insight.confidence)}
                            {insight.relevance_category && (
                              <Badge variant={insight.relevance_category === 'DIRECT_ANSWER' ? 'default' : 'secondary'}>
                                {insight.relevance_category === 'DIRECT_ANSWER' ? '🎯 Direct Answer' :
                                 insight.relevance_category === 'FOUNDATIONAL' ? '📚 Foundational' :
                                 '🔗 Related'}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg leading-relaxed">
                            {insightText}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Sources */}
                      {sources.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Sources:</p>
                          <div className="flex flex-wrap gap-2">
                            {sources.map((author, i) => (
                              <Badge key={i} variant="secondary">
                                {author}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Supporting Data Points */}
                      {insight.supporting_data && insight.supporting_data.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-semibold text-muted-foreground mb-2">📊 Supporting Data:</p>
                          <div className="space-y-2">
                            {insight.supporting_data.map((dp, i) => (
                              <div key={i} className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {dp.value}
                                  </span>
                                  <span className="text-sm font-medium text-blue-600/80 dark:text-blue-400/80">
                                    {dp.unit}
                                  </span>
                                </div>
                                <p className="text-sm font-medium mt-1">{dp.label}</p>
                                <p className="text-xs text-muted-foreground mt-1">{dp.context}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Production Notes - New Format */}
                      {hasProductionNote && (
                        <div className="pt-3 border-t space-y-3">
                          <p className="text-sm font-semibold text-muted-foreground mb-2">📝 Production Notes:</p>

                          {insight.production_note!.why_it_matters && (
                            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
                              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                                💡 WHY IT MATTERS
                              </p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">
                                {insight.production_note!.why_it_matters}
                              </p>
                            </div>
                          )}

                          {insight.production_note!.what_to_do && (
                            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                              <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                                ✅ WHAT TO DO
                              </p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">
                                {insight.production_note!.what_to_do}
                              </p>
                            </div>
                          )}

                          {insight.production_note!.when_it_applies && (
                            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                                🎯 WHEN IT APPLIES
                              </p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">
                                {insight.production_note!.when_it_applies}
                              </p>
                            </div>
                          )}

                          {insight.production_note!.common_mistakes && (
                            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                                ⚠️ COMMON MISTAKES
                              </p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">
                                {insight.production_note!.common_mistakes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Fallback to old note format if no production note */}
                      {!hasProductionNote && insight.note && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold">Note:</span> {insight.note}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </AnimatedCard>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="viral" className="space-y-4">
            {/* Multi-Insight Script Generation */}
            {selectedInsightIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
                      {selectedInsightIds.length}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        {selectedInsightIds.length} insight{selectedInsightIds.length !== 1 ? 's' : ''} selected
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        {selectedInsightIds.length < 3 ? `Select ${3 - selectedInsightIds.length} more to generate scripts` :
                         selectedInsightIds.length > 5 ? 'Long-form ready • Short-form max (5) exceeded' :
                         'Ready to generate scripts'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      className="gap-2"
                    >
                      Clear Selection
                    </Button>
                    <Button
                      onClick={() => handleGenerateCompositeScript('short-form')}
                      disabled={selectedInsightIds.length < 3 || selectedInsightIds.length > 5 || generatingCompositeScript}
                      size="sm"
                      className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                    >
                      {generatingCompositeScript ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4" />
                          Short-Form (1:30-1:45)
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleGenerateCompositeScript('long-form')}
                      disabled={selectedInsightIds.length < 3 || generatingCompositeScript}
                      size="sm"
                      className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                    >
                      {generatingCompositeScript ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Long-Form (8-15 min)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {viralInsights.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No viral insights found. Viral scoring may not be available for this topic yet.
                </CardContent>
              </Card>
            ) : (
              viralInsights.map((insight, index) => {
                const insightText = insight.insight || insight.text || '';
                const sources = insight.sources || (insight.source_authors ? insight.source_authors.split(',').map(s => s.trim()) : []);
                const hasProductionNote = insight.production_note && Object.keys(insight.production_note).length > 0;
                const viralScore = insight.viral_score || 0;
                const viralTier = insight.viral_tier || 'F';
                const viralBreakdown = insight.viral_breakdown || {};

                return (
                  <AnimatedCard key={insight.id} delay={index * 0.05} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedInsightIds.includes(insight.id)}
                            onCheckedChange={() => toggleInsightSelection(insight.id)}
                            disabled={!selectedInsightIds.includes(insight.id) && selectedInsightIds.length >= 5}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <Badge variant="outline" className="font-mono">
                              #{index + 1}
                            </Badge>
                            {getViralTierBadge(viralTier)}
                            <Badge variant="secondary" className="font-semibold">
                              {viralScore}/100
                            </Badge>
                            {getConfidenceBadge(insight.confidence)}
                          </div>
                          <CardTitle className="text-lg leading-relaxed">
                            {insightText}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {scriptCounts[insight.id] > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <Video className="h-3 w-3" />
                              {scriptCounts[insight.id]}
                            </Badge>
                          )}
                          <Button
                            onClick={() => handleGenerateScript(insight.id)}
                            disabled={generatingScript === insight.id}
                            className="gap-2"
                            variant="outline"
                          >
                            {generatingScript === insight.id ? (
                              <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Video className="h-4 w-4" />
                                {scriptCounts[insight.id] > 0 ? 'View Scripts' : 'Generate Script'}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Viral Breakdown */}
                      {Object.keys(viralBreakdown).length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-semibold text-muted-foreground mb-3">🎬 Viral Potential Breakdown:</p>
                          <div className="space-y-3">
                            {viralBreakdown.hook_strength && (
                              <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                                    🎣 HOOK STRENGTH
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {viralBreakdown.hook_strength.score}/{viralBreakdown.hook_strength.max}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  {viralBreakdown.hook_strength.reasoning}
                                </p>
                              </div>
                            )}
                            {viralBreakdown.emotional_resonance && (
                              <div className="bg-pink-50 dark:bg-pink-950/20 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-semibold text-pink-700 dark:text-pink-400">
                                    ❤️ EMOTIONAL RESONANCE
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {viralBreakdown.emotional_resonance.score}/{viralBreakdown.emotional_resonance.max}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  {viralBreakdown.emotional_resonance.reasoning}
                                </p>
                              </div>
                            )}
                            {viralBreakdown.specificity && (
                              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                                    🎯 SPECIFICITY
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {viralBreakdown.specificity.score}/{viralBreakdown.specificity.max}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  {viralBreakdown.specificity.reasoning}
                                </p>
                              </div>
                            )}
                            {viralBreakdown.counterintuitiveness && (
                              <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                                    🔄 COUNTERINTUITIVENESS
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {viralBreakdown.counterintuitiveness.score}/{viralBreakdown.counterintuitiveness.max}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  {viralBreakdown.counterintuitiveness.reasoning}
                                </p>
                              </div>
                            )}
                            {viralBreakdown.universal_relatability && (
                              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                                    🌍 UNIVERSAL RELATABILITY
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {viralBreakdown.universal_relatability.score}/{viralBreakdown.universal_relatability.max}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  {viralBreakdown.universal_relatability.reasoning}
                                </p>
                              </div>
                            )}
                            {viralBreakdown.story_potential && (
                              <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                                    📖 STORY POTENTIAL
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {viralBreakdown.story_potential.score}/{viralBreakdown.story_potential.max}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  {viralBreakdown.story_potential.reasoning}
                                </p>
                              </div>
                            )}
                            {viralBreakdown.shareability && (
                              <div className="bg-cyan-50 dark:bg-cyan-950/20 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                                    📤 SHAREABILITY
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {viralBreakdown.shareability.score}/{viralBreakdown.shareability.max}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  {viralBreakdown.shareability.reasoning}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sources */}
                      {sources.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-sm text-muted-foreground mb-1">Sources:</p>
                          <div className="flex flex-wrap gap-2">
                            {sources.map((author, i) => (
                              <Badge key={i} variant="secondary">
                                {author}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Supporting Data Points */}
                      {insight.supporting_data && insight.supporting_data.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-semibold text-muted-foreground mb-2">📊 Supporting Data:</p>
                          <div className="space-y-2">
                            {insight.supporting_data.map((dp, i) => (
                              <div key={i} className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {dp.value}
                                  </span>
                                  <span className="text-sm font-medium text-blue-600/80 dark:text-blue-400/80">
                                    {dp.unit}
                                  </span>
                                </div>
                                <p className="text-sm font-medium mt-1">{dp.label}</p>
                                <p className="text-xs text-muted-foreground mt-1">{dp.context}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Production Notes */}
                      {hasProductionNote && (
                        <div className="pt-3 border-t space-y-3">
                          <p className="text-sm font-semibold text-muted-foreground mb-2">📝 Production Notes:</p>

                          {insight.production_note!.why_it_matters && (
                            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
                              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                                💡 WHY IT MATTERS
                              </p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">
                                {insight.production_note!.why_it_matters}
                              </p>
                            </div>
                          )}

                          {insight.production_note!.what_to_do && (
                            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                              <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                                ✅ WHAT TO DO
                              </p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">
                                {insight.production_note!.what_to_do}
                              </p>
                            </div>
                          )}

                          {insight.production_note!.when_it_applies && (
                            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                                🎯 WHEN IT APPLIES
                              </p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">
                                {insight.production_note!.when_it_applies}
                              </p>
                            </div>
                          )}

                          {insight.production_note!.common_mistakes && (
                            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                                ⚠️ COMMON MISTAKES
                              </p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">
                                {insight.production_note!.common_mistakes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Fallback to old note format if no production note */}
                      {!hasProductionNote && insight.note && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold">Note:</span> {insight.note}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </AnimatedCard>
                );
              })
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

      {/* Viral Script Modal */}
      <Dialog open={showScriptModal} onOpenChange={setShowScriptModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Viral Video Script
              </DialogTitle>
              <div className="flex items-center gap-2">
                {availableVersions.length > 1 && (
                  <Select
                    value={selectedVersion.toString()}
                    onValueChange={(v) => handleVersionChange(parseInt(v))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Version" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVersions.map((v) => (
                        <SelectItem key={v.version} value={v.version.toString()}>
                          Version {v.version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {generatedScript && (
                  <Button
                    onClick={() => handleRegenerateScript(generatedScript.insight_id)}
                    variant="default"
                    size="sm"
                    disabled={generatingScript === generatedScript.insight_id}
                    className="gap-2"
                  >
                    {generatingScript === generatedScript.insight_id ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4" />
                        Regenerate
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            <DialogDescription>
              {generatedScript?.viral_tier && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {getViralTierBadge(generatedScript.viral_tier)}
                  <Badge variant="secondary">{generatedScript.viral_score}/100</Badge>
                  <span className="text-sm text-muted-foreground">
                    {generatedScript.script?.total_duration} • {generatedScript.script?.total_word_count} words
                  </span>
                  {availableVersions.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      v{selectedVersion} of {availableVersions.length}
                    </Badge>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {generatedScript?.script && (
            <div className="space-y-4 mt-4">
              {/* Full Script Copy Button */}
              <div className="flex items-center justify-between pb-2 border-b">
                <p className="text-sm font-semibold">Full Script</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyFullScript}
                  className="gap-2"
                >
                  {copiedSection === 'full' ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy All
                    </>
                  )}
                </Button>
              </div>

              {/* HOOK */}
              {generatedScript.script.script?.hook && (
                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                        🎣 HOOK
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {generatedScript.script.script.hook.duration_seconds}s • {generatedScript.script.script.hook.word_count} words
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopySection(generatedScript.script.script.hook.text, 'hook')}
                    >
                      {copiedSection === 'hook' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {generatedScript.script.script.hook.text}
                  </p>
                </div>
              )}

              {/* SETUP */}
              {generatedScript.script.script?.setup && (
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                        🎬 SETUP
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {generatedScript.script.script.setup.duration_seconds}s • {generatedScript.script.script.setup.word_count} words
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopySection(generatedScript.script.script.setup.text, 'setup')}
                    >
                      {copiedSection === 'setup' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {generatedScript.script.script.setup.text}
                  </p>
                </div>
              )}

              {/* REVEAL */}
              {generatedScript.script.script?.reveal && (
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                        💡 REVEAL
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {generatedScript.script.script.reveal.duration_seconds}s • {generatedScript.script.script.reveal.word_count} words
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopySection(generatedScript.script.script.reveal.text, 'reveal')}
                    >
                      {copiedSection === 'reveal' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {generatedScript.script.script.reveal.text}
                  </p>
                </div>
              )}

              {/* SOLUTION */}
              {generatedScript.script.script?.solution && (
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                        ✅ SOLUTION
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {generatedScript.script.script.solution.duration_seconds}s • {generatedScript.script.script.solution.word_count} words
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopySection(generatedScript.script.script.solution.text, 'solution')}
                    >
                      {copiedSection === 'solution' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {generatedScript.script.script.solution.text}
                  </p>
                </div>
              )}

              {/* CLOSER */}
              {generatedScript.script.script?.closer && (
                <div className="bg-pink-50 dark:bg-pink-950/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-pink-700 dark:text-pink-400">
                        🎤 CLOSER
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {generatedScript.script.script.closer.duration_seconds}s • {generatedScript.script.script.closer.word_count} words
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopySection(generatedScript.script.script.closer.text, 'closer')}
                    >
                      {copiedSection === 'closer' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {generatedScript.script.script.closer.text}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Long-Form Composite Script Modal */}
      <Dialog open={showLongFormModal} onOpenChange={setShowLongFormModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {compositeScript && (
            <div>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl">Long-Form Script (8-15 min)</DialogTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      {compositeScript.total_insights} insights
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(compositeScript.full_script_text);
                        setCopiedSection('composite-full');
                        setTimeout(() => setCopiedSection(null), 2000);
                      }}
                      className="gap-2"
                    >
                      {copiedSection === 'composite-full' ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy All
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <DialogDescription>
                  {compositeScript.script_json.total_word_count} words • {compositeScript.script_json.total_duration}
                </DialogDescription>
              </DialogHeader>

              <Accordion type="multiple" className="w-full mt-6">
                {/* Introduction */}
                {'introduction' in compositeScript.script_json.script && (
                  <AccordionItem value="introduction">
                    <AccordionTrigger className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                      📺 INTRODUCTION ({compositeScript.script_json.script.introduction.word_count} words • {compositeScript.script_json.script.introduction.duration_seconds}s)
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                          {compositeScript.script_json.script.introduction.text}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Chapters */}
                {'chapters' in compositeScript.script_json.script &&
                  compositeScript.script_json.script.chapters.map((chapter, idx) => (
                    <AccordionItem key={idx} value={`chapter-${idx}`}>
                      <AccordionTrigger className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        📖 Chapter {chapter.chapter_number}: {chapter.chapter_title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">INTRO ({chapter.intro.duration_seconds}s)</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{chapter.intro.text}</p>
                          </div>
                          <div className="bg-cyan-50 dark:bg-cyan-950/20 rounded-lg p-3">
                            <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 mb-1">SETUP ({chapter.setup.duration_seconds}s)</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{chapter.setup.text}</p>
                          </div>
                          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">REVEAL ({chapter.reveal.duration_seconds}s)</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{chapter.reveal.text}</p>
                          </div>
                          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                            <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">EXAMPLE ({chapter.example.duration_seconds}s)</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{chapter.example.text}</p>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3">
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">MINI-SOLUTION ({chapter.mini_solution.duration_seconds}s)</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{chapter.mini_solution.text}</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-950/20 rounded-lg p-3">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1">TRANSITION ({chapter.transition.duration_seconds}s)</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{chapter.transition.text}</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}

                {/* Synthesis */}
                {'synthesis' in compositeScript.script_json.script && (
                  <AccordionItem value="synthesis">
                    <AccordionTrigger className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                      🔗 SYNTHESIS ({compositeScript.script_json.script.synthesis.word_count} words • {compositeScript.script_json.script.synthesis.duration_seconds}s)
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-lg p-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                          {compositeScript.script_json.script.synthesis.text}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Action Plan */}
                {'action_plan' in compositeScript.script_json.script && (
                  <AccordionItem value="action">
                    <AccordionTrigger className="text-lg font-semibold text-green-600 dark:text-green-400">
                      ✅ ACTION PLAN ({compositeScript.script_json.script.action_plan.word_count} words • {compositeScript.script_json.script.action_plan.duration_seconds}s)
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                          {compositeScript.script_json.script.action_plan.text}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Closer */}
                {'closer' in compositeScript.script_json.script && (
                  <AccordionItem value="closer">
                    <AccordionTrigger className="text-lg font-semibold text-pink-600 dark:text-pink-400">
                      🎤 CLOSER ({compositeScript.script_json.script.closer.word_count} words • {compositeScript.script_json.script.closer.duration_seconds}s)
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-pink-50 dark:bg-pink-950/20 rounded-lg p-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                          {compositeScript.script_json.script.closer.text}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Short-Form Composite Script Modal */}
      <Dialog open={showShortFormModal} onOpenChange={setShowShortFormModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {compositeScript && 'hook' in compositeScript.script_json.script && (
            <div>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl">Short-Form Script (1:30-1:45)</DialogTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Video className="h-3 w-3" />
                      {compositeScript.total_insights} insights
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(compositeScript.full_script_text);
                        setCopiedSection('composite-short-full');
                        setTimeout(() => setCopiedSection(null), 2000);
                      }}
                      className="gap-2"
                    >
                      {copiedSection === 'composite-short-full' ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy All
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <DialogDescription>
                  {compositeScript.script_json.total_word_count} words • {compositeScript.script_json.total_duration}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-6">
                {/* Hook */}
                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                      🪝 HOOK ({compositeScript.script_json.script.hook.word_count} words • {compositeScript.script_json.script.hook.duration_seconds}s)
                    </p>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {compositeScript.script_json.script.hook.text}
                  </p>
                </div>

                {/* Setup */}
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                      🎬 SETUP ({compositeScript.script_json.script.setup.word_count} words • {compositeScript.script_json.script.setup.duration_seconds}s)
                    </p>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {compositeScript.script_json.script.setup.text}
                  </p>
                </div>

                {/* Reveal */}
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      💡 REVEAL ({compositeScript.script_json.script.reveal.word_count} words • {compositeScript.script_json.script.reveal.duration_seconds}s)
                    </p>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {compositeScript.script_json.script.reveal.text}
                  </p>
                </div>

                {/* Solution */}
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      ✅ SOLUTION ({compositeScript.script_json.script.solution.word_count} words • {compositeScript.script_json.script.solution.duration_seconds}s)
                    </p>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {compositeScript.script_json.script.solution.text}
                  </p>
                </div>

                {/* Closer */}
                <div className="bg-pink-50 dark:bg-pink-950/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-pink-700 dark:text-pink-400">
                      🎤 CLOSER ({compositeScript.script_json.script.closer.word_count} words • {compositeScript.script_json.script.closer.duration_seconds}s)
                    </p>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {compositeScript.script_json.script.closer.text}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
