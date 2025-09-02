"use client";

import { useSetAtom } from "jotai";
import { Button } from "~/components/ui/button";
import { X, Minus, MessageSquare } from "lucide-react";
import { cn } from "~/lib/utils";
import ConversationPromptInput from "./chatbot";
import {
  type ChatSystem,
  removeSessionAtom,
  toggleMinimizeAtom,
} from "~/lib/atoms/chat-atoms";

type FloatingChatSystemProps = {
  system: ChatSystem;
  systemId: string;
  systemIndex: number;
};

export default function FloatingChatSystem({
  system,
  systemId,
  systemIndex,
}: FloatingChatSystemProps) {
  const removeSession = useSetAtom(removeSessionAtom);
  const toggleMinimize = useSetAtom(toggleMinimizeAtom);

  const handleRemoveSession = (sessionId: string) => {
    removeSession({ systemId, sessionId });
  };

  const handleToggleMinimize = (sessionId: string) => {
    toggleMinimize({ systemId, sessionId });
  };

  // Calculate position from right based on system index
  // Each chat window is 384px (w-96) wide + 16px gap (px-4)
  // To adjust gap, change the 16 value below
  const gap = 4; // px-4 = 16px
  const rightPosition = systemIndex * (384 + gap);

  return (
    <>
      {/* Single Chat Window for this system */}
      {system.sessions.length > 0 && system.sessions[0] && (
        <div
          className="fixed bottom-0 z-40"
          style={{
            right: `${rightPosition}px`,
          }}
        >
          <ChatWindow
            id={system.sessions[0].id}
            minimized={system.sessions[0].minimized}
            onClose={() => handleRemoveSession(system.sessions[0].id)}
            onToggleMinimize={() => handleToggleMinimize(system.sessions[0].id)}
            position={systemIndex}
          />
        </div>
      )}
    </>
  );
}

type ChatWindowProps = {
  id: string;
  minimized: boolean;
  onClose: () => void;
  onToggleMinimize: () => void;
  position: number;
};

function ChatWindow({
  minimized,
  onClose,
  onToggleMinimize,
  position,
}: ChatWindowProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden border-l border-t bg-white shadow-xl transition-all duration-300",
        minimized ? "h-14 w-96" : "h-[600px] w-96",
      )}
    >
      {/* Header - clickable to toggle minimize/maximize */}
      <div
        className="flex h-14 cursor-pointer items-center justify-between border-b bg-muted/50 px-4 hover:bg-muted/70"
        onClick={onToggleMinimize}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="font-medium">Chat {position + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMinimize();
            }}
            className="h-8 w-8 rounded-sm"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="h-8 w-8 rounded-sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Content - Always mounted to preserve state */}
      <div
        className={cn(
          "relative flex h-full flex-1 flex-col overflow-hidden",
          minimized && "hidden",
        )}
      >
        <ConversationPromptInput />
      </div>
    </div>
  );
}
