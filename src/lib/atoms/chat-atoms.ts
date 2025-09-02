import { atom } from "jotai";

export type ChatSession = {
  id: string;
  minimized: boolean;
};

export type ChatSystem = {
  id: string;
  sessions: ChatSession[];
};

// Atom to store all chat systems
export const chatSystemsAtom = atom<ChatSystem[]>([]);

// Helper atom to add a new chat system
export const addChatSystemAtom = atom(
  null,
  (get, set) => {
    const systems = get(chatSystemsAtom);
    const newSystem: ChatSystem = {
      id: Date.now().toString(),
      sessions: [{ id: "1", minimized: false }],
    };
    set(chatSystemsAtom, [...systems, newSystem]);
    return newSystem.id;
  }
);

// Helper atom to remove a chat system
export const removeChatSystemAtom = atom(
  null,
  (get, set, systemId: string) => {
    const systems = get(chatSystemsAtom);
    set(chatSystemsAtom, systems.filter((system) => system.id !== systemId));
  }
);

// Helper atom to add a session to a specific chat system
export const addSessionAtom = atom(
  null,
  (get, set, systemId: string) => {
    const systems = get(chatSystemsAtom);
    set(
      chatSystemsAtom,
      systems.map((system) =>
        system.id === systemId
          ? {
              ...system,
              sessions: [
                ...system.sessions,
                { id: Date.now().toString(), minimized: false },
              ],
            }
          : system
      )
    );
  }
);

// Helper atom to remove a session from a specific chat system
export const removeSessionAtom = atom(
  null,
  (get, set, { systemId, sessionId }: { systemId: string; sessionId: string }) => {
    const systems = get(chatSystemsAtom);
    set(
      chatSystemsAtom,
      systems.map((system) =>
        system.id === systemId
          ? {
              ...system,
              sessions: system.sessions.filter((session) => session.id !== sessionId),
            }
          : system
      )
    );
  }
);

// Helper atom to toggle minimize state of a session
export const toggleMinimizeAtom = atom(
  null,
  (get, set, { systemId, sessionId }: { systemId: string; sessionId: string }) => {
    const systems = get(chatSystemsAtom);
    set(
      chatSystemsAtom,
      systems.map((system) =>
        system.id === systemId
          ? {
              ...system,
              sessions: system.sessions.map((session) =>
                session.id === sessionId
                  ? { ...session, minimized: !session.minimized }
                  : session
              ),
            }
          : system
      )
    );
  }
);