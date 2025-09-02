"use client";

import React from "react";
import { Provider } from "jotai";
import { useAtom, useSetAtom } from "jotai";
import FloatingChatSystem from "~/components/primitives/floating-chat-system";
import { chatSystemsAtom, addChatSystemAtom, removeChatSystemAtom } from "~/lib/atoms/chat-atoms";
import { Button } from "~/components/ui/button";
import { Plus, X } from "lucide-react";

function ChatSystemsManager() {
  const [chatSystems, setChatSystems] = useAtom(chatSystemsAtom);
  const addChatSystem = useSetAtom(addChatSystemAtom);
  const removeChatSystem = useSetAtom(removeChatSystemAtom);

  // Auto-remove systems with no sessions
  React.useEffect(() => {
    const systemsToRemove = chatSystems.filter(
      (system) => system.sessions.length === 0
    );
    systemsToRemove.forEach((system) => {
      removeChatSystem(system.id);
    });
  }, [chatSystems, removeChatSystem]);

  return (
    <div className="h-screen w-full bg-gray-50">
      {/* Control Panel */}
      <div className="fixed left-0 top-0 z-50 p-4">
        <div className="rounded-lg border bg-white p-4 shadow-md">
          <h3 className="mb-2 text-sm font-semibold">Chat Systems</h3>
          <Button
            onClick={() => addChatSystem()}
            size="sm"
            className="mb-2 w-full"
            disabled={chatSystems.length >= 4}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Chat System {chatSystems.length >= 4 && "(Max 4)"}
          </Button>
          <div className="space-y-1">
            {chatSystems.map((system, index) => (
              <div
                key={system.id}
                className="flex items-center justify-between rounded border p-2"
              >
                <span className="text-sm">System {index + 1}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => removeChatSystem(system.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Render all chat systems */}
      {chatSystems.map((system, index) => (
        <FloatingChatSystem
          key={system.id}
          system={system}
          systemId={system.id}
          systemIndex={index}
        />
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <Provider>
      <ChatSystemsManager />
    </Provider>
  );
}