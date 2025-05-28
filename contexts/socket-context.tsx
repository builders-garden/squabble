import { env } from "@/lib/env";
import { SocketEventMap } from "@/types/socket-events";
import { createContext, useContext, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

type EventCallback<T> = (data: T) => void;

interface SocketContextType {
  socket: React.RefObject<Socket | null>;
  connect: () => void;
  disconnect: () => void;
  emit: <T extends keyof SocketEventMap>(
    key: T,
    data: SocketEventMap[T]
  ) => void;
  subscribe: <T extends keyof SocketEventMap>(
    event: T,
    callback: EventCallback<SocketEventMap[T]>
  ) => void;
  unsubscribe: <T extends keyof SocketEventMap>(
    event: T,
    callback: EventCallback<SocketEventMap[T]>
  ) => void;
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
  // Registry for event listeners with proper typing
  const listeners = useRef<{
    [K in keyof SocketEventMap]?: Array<EventCallback<SocketEventMap[K]>>;
  }>({});

  const subscribe = <T extends keyof SocketEventMap>(
    event: T,
    callback: EventCallback<SocketEventMap[T]>
  ) => {
    if (!listeners.current[event]) listeners.current[event] = [];
    (listeners.current[event] as Array<EventCallback<SocketEventMap[T]>>).push(
      callback
    );
  };

  const unsubscribe = <T extends keyof SocketEventMap>(
    event: T,
    callback: EventCallback<SocketEventMap[T]>
  ) => {
    if (!listeners.current[event]) return;
    (listeners.current[event] as Array<EventCallback<SocketEventMap[T]>>) = (
      listeners.current[event] as Array<EventCallback<SocketEventMap[T]>>
    ).filter((cb) => cb !== callback);
  };

  const handleEvent = <T extends keyof SocketEventMap>(
    event: T,
    data: SocketEventMap[T]
  ) => {
    if (listeners.current[event]) {
      (
        listeners.current[event] as Array<EventCallback<SocketEventMap[T]>>
      ).forEach((cb) => cb(data));
    }
  };

  const connect = () => {
    
    if (!socket.current) {
      socket.current = io(
        env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
        {
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        }
      );

      console.log("Socket connected", env.NEXT_PUBLIC_SOCKET_URL);

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
      (Object.keys(listeners.current) as Array<keyof SocketEventMap>).forEach(
        (event) => {
          socket.current!.on(event, (data: SocketEventMap[typeof event]) => {
            console.log("[SOCKET EVENT]", event, data);
            handleEvent(event, data);
          });
        }
      );
    }
  };

  const disconnect = () => {
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
    }
  };

  const emit = <T extends keyof SocketEventMap>(
    key: T,
    data: SocketEventMap[T]
  ) => {
    if (socket.current?.connected) {
      socket.current.emit(key, data);
      console.log(`Sent message: ${key}`, data);
    } else {
      console.log("Socket not connected. Attempting to reconnect...");
      connect();
      // Wait a short moment for connection to establish
      setTimeout(() => {
        if (socket.current?.connected) {
          socket.current.emit(key, data);
          console.log(`Sent message after reconnect: ${key}`, data);
        } else {
          console.warn(
            "Socket still not connected after reconnect attempt. Cannot send message."
          );
        }
      }, 1000);
    }
  };

  useEffect(() => {
    console.log("Connecting socket");
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
