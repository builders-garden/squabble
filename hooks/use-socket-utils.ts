import {
  ConnectToLobbyEvent,
  PlaceLetterEvent,
  PlayerReadyEvent,
  PlayerStakeConfirmedEvent,
  PlayerStakeRefundedEvent,
  RefreshAvailableLettersEvent,
  RemoveLetterEvent,
  StartGameEvent,
  SubmitWordEvent,
} from "@/types/socket";
import { useSocket } from "./use-socket";

export default function useSocketUtils() {
  const { emit, disconnect } = useSocket();

  const connectToLobby = ({ player, gameId }: ConnectToLobbyEvent) => {
    emit("connect_to_lobby", { player, gameId });
  };

  const disconnectFromLobby = () => {
    disconnect();
  };

  const playerReady = ({ player, gameId }: PlayerReadyEvent) => {
    emit("player_ready", { player, gameId });
  };

  const playerStakeConfirmed = ({
    player,
    gameId,
    paymentHash,
    payerAddress,
  }: PlayerStakeConfirmedEvent) => {
    emit("player_stake_confirmed", {
      player,
      gameId,
      paymentHash,
      payerAddress,
    });
  };

  const playerStakeRefunded = ({
    player,
    gameId,
    transactionHash,
  }: PlayerStakeRefundedEvent) => {
    emit("player_stake_refunded", { player, gameId, transactionHash });
  };

  const startGame = ({ player, gameId }: StartGameEvent) => {
    emit("start_game", { player, gameId });
  };

  const submitWord = ({
    player,
    gameId,
    word,
    path,
    isNew,
    placedLetters,
  }: SubmitWordEvent) => {
    emit("submit_word", { player, gameId, word, path, isNew, placedLetters });
  };

  const placeLetter = ({ player, gameId, letter, x, y }: PlaceLetterEvent) => {
    emit("place_letter", { player, gameId, letter, x, y });
  };

  const removeLetter = ({ player, gameId, x, y }: RemoveLetterEvent) => {
    emit("remove_letter", { player, gameId, x, y });
  };

  const refreshAvailableLetters = ({
    playerId,
    gameId,
  }: RefreshAvailableLettersEvent) => {
    emit("refresh_available_letters", { playerId, gameId });
  };

  return {
    playerReady,
    startGame,
    submitWord,
    placeLetter,
    removeLetter,
    connectToLobby,
    disconnectFromLobby,
    playerStakeConfirmed,
    refreshAvailableLetters,
    playerStakeRefunded,
  };
}
