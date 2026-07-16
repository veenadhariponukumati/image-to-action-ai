import OpenAI from "openai";
import { ENV } from "./env";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!ENV.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  if (!_client) {
    _client = new OpenAI({ apiKey: ENV.openaiApiKey });
  }
  return _client;
}

export type LLMMessageContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } }
    >;

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: LLMMessageContent;
};

export type InvokeLLMParams = {
  messages: LLMMessage[];
  model?: string;
  response_format?: {
    type: "json_schema";
    json_schema: {
      name: string;
      strict?: boolean;
      schema: Record<string, unknown>;
    };
  };
};

export async function invokeLLM(params: InvokeLLMParams) {
  const client = getClient();
  return client.chat.completions.create({
    model: params.model ?? "gpt-4o-mini",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: params.messages as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response_format: params.response_format as any,
  });
}
