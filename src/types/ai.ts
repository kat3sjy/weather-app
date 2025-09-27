export interface ProfileAnalysis {
  strengths: string[];
  interests: string[];
  suggestedRoles: string[];
  matchCriteria: string[];
  summary: string;
}

export interface MatchScore {
  score: number; // 0..1
  reasons: string[];
}
