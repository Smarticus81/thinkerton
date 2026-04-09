// Thinkerton Command Center — Data Store

export type TeamMember = {
  id: string
  name: string
  initials: string
  role: string
  color: string
  gradient: string
}

export type TaskStatus = 'todo' | 'progress' | 'review' | 'done' | 'blocked'
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'

export type Task = {
  id: string
  title: string
  description: string
  owner: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
  tags: string[]
  deliverable: string
  verified: boolean
  milestoneId?: string
}

export type Milestone = {
  id: string
  title: string
  date: string
  description: string
  progress: number
  tasks: string[]
  stakeholders: string[]
}

export type BrainstormIdea = {
  id: string
  text: string
  author: string
  votes: number
  timestamp: number
  isAtlas?: boolean
}

export type BrainstormSession = {
  id: string
  title: string
  ideas: BrainstormIdea[]
  status: 'active' | 'archived'
  createdAt: number
}

export type NewsItem = {
  id: string
  title: string
  summary: string
  source: string
  timeAgo: string
  category: 'regulatory' | 'quality' | 'ai-compliance' | 'market'
  tags: string[]
  featured?: boolean
  atlasNote?: string
  relevance: 'high' | 'medium' | 'low'
}

export type ProcessNode = {
  id: string
  label: string
  description: string
  x: number
  y: number
  type: 'start' | 'process' | 'decision' | 'end'
  connections: string[]
  color: string
}

export type ProcessMap = {
  id: string
  title: string
  description: string
  nodes: ProcessNode[]
  createdAt: number
  updatedAt: number
}

export type ChatMessage = {
  id: string
  sender: 'atlas' | string
  text: string
  timestamp: number
}

// ─── Team Members ──────────────────────────────────────

export const team: TeamMember[] = [
  { id: 'terence', name: 'Terence', initials: 'TH', role: 'CEO & Co-Founder', color: 'hsl(225, 100%, 65%)', gradient: 'linear-gradient(135deg, hsl(225,100%,65%), hsl(245,80%,55%))' },
  { id: 'jon', name: 'Jon', initials: 'JK', role: 'CTO & Co-Founder', color: 'hsl(215, 90%, 60%)', gradient: 'linear-gradient(135deg, hsl(215,90%,60%), hsl(225,80%,50%))' },
  { id: 'umer', name: 'Umer', initials: 'UA', role: 'CPO & Co-Founder', color: 'hsl(270, 80%, 65%)', gradient: 'linear-gradient(135deg, hsl(270,80%,65%), hsl(290,70%,55%))' },
  { id: 'janice', name: 'Janice', initials: 'JL', role: 'COO & Co-Founder', color: 'hsl(165, 80%, 55%)', gradient: 'linear-gradient(135deg, hsl(165,80%,55%), hsl(180,70%,45%))' },
]

// ─── Tasks (Day 1 — genuine first-week priorities) ────

export const initialTasks: Task[] = [
  {
    id: 't1',
    title: 'Define product vision and 90-day roadmap',
    description: 'Align the team on what we\'re building, who it\'s for, and what the first shippable version looks like. Document the core value proposition and key differentiators.',
    owner: 'terence',
    status: 'todo',
    priority: 'critical',
    dueDate: '2026-03-18',
    tags: ['Strategy', 'Product'],
    deliverable: '',
    verified: false,
    milestoneId: 'm1',
  },
  {
    id: 't2',
    title: 'Set up development environment and CI/CD',
    description: 'Initialize the monorepo, configure CI/CD pipelines, set up staging and production environments. Choose and configure cloud infrastructure.',
    owner: 'jon',
    status: 'todo',
    priority: 'critical',
    dueDate: '2026-03-15',
    tags: ['Engineering', 'Infra'],
    deliverable: '',
    verified: false,
    milestoneId: 'm1',
  },
  {
    id: 't3',
    title: 'Conduct 10 customer discovery interviews',
    description: 'Interview potential customers (RA professionals, QA managers at medical device companies) to validate assumptions about pain points in regulatory compliance workflows.',
    owner: 'umer',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-03-25',
    tags: ['Research', 'Customer'],
    deliverable: '',
    verified: false,
    milestoneId: 'm1',
  },
  {
    id: 't4',
    title: 'Map the regulatory landscape and competitive analysis',
    description: 'Document the full regulatory framework landscape (EU MDR, FDA 510(k), ISO 13485, IEC 62304). Identify and analyze competitors: Greenlight Guru, Rimsys, Qualio, etc.',
    owner: 'janice',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-03-21',
    tags: ['Research', 'Market'],
    deliverable: '',
    verified: false,
    milestoneId: 'm1',
  },
  {
    id: 't5',
    title: 'Draft initial company operating agreement',
    description: 'Formalize co-founder equity splits, vesting schedules, decision-making framework, and IP assignment. Engage startup counsel for review.',
    owner: 'terence',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-03-20',
    tags: ['Legal', 'Operations'],
    deliverable: '',
    verified: false,
    milestoneId: 'm1',
  },
]

// ─── Milestones (genuine startup journey) ─────────────

export const milestones: Milestone[] = [
  {
    id: 'm1',
    title: 'Company Formation & Alignment',
    date: '2026-03-31',
    description: 'Incorporate the company, align on vision, set up foundational infrastructure, and complete initial customer research.',
    progress: 0,
    tasks: ['t1', 't2', 't3', 't4', 't5'],
    stakeholders: ['terence', 'jon', 'umer', 'janice'],
  },
  {
    id: 'm2',
    title: 'Problem Validation',
    date: '2026-05-15',
    description: 'Validate the core problem hypothesis through customer interviews, market research, and regulatory expert consultations. Define the initial product scope.',
    progress: 0,
    tasks: [],
    stakeholders: ['umer', 'janice', 'terence'],
  },
  {
    id: 'm3',
    title: 'MVP Build',
    date: '2026-07-31',
    description: 'Build the minimum viable product with core regulatory intelligence features. Focus on EU MDR compliance documentation workflows as the beachhead.',
    progress: 0,
    tasks: [],
    stakeholders: ['jon', 'umer'],
  },
  {
    id: 'm4',
    title: 'Closed Beta Launch',
    date: '2026-09-15',
    description: 'Launch with 5-10 design partners. Gather structured feedback, iterate on core workflows, validate willingness to pay.',
    progress: 0,
    tasks: [],
    stakeholders: ['terence', 'umer', 'janice'],
  },
  {
    id: 'm5',
    title: 'Pre-Seed Fundraise',
    date: '2026-10-31',
    description: 'Raise pre-seed round to fund 12-18 months of runway. Build pitch materials, develop financial model, begin investor outreach.',
    progress: 0,
    tasks: [],
    stakeholders: ['terence'],
  },
  {
    id: 'm6',
    title: 'Public Launch & First Revenue',
    date: '2027-01-31',
    description: 'Launch publicly, sign first paying customers, establish pricing model, and begin building the sales pipeline.',
    progress: 0,
    tasks: [],
    stakeholders: ['terence', 'umer', 'janice'],
  },
  {
    id: 'm7',
    title: 'Product-Market Fit',
    date: '2027-06-30',
    description: '20+ paying customers, clear retention metrics, repeatable sales motion, and evidence of product-market fit to support Seed fundraise.',
    progress: 0,
    tasks: [],
    stakeholders: ['terence', 'jon', 'umer', 'janice'],
  },
]

// ─── Brainstorm Sessions (fresh start) ────────────────

export const initialSessions: BrainstormSession[] = [
  {
    id: 'bs1',
    title: 'Core Product Differentiators',
    status: 'active',
    createdAt: Date.now(),
    ideas: [],
  },
]

// ─── Process Maps (for the new Workflows tab) ─────────

export const initialProcessMaps: ProcessMap[] = [
  {
    id: 'pm1',
    title: 'Example: Customer Onboarding',
    description: 'Template process map — delete or modify this to start building your own workflows.',
    nodes: [
      { id: 'pn1', label: 'Customer Signs Up', description: 'New customer creates account', x: 150, y: 150, type: 'start', connections: ['pn2'], color: 'var(--success)' },
      { id: 'pn2', label: 'Welcome Email', description: 'Automated welcome sequence', x: 380, y: 150, type: 'process', connections: ['pn3'], color: 'var(--accent)' },
      { id: 'pn3', label: 'Kickoff Call', description: 'Schedule and conduct onboarding call', x: 610, y: 150, type: 'process', connections: ['pn4'], color: 'var(--accent)' },
      { id: 'pn4', label: 'Setup Complete', description: 'Customer is fully onboarded', x: 840, y: 150, type: 'end', connections: [], color: 'var(--success)' },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

// ─── News Feed ─────────────────────────────────────────

export const initialNewsItems: NewsItem[] = [
  { id: 'n1', title: 'EU MDR Transitional Provisions Extended to 2028 for Legacy Devices', summary: 'The European Commission has published a regulation amending MDR 2017/745 to extend the transitional period for legacy devices.', source: 'Official Journal of the EU', timeAgo: '1d ago', category: 'regulatory', tags: ['MDR', 'EU Commission', 'Transition'], featured: true, atlasNote: 'This extension gives our target customers more breathing room, but actually increases demand for compliance tooling as they now have a firmer deadline.', relevance: 'high' },
  { id: 'n2', title: 'FDA Releases Updated Framework for AI/ML-Based SaMD', summary: 'The FDA has published its final guidance on a total product lifecycle approach for AI/ML-based Software as a Medical Device.', source: 'FDA.gov', timeAgo: '3d ago', category: 'ai-compliance', tags: ['FDA', 'AI/ML', 'SaMD'], featured: true, atlasNote: 'Directly relevant to how we classify our own product. The predetermined change control requirements affect our ML update methodology.', relevance: 'high' },
  { id: 'n3', title: 'ISO 13485:2025 Draft Standard Open for Comment', summary: 'The revised ISO 13485 quality management system standard is now open for public comment. Major changes include enhanced software validation requirements.', source: 'ISO.org', timeAgo: '4d ago', category: 'quality', tags: ['ISO 13485', 'QMS'], relevance: 'high' },
  { id: 'n4', title: 'Greenlight Guru Raises $100M Series C for Regulatory SaaS', summary: 'Medical device quality management platform Greenlight Guru has closed a $100M Series C. Plans to expand into AI-powered regulatory intelligence.', source: 'TechCrunch', timeAgo: '6d ago', category: 'market', tags: ['Competition', 'Funding'], relevance: 'high' },
  { id: 'n5', title: 'MDCG Publishes New Guidance on Clinical Evidence for AI Devices', summary: 'New guidance clarifies expectations for clinical evaluation, performance studies, and post-market clinical follow-up.', source: 'European Commission', timeAgo: '8d ago', category: 'regulatory', tags: ['MDCG', 'Clinical Evidence', 'AI'], relevance: 'medium' },
  { id: 'n6', title: 'UK MHRA Announces Sovereign AI Medical Device Pathway', summary: 'A new fast-track approval pathway for AI-based medical devices developed in the UK.', source: 'GOV.UK', timeAgo: '10d ago', category: 'regulatory', tags: ['MHRA', 'UK', 'AI'], relevance: 'medium' },
  { id: 'n7', title: 'Analysis: RegTech Market to Reach $30B by 2028', summary: 'AI-powered compliance tools identified as the key growth driver in healthcare and life sciences regulatory technology.', source: 'Grand View Research', timeAgo: '12d ago', category: 'market', tags: ['Market Analysis', 'RegTech'], relevance: 'low' },
]

// ─── Initial Chat Messages (empty — fresh start) ──────

export const initialMessages: ChatMessage[] = []
