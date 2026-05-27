import { fetchWithAuth } from './apiService';

export interface XAIExplanation {
  content_contribution_pct: number;
  collaborative_contribution_pct: number;
  human_explanation: string;
}

export interface MovieRecommendation {
  movie_id: number;
  title: string;
  poster_url: string;
  score: number;
  xai: XAIExplanation;
}

export const fetchRecommendationsForUser = async (
  likedMovieIds: number[],
  alpha: number = 0.5
): Promise<MovieRecommendation[]> => {
  return fetchWithAuth('/recommendations/for-user', {
    method: 'POST',
    body: JSON.stringify(likedMovieIds),
    headers: { 'Content-Type': 'application/json' },
  });
};