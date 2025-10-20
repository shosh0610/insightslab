/**
 * API Client for InsightsLab Backend
 *
 * Handles all API calls to the FastAPI backend on Railway
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
if (typeof window !== 'undefined') {
  console.log('[InsightsLab] API URL:', API_URL);
}

// Types
export interface Topic {
  id: number;
  name: string;
  slug: string;
  category: string;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: number;
  url: string;
  title: string;
  author: string;
  source_type: 'youtube' | 'paper' | 'article' | 'book';
  raw_content: string;
  credibility_score: number;
  processed: boolean;
  created_at: string;
}

export interface ProductionNote {
  why_it_matters: string;
  what_to_do: string;
  when_it_applies: string;
  common_mistakes: string;
}

export interface SupportingDataPoint {
  value: number;
  unit: string;
  label: string;
  context: string;
}

export interface ViralDimensionScore {
  score: number;
  max: number;
  reasoning: string;
}

export interface ViralBreakdown {
  hook_strength?: ViralDimensionScore;
  emotional_resonance?: ViralDimensionScore;
  specificity?: ViralDimensionScore;
  counterintuitiveness?: ViralDimensionScore;
  universal_relatability?: ViralDimensionScore;
  story_potential?: ViralDimensionScore;
  shareability?: ViralDimensionScore;
}

export interface ScriptSection {
  text: string;
  word_count: number;
  duration_seconds: number;
}

export interface ViralScript {
  hook: ScriptSection;
  setup: ScriptSection;
  reveal: ScriptSection;
  solution: ScriptSection;
  closer: ScriptSection;
}

export interface GeneratedScript {
  insight_id: number;
  insight_text: string;
  viral_score: number;
  viral_tier: string;
  script: {
    script: ViralScript;
    total_word_count: number;
    total_duration: string;
    full_script_text: string;
  };
}

export interface Insight {
  id: number;
  topic_id?: number;
  insight?: string;  // New API format
  text?: string;     // Old format (deprecated)
  confidence: string;
  source_authors?: string;
  sources?: string[];  // New API format
  note?: string | null;  // Old format - fallback
  production_note?: ProductionNote;  // New API format - structured notes
  supporting_data?: SupportingDataPoint[];  // New API format - linked data points
  relevance_score?: number;
  relevance_category?: string;
  viral_score?: number;  // Viral potential score (0-100)
  viral_breakdown?: ViralBreakdown;  // Breakdown of 7 scoring dimensions
  viral_tier?: string;  // A, B, C, D, or F
  insight_type?: string;
  created_at?: string;
}

export interface DataPoint {
  id: number;
  topic_id: number;
  label: string;
  value: number;
  unit: string | null;
  context: string | null;
  context_note: string | null;
  source_authors: string;
  source_count: number;
  date_recorded: string | null;
  created_at: string;
}

export interface DiscoveredVideo {
  id: number;
  video_id: string;
  title: string;
  channel_name: string;
  channel_handle: string;
  url: string;
  thumbnail_url: string;
  view_count: number;
  like_count: number;
  duration: string;
  published_at: string | null;
  selection_score: number;
  selection_reasoning: string;
  synthesis_value: string;
  is_selected: boolean;
}

export interface ResearchResult {
  research_session_id: number;
  status: string;
  topic_name: string;
  category: string;
  total_videos_found: number;
  videos: DiscoveredVideo[];
  search_strategy: string;
  classification: {
    primary: string;
    supported: boolean;
    confidence: number;
    reasoning: string;
  };
}

export interface ResearchSession {
  id: number;
  topic_name: string;
  category: string;
  status: 'researching' | 'ready_for_selection' | 'synthesizing' | 'completed' | 'failed';
  video_count_requested: number;
  total_videos_found: number;
  created_at: string;
  completed_at: string | null;
  classification_confidence: number;
  is_supported: boolean;
}

export interface SynthesisStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  insights_count?: number;
  data_points_count?: number;
}

export interface ConversationProfile {
  id: number;
  name: string;
  role: 'interviewer' | 'expert';
  style: string;
  tone: string;
  energy: string;
  description: string;
}

// API Functions

/**
 * Get all research sessions
 */
export async function getResearchSessions(): Promise<ResearchSession[]> {
  const response = await fetch(`${API_URL}/api/research/sessions`);

  if (!response.ok) {
    throw new Error(`Failed to get research sessions: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get specific research session details
 */
export async function getResearchSession(sessionId: number): Promise<ResearchResult> {
  const response = await fetch(`${API_URL}/api/research/${sessionId}`);

  if (!response.ok) {
    throw new Error(`Failed to get research session: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Start research agent for a topic
 */
export async function startResearch(topicName: string, videoCount: number = 10): Promise<ResearchResult> {
  const response = await fetch(`${API_URL}/api/research/start/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic_name: topicName,
      video_count: videoCount,
    }),
  });

  if (!response.ok) {
    throw new Error(`Research failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create topic with selected sources
 */
export async function createTopic(
  topicName: string,
  sources: Array<{ url: string; title: string; author: string; source_type: string }>
): Promise<Topic> {
  const response = await fetch(`${API_URL}/api/topics/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: topicName,
      sources,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create topic: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Trigger synthesis for a topic
 */
export async function triggerSynthesis(topicId: number): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_URL}/api/synthesis/synthesize/${topicId}/`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Synthesis failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get synthesis status
 */
export async function getSynthesisStatus(topicId: number): Promise<SynthesisStatus> {
  const response = await fetch(`${API_URL}/api/synthesis/status/${topicId}/`);

  if (!response.ok) {
    throw new Error(`Failed to get status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all topics
 */
export async function getTopics(): Promise<Topic[]> {
  const response = await fetch(`${API_URL}/api/topics/`);

  if (!response.ok) {
    throw new Error(`Failed to get topics: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get topic by ID
 */
export async function getTopic(topicId: number): Promise<Topic> {
  const response = await fetch(`${API_URL}/api/topics/${topicId}/`);

  if (!response.ok) {
    throw new Error(`Failed to get topic: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get insights for a topic
 */
export async function getInsights(topicId: number): Promise<Insight[]> {
  const response = await fetch(`${API_URL}/api/topics/${topicId}/insights/`);

  if (!response.ok) {
    throw new Error(`Failed to get insights: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get insights sorted by viral potential score
 */
export async function getViralInsights(topicId: number): Promise<Insight[]> {
  const response = await fetch(`${API_URL}/api/topics/${topicId}/insights/viral/`);

  if (!response.ok) {
    throw new Error(`Failed to get viral insights: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generate a viral video script for a specific insight
 * Saves to database and returns the script with version info
 */
export async function generateViralScript(topicId: number, insightId: number): Promise<GeneratedScript> {
  const response = await fetch(`${API_URL}/api/topics/${topicId}/insights/${insightId}/viral-script`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to generate script: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all saved viral script versions for an insight
 */
export async function getViralScripts(topicId: number, insightId: number): Promise<any[]> {
  const response = await fetch(`${API_URL}/api/topics/${topicId}/insights/${insightId}/viral-scripts`);

  if (!response.ok) {
    throw new Error(`Failed to get scripts: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get latest viral script for an insight
 */
export async function getLatestViralScript(topicId: number, insightId: number): Promise<GeneratedScript | null> {
  const response = await fetch(`${API_URL}/api/topics/${topicId}/insights/${insightId}/viral-scripts/latest`);

  if (response.status === 404) {
    return null; // No scripts exist yet
  }

  if (!response.ok) {
    throw new Error(`Failed to get latest script: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get data points for a topic
 */
export async function getDataPoints(topicId: number): Promise<DataPoint[]> {
  const response = await fetch(`${API_URL}/api/topics/${topicId}/data-points/`);

  if (!response.ok) {
    throw new Error(`Failed to get data points: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get ALL raw insights for a topic (before ranking/deduplication)
 */
export async function getRawInsights(topicId: number): Promise<Insight[]> {
  const response = await fetch(`${API_URL}/api/topics/${topicId}/insights/raw/`);

  if (!response.ok) {
    throw new Error(`Failed to get raw insights: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get ALL raw data points for a topic (before ranking/deduplication)
 */
export async function getRawDataPoints(topicId: number): Promise<DataPoint[]> {
  const response = await fetch(`${API_URL}/api/topics/${topicId}/data-points/raw/`);

  if (!response.ok) {
    throw new Error(`Failed to get raw data points: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get conversation profiles
 */
export async function getConversationProfiles(): Promise<ConversationProfile[]> {
  const response = await fetch(`${API_URL}/api/conversations/profiles/`);

  if (!response.ok) {
    throw new Error(`Failed to get profiles: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generate conversation script
 */
export async function generateScript(params: {
  topic_id: number;
  interviewer_profile_id: number;
  expert_profile_id: number;
  duration_seconds: number;
  insight_ids?: number[];
}): Promise<{ script: string; word_count: number }> {
  const queryParams = new URLSearchParams({
    topic_id: params.topic_id.toString(),
    interviewer_profile_id: params.interviewer_profile_id.toString(),
    expert_profile_id: params.expert_profile_id.toString(),
    duration_seconds: params.duration_seconds.toString(),
  });

  if (params.insight_ids && params.insight_ids.length > 0) {
    params.insight_ids.forEach(id => queryParams.append('insight_ids', id.toString()));
  }

  const response = await fetch(`${API_URL}/api/conversations/generate?${queryParams}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to generate script: ${response.statusText}`);
  }

  return response.json();
}
