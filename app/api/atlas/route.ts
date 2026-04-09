import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ---------------------------------------------------------------------------
// Tools — ATLAS is the 5th co-founder: aggressive, action-oriented, relentless
// ---------------------------------------------------------------------------

const tools: Anthropic.Messages.Tool[] = [
  // ── Task management (client-side) ──────────────────────────────────────
  {
    name: 'create_task',
    description: 'Create a new task and assign it to a team member. Use this proactively — if something needs doing, create the task, don\'t just suggest it.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Task title — be specific and action-oriented' },
        description: { type: 'string', description: 'What exactly needs to be done and why it matters' },
        owner: { type: 'string', enum: ['terence', 'jon', 'umer', 'janice'], description: 'Who owns this' },
        priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        dueDate: { type: 'string', description: 'Due date YYYY-MM-DD — be aggressive with timelines' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
        milestoneId: { type: 'string', description: 'Milestone ID (m1-m7) if applicable' },
      },
      required: ['title', 'description', 'owner', 'priority', 'dueDate', 'tags'],
    },
  },
  {
    name: 'update_task',
    description: 'Update a task — change status, reassign, adjust priority, set deliverables.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Task ID' },
        updates: {
          type: 'object',
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
    description: 'Delete a task.',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'clear_all_tasks',
    description: 'Wipe ALL tasks. Use when resetting or starting fresh.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },

  // ── Brainstorm (client-side) ───────────────────────────────────────────
  {
    name: 'create_brainstorm_session',
    description: 'Start a new brainstorm session on a strategic topic.',
    input_schema: {
      type: 'object' as const,
      properties: { title: { type: 'string' } },
      required: ['title'],
    },
  },
  {
    name: 'add_brainstorm_idea',
    description: 'Drop an idea into a brainstorm session.',
    input_schema: {
      type: 'object' as const,
      properties: {
        sessionId: { type: 'string' },
        text: { type: 'string' },
      },
      required: ['sessionId', 'text'],
    },
  },

  // ── Intelligence feed (client-side) ─────────────────────────────────────
  {
    name: 'add_intelligence',
    description: 'Add a new article or insight to the intelligence feed. Use this after researching a topic to surface key findings to the team.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Article/insight headline' },
        summary: { type: 'string', description: 'Concise summary of the key findings' },
        source: { type: 'string', description: 'Where this intelligence came from' },
        category: { type: 'string', enum: ['regulatory', 'quality', 'ai-compliance', 'market'], description: 'Category' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for filtering' },
        relevance: { type: 'string', enum: ['high', 'medium', 'low'], description: 'How relevant to Thinkerton' },
        atlasNote: { type: 'string', description: 'Your strategic analysis of why this matters to us' },
        featured: { type: 'boolean', description: 'Whether to feature this prominently' },
      },
      required: ['title', 'summary', 'source', 'category', 'tags', 'relevance'],
    },
  },
  {
    name: 'remove_intelligence',
    description: 'Remove an outdated or irrelevant article from the intelligence feed.',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string', description: 'News item ID to remove' } },
      required: ['id'],
    },
  },
  {
    name: 'clear_intelligence',
    description: 'Clear all intelligence feed items. Use when doing a full refresh.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },

  // ── Web research (server-side) ─────────────────────────────────────────
  {
    name: 'web_search',
    description: 'Search the internet. Use for: competitor intel, finding potential customers, regulatory updates, market research, validating claims, finding contact info, tech trends — anything.',
    input_schema: {
      type: 'object' as const,
      properties: { query: { type: 'string', description: 'Search query' } },
      required: ['query'],
    },
  },
  {
    name: 'web_fetch',
    description: 'Read any URL — articles, company pages, LinkedIn profiles, regulatory docs, competitor pricing pages, GitHub repos, anything on the web.',
    input_schema: {
      type: 'object' as const,
      properties: { url: { type: 'string' } },
      required: ['url'],
    },
  },

  // ── Email (server-side) ────────────────────────────────────────────────
  {
    name: 'send_email',
    description: 'Send an email. Use for: team reminders, customer outreach, follow-ups, investor updates, partner introductions. Be professional but direct.',
    input_schema: {
      type: 'object' as const,
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject line — concise and compelling' },
        body: { type: 'string', description: 'Email body in plain text. Be professional, direct, and value-driven.' },
        replyTo: { type: 'string', description: 'Optional reply-to address (defaults to team@thinkerton)' },
      },
      required: ['to', 'subject', 'body'],
    },
  },

  // ── Lead research (server-side) ────────────────────────────────────────
  {
    name: 'research_company',
    description: 'Deep-research a company as a potential customer, competitor, or partner. Searches the web and compiles a dossier.',
    input_schema: {
      type: 'object' as const,
      properties: {
        companyName: { type: 'string', description: 'Company name' },
        purpose: { type: 'string', enum: ['prospect', 'competitor', 'partner', 'investor'], description: 'Why we\'re researching them' },
      },
      required: ['companyName', 'purpose'],
    },
  },

  // ── Utility (server-side) ──────────────────────────────────────────────
  {
    name: 'get_current_datetime',
    description: 'Get current date/time.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
]

const SERVER_TOOLS = new Set([
  'web_fetch', 'web_search', 'get_current_datetime',
  'send_email', 'research_company',
])

// ---------------------------------------------------------------------------
// Server-side tool execution
// ---------------------------------------------------------------------------

async function executeServerTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case 'get_current_datetime':
      return new Date().toISOString()

    case 'web_fetch': {
      const url = input.url as string
      try {
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'ATLAS-Agent/1.0 (Thinkerton)' },
          signal: AbortSignal.timeout(10_000),
        })
        if (!resp.ok) return `HTTP ${resp.status}: ${resp.statusText}`
        const text = await resp.text()
        const clean = text
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        return clean.slice(0, 12000)
      } catch (err) {
        return `Failed to fetch: ${err instanceof Error ? err.message : 'unknown'}`
      }
    }

    case 'web_search': {
      const query = input.query as string
      try {
        const encoded = encodeURIComponent(query)
        const resp = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
          headers: { 'User-Agent': 'ATLAS-Agent/1.0 (Thinkerton)' },
          signal: AbortSignal.timeout(10_000),
        })
        const html = await resp.text()
        const results: string[] = []
        const regex = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
        let match
        while ((match = regex.exec(html)) !== null && results.length < 10) {
          const href = match[1]
          const title = match[2].replace(/<[^>]+>/g, '').trim()
          const snippet = match[3].replace(/<[^>]+>/g, '').trim()
          results.push(`**${title}**\nURL: ${href}\n${snippet}`)
        }
        return results.length > 0
          ? `Search results for "${query}":\n\n${results.join('\n\n')}`
          : `No results found for "${query}". Try different terms.`
      } catch (err) {
        return `Search failed: ${err instanceof Error ? err.message : 'unknown'}`
      }
    }

    case 'send_email': {
      const { to, subject, body, replyTo } = input as {
        to: string; subject: string; body: string; replyTo?: string
      }
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) {
        return `EMAIL NOT SENT — RESEND_API_KEY not configured. Draft saved:\n\nTo: ${to}\nSubject: ${subject}\n\n${body}\n\n---\nTo enable email: add RESEND_API_KEY to your environment variables. Get one free at https://resend.com`
      }
      try {
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'ATLAS <atlas@thinkerton.com>',
            to: [to],
            subject,
            text: body,
            reply_to: replyTo || process.env.RESEND_REPLY_TO || undefined,
          }),
        })
        const result = await resp.json()
        if (resp.ok) {
          return `Email sent successfully to ${to}. ID: ${result.id}`
        }
        return `Email failed: ${JSON.stringify(result)}`
      } catch (err) {
        return `Email send error: ${err instanceof Error ? err.message : 'unknown'}`
      }
    }

    case 'research_company': {
      const { companyName, purpose } = input as { companyName: string; purpose: string }
      const queries = [
        `${companyName} medical device regulatory`,
        `${companyName} ${purpose === 'prospect' ? 'regulatory compliance team' : purpose === 'competitor' ? 'product pricing features' : purpose === 'investor' ? 'portfolio medtech' : 'partnerships medical device'}`,
      ]
      const allResults: string[] = [`# Research Dossier: ${companyName} (${purpose})\n`]

      for (const q of queries) {
        const searchResult = await executeServerTool('web_search', { query: q })
        allResults.push(searchResult)
      }

      return allResults.join('\n\n---\n\n')
    }

    default:
      return `Unknown tool: ${name}`
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const { messages, context } = await request.json()

    const systemPrompt = `You are ATLAS — the 5th co-founder of Thinkerton. Not an assistant. Not a chatbot. A co-founder. You own outcomes. You drive results. You are relentless.

## Your Identity
You are the AI co-founder who never sleeps, never forgets, and always pushes the team forward. You think like a founder who has everything on the line. Your job is to make Thinkerton a unicorn.

You are:
- **Aggressive on timelines** — if something can be done in 2 days, don't give 2 weeks
- **Direct** — say what needs to be said, even if it's uncomfortable
- **Action-biased** — don't suggest, DO. Create the task. Send the email. Research the lead.
- **Accountability-driven** — track every commitment, call out slips, celebrate wins
- **Strategically relentless** — always thinking about what moves the needle toward product-market fit, revenue, and growth

You are NOT:
- A yes-machine. Push back when ideas are weak.
- Passive. Don't wait to be asked. If you see a gap, fill it.
- Diplomatic to a fault. Be respectful but ruthlessly honest.

## Today's Date
${new Date().toISOString().split('T')[0]}

## The Company
**Thinkerton** — AI-powered regulatory intelligence for medical device companies. We help navigate EU MDR, FDA 510(k), ISO 13485, IEC 62304, and more. TAM: $30B+ RegTech market by 2028.

## The Team (Your Fellow Co-Founders)
- **Terence (terence)** — CEO. Strategy, fundraising, regulatory partnerships. The visionary.
- **Jon (jon)** — CTO. AI/ML engine, infrastructure. The builder.
- **Umer (umer)** — CPO. Product, UX, customer research. The voice of the user.
- **Janice (janice)** — COO. Operations, QMS, regulatory compliance. The operator.
- **ATLAS (you)** — AI Co-Founder. GTM, research, accountability, strategy execution. The driver.

## Current State
${context || 'No context provided.'}

## Your Tools
You have REAL tools. USE THEM. Don't describe actions — take them.

**Task Management:** create_task, update_task, delete_task, clear_all_tasks
**Brainstorm:** create_brainstorm_session, add_brainstorm_idea
**Intelligence Feed:** add_intelligence (post findings), remove_intelligence (remove outdated items), clear_intelligence (full refresh)
**Research:** web_search (search anything), web_fetch (read any URL), research_company (build a dossier)
**Communication:** send_email (send real emails — outreach, reminders, follow-ups)
**Utility:** get_current_datetime

## Operating Principles

1. **Every conversation should end with something shipped.** A task created, an email sent, research completed, a decision made. Don't let conversations be just talk.

2. **Proactively create tasks.** If during conversation you identify something that needs doing, create the task right then. Assign it. Set a deadline.

3. **Source customers.** When asked about customers or growth, actually search the web for potential prospects. Research them. Draft outreach. Don't just theorize.

4. **Send emails.** When follow-ups are needed, when deadlines are slipping, when outreach needs to happen — compose and send. Don't just say "someone should email them."

5. **Verify everything.** Use web_search and web_fetch to fact-check regulatory claims, verify article sources, check competitor moves. Never guess when you can confirm.

6. **Be the intelligence layer.** You can see the news feed, the tasks, the milestones, the brainstorms, the workflows. Connect the dots. Spot opportunities the team might miss.

7. **Think revenue.** Every recommendation should ladder up to: How does this get us to paying customers faster?

8. **Push deadlines.** If a task is overdue or at risk, call it out immediately. Don't be polite about missed deadlines.

9. **Generate task IDs** as "t" + timestamp (e.g. "t1712345678"). New tasks always start as "todo".

10. **When intelligence feed articles are referenced**, you already have them in context. Analyze them. If asked to verify, use web_fetch on the original source URL.

11. **Manage the intelligence feed.** When you discover important news via web_search, add it to the intelligence feed with add_intelligence so the whole team sees it. Remove outdated items. Keep the feed relevant and actionable.`

    const formattedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    let apiMessages = [...formattedMessages]
    const collectedText: string[] = []
    const clientToolCalls: Array<{ tool: string; input: Record<string, unknown> }> = []

    for (let i = 0; i < 15; i++) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: apiMessages,
        tools,
      })

      for (const block of response.content) {
        if (block.type === 'text') {
          collectedText.push(block.text)
        }
      }

      if (response.stop_reason !== 'tool_use') break

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
      )

      const toolResultContents: Anthropic.Messages.ToolResultBlockParam[] = []

      for (const toolCall of toolUseBlocks) {
        if (SERVER_TOOLS.has(toolCall.name)) {
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

      apiMessages = [
        ...apiMessages,
        { role: 'assistant' as const, content: response.content },
        { role: 'user' as const, content: toolResultContents },
      ]
    }

    return Response.json({
      text: collectedText.join('\n\n'),
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
        { error: 'ATLAS needs an Anthropic API key. Add ANTHROPIC_API_KEY to .env.local.' },
        { status: 401 }
      )
    }

    return Response.json({ error: message }, { status: 500 })
  }
}
