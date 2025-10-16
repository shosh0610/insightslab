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

export interface Insight {
  id: number;
  topic_id: number;
  text: string;
  confidence: string;
  source_authors: string;
  note: string | null;
  created_at: string;
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

export interface ResearchRecommendation {
  channel_name: string;
  search_query: string;
  why_selected: string;
  expected_topics: string[];
  priority: number;
}

export interface ResearchResult {
  search_strategy: string;
  coverage_areas: string[];
  recommended_videos: ResearchRecommendation[];
  total_words?: number;
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
