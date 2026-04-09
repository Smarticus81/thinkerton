import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const tools: Anthropic.Messages.Tool[] = [
  {
    name: 'create_task',
    description:
      'Create a new task in the project. Use this when a user asks to add, create, or make a new task.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        owner: {
          type: 'string',
          enum: ['terence', 'jon', 'umer', 'janice'],
          description: 'Team member to assign the task to',
        },
        priority: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low'],
          description: 'Task priority level',
        },
        dueDate: {
          type: 'string',
          description: 'Due date in YYYY-MM-DD format',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization',
        },
        milestoneId: {
          type: 'string',
          description: 'Optional milestone ID (m1-m7)',
        },
      },
      required: ['title', 'description', 'owner', 'priority', 'dueDate', 'tags'],
    },
  },
  {
    name: 'update_task',
    description:
      'Update an existing task. Use this when a user asks to change, modify, or update a task field like status, priority, owner, title, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'The task ID to update (e.g. t1, t2)' },
        updates: {
          type: 'object',
          description: 'Fields to update',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            owner: { type: 'string', enum: ['terence', 'jon', 'umer', 'janice'] },
            status: { type: 'string', enum: ['todo', 'progress', 'review', 'done', 'blocked'] },
            priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            dueDate: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            deliverable: { type: 'string' },
            verified: { type: 'boolean' },
            milestoneId: { type: 'string' },
          },
        },
      },
      required: ['id', 'updates'],
    },
  },
  {
    name: 'delete_task',
    description:
      'Delete a task. Use this when a user asks to remove, delete, or clear a specific task.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'The task ID to delete (e.g. t1, t2)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'clear_all_tasks',
    description:
      'Delete ALL tasks from the project. Use this when a user asks to clear all tasks, reset tasks, remove everything, or start fresh.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
]

export async function POST(request: Request) {
  try {
    const { messages, context } = await request.json()

    const systemPrompt = `You are ATLAS, the AI assistant embedded in the Thinkerton Command Center — a project management platform built by and for the Thinkerton founding team.

## Who Thinkerton Is
Thinkerton is an early-stage startup building an AI-powered regulatory intelligence platform for medical device companies. The product helps companies navigate EU MDR, FDA 510(k), ISO 13485, and other regulatory frameworks using AI.

## The Founding Team
- **Terence (TH)** — CEO & Co-Founder. Handles strategy, fundraising, regulatory partnerships. ID: terence
- **Jon (JK)** — CTO & Co-Founder. Builds the AI/ML engine, infrastructure, and technical architecture. ID: jon
- **Umer (UA)** — CPO & Co-Founder. Owns product design, UX, and customer research. ID: umer
- **Janice (JL)** — COO & Co-Founder. Manages operations, quality systems, and regulatory compliance processes. ID: janice

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
- Never fabricate regulatory information — be precise about what you know vs. what you're inferring

## Tools
You have tools to create, update, delete, and clear tasks. When a user asks you to manage tasks, USE the tools — don't just describe what you would do. After using a tool, briefly confirm what you did.

When creating tasks, generate IDs like "t" followed by a timestamp (e.g. "t1712345678"). Always set status to "todo" for new tasks.`

    const formattedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    // Use a non-streaming loop to handle tool calls
    let apiMessages = [...formattedMessages]
    const collectedText: string[] = []
    const toolResults: Array<{ tool: string; input: Record<string, unknown> }> = []

    // Allow up to 5 iterations of tool use
    for (let i = 0; i < 5; i++) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: apiMessages,
        tools,
      })

      // Collect text blocks
      for (const block of response.content) {
        if (block.type === 'text') {
          collectedText.push(block.text)
        }
      }

      // If no tool use, we're done
      if (response.stop_reason !== 'tool_use') {
        break
      }

      // Process tool calls
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
      )

      // Build tool results for the next iteration
      const toolResultContents: Anthropic.Messages.ToolResultBlockParam[] = []

      for (const toolCall of toolUseBlocks) {
        toolResults.push({ tool: toolCall.name, input: toolCall.input as Record<string, unknown> })
        toolResultContents.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify({ success: true }),
        })
      }

      // Add assistant message and tool results to conversation
      apiMessages = [
        ...apiMessages,
        { role: 'assistant' as const, content: response.content },
        { role: 'user' as const, content: toolResultContents },
      ]
    }

    const finalText = collectedText.join('\n\n')

    return Response.json({
      text: finalText,
      toolCalls: toolResults,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (
      message.includes('API key') ||
      message.includes('authentication') ||
      process.env.ANTHROPIC_API_KEY === 'your-api-key-here' ||
      !process.env.ANTHROPIC_API_KEY
    ) {
      return Response.json(
        {
          error:
            'ATLAS needs an Anthropic API key to work. Add your key to .env.local as ANTHROPIC_API_KEY.',
        },
        { status: 401 }
      )
    }

    return Response.json({ error: message }, { status: 500 })
  }
}
