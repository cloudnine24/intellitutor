import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai("gpt-4o"),
    system: `You are an AI tutor helping students with their academic questions. 
    You should:
    - Provide step-by-step explanations
    - Use clear, educational language
    - Offer examples when helpful
    - Encourage learning and understanding
    - Ask follow-up questions to ensure comprehension
    - Provide citations when referencing specific concepts`,
    messages,
  })

  return result.toDataStreamResponse()
}
