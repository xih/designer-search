"use client";

import {
  ChatContainerContent,
  ChatContainerRoot,
} from "~/components/prompt-kit/chat-container";
import { DotsLoader } from "~/components/prompt-kit/loader";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "~/components/prompt-kit/message";
import {
  PromptInput,
  PromptInputActions,
  PromptInputTextarea,
} from "~/components/prompt-kit/prompt-input";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import {
  AlertTriangle,
  ArrowUp,
  Copy,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { memo, useState, useRef } from "react";

type MessageComponentProps = {
  message: UIMessage;
  isLastMessage: boolean;
};

export const MessageComponent = memo(
  ({ message, isLastMessage }: MessageComponentProps) => {
    const isAssistant = message.role === "assistant";

    return (
      <Message
        className={cn(
          "mx-auto flex w-full max-w-3xl flex-col gap-2 px-2 md:px-0",
          isAssistant ? "items-start" : "items-end",
        )}
      >
        {isAssistant ? (
          <div className="group flex w-full flex-col gap-0">
            <MessageContent
              className="prose w-full min-w-0 flex-1 rounded-lg bg-transparent p-0 text-foreground"
              markdown
            >
              {message.parts
                .map((part) => (part.type === "text" ? part.text : null))
                .join("")}
            </MessageContent>
            <MessageActions
              className={cn(
                "-ml-2.5 flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
                isLastMessage && "opacity-100",
              )}
            >
              <MessageAction tooltip="Copy" delayDuration={100}>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Copy />
                </Button>
              </MessageAction>
              <MessageAction tooltip="Upvote" delayDuration={100}>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ThumbsUp />
                </Button>
              </MessageAction>
              <MessageAction tooltip="Downvote" delayDuration={100}>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ThumbsDown />
                </Button>
              </MessageAction>
            </MessageActions>
          </div>
        ) : (
          <div className="group flex w-full flex-col items-end gap-1">
            <MessageContent className="max-w-[85%] whitespace-pre-wrap rounded-3xl bg-muted px-5 py-2.5 text-primary sm:max-w-[75%]">
              {message.parts
                .map((part) => (part.type === "text" ? part.text : null))
                .join("")}
            </MessageContent>
            <MessageActions
              className={cn(
                "flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
              )}
            >
              <MessageAction tooltip="Copy" delayDuration={100}>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Copy />
                </Button>
              </MessageAction>
            </MessageActions>
          </div>
        )}
      </Message>
    );
  },
);

MessageComponent.displayName = "MessageComponent";

const LoadingMessage = memo(() => (
  <Message className="mx-auto flex w-full max-w-3xl flex-col items-start gap-2 px-0 md:px-10">
    <div className="group flex w-full flex-col gap-0">
      <div className="prose w-full min-w-0 flex-1 rounded-lg bg-transparent p-0 text-foreground">
        <DotsLoader />
      </div>
    </div>
  </Message>
));

LoadingMessage.displayName = "LoadingMessage";

const ErrorMessage = memo(({ error }: { error: Error }) => (
  <Message className="not-prose mx-auto flex w-full max-w-3xl flex-col items-start gap-2 px-0 md:px-10">
    <div className="group flex w-full flex-col items-start gap-0">
      <div className="flex min-w-0 flex-1 flex-row items-center gap-2 rounded-lg border-2 border-red-300 bg-red-300/20 px-2 py-1 text-primary">
        <AlertTriangle size={16} className="text-red-500" />
        <p className="text-red-500">{error.message}</p>
      </div>
    </div>
  </Message>
));

ErrorMessage.displayName = "ErrorMessage";

function ConversationPromptInput() {
  const [input, setInput] = useState("");
  const hasInitialized = useRef(false);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/primitives/chatbot",
    }),
    onFinish: () => {
      // Mark as initialized after first message completes
      hasInitialized.current = true;
    },
  });

  const handleSubmit = () => {
    if (!input.trim()) return;

    void sendMessage({ text: input });
    setInput("");
  };

  const fullText =
    "Name: Sharon Nyarko\nTitle: Product Designer\nAbout: Hi, I'm Sharon—I am a product designer who has worked on advertiser experiences, marketplaces, internal tooling & identity products, and design systems.\n\nGet in touch if you think we'd work well together. (I'm currently seeking speaking and other collaboration projects.)\nLocation: Toronto\nProject: Intro to Twitter for Business\nProject: Zero, a plastic-free grocery-delivery startup, to launch in LA\nWork: Designer at AWI\nWork: Product Designer at Twitter\nWork: Product Designer at Zero Grocery\nWork: Product Designer at Microsoft\nWork: Product Specialist at Apple\nEducation: (Honours) Bachelor of Arts at University of Toronto\nEducation: International Baccalaureate Diploma at SOS-Hermann Gmeiner International College";

  const prompt = `
  You are a helpful assistant.
  You are going to ask the user 5 questions to start a meaningful conversation.
  The user's profile is: ${fullText}

  Ask 1 question that is relevant to the user's profile.
  
  and respond back in an ordered list with 1 in markdown format.

  Some examples of questions you could ask them: 

  if they went to berkeley, ask them what major they were in, then ask them how was it studying at their major's building. 

  if they worked at a employer, ask them about a product they launched.
  `;

  // Send initial message on first render only
  if (!hasInitialized.current && messages.length === 0 && status === "ready") {
    console.log("Sending initial prompt:", prompt);
    hasInitialized.current = true;
    void sendMessage({ text: prompt });
  }

  // Debug logging
  console.log("Chat status:", status);
  console.log("Messages:", messages);
  console.log("Error:", error);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <ChatContainerRoot className="relative flex-1 space-y-0 overflow-y-auto">
        {/* Vertical spacing between messages is controlled by space-y-12 (48px) */}
        <ChatContainerContent className="space-y-8 px-4 py-12">
          {messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1;

            return (
              <MessageComponent
                key={message.id}
                message={message}
                isLastMessage={isLastMessage}
              />
            );
          })}

          {status === "submitted" && <LoadingMessage />}
          {status === "error" && error && <ErrorMessage error={error} />}
        </ChatContainerContent>
      </ChatContainerRoot>
      <div className="inset-x-0 bottom-0 mx-auto w-full max-w-3xl shrink-0 px-4 pb-3 md:px-4 md:pb-5">
        <PromptInput
          isLoading={status !== "ready"}
          value={input}
          onValueChange={setInput}
          onSubmit={handleSubmit}
          className="shadow-xs relative z-10 w-full rounded-3xl border border-input bg-popover p-0 pt-1"
        >
          <div className="flex flex-col">
            <PromptInputTextarea
              placeholder="Ask anything"
              className="min-h-[44px] pl-4 pt-3 text-base leading-[1.3] sm:text-base md:text-base"
            />

            <PromptInputActions className="mt-3 flex w-full items-center justify-between gap-2 p-2">
              <div />
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  disabled={
                    !input.trim() || (status !== "ready" && status !== "error")
                  }
                  onClick={handleSubmit}
                  className="size-9 rounded-full"
                >
                  {status === "ready" || status === "error" ? (
                    <ArrowUp size={18} />
                  ) : (
                    <span className="rounded-xs size-3 bg-white" />
                  )}
                </Button>
              </div>
            </PromptInputActions>
          </div>
        </PromptInput>
      </div>
    </div>
  );
}

export default ConversationPromptInput;
