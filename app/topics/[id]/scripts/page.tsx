'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  getTopic,
  getInsights,
  getConversationProfiles,
  generateScript,
  type Topic,
  type Insight,
  type ConversationProfile
} from '@/lib/api';
import {
  ArrowLeft,
  Sparkles,
  Download,
  Copy,
  Check,
  Mic
} from 'lucide-react';

export default function ScriptsPage() {
  const params = useParams();
  const topicId = parseInt(params.id as string);

  const [topic, setTopic] = useState<Topic | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [profiles, setProfiles] = useState<ConversationProfile[]>([]);
  const [selectedInsights, setSelectedInsights] = useState<number[]>([]);
  const [selectedInterviewer, setSelectedInterviewer] = useState<number | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<number | null>(null);
  const [duration, setDuration] = useState(120); // 2 minutes default
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [topicData, insightsData, profilesData] = await Promise.all([
          getTopic(topicId),
          getInsights(topicId),
          getConversationProfiles()
        ]);

        setTopic(topicData);
        setInsights(insightsData);
        setProfiles(profilesData);

        // Auto-select first 3 insights
        setSelectedInsights(insightsData.slice(0, 3).map(i => i.id));

        // Auto-select default profiles
        const defaultInterviewer = profilesData.find(p => p.role === 'interviewer');
        const defaultExpert = profilesData.find(p => p.role === 'expert');
        if (defaultInterviewer) setSelectedInterviewer(defaultInterviewer.id);
        if (defaultExpert) setSelectedExpert(defaultExpert.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    }

    fetchData();
  }, [topicId]);

  const toggleInsight = (insightId: number) => {
    setSelectedInsights(prev =>
      prev.includes(insightId)
        ? prev.filter(id => id !== insightId)
        : [...prev, insightId]
    );
  };

  const handleGenerate = async () => {
    if (!selectedInterviewer || !selectedExpert) {
      setError('Please select both interviewer and expert profiles');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateScript({
        topic_id: topicId,
        interviewer_profile_id: selectedInterviewer,
        expert_profile_id: selectedExpert,
        duration_seconds: duration,
        insight_ids: selectedInsights.length > 0 ? selectedInsights : undefined
      });

      setGeneratedScript(result.script);
      setWordCount(result.word_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate script');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedScript) {
      navigator.clipboard.writeText(generatedScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadScript = () => {
    if (generatedScript) {
      const blob = new Blob([generatedScript], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${topic?.slug || 'script'}-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const interviewers = profiles.filter(p => p.role === 'interviewer');
  const experts = profiles.filter(p => p.role === 'expert');
  const estimatedWords = Math.floor((duration / 60) * 150); // ~150 words per minute

  if (error && !profiles.length) {
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
              <Link href={`/topics/${topicId}/insights`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Insights
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Generate Scripts</h1>
                <p className="text-sm text-muted-foreground">{topic?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-blue-600" />
                  Script Configuration
                </CardTitle>
                <CardDescription>
                  Configure your conversation style and content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Duration Slider */}
                <div className="space-y-4">
                  <div>
                    <Label>Duration</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Target length for the conversation
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">
                        {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ~{estimatedWords} words
                      </span>
                    </div>

                    <Slider
                      value={[duration]}
                      onValueChange={(value) => setDuration(value[0])}
                      min={60}
                      max={300}
                      step={30}
                      disabled={loading}
                    />

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 min</span>
                      <span>3 min</span>
                      <span>5 min</span>
                    </div>
                  </div>
                </div>

                {/* Interviewer Selection */}
                <div className="space-y-3">
                  <Label>Interviewer Style</Label>
                  <div className="space-y-2">
                    {interviewers.map(profile => (
                      <Card
                        key={profile.id}
                        className={`cursor-pointer transition-all ${
                          selectedInterviewer === profile.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                            : 'hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedInterviewer(profile.id)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedInterviewer === profile.id
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-slate-300'
                            }`}>
                              {selectedInterviewer === profile.id && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold">{profile.name}</p>
                              <p className="text-sm text-muted-foreground mb-2">
                                {profile.description}
                              </p>
                              <div className="flex gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">{profile.style}</Badge>
                                <Badge variant="outline" className="text-xs">{profile.tone}</Badge>
                                <Badge variant="outline" className="text-xs">{profile.energy}</Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Expert Selection */}
                <div className="space-y-3">
                  <Label>Expert Persona</Label>
                  <div className="space-y-2">
                    {experts.map(profile => (
                      <Card
                        key={profile.id}
                        className={`cursor-pointer transition-all ${
                          selectedExpert === profile.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                            : 'hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedExpert(profile.id)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedExpert === profile.id
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-slate-300'
                            }`}>
                              {selectedExpert === profile.id && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold">{profile.name}</p>
                              <p className="text-sm text-muted-foreground mb-2">
                                {profile.description}
                              </p>
                              <div className="flex gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">{profile.style}</Badge>
                                <Badge variant="outline" className="text-xs">{profile.tone}</Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Focus Insights */}
                <div className="space-y-3">
                  <div>
                    <Label>Focus Insights (Optional)</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select 2-3 insights to emphasize in the script
                    </p>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {insights.slice(0, 10).map((insight, index) => (
                      <div key={insight.id} className="flex items-start gap-3 p-3 rounded-md border">
                        <Checkbox
                          checked={selectedInsights.includes(insight.id)}
                          onCheckedChange={() => toggleInsight(insight.id)}
                          disabled={loading}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                          </div>
                          <p className="text-sm">{insight.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={loading || !selectedInterviewer || !selectedExpert}
                  className="w-full gap-2"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Script
                    </>
                  )}
                </Button>

                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card className="min-h-[600px] flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Script Preview</CardTitle>
                    {generatedScript && (
                      <CardDescription className="mt-1">
                        {wordCount} words • ~{Math.ceil(wordCount / 150)} min read
                      </CardDescription>
                    )}
                  </div>
                  {generatedScript && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                        className="gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadScript}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {!generatedScript ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Sparkles className="h-12 w-12 mb-4 text-slate-300" />
                    <p className="text-lg font-medium">No script generated yet</p>
                    <p className="text-sm mt-2">
                      Configure your settings and click &quot;Generate Script&quot; to create a conversation
                    </p>
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {generatedScript}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>

            {generatedScript && (
              <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Next steps:</strong> Copy this script into Descript
                    or your preferred video editing software. You can assign voices to INTERVIEWER and EXPERT
                    and generate the audio/video content.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
