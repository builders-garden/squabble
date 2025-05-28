export interface Player {
  id?: number;
  fid: number;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  ready?: boolean;
  staked?: boolean;
  score?: number;
}

export interface PlayerJoinedEvent {
  player: Player;
  gameId: string;
}

export interface PlayerLeftEvent {
  playerId: string;
  gameId: string;
}

export interface GameUpdateEvent {
  gameId: string;
  players: Array<Player>;
  status: "pending" | "ready" | "finished";
}

export interface GameStartedEvent {
  gameId: string;
  seed: string;
  players: Array<Player>;
  startTime: number;
  endTime: number;
}

export interface LetterPlacedEvent {
  gameId: string;
  player: Player;
  position: {
    x: number;
    y: number;
  };
  letter: string;
}

export interface LetterRemovedEvent {
  gameId: string;
  playerId: Player;
  position: {
    x: number;
    y: number;
  };
}

export interface WordSubmittedEvent {
  gameId: string;
  player: Player;
  word: string;
  score: number;
  positions: Array<{
    x: number;
    y: number;
  }>;
}

export interface ConflictResolutionEvent {
  gameId: string;
  conflictType: "word" | "position";
  resolution: "accepted" | "rejected";
  details: {
    word?: string;
    position?: {
      x: number;
      y: number;
    };
  };
}

export interface ScoreUpdateEvent {
  gameId: string;
  player: Player;
  newScore: number;
  totalScore: number;
}

export interface TimerTickEvent {
  gameId: string;
  timeRemaining: number;
}

export interface GameEndedEvent {
  gameId: string;
  winner: Player;
  winnerScore: number;
  finalScores: Array<{
    playerId: string;
    score: number;
  }>;
}

export interface ConnectToLobbyEvent {
  player: Player;
  gameId: string;
}

export interface PlayerReadyEvent {
  player: Player;
  gameId: string;
}

export interface PlayerStakeConfirmedEvent {
  player: Player;
  gameId: string;
  paymentHash: string;
}

export interface StartGameEvent {
  player: Player;
  gameId: string;
}

export interface SubmitWordEvent {
  player: Player;
  gameId: string;
  word: string;
  path: Array<{ x: number; y: number }>;
  isNew: boolean;
}

export interface PlaceLetterEvent {
  player: Player;
  gameId: string;
  letter: string;
  x: number;
  y: number;
}

export interface RemoveLetterEvent {
  player: Player;
  gameId: string;
  x: number;
  y: number;
}

// Type map for all events
export type SocketEventMap = {
  player_joined: PlayerJoinedEvent;
  player_left: PlayerLeftEvent;
  game_update: GameUpdateEvent;
  game_started: GameStartedEvent;
  letter_placed: LetterPlacedEvent;
  letter_removed: LetterRemovedEvent;
  word_submitted: WordSubmittedEvent;
  conflict_resolution: ConflictResolutionEvent;
  score_update: ScoreUpdateEvent;
  timer_tick: TimerTickEvent;
  game_ended: GameEndedEvent;
  connect_to_lobby: ConnectToLobbyEvent;
  player_ready: PlayerReadyEvent;
  player_stake_confirmed: PlayerStakeConfirmedEvent;
  start_game: StartGameEvent;
  submit_word: SubmitWordEvent;
  place_letter: PlaceLetterEvent;
  remove_letter: RemoveLetterEvent;
};
