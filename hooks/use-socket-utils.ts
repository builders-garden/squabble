import { useSocket } from "@/contexts/socket-context";
import { Player } from "@/types/socket-events";

export default function useSocketUtils() {
  const { emit, disconnect } = useSocket();

  const connectToLobby = (player: Player, gameId: string) => {
    emit("connect_to_lobby", { player, gameId });
  };

  const disconnectFromLobby = () => {
    disconnect();
  };

  const playerReady = (player: Player, gameId: string) => {
    emit("player_ready", { player, gameId });
  };

  const playerStakeConfirmed = (player: Player, gameId: string, paymentHash: string) => {
    emit("player_stake_confirmed", { player, gameId, paymentHash });
  };

  const startGame = (player: Player, gameId: string) => {
    emit("start_game", { player, gameId });
  };

  const submitWord = (player: Player, gameId: string, word: string, path: {x: number, y: number}[], isNew: boolean) => {
    emit("submit_word", { player, gameId, word, path, isNew });
  };

  const placeLetter = (
    player: Player,
    gameId: string,
    letter: string,
    x: number,
    y: number
  ) => {
    emit("place_letter", { player, gameId, letter, x, y });
  };

  const removeLetter = (player: Player, gameId: string, x: number, y: number) => {
    emit("remove_letter", { player, gameId, x, y });
  };
  
  const refreshAvailableLetters = (playerId: number, gameId: string) => {
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
  };
}
