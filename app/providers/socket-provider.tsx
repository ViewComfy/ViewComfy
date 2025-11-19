"use client";

import { useAuth } from "@clerk/nextjs";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { socket } from "@/lib/socket";
import { S3FilesData } from "@/app/models/prompt-result";
import { useWorkflowData } from "@/app/providers/workflows-data-provider";
import { IWorkflowResult } from "@/app/interfaces/workflow-history";

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
  currentLog: ICurrentLog | null;
}

const SocketContext = createContext<SocketContextType>({
  socket,
  isConnected: false,
  currentLog: null,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export interface IWSMessage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  prompt_id: string;
}

export interface ICurrentLog {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prompt_id: string]: any;
}

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken, isSignedIn } = useAuth();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [currentLog, setCurrentLog] = useState<ICurrentLog | null>(null);
  const { addCompletedWorkflow } = useWorkflowData();

  const updateCurrentLog = (message: IWSMessage) => {
    const updatedLog = { ...currentLog };
    if (message.prompt_id) {
      updatedLog[message.prompt_id] = message.data;
    }
    setCurrentLog(updatedLog);
  };

  useEffect(() => {
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
      }
    };

    const onLogMessage = (data: IWSMessage) => {
      updateCurrentLog(data);
    };

    const onErrorMessage = (wsMsg: IWSMessage) => {
      console.error(`error: ${JSON.stringify(wsMsg)}`);
      // const msg = {
      //   prompt_id: wsMsg.prompt_id,
      //   data: `${JSON.stringify(wsMsg)}`
      // };
      // updateCurrentLog(msg);
    };

    const onExecuteMessage = (data: IWSMessage) => {
      // console.log(`prompt executed: ${JSON.stringify(data)}`);
      const msg = {
        prompt_id: data.prompt_id,
        data: `Prompt executed, downloading the results...`
      }
      updateCurrentLog(msg);
    };

     
    const onResultMessage = async (data: {
      prompt_id: string,
      completed: boolean,
      status: string,
      execution_time_seconds: number,
      prompt: {
        prompt_id: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any,
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any
    }) => {
      const msg = {
        prompt_id: data.prompt_id,
        data: `Prompt executed, downloading the results...`
      };
      updateCurrentLog(msg);
      if (data) {
        const fileOutputs: S3FilesData[] = [];
        if (data.outputs) {
          for (const output of data.outputs) {
            if (output.hasOwnProperty("filepath")) {
              fileOutputs.push(new S3FilesData({ ...output, contentType: output.content_type }));
            }
          }
        }

        const result: IWorkflowResult = {
          completed: data.completed,
          executionTimeSeconds: data.execution_time_seconds,
          outputs: fileOutputs,
          prompt: { ...data.prompt, promptId: data.prompt_id },
          promptId: data.prompt_id,
          status: data.status,
          errorData: data.error_data

        }
        addCompletedWorkflow(result);
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
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on(InferEmitEventEnum.LogMessage, onLogMessage);
    socket.on(InferEmitEventEnum.ErrorMessage, onErrorMessage);
    socket.on(InferEmitEventEnum.ExecutedMessage, onExecuteMessage);
    socket.on(InferEmitEventEnum.ResultMessage, onResultMessage);

    socket.io.on("reconnect_attempt", async () => {
      try {
        const token = await getToken({ template: "long_token" });
        socket.auth = { authorization: token ?? "" };
      } catch (e) {
        console.error("Failed to refresh token on reconnect_attempt:", e);
      }
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(InferEmitEventEnum.LogMessage, onLogMessage);
      socket.off(InferEmitEventEnum.ErrorMessage, onErrorMessage);
      socket.off(InferEmitEventEnum.ExecutedMessage, onExecuteMessage);
      socket.off(InferEmitEventEnum.ResultMessage, onResultMessage);
      socket.off('error');
      socket.io.off("reconnect_attempt");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const connectWithAuth = async () => {
      if (!isSignedIn) return;
      try {
        const token = await getToken({ template: "long_token" });
        if (token) {
          socket.auth = { authorization: token };
          socket.connect(); // built-in reconnection will handle further attempts
        }
      } catch (error) {
        console.error('Error getting token for socket connection:', error);
      }
    };

    if (isSignedIn && !isConnected) {
      connectWithAuth();
    }

    if (!isSignedIn) {
      socket.disconnect();
    }

  }, [isSignedIn, getToken, isConnected]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, currentLog }}>
      {children}
    </SocketContext.Provider>
  );
};
