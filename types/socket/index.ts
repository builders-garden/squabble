export * from "./client-to-server";
export * from "./server-to-client";
export * from "./player";

export type EventCallback<T> = (data: T) => void;
