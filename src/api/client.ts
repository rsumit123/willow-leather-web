import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Team {
  id: number;
  name: string;
  short_name: string;
  city: string;
  home_ground: string;
  primary_color: string;
  secondary_color: string;
  budget: number;
  remaining_budget: number;
  is_user_team: boolean;
}

export interface TeamChoice {
  index: number;
  name: string;
  short_name: string;
  city: string;
}

export interface Player {
  id: number;
  name: string;
  age: number;
  nationality: string;
  is_overseas: boolean;
  role: string;
  batting: number;
  bowling: number;
  overall_rating: number;
  team_id?: number;
  base_price: number;
  sold_price?: number;
  form: number;
  batting_style: string;
  bowling_type: string;
}

export interface PlayerBrief {
  id: number;
  name: string;
  role: string;
  overall_rating: number;
  is_overseas: boolean;
  base_price: number;
  batting_style: string;
  bowling_type: string;
}

export interface Career {
  id: number;
  name: string;
  status: string;
  current_season_number: number;
  user_team_id?: number;
  created_at: string;
  user_team?: Team;
}

export interface AuctionState {
  status: string;
  current_player?: PlayerBrief;
  current_bid: number;
  current_bidder_team_id?: number;
  current_bidder_team_name?: string;
  players_sold: number;
  players_unsold: number;
  total_players: number;
}

export interface TeamAuctionState {
  team_id: number;
  team_name: string;
  remaining_budget: number;
  total_players: number;
  overseas_players: number;
  batsmen: number;
  bowlers: number;
  all_rounders: number;
  wicket_keepers: number;
  max_bid_possible: number;
}

export interface AuctionPlayerResult {
  player_id: number;
  player_name: string;
  is_sold: boolean;
  sold_to_team_id?: number;
  sold_to_team_name?: string;
  sold_price: number;
  bid_history: Array<{ team_id: number; amount: number }>;
}

export interface SkipCategoryPlayerResult {
  player_id: number;
  player_name: string;
  is_sold: boolean;
  sold_to_team_id?: number;
  sold_to_team_name?: string;
  sold_price: number;
}

export interface SkipCategoryResponse {
  players_auctioned: number;
  results: SkipCategoryPlayerResult[];
}

export interface AutoBidResponse {
  status: 'won' | 'lost' | 'cap_exceeded' | 'budget_limit';
  // When won/lost
  player_id?: number;
  player_name?: string;
  is_sold?: boolean;
  sold_to_team_id?: number;
  sold_to_team_name?: string;
  sold_price?: number;
  // When cap_exceeded/budget_limit
  current_bid?: number;
  current_bidder_team_name?: string;
  next_bid_needed?: number;
}

export interface SoldPlayerBrief {
  id: number;
  name: string;
  role: string;
  overall_rating: number;
  is_overseas: boolean;
  base_price: number;
  sold_price: number;
  sold_to_team_name: string;
}

export interface CategoryPlayersResponse {
  current_category: string | null;
  current_player_id: number | null;
  categories: Record<string, PlayerBrief[]>;
  counts: Record<string, number>;
  sold: Record<string, SoldPlayerBrief[]>;
  sold_counts: Record<string, number>;
}

export interface Fixture {
  id: number;
  match_number: number;
  fixture_type: string;
  team1_id: number;
  team1_name: string;
  team2_id: number;
  team2_name: string;
  venue: string;
  status: string;
  winner_id?: number;
  result_summary?: string;
}

export interface Standing {
  position: number;
  team_id: number;
  team_name: string;
  team_short_name: string;
  played: number;
  won: number;
  lost: number;
  no_result: number;
  points: number;
  nrr: number;
}

export interface MatchResult {
  fixture_id: number;
  winner_id?: number;
  winner_name?: string;
  margin: string;
  innings1_score: string;
  innings2_score: string;
}

export interface Squad {
  team: Team;
  players: Player[];
  total_players: number;
  overseas_count: number;
}

export interface PlayingXIPlayer extends Player {
  position: number;
}

export interface PlayingXIResponse {
  players: PlayingXIPlayer[];
  is_valid: boolean;
  is_set: boolean;
}

export interface PlayingXIValidationResponse {
  valid: boolean;
  errors: string[];
  breakdown: Record<string, number>;
}

export interface PlayerStateBrief {
  id: number;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  is_out: boolean;
  is_settled: boolean;
  is_nervous: boolean;
  is_on_fire: boolean;
}

export interface BowlerStateBrief {
  id: number;
  name: string;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  is_tired: boolean;
  has_confidence: boolean;
}

export interface MatchState {
  innings: number;
  runs: number;
  wickets: number;
  overs: string;
  run_rate: number;
  required_rate?: number;
  target?: number;
  striker?: PlayerStateBrief;
  non_striker?: PlayerStateBrief;
  bowler?: BowlerStateBrief;
  pitch_type: string;
  is_pressure: boolean;
  is_collapse: boolean;
  partnership_runs: number;
  this_over: string[];
  last_ball_commentary?: string;
  phase: string;
  balls_remaining: number;
  status: 'in_progress' | 'completed';
  winner_name?: string;
  margin?: string;
  batting_team_name: string;
  bowling_team_name: string;
  is_user_batting: boolean;
  user_team_name: string;
  innings_just_changed: boolean;
}

export interface PlayoffMatch {
  fixture_id: number;
  match_number: number;
  team1: string | null;
  team1_id: number | null;
  team2: string | null;
  team2_id: number | null;
  winner: string | null;
  status: string;
  result: string | null;
}

export interface PlayoffBracket {
  qualifier_1?: PlayoffMatch;
  eliminator?: PlayoffMatch;
  qualifier_2?: PlayoffMatch;
  final?: PlayoffMatch;
}

export interface SeasonSummary {
  message: string;
  champion?: string;
  runner_up?: string;
}

export interface TossResult {
  toss_winner_id: number;
  toss_winner_name: string;
  user_won_toss: boolean;
  user_team_name: string;
}

export interface BallResult {
  outcome: string;
  runs: number;
  is_wicket: boolean;
  is_boundary: boolean;
  is_six: boolean;
  commentary: string;
  match_state: MatchState;
}

// API functions
export const careerApi = {
  getTeamChoices: () => api.get<TeamChoice[]>('/career/teams/choices'),
  create: (name: string, teamIndex: number) =>
    api.post<Career>('/career/new', { name, team_index: teamIndex }),
  list: () => api.get<Career[]>('/career/list'),
  get: (id: number) => api.get<Career>(`/career/${id}`),
  delete: (id: number) => api.delete(`/career/${id}`),
  getTeams: (careerId: number) => api.get<Team[]>(`/career/${careerId}/teams`),
  getSquad: (careerId: number, teamId: number) =>
    api.get<Squad>(`/career/${careerId}/teams/${teamId}/squad`),
  getPlayingXI: (careerId: number) =>
    api.get<PlayingXIResponse>(`/career/${careerId}/playing-xi`),
  setPlayingXI: (careerId: number, playerIds: number[]) =>
    api.post<PlayingXIResponse>(`/career/${careerId}/playing-xi`, { player_ids: playerIds }),
  validatePlayingXI: (careerId: number, playerIds: number[]) =>
    api.post<PlayingXIValidationResponse>(`/career/${careerId}/playing-xi/validate`, { player_ids: playerIds }),
};

export const auctionApi = {
  start: (careerId: number) => api.post(`/auction/${careerId}/start`),
  getState: (careerId: number) => api.get<AuctionState>(`/auction/${careerId}/state`),
  getTeamsState: (careerId: number) =>
    api.get<TeamAuctionState[]>(`/auction/${careerId}/teams`),
  nextPlayer: (careerId: number) => api.post(`/auction/${careerId}/next-player`),
  bid: (careerId: number) => api.post(`/auction/${careerId}/bid`),
  pass: (careerId: number) => api.post(`/auction/${careerId}/pass`),
  simulateBidding: (careerId: number) =>
    api.post(`/auction/${careerId}/simulate-bidding`),
  finalizePlayer: (careerId: number) =>
    api.post<AuctionPlayerResult>(`/auction/${careerId}/finalize-player`),
  autoComplete: (careerId: number) =>
    api.post(`/auction/${careerId}/auto-complete`),
  getRemainingPlayers: (careerId: number) =>
    api.get<CategoryPlayersResponse>(`/auction/${careerId}/remaining-players`),
  skipCategory: (careerId: number, category: string) =>
    api.post<SkipCategoryResponse>(`/auction/${careerId}/skip-category/${category}`),
  quickPass: (careerId: number) =>
    api.post<AuctionPlayerResult>(`/auction/${careerId}/quick-pass`),
  autoBid: (careerId: number, maxBid: number) =>
    api.post<AutoBidResponse>(`/auction/${careerId}/auto-bid`, { max_bid: maxBid }),
};

export const seasonApi = {
  get: (careerId: number) => api.get(`/season/${careerId}`),
  generateFixtures: (careerId: number) =>
    api.post(`/season/${careerId}/generate-fixtures`),
  getFixtures: (careerId: number, type?: string, status?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('fixture_type', type);
    if (status) params.append('status', status);
    return api.get<Fixture[]>(`/season/${careerId}/fixtures?${params}`);
  },
  getNextFixture: (careerId: number) =>
    api.get<Fixture | null>(`/season/${careerId}/next-fixture`),
  getStandings: (careerId: number) =>
    api.get<Standing[]>(`/season/${careerId}/standings`),
  simulateMatch: (careerId: number, fixtureId: number) =>
    api.post<MatchResult>(`/season/${careerId}/simulate-match/${fixtureId}`),
  simulateNextMatch: (careerId: number) =>
    api.post<MatchResult>(`/season/${careerId}/simulate-next-match`),
  simulateAllLeague: (careerId: number) =>
    api.post(`/season/${careerId}/simulate-all-league`),
  getPlayoffBracket: (careerId: number) =>
    api.get<PlayoffBracket>(`/season/${careerId}/playoffs/bracket`),
  generateNextPlayoff: (careerId: number) =>
    api.post<SeasonSummary>(`/season/${careerId}/playoffs/generate-next`),
};

export const matchApi = {
  doToss: (careerId: number, fixtureId: number) =>
    api.post<TossResult>(`/match/${careerId}/match/${fixtureId}/toss`),
  startMatch: (careerId: number, fixtureId: number, tossWinnerId?: number, electedTo?: string) => {
    const body = tossWinnerId && electedTo
      ? { toss_winner_id: tossWinnerId, elected_to: electedTo }
      : undefined;
    return api.post<MatchState>(`/match/${careerId}/match/${fixtureId}/start`, body);
  },
  getState: (careerId: number, fixtureId: number) =>
    api.get<MatchState>(`/match/${careerId}/match/${fixtureId}/state`),
  playBall: (careerId: number, fixtureId: number, aggression: string) =>
    api.post<BallResult>(`/match/${careerId}/match/${fixtureId}/ball`, { aggression }),
  simulateOver: (careerId: number, fixtureId: number, aggression: string = 'balanced') =>
    api.post<MatchState>(`/match/${careerId}/match/${fixtureId}/simulate-over`, { aggression }),
  simulateInnings: (careerId: number, fixtureId: number) =>
    api.post<MatchState>(`/match/${careerId}/match/${fixtureId}/simulate-innings`),
};
