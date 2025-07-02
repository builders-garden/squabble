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

  const setupEventListeners = () => {
    if (!socket.current) return;

    console.log(
      "Setting up event listeners for events:",
      Object.keys(listeners.current)
    );

    // Set up listeners for all registered events
    Object.entries(listeners.current).forEach(([event, callbacks]) => {
      // Remove any existing listeners first to prevent duplicates
      socket.current!.off(event);

      // Only set up listener if we have callbacks
      if (callbacks && callbacks.length > 0) {
        socket.current!.on(event, (data: any) => {
          console.log("[SOCKET EVENT]", event, data);
          (callbacks as Array<EventCallback<any>>).forEach((callback) =>
            callback(data)
          );
        });
      }
    });
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
        }
      );

      socket.current.on("connect", () => {
        console.log("Socket connected");
        setupEventListeners();
      });

      socket.current.on("reconnect", (attempt: number) => {
        console.log(`Socket reconnected after ${attempt} attempts`);
        setupEventListeners();
      });

      socket.current.on("disconnect", (reason: string) => {
        console.log("Socket disconnected:", reason);
      });

      socket.current.on("error", (error) => {
        console.error("Socket error:", error);
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
            "Socket still not connected after reconnect attempt. Retrying in 1s..."
          );
          // Try one more time after a longer delay
          setTimeout(() => {
            connect();
            if (socket.current?.connected) {
              socket.current.emit(key, data);
              console.log(
                `Sent message after second reconnect attempt: ${key}`,
                data
              );
            }
          }, 1000);
        }
      }, 100);
    }
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

  const subscribe = <T extends keyof SocketEventMap>(
    event: T,
    callback: EventCallback<SocketEventMap[T]>
  ) => {
    if (!listeners.current[event]) {
      listeners.current[event] = [];
    }

    // Add callback to listeners registry if not already present
    const callbacks = listeners.current[event] as Array<
      EventCallback<SocketEventMap[T]>
    >;
    if (!callbacks.includes(callback)) {
      callbacks.push(callback);
      console.log(`Subscribed to ${event}, total listeners:`, callbacks.length);

      // Set up socket listener if socket is connected
      if (socket.current?.connected) {
        setupEventListeners();
      }
    }
  };

  const unsubscribe = <T extends keyof SocketEventMap>(
    event: T,
    callback: EventCallback<SocketEventMap[T]>
  ) => {
    if (!listeners.current[event]) return;
    (listeners.current[event] as Array<EventCallback<SocketEventMap[T]>>) = (
      listeners.current[event] as Array<EventCallback<SocketEventMap[T]>>
    ).filter((cb) => cb !== callback);

    // If no more listeners for this event, remove the socket listener
    if (listeners.current[event]?.length === 0 && socket.current?.connected) {
      socket.current.off(event);
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
