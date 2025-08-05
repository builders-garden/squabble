import { Player } from "./player";

export interface PlayerJoinedEvent {
  player: Player;
  gameId: string;
}

export interface PlayerLeftEvent {
  playerId: number;
  gameId: string;
}

export interface GameUpdateEvent {
  gameId: string;
  players: Array<Player>;
  status: "pending" | "ready" | "finished";
}

export interface GameFullEvent {
  gameId: string;
  players: Array<Player>;
}

export interface GameStartedEvent {
  gameId: string;
  board: string[][];
  timeRemaining: number;
  players: Array<Player>;
  startTime: number;
  endTime: number;
}

export interface RefreshedAvailableLettersEvent {
  gameId: string;
  players: Array<Player>;
  playerId: number;
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
  words: string[];
  score: number;
  path: Array<{
    x: number;
    y: number;
  }>;
  board: string[][];
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
  players: Array<Player>;
}

export interface GameLoadingEvent {
  gameId: string;
  title: string;
  body: string;
}

export interface WordNotValidEvent {
  gameId: string;
  player: Player;
  word: string;
  board: string[][];
  path: Array<{ x: number; y: number }>;
}

export interface AdjacentWordsNotValidEvent {
  gameId: string;
  player: Player;
  word: string;
  board: string[][];
  path: Array<{ x: number; y: number }>;
}

// Type map for all events
export type ServerToClientEvents = {
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
  refreshed_available_letters: RefreshedAvailableLettersEvent;
  word_not_valid: WordNotValidEvent;
  adjacent_words_not_valid: AdjacentWordsNotValidEvent;
  game_loading: GameLoadingEvent;
  game_full: GameFullEvent;
};
