import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  streamText,
  type LanguageModelUsage,
} from "ai";
import type { UIMessage } from "@ai-sdk/react";

export const maxDuration = 30;

// Create a new metadata type (optional for type-safety)
type MyMetadata = {
  totalUsage: LanguageModelUsage;
};

export type MyUIMessage = UIMessage<MyMetadata>;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = (await req.json()) as {
    messages: UIMessage[];
  };

  const result = streamText({
    model: openai("gpt-4.1"),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    messageMetadata: ({ part }) => {
      // Send total usage when generation is finished
      if (part.type === "finish") {
        return { totalUsage: part.totalUsage };
      }
    },
  });
}
