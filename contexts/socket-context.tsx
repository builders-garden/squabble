"use client";

import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { io, Socket } from "socket.io-client";
import { env } from "@/lib/env";
import {
  ClientToServerEvents,
  EventCallback,
  ServerToClientEvents,
} from "@/types/socket";

export type SocketContextType = {
  socket: RefObject<Socket<ServerToClientEvents, ClientToServerEvents> | null>;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  emit: <T extends keyof ClientToServerEvents>(
    key: T,
    data: ClientToServerEvents[T],
  ) => void;
  subscribe: <T extends keyof ServerToClientEvents>(
    event: T,
    callback: EventCallback<ServerToClientEvents[T]>,
  ) => void;
  unsubscribe: <T extends keyof ServerToClientEvents>(
    event: T,
    callback: EventCallback<ServerToClientEvents[T]>,
  ) => void;
};

export const SocketContext = createContext<SocketContextType>({
  socket: { current: null },
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
  emit: () => {},
  subscribe: () => {},
  unsubscribe: () => {},
});

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const socket = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Registry for event listeners with proper typing
  const listeners = useRef<{
    [K in keyof ServerToClientEvents]?: Array<
      EventCallback<ServerToClientEvents[K]>
    >;
  }>({});

  const subscribe = <T extends keyof ServerToClientEvents>(
    event: T,
    callback: EventCallback<ServerToClientEvents[T]>,
  ) => {
    if (!listeners.current[event]) {
      listeners.current[event] = [];
    }

    // Add callback to listeners registry if not already present
    (
      listeners.current[event] as Array<EventCallback<ServerToClientEvents[T]>>
    ).push(callback);

    // If socket is connected, ensure we have a listener attached
    if (socket.current && socket.current.connected) {
      const existingListeners = socket.current.listeners(event);
      if (existingListeners.length === 0) {
        socket.current.on(event as any, (data: any) => {
          handleEvent(event as any, data);
        });
      }
    }
  };

  const unsubscribe = <T extends keyof ServerToClientEvents>(
    event: T,
    callback: EventCallback<ServerToClientEvents[T]>,
  ) => {
    if (!listeners.current[event]) return;

    (listeners.current[event] as Array<
      EventCallback<ServerToClientEvents[T]>
    >) = (
      listeners.current[event] as Array<EventCallback<ServerToClientEvents[T]>>
    ).filter((cb) => cb !== callback);

    // If no more listeners for this event, remove the socket listener
    if (
      socket.current &&
      socket.current.connected &&
      listeners.current[event] &&
      listeners.current[event].length === 0
    ) {
      socket.current.off(event);
      delete listeners.current[event];
    }
  };

  const handleEvent = <T extends keyof ServerToClientEvents>(
    event: T,
    data: ServerToClientEvents[T],
  ) => {
    if (listeners.current[event]) {
      (
        listeners.current[event] as Array<
          EventCallback<ServerToClientEvents[T]>
        >
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
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          forceNew: false,
          transports: ["websocket"],
        },
      );

      socket.current.on("connect", () => {
        console.log("Socket connected");
        setIsConnected(true);
      });

      socket.current.on("disconnect", (reason: string) => {
        console.log("Socket disconnected:", reason);
        setIsConnected(false);
      });

      // Attach listeners for events that were subscribed before socket connection
      (
        Object.keys(listeners.current) as Array<keyof ServerToClientEvents>
      ).forEach((event) => {
        // Check if we already have listeners for this event to avoid duplicates
        const existingListeners = socket.current!.listeners(event);
        if (existingListeners.length === 0) {
          socket.current!.on(event, ((
            data: ServerToClientEvents[typeof event],
          ) => {
            console.log("[SOCKET EVENT]", event, data);
            handleEvent(event, data);
          }) as any);
        }
      });
    } else if (!socket.current.connected) {
      socket.current.connect();
    }
  };

  const disconnect = () => {
    if (socket.current) {
      console.log("Disconnecting socket");
      socket.current.disconnect();
      socket.current = null;
    }
  };

  const emit = <T extends keyof ClientToServerEvents>(
    key: T,
    data: ClientToServerEvents[T],
  ) => {
    if (socket.current?.connected) {
      (socket.current as any).emit(key, data);
      console.log(`Sent message: ${key}`, data);
    } else {
      console.warn("Socket not connected. Attempting to reconnect...");
      connect();
      // Wait a short moment for connection to establish
      setTimeout(() => {
        if (socket.current?.connected) {
          (socket.current as any).emit(key, data);
          console.log(`Sent message after reconnect: ${key}`, data);
        } else {
          console.warn(
            "Socket still not connected after reconnect attempt. Retrying in 1s...",
          );
          // Try one more time after a longer delay
          setTimeout(() => {
            connect();
            if (socket.current?.connected) {
              (socket.current as any).emit(key, data);
              console.log(
                `Sent message after second reconnect attempt: ${key}`,
                data,
              );
            }
          }, 1000);
        }
      }, 100);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: not necessary to reconnect
  useEffect(() => {
    console.log("Connecting socket");
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connect,
        disconnect,
        emit,
        subscribe,
        unsubscribe,
      }}>
      {children}
    </SocketContext.Provider>
  );
};
