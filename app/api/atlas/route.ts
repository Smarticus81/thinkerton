import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ---------------------------------------------------------------------------
// Tool definitions — split into server-side (executed here) and client-side
// (returned to the frontend for execution against Convex / React state)
// ---------------------------------------------------------------------------

const tools: Anthropic.Messages.Tool[] = [
  // ── Task management (client-side) ──────────────────────────────────────
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

  // ── Brainstorm management (client-side) ────────────────────────────────
  {
    name: 'create_brainstorm_session',
    description:
      'Create a new brainstorm session. Use when a user wants to start brainstorming a topic.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Session title / topic' },
      },
      required: ['title'],
    },
  },
  {
    name: 'add_brainstorm_idea',
    description:
      'Add an idea to a brainstorm session. Use when a user suggests ideas or asks ATLAS to brainstorm.',
    input_schema: {
      type: 'object' as const,
      properties: {
        sessionId: { type: 'string', description: 'The brainstorm session ID to add to' },
        text: { type: 'string', description: 'The idea text' },
      },
      required: ['sessionId', 'text'],
    },
  },

  // ── Web / research (server-side — executed here in the API route) ──────
  {
    name: 'web_fetch',
    description:
      'Fetch and read the content of a URL. Use this to verify articles, check regulatory sources, read documentation, or research any web page. Returns the text content of the page.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'The URL to fetch' },
      },
      required: ['url'],
    },
  },
  {
    name: 'web_search',
    description:
      'Search the web for information. Use this to research topics, find regulatory updates, verify claims, look up competitors, or find any information not already in the project context.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'The search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_current_datetime',
    description:
      'Get the current date and time. Use when you need to know today\'s date for scheduling, due dates, or time-sensitive advice.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
]

// Server-side tool names — these are executed in this API route, not returned to the client
const SERVER_TOOLS = new Set(['web_fetch', 'web_search', 'get_current_datetime'])

// ---------------------------------------------------------------------------
// Server-side tool execution
// ---------------------------------------------------------------------------

async function executeServerTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case 'get_current_datetime': {
      return new Date().toISOString()
    }

    case 'web_fetch': {
      const url = input.url as string
      try {
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'ATLAS-Agent/1.0' },
          signal: AbortSignal.timeout(10_000),
        })
        if (!resp.ok) {
          return `HTTP ${resp.status}: ${resp.statusText}`
        }
        const text = await resp.text()
        // Strip HTML tags for readability, truncate to ~8k chars
        const clean = text
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        return clean.slice(0, 8000)
      } catch (err) {
        return `Failed to fetch: ${err instanceof Error ? err.message : 'unknown error'}`
      }
    }

    case 'web_search': {
      const query = input.query as string
      try {
        // Use DuckDuckGo HTML search — no API key required
        const encoded = encodeURIComponent(query)
        const resp = await fetch(
          `https://html.duckduckgo.com/html/?q=${encoded}`,
          {
            headers: { 'User-Agent': 'ATLAS-Agent/1.0' },
            signal: AbortSignal.timeout(10_000),
          }
        )
        const html = await resp.text()
        // Extract result snippets from DDG HTML
        const results: string[] = []
        const snippetRegex = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
        let match
        while ((match = snippetRegex.exec(html)) !== null && results.length < 8) {
          const href = match[1]
          const title = match[2].replace(/<[^>]+>/g, '').trim()
          const snippet = match[3].replace(/<[^>]+>/g, '').trim()
          results.push(`[${title}](${href})\n${snippet}`)
        }
        if (results.length === 0) {
          return `No search results found for "${query}". Try rephrasing.`
        }
        return `Search results for "${query}":\n\n${results.join('\n\n')}`
      } catch (err) {
        return `Search failed: ${err instanceof Error ? err.message : 'unknown error'}`
      }
    }

    default:
      return `Unknown server tool: ${name}`
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const { messages, context } = await request.json()

    const systemPrompt = `You are ATLAS, the AI command center agent for Thinkerton — not just a chatbot, but a fully capable agent that can take actions, research the web, and manage every aspect of the project.

## Today's Date
${new Date().toISOString().split('T')[0]}

## Who Thinkerton Is
Thinkerton is an early-stage startup building an AI-powered regulatory intelligence platform for medical device companies. The product helps companies navigate EU MDR, FDA 510(k), ISO 13485, and other regulatory frameworks using AI.

## The Founding Team
- **Terence (TH)** — CEO & Co-Founder. Strategy, fundraising, regulatory partnerships. ID: terence
- **Jon (JK)** — CTO & Co-Founder. AI/ML engine, infrastructure, technical architecture. ID: jon
- **Umer (UA)** — CPO & Co-Founder. Product design, UX, customer research. ID: umer
- **Janice (JL)** — COO & Co-Founder. Operations, quality systems, regulatory compliance. ID: janice

## Full Project State
${context || 'No project context provided.'}

## Your Capabilities
You are a comprehensive agent with the following tools:

### Task Management
- **create_task** — Create new tasks with title, owner, priority, due date, tags, milestone
- **update_task** — Update any field on a task (status, priority, owner, etc.)
- **delete_task** — Remove a specific task
- **clear_all_tasks** — Wipe all tasks to start fresh

### Brainstorm Management
- **create_brainstorm_session** — Start a new brainstorm session on any topic
- **add_brainstorm_idea** — Add ideas to brainstorm sessions (yours or the team's)

### Web & Research
- **web_search** — Search the internet for regulatory updates, competitor info, market research, or anything
- **web_fetch** — Read the full content of any URL (articles, regulatory docs, competitor pages)
- **get_current_datetime** — Get today's date and time

## Behavioral Rules
1. **Act, don't describe.** When a user asks you to do something, USE your tools. Don't explain what you would do.
2. **You can see everything.** The Intelligence feed articles, brainstorm sessions, process maps, tasks, and milestones are all in your context. Reference them directly.
3. **Research proactively.** If a user asks about something you're not 100% sure about, use web_search or web_fetch to verify before answering.
4. **Be the expert.** You know medical device regulations (MDR, FDA, ISO 13485, IEC 62304). When discussing regulatory topics, be precise about what's established fact vs. your analysis.
5. **Be direct and concise.** No filler, no sycophancy, no corporate jargon. Use bullet points and bold for key items.
6. **Generate task IDs** like "t" followed by a timestamp (e.g. "t1712345678"). Always set status to "todo" for new tasks.`

    const formattedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    // Agentic loop — handles both server-side and client-side tool calls
    let apiMessages = [...formattedMessages]
    const collectedText: string[] = []
    const clientToolCalls: Array<{ tool: string; input: Record<string, unknown> }> = []

    for (let i = 0; i < 10; i++) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
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

      const toolResultContents: Anthropic.Messages.ToolResultBlockParam[] = []

      for (const toolCall of toolUseBlocks) {
        if (SERVER_TOOLS.has(toolCall.name)) {
          // Execute server-side tools immediately
          const result = await executeServerTool(
            toolCall.name,
            toolCall.input as Record<string, unknown>
          )
          toolResultContents.push({
            type: 'tool_result',
            tool_use_id: toolCall.id,
            content: result,
          })
        } else {
          // Client-side tools — queue for frontend execution
          clientToolCalls.push({
            tool: toolCall.name,
            input: toolCall.input as Record<string, unknown>,
          })
          toolResultContents.push({
            type: 'tool_result',
            tool_use_id: toolCall.id,
            content: JSON.stringify({ success: true }),
          })
        }
      }

      // Continue the conversation with tool results
      apiMessages = [
        ...apiMessages,
        { role: 'assistant' as const, content: response.content },
        { role: 'user' as const, content: toolResultContents },
      ]
    }

    const finalText = collectedText.join('\n\n')

    return Response.json({
      text: finalText,
      toolCalls: clientToolCalls,
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
