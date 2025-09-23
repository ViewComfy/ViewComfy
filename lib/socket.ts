"use client";

import { io, Socket } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_CLOUD_WS_URL;

if (!URL) {
    throw new Error("NEXT_PUBLIC_CLOUD_WS_URL is not defined");
}

export const socket: Socket = io(URL, {
    autoConnect: false,
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
});
