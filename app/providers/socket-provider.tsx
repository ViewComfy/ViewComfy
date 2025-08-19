"use client";

import { useAuth } from "@clerk/nextjs";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { socket } from "@/lib/socket";
import { S3FilesData } from "@/app/models/prompt-result";

enum InferEmitEventEnum {
  LogMessage = "infer_log_message",
  ErrorMessage = "infer_error_message",
  ExecutedMessage = "infer_executed_message",
  JoinRoom = "infer_join_room",
  ResultMessage = "infer_result_message",
}

interface SocketContextType {
  socket: Socket;
  isConnected: boolean;
  currentLog: IWSMessage | null;
  clearCurrentLog: () => void;
  setResultCallback: (callback: ((files: File[] | S3FilesData[]) => void) | null) => void;
  setErrorCallback: (callback: ((error: Error) => void) | null) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket,
  isConnected: false,
  currentLog: null,
  clearCurrentLog: () => { },
  setResultCallback: () => { },
  setErrorCallback: () => { },
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export interface IWSMessage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  prompt_id: string;
}

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken, isSignedIn } = useAuth();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [currentLog, setCurrentLog] = useState<IWSMessage | null>(null);
  const resultCallbackRef = useRef<((files: File[] | S3FilesData[]) => void) | null>(null);
  const errorCallbackRef = useRef<((error: Error) => void) | null>(null);

  const clearCurrentLog = () => {
    setCurrentLog(null);
  };

  const updateCurrentLog = (message: IWSMessage) => {
    setCurrentLog(message);
  };

  const setResultCallback = (callback: ((files: File[] | S3FilesData[]) => void) | null) => {
    resultCallbackRef.current = callback;
  };

  const setErrorCallback = (callback: ((error: Error) => void) | null) => {
    errorCallbackRef.current = callback;
  };

  useEffect(() => {
    // This effect is for registering event listeners and runs only once.
    const onConnect = () => {
      console.log("Socket connected");
      setIsConnected(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onDisconnect = (reason: string, details: any) => {
      console.log("Socket disconnected", reason, details);
      setIsConnected(false);
      if (reason !== "io client disconnect") {
        const msg = {
          prompt_id: "",
          data: `Socket disconnected: ${reason}`
        }
        updateCurrentLog(msg);
        throw new Error(`Socket disconnected unexpectedly: ${reason}`);
      }
    };

    const onLogMessage = (data: IWSMessage) => {
      // console.log(data);
      updateCurrentLog(data);
    };

    const onErrorMessage = (wsMsg: IWSMessage) => {
      console.error(`error: ${JSON.stringify(wsMsg)}`);
      const msg = {
        prompt_id: wsMsg.prompt_id,
        data: `${JSON.stringify(wsMsg)}`
      }
      updateCurrentLog(msg);
      if (errorCallbackRef.current) {
        errorCallbackRef.current(new Error(wsMsg.data));
      }
    };

    const onExecuteMessage = (data: IWSMessage) => {
      // console.log(`prompt executed: ${JSON.stringify(data)}`);
      const msg = {
        prompt_id: data.prompt_id,
        data: `Prompt executed, downloading the results...`
      }
      updateCurrentLog(msg);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onResultMessage = async (data: { [key: string]: any }) => {
      console.log("Result message received.");
      const msg = {
        prompt_id: data.prompt_id,
        data: `Prompt executed, downloading the results...`
      };
      updateCurrentLog(msg);
      if (data && resultCallbackRef.current) {
        const fileOutputs: S3FilesData[] = [];
        if (data.outputs) {
          for (const output of data.outputs) {
            if (output.hasOwnProperty("filepath")) {
              fileOutputs.push(new S3FilesData({ ...output }));
            }
          }
        }
        if (fileOutputs.length > 0) {
          resultCallbackRef.current(fileOutputs);
        }
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      const msg = {
        prompt_id: "",
        data: `Connection error: ${err.message}`
      }
      updateCurrentLog(msg);
      socket.disconnect();
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on(InferEmitEventEnum.LogMessage, onLogMessage);
    socket.on(InferEmitEventEnum.ErrorMessage, onErrorMessage);
    socket.on(InferEmitEventEnum.ExecutedMessage, onExecuteMessage);
    socket.on(InferEmitEventEnum.ResultMessage, onResultMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(InferEmitEventEnum.LogMessage, onLogMessage);
      socket.off(InferEmitEventEnum.ErrorMessage, onErrorMessage);
      socket.off(InferEmitEventEnum.ExecutedMessage, onExecuteMessage);
      socket.off(InferEmitEventEnum.ResultMessage, onResultMessage);
      socket.off('error', (error) => {
        console.error('Socket error:', error);
      });
    };
  }, []);

  useEffect(() => {
    // This effect handles connection based on authentication status.
    if (isSignedIn) {
      const connectSocket = async () => {
        const token = await getToken({ template: "long_token" });
        if (token) {
          socket.auth = { authorization: token };
          socket.connect();
        }
      };
      connectSocket();
    } else {
      socket.disconnect();
    }
  }, [isSignedIn, getToken]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, currentLog, clearCurrentLog, setResultCallback, setErrorCallback }}>
      {children}
    </SocketContext.Provider>
  );
};
