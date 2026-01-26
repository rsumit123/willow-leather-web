import axios from 'axios';
import { showDevToast } from '../components/common/DevToast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Development mode error interceptor - shows API errors as toasts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.VITE_DEV_MODE === 'true') {
      const url = error.config?.url || 'unknown';
      const method = error.config?.method?.toUpperCase() || 'REQUEST';
      const status = error.response?.status || 'Network Error';

      // Extract error message from response
      let errorMessage = error.message;
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          // FastAPI returns errors as { detail: string } or { detail: [{msg, loc, type}] }
          const detail = error.response.data.detail;
          if (typeof detail === 'string') {
            errorMessage = detail;
          } else if (Array.isArray(detail)) {
            // Validation errors - extract messages
            errorMessage = detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join('\n');
          }
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

      // Include request body for POST/PUT requests
      let details = errorMessage !== error.message ? errorMessage : undefined;
      if (error.config?.data && ['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          const body = typeof error.config.data === 'string'
            ? JSON.parse(error.config.data)
            : error.config.data;
          details = `${details || ''}\n\nRequest: ${JSON.stringify(body, null, 2)}`.trim();
        } catch {
          // Ignore JSON parse errors
        }
      }

      const toastMessage = `${method} ${url} - ${status}`;
      showDevToast(toastMessage, 'error', details);
    }

    return Promise.reject(error);
  }
);

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
  current_category?: string;
}

export interface NextPlayerResponse {
  auction_finished: boolean;
  player?: PlayerBrief;
  starting_bid?: number;
  category?: string;
  previous_category?: string;
  category_changed: boolean;
  category_display_name?: string;
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
  can_change_bowler: boolean;
}

export interface AvailableBowler {
  id: number;
  name: string;
  bowling_type: string; // "pace", "medium", "off_spin", "leg_spin", "left_arm_spin"
  bowling_skill: number; // 1-100 bowling attribute
  overs_bowled: string; // "2.3" format (overs.balls)
  wickets: number;
  runs_conceded: number;
  economy: number;
  can_bowl: boolean;
  reason?: string;
}

export interface AvailableBowlersResponse {
  bowlers: AvailableBowler[];
  last_bowler_id?: number;
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

// Scorecard types
export interface BatterScorecardEntry {
  player_id: number;
  player_name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strike_rate: number;
  is_out: boolean;
  dismissal: string;
  batting_position: number;
}

export interface BowlerScorecardEntry {
  player_id: number;
  player_name: string;
  overs: string;
  runs: number;
  wickets: number;
  economy: number;
  wides: number;
  no_balls: number;
}

export interface ExtrasBreakdown {
  wides: number;
  no_balls: number;
  total: number;
}

export interface InningsScorecard {
  batting_team_name: string;
  bowling_team_name: string;
  total_runs: number;
  wickets: number;
  overs: string;
  run_rate: number;
  extras: ExtrasBreakdown;
  batters: BatterScorecardEntry[];
  bowlers: BowlerScorecardEntry[];
  did_not_bat: string[];
}

export interface ManOfTheMatch {
  player_id: number;
  player_name: string;
  team_name: string;
  performance_summary: string;
  impact_score: number;
}

export interface LiveScorecardResponse {
  innings1: InningsScorecard | null;
  innings2: InningsScorecard | null;
  current_innings: number;
}

export interface MatchCompletionResponse {
  winner_name: string;
  margin: string;
  innings1: InningsScorecard;
  innings2: InningsScorecard;
  man_of_the_match: ManOfTheMatch;
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
  nextPlayer: (careerId: number) => api.post<NextPlayerResponse>(`/auction/${careerId}/next-player`),
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
  getAvailableBowlers: (careerId: number, fixtureId: number) =>
    api.get<AvailableBowlersResponse>(`/match/${careerId}/match/${fixtureId}/available-bowlers`),
  selectBowler: (careerId: number, fixtureId: number, bowlerId: number) =>
    api.post<MatchState>(`/match/${careerId}/match/${fixtureId}/select-bowler`, { bowler_id: bowlerId }),
  getScorecard: (careerId: number, fixtureId: number) =>
    api.get<LiveScorecardResponse>(`/match/${careerId}/match/${fixtureId}/scorecard`),
  getMatchResult: (careerId: number, fixtureId: number) =>
    api.get<MatchCompletionResponse>(`/match/${careerId}/match/${fixtureId}/result`),
};
