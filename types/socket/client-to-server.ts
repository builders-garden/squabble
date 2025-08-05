import { Player } from "./player";

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
  payerAddress: string;
}

export interface PlayerStakeRefundedEvent {
  player: Player;
  gameId: string;
  transactionHash: string;
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
  placedLetters: Array<{ letter: string; x: number; y: number }>;
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

export interface RefreshAvailableLettersEvent {
  gameId: string;
  playerId: number;
}

export type ClientToServerEvents = {
  connect_to_lobby: ConnectToLobbyEvent;
  player_ready: PlayerReadyEvent;
  player_stake_confirmed: PlayerStakeConfirmedEvent;
  player_stake_refunded: PlayerStakeRefundedEvent;
  start_game: StartGameEvent;
  submit_word: SubmitWordEvent;
  place_letter: PlaceLetterEvent;
  remove_letter: RemoveLetterEvent;
  refresh_available_letters: RefreshAvailableLettersEvent;
};
