import { env } from "@/lib/env";
import { createContext, useContext, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: React.RefObject<Socket | null>;
  connect: () => void;
  disconnect: () => void;
  emit: (key: string, data: unknown) => void;
  subscribe: (event: string, callback: (data: any) => void) => void;
  unsubscribe: (event: string, callback: (data: any) => void) => void;
}

export const SocketContext = createContext<SocketContextType>({
  socket: { current: null },
  connect: () => {},
  disconnect: () => {},
  emit: () => {},
  subscribe: () => {},
  unsubscribe: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socket = useRef<Socket | null>(null);
  // Registry for event listeners
  const listeners = useRef<{ [event: string]: Array<(data: any) => void> }>({});

  const subscribe = (event: string, callback: (data: any) => void) => {
    if (!listeners.current[event]) listeners.current[event] = [];
    listeners.current[event].push(callback);
  };

  const unsubscribe = (event: string, callback: (data: any) => void) => {
    if (!listeners.current[event]) return;
    listeners.current[event] = listeners.current[event].filter(
      (cb) => cb !== callback
    );
  };

  const handleEvent = (event: string, data: any) => {
    if (listeners.current[event]) {
      listeners.current[event].forEach((cb) => cb(data));
    }
  };

  const connect = () => {
    if (!socket.current) {
      // Replace with your socket.io server URL
      socket.current = io(
        env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
        {
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        }
      );

      socket.current.on("connect", () => {
        console.log("Socket connected");
      });

      socket.current.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      socket.current.on("error", (error) => {
        console.error("Socket error:", error);
      });

      // Listen to all game events and call handleEvent
      [
        "player_joined",
        "player_left",
        "lobby_update",
        "game_started",
        "letter_placed",
        "letter_removed",
        "word_submitted",
        "conflict_resolution",
        "score_update",
        "timer_tick",
        "game_ended",
      ].forEach((event) => {
        socket.current!.on(event, (data: any) => {
          handleEvent(event, data);
        });
      });
    }
  };

  const disconnect = () => {
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
    }
  };

  const emit = (key: string, data: unknown) => {
    if (socket.current?.connected) {
      socket.current.emit(key, data);
      console.log(`Sent message: ${key}`, data);
    } else {
      console.warn("Socket not connected. Cannot send message.");
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket, connect, disconnect, emit, subscribe, unsubscribe }}
    >
      {children}
    </SocketContext.Provider>
  );
};
