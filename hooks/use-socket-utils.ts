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
import { ClientToServerSocketEvents } from "@/types/socket/socket.enum";
import { useSocket } from "./use-socket";

export default function useSocketUtils() {
  const { emit, disconnect } = useSocket();

  const connectToLobby = ({ player, gameId }: ConnectToLobbyEvent) => {
    emit(ClientToServerSocketEvents.CONNECT_TO_LOBBY, { player, gameId });
  };

  const disconnectFromLobby = () => {
    disconnect();
  };

  const playerReady = ({ player, gameId }: PlayerReadyEvent) => {
    emit(ClientToServerSocketEvents.PLAYER_READY, { player, gameId });
  };

  const playerStakeConfirmed = ({
    player,
    gameId,
    paymentHash,
    payerAddress,
  }: PlayerStakeConfirmedEvent) => {
    emit(ClientToServerSocketEvents.PLAYER_STAKE_CONFIRMED, {
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
    emit(ClientToServerSocketEvents.PLAYER_STAKE_REFUNDED, {
      player,
      gameId,
      transactionHash,
    });
  };

  const startGame = ({ player, gameId }: StartGameEvent) => {
    emit(ClientToServerSocketEvents.START_GAME, { player, gameId });
  };

  const submitWord = ({
    player,
    gameId,
    word,
    path,
    isNew,
    placedLetters,
  }: SubmitWordEvent) => {
    emit(ClientToServerSocketEvents.SUBMIT_WORD, {
      player,
      gameId,
      word,
      path,
      isNew,
      placedLetters,
    });
  };

  const placeLetter = ({ player, gameId, letter, x, y }: PlaceLetterEvent) => {
    emit(ClientToServerSocketEvents.PLACE_LETTER, {
      player,
      gameId,
      letter,
      x,
      y,
    });
  };

  const removeLetter = ({ player, gameId, x, y }: RemoveLetterEvent) => {
    emit(ClientToServerSocketEvents.REMOVE_LETTER, { player, gameId, x, y });
  };

  const refreshAvailableLetters = ({
    playerId,
    gameId,
  }: RefreshAvailableLettersEvent) => {
    emit(ClientToServerSocketEvents.REFRESH_AVAILABLE_LETTERS, {
      playerId,
      gameId,
    });
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
