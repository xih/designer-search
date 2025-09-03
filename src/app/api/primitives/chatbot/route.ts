import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log("=== CHATBOT API ROUTE CALLED ===");

  const { messages }: { messages: UIMessage[] } = (await req.json()) as {
    messages: UIMessage[];
  };

  console.log("Received messages:", JSON.stringify(messages, null, 2));
  console.log("Number of messages:", messages.length);

  const convertedMessages = convertToModelMessages(messages);
  console.log(
    "Converted messages:",
    JSON.stringify(convertedMessages, null, 2),
  );

  try {
    console.log("Creating streamText with model: gpt-4-turbo");

    const result = streamText({
      model: openai("gpt-4.1-nano"),
      system:
        "You are a helpful assistant with access to tools. ONLY use the getCurrentDate or getTime tools when users explicitly ask about dates, time, or current information. When asked to generate questions or have a conversation, respond directly with text without using any tools. When asked to generate questions for a user, create thoughtful, engaging questions that help start a meaningful conversation.",
      messages: convertedMessages,
      tools: {
        getTime: tool({
          description: "Get the current time in a specific timezone",
          inputSchema: z.object({
            timezone: z
              .string()
              .describe("A valid IANA timezone, e.g. 'Europe/Paris'"),
          }),
          execute: async ({ timezone }) => {
            try {
              const now = new Date();
              const time = now.toLocaleString("en-US", {
                timeZone: timezone,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              });

              return { time, timezone };
            } catch {
              return { error: "Invalid timezone format." };
            }
          },
        }),
        getCurrentDate: tool({
          description:
            "Get the current date and time with timezone information",
          inputSchema: z.object({}),
          execute: async () => {
            const now = new Date();
            return {
              timestamp: now.getTime(),
              iso: now.toISOString(),
              local: now.toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZoneName: "short",
              }),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              utc: now.toUTCString(),
            };
          },
        }),
      },
    });

    console.log("StreamText result created successfully");
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error in chatbot route:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response", details: error }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
