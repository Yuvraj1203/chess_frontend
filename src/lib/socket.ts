import { io, type Socket } from "socket.io-client";

import { api, API_URL } from "./api";

let socket: Socket | null = null;

/**
 * Single shared Socket.IO connection, straight to the API origin. The auth
 * cookie lives on the frontend's domain, so every (re)connect first swaps it
 * for a short-lived socket token via the proxied REST API.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      autoConnect: false,
      auth: (cb) => {
        api<{ token: string }>("/auth/socket-token").then(
          ({ token }) => cb({ token }),
          () => cb({}),
        );
      },
    });
  }
  return socket;
}

/** Emit an event and resolve with the server's `{ok,data,error}` ack. */
export function emitAck<T = unknown>(
  event: string,
  payload: unknown,
  timeoutMs = 8000,
): Promise<T> {
  const s = getSocket();
  return new Promise<T>((resolve, reject) => {
    if (!s.connected) {
      reject(new Error("Not connected to the live server"));
      return;
    }
    s.timeout(timeoutMs).emit(
      event,
      payload,
      (err: Error | null, res?: { ok: boolean; data?: T; error?: string }) => {
        if (err) return reject(new Error("The server did not respond in time"));
        if (!res?.ok) return reject(new Error(res?.error ?? "Request failed"));
        resolve(res.data as T);
      },
    );
  });
}
