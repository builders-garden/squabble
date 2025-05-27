import { useSocket } from "@/contexts/socket-context";

export default function useSocketUtils() {
  const { emit } = useSocket();

  const joinRoom = (playerId: string, roomId: string) => {
    emit("join_room", { playerId, roomId });
  };

  const leaveRoom = (playerId: string, roomId: string) => {
    emit("leave_room", { playerId, roomId });
  };

  const playerReady = (playerId: string, gameId: string) => {
    emit("player_ready", { playerId, gameId });
  };

  const startGame = (playerId: string, gameId: string) => {
    emit("start_game", { playerId, gameId });
  };

  const endGame = (gameId: string) => {
    emit("end_game", { gameId });
  };

  const submitWord = (playerId: string, gameId: string, word: string, path: {x: number, y: number}[], isNew: boolean) => {
    emit("submit_word", { playerId, gameId, word, path, isNew });
  };

  const placeLetter = (
    playerId: string,
    gameId: string,
    letter: string,
    x: number,
    y: number
  ) => {
    emit("place_letter", { playerId, gameId, letter, x, y });
  };

  const removeLetter = (playerId: string, gameId: string, x: number, y: number) => {
    emit("remove_letter", { playerId, gameId, x, y });
  };

  return {
    playerReady,
    startGame,
    endGame,
    submitWord,
    placeLetter,
    joinRoom,
    leaveRoom,
    removeLetter,
  };
}
