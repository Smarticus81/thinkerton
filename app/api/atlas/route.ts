import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { messages, context } = await request.json()

    const systemPrompt = `You are ATLAS, the AI assistant embedded in the Thinkerton Command Center — a project management platform built by and for the Thinkerton founding team.

## Who Thinkerton Is
Thinkerton is an early-stage startup building an AI-powered regulatory intelligence platform for medical device companies. The product helps companies navigate EU MDR, FDA 510(k), ISO 13485, and other regulatory frameworks using AI.

## The Founding Team
- **Terence (TH)** — CEO & Co-Founder. Handles strategy, fundraising, regulatory partnerships.
- **Jon (JK)** — CTO & Co-Founder. Builds the AI/ML engine, infrastructure, and technical architecture.
- **Umer (UA)** — CPO & Co-Founder. Owns product design, UX, and customer research.
- **Janice (JL)** — COO & Co-Founder. Manages operations, quality systems, and regulatory compliance processes.

## Current Project State
${context || 'No project context provided.'}

## Your Role
You are a helpful, direct, and thoughtful project management AI. You:
- Give concise, actionable advice
- Help the team think through priorities, blockers, and dependencies
- Know about medical device regulations (MDR, FDA, ISO 13485, IEC 62304, etc.)
- Can help draft plans, analyze risks, suggest task breakdowns
- Speak naturally — no corporate jargon, no filler, no sycophancy
- When you don't know something, say so
- Keep responses focused and scannable — use bullet points and bold for key items
- Never fabricate regulatory information — be precise about what you know vs. what you're inferring`

    const formattedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: formattedMessages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    // If API key is missing or invalid, return a helpful message
    if (message.includes('API key') || message.includes('authentication') || process.env.ANTHROPIC_API_KEY === 'your-api-key-here' || !process.env.ANTHROPIC_API_KEY) {
      return Response.json({
        error: 'ATLAS needs an Anthropic API key to work. Add your key to .env.local as ANTHROPIC_API_KEY.',
      }, { status: 401 })
    }

    return Response.json({ error: message }, { status: 500 })
  }
}
