# Context, Memory, and RAG for AI Coding Assistants

**Context is the scarcest resource in AI-assisted coding.** Despite Claude's 200K token window, research consistently shows that LLM performance degrades as context length increasesâ€”adding just 10% irrelevant content can reduce accuracy by 23%, and optimal results typically occur at 60-120K tokens. The tools dominating AI coding today (Cursor, Roo Code, Claude Code, Aider, Cline) have converged on similar solutions: markdown-based memory banks, hierarchical rule loading, intelligent retrieval, and aggressive context management.

This document synthesizes academic research, tool-specific implementations, and practitioner wisdom into actionable patterns for preventing memory bloat, optimizing retrieval, and maintaining effective AI assistance.

---

## Part 1: Context Window Fundamentals

### Why more context isn't better

The academic consensus is sobering: **context is a finite resource with diminishing marginal returns.** LLMs have an "attention budget" that depletes as tokens increase. The nÂ² pairwise relationships in transformer attention mean attention gets stretched thin at longer contexts.

**Critical findings from research:**

- **Position bias ("Lost in the Middle")**: LLM performance follows a U-shaped curveâ€”highest when information appears at the beginning or end of context, with significant degradation for middle-positioned content. This stems from causal attention bias favoring initial tokens and Rotary Positional Embedding decay reducing attention to distant tokens. Even "long-context" models exhibit this bias.
- **NoLiMa benchmark**: At 32K tokens, 11 of 12 tested models dropped below 50% of their short-context performance.
- **Optimal utilization**: Despite having 200K tokens available, research shows optimal performance at **60-75% utilization**. More context increases the chance of irrelevant information interfering with reasoning.

**Does this affect Claude 4.5?** Yes, but less severely. Claude models show the smallest degradation among tested models, and "thinking" modes perform significantly better on lengthy inputs. Claude 4.5 also includes native context awarenessâ€”the model receives explicit token budget information and can pace itself across long tasks.

### Strategic context placement

**Mitigation strategies that work:**

1. **Scratchpad technique**: Instruct Claude to extract relevant quotes before answeringâ€”yields **36% error reduction** in Anthropic's tests
2. **Attention sorting**: Perform initial decode, sort documents by attention weight, regenerate
3. **Contextual examples**: Provide 2-5 examples of correctly answered questions from the actual document
4. **Strategic placement**: Put instructions at the END (right before the question), system prompts at the BEGINNING

| Information Type    | Optimal Position             |
| ------------------- | ---------------------------- |
| System prompts      | Beginning                    |
| Background context  | Beginning                    |
| Retrieved documents | Middle (sorted by relevance) |
| Most important docs | End                          |
| Current task/query  | End                          |
| Instructions        | Very end                     |

### Context compression

Microsoft's **LLMLingua** series represents the leading approach to context compression:

- **LLMLingua**: Achieves **up to 20x compression** with minimal performance loss using perplexity-based token pruning
- **LongLLMLingua**: Specifically designed for long-context scenarios, delivering **21.4% performance boost** with 4x fewer tokens
- **LLMLingua-2**: **3-6x faster** than original, formulates compression as token classification

For code specifically, **skeletonization** works well: as budget decreases, preserve structure (class definitions, signatures, type hints) over implementation details. The key insight is that compressed prompts remain effective for LLMs even when "unreadable" to humans.

---

## Part 2: Memory Architecture and Persistence

### The universal file structure

Every major AI coding tool has converged on a remarkably similar memory architecture. The pattern uses a `memory-bank/` directory with **5-6 core markdown files**, each serving a distinct purpose:

```
project-root/
â”œâ”€â”€ memory-bank/
â”‚   â”œâ”€â”€ projectbrief.md      # Foundation: scope, goals, constraints (static)
â”‚   â”œâ”€â”€ productContext.md    # Why the project exists, problems solved (stable)
â”‚   â”œâ”€â”€ systemPatterns.md    # Architecture, design patterns, decisions (stable)
â”‚   â”œâ”€â”€ techContext.md       # Stack, setup, constraints (stable)
â”‚   â”œâ”€â”€ activeContext.md     # Current focus, recent changes (dynamic - PRUNE OFTEN)
â”‚   â””â”€â”€ progress.md          # Task status, blockers, next steps (dynamic - PRUNE OFTEN)
â”œâ”€â”€ CLAUDE.md                # Project "constitution" for Claude-based tools
â””â”€â”€ .cursor/rules/           # Cursor-specific hierarchical rules
```

The critical insight: **separate static context from dynamic context**. Files like `projectbrief.md` and `systemPatterns.md` rarely changeâ€”they establish baseline project understanding. But `activeContext.md` and `progress.md` accumulate rapidly and require regular pruning. Cursor Memory Bank reduces token usage by **70%** through hierarchical rule loading that only activates relevant rules for each task complexity level.

Roo Code and Cline add mode-specific rules (`.clinerules-code`, `.clinerules-architect`) that load different context based on whether you're designing, implementing, or debugging. Claude Code uses the simpler CLAUDE.md patternâ€”a single file that acts as persistent project memory, automatically included in every conversation.

### Memory extraction outperforms summarization

The 2024-2025 memory landscape has converged on tiered architectures mirroring human cognition:

| Memory Type       | Purpose               | Implementation             |
| ----------------- | --------------------- | -------------------------- |
| Working memory    | Current session       | Native context window      |
| Episodic memory   | Past interactions     | Vector store               |
| Semantic memory   | Facts and preferences | Knowledge graph + profiles |
| Procedural memory | How to perform tasks  | System prompts + rules     |

**Mem0** leads production implementations with **26% accuracy improvement** over OpenAI memory, 91% lower latency, and 90% token savings. Its key innovation is treating memory as extraction rather than summarizationâ€”discrete facts are stored and updated through ADD, UPDATE, DELETE, and NOOP operations.

**Zep** offers an alternative with temporal knowledge graphs, achieving **94.8%** on the DMR benchmark. Its bi-temporal data model tracks both when events occurred and when they were ingestedâ€”valuable for evolving codebases.

### Rotation and archival strategies

The memory bank pattern works because it includes **explicit archival and pruning mechanisms**. Cursor Memory Bank implements a command-driven workflow: `/van` â†’ `/plan` â†’ `/creative` â†’ `/build` â†’ `/reflect` â†’ `/archive`. The archive step moves completed task documentation into an `archive/` folder with task IDs, keeping active context lean.

**Token budgets matter enormously.** Research shows optimal context window utilization is **60-70%**â€”going beyond this yields diminishing returns. Cline implements automatic compaction at 80% context usage, triggering summarization that preserves decisions and code changes while removing completed tool outputs and verbose explanations. The formula:

```javascript
maxAllowedSize = Math.max(contextWindow - 40_000, contextWindow * 0.8);
```

This ensures either a 40K token buffer or 20% of context remains free for actual work.

**What gets pruned first, in order:**

1. Redundant conversation history and completed tool outputs
2. Intermediate debugging logs and verbose explanations
3. Stale file reads and completed searches
4. Superseded architectural discussions

**What gets preserved:**

1. Original task description and objectives
2. Architectural decisions and their rationale
3. Current code state and recent changes
4. Unresolved bugs and active blockers

Memory files should total **1.3k-2.2k tokens combined**; keep `activeContext.md` under 500 tokens.

### Roo Code Memory Bank implementation

The **Roo Code Memory Bank** (GitHub: GreatScottyMac/roo-code-memory-bank, 1.6k stars) directly addresses the challenge of maintaining project context across AI sessions.

**Implementation approach:**

1. Install Memory Bank configuration files
2. Configure mode-specific prompts (architect, code, debug, ask modes)
3. Create `projectBrief.md` in project root before initialization
4. Use `@` mentions to reference specific files

**Roo Code's native features complement this:**

- Configurable codebase indexing with choice of embedding providers
- Vector database configuration for semantic search
- `.rooignore` for excluding sensitive files
- Context limit configuration and automatic condensing
- Support for OpenAI, Claude, Gemini, and local models via Ollama

The **RooFlow extension** adds token optimization across five integrated modes (architecture, coding, testing, debugging, Q&A).

---

## Part 3: Code Retrieval and RAG

### AST-based chunking transforms retrieval quality

The most significant 2024-2025 advancement in code RAG is **cAST (Chunking via Abstract Syntax Trees)**, published in EMNLP 2025. Unlike naive text splitting that fragments functions mid-logic, AST-based chunking respects code structure by parsing source files into syntax trees and extracting semantically complete units.

**Measured improvements from cAST:**

- **5.5 point gain** on RepoEval with StarCoder2-7B
- **4.3 point improvement** in Recall@5
- **2.7 point gain** on SWE-bench for issue resolution

The implementation approach uses tree-sitter to parse code, recursively breaks large AST nodes into smaller chunks, and merges sibling nodes while respecting size limits. Available tools include **astchunk** (Python toolkit supporting Python, Java, C#, TypeScript) and **code-chunk** from supermemoryai.

**Optimal chunk configuration for code:**

| Parameter         | Recommendation                         |
| ----------------- | -------------------------------------- |
| Chunk size        | 400-512 tokens                         |
| Overlap           | 10-20%                                 |
| Context inclusion | Always add imports + class definitions |
| Initial retrieval | 100 candidates                         |
| Final top-K       | 5-10 chunks to LLM                     |

A crucial finding from Qodo's work with **10,000+ enterprise repositories**: providing incomplete code segments to LLMs increases hallucinations. Each chunk should include the class definition, constructor, and relevant imports alongside the method itselfâ€”making chunks self-contained.

### Embedding model selection

The 2024-2025 embedding landscape shows a surprising pattern: **general-purpose models now outperform code-specific models** like CodeBERT and GraphCodeBERT on code search tasks.

**Embedding model performance (Modal benchmarks, March 2025):**

| Model                         | MRR   | Recall@1 | Context    | Cost     |
| ----------------------------- | ----- | -------- | ---------- | -------- |
| Voyage Code-3                 | 97.3% | 95.0%    | 32K tokens | $0.06/1M |
| OpenAI text-embedding-3-small | 95.0% | 91.0%    | 8K tokens  | $0.02/1M |
| Cohere v3                     | 92.8% | 87.0%    | -          | -        |
| GraphCodeBERT                 | 50.9% | -        | -          | Free     |
| CodeBERT                      | 11.7% | -        | -          | Free     |

For a solo developer, **OpenAI text-embedding-3-small** offers the best valueâ€”95% MRR at one-third the cost. If code retrieval quality is paramount, Voyage Code-3's 32K context and 300+ language support justify the premium. For self-hosting, **CodeSage Large V2** or **Nomic Embed Code** provide strong open-weight alternatives.

### Hybrid search is non-negotiable for code

Pure vector search fails on code because identifiers, function names, and API signatures require exact lexical matching that embeddings can miss. IBM Research (2024) confirms that **three-way retrieval (BM25 + dense vectors + sparse vectors)** is optimal for RAG.

The recommended configuration weights semantic search slightly higher:

```
BM25 (sparse): 30-40%
Dense vectors: 60-70%
```

BM25 catches exact matches for `getUserById`, `AUTH_TOKEN`, or specific error messages, while dense embeddings capture semantic similarity for questions like "how does authentication work?" The combination is merged using Reciprocal Rank Fusion (RRF).

For reranking, **cross-encoder/ms-marco-MiniLM-L-12-v2** offers a good quality/speed tradeoff for code. The typical flow retrieves 100 candidates fast, then reranks to top 10-20 with higher precision before sending to the LLM.

### Industry trends: moving away from embeddings

Sourcegraph Cody initially used embeddings for vector retrieval but abandoned them due to privacy concerns (code sent to OpenAI), storage costs, and maintenance burden. They now use intent classification combined with local context sources (active file, open tabs, recently closed tabs). Claude Code takes a similar approachâ€”no embeddings, instead using primitives like `glob` and `grep` for just-in-time navigation that bypasses stale indexing issues.

The emerging pattern is **hybrid retrieval**: combine pre-computed semantic understanding with agentic "search as you go" rather than front-loading everything into context.

### What commercial tools reveal

Analyzing Cursor, Windsurf, and GitHub Copilot reveals common patterns:

**Cursor's approach:**

- Files chunked locally into semantic pieces
- Embeddings stored in Turbopuffer (only embeddings, no plaintext)
- Merkle trees for efficient re-indexing (syncs every 3 minutes)
- Code retrieved locally using obfuscated paths from vector search

**Windsurf/Codeium's innovation:**

- Proprietary **Riptide** engine achieves **200% improvement** in retrieval recall
- Specialized LLM evaluates code snippet relevance (not just vector similarity)
- Parallel inference across GPUs for speed

**GitHub Copilot:**

- Combines RAG with sophisticated non-neural code search
- Organization codebase indexing for enterprise
- Agent mode (2025) uses RAG powered by GitHub code search

The common thread: hybrid retrieval combining semantic embeddings with code-aware search, plus reranking for precision.

---

## Part 4: Session Management and Clean Slates

### Knowing when to start fresh

The single most important context management skill is **recognizing when to clear and start over**. Research from multiple sources converges on consistent triggers.

**Start a new conversation when:**

- A distinct task or feature is complete
- Context usage exceeds 50% of available tokens
- Debugging has exceeded ~20 messages without resolution
- You're switching to an unrelated area of the codebase
- The model starts "forgetting" earlier context or contradicting itself
- Responses become generic rather than project-specific

**Continue the existing conversation when:**

- Tasks are logically connected and build on prior work
- You're iterating on the same implementation (test-driven cycles)
- The conversation remains focused and coherent

Claude Code provides explicit commands: `/clear` wipes conversation history completely while CLAUDE.md remains accessible. `/compact` summarizes the conversation and starts fresh with the summary preloadedâ€”you can customize this with instructions like "summarize just the to-do items." Cursor auto-summarizes at ~95% context capacity.

The community has developed a practical heuristic: **"One task = one conversation."** As Simon Willison puts it: "Often the fix for a conversation that has stopped being useful is to wipe the slate clean and start again."

### Subagents for context isolation

For complex work, the subagent pattern provides context isolation without losing coordination. The main agent handles high-level planning while specialized subagents execute focused tasks with clean context windows. Each subagent may process 10,000+ tokens internally but returns only a **1,000-2,000 token condensed summary**.

Anthropic's research on their multi-agent system found subagents process **67% fewer tokens** compared to accumulating context in a single agent. Claude Code stores custom subagents in `.claude/agents/` for version control and reuse.

Git worktrees offer another isolation pattern for parallel features: create separate checkouts (`git worktree add ../project-feature-a feature-a`), launch independent Claude Code instances in each, and maintain complete code isolation while sharing git history.

**Key principle from Anthropic's engineering guidance:** "Use subagents to verify details or investigate questions early in a conversation to preserve context availability without much downside."

---

## Part 5: Practitioner Wisdom

### The DOs that actually matter

Community wisdom from Reddit, GitHub discussions, and practitioner blogs has crystallized into consistent recommendations:

**Tell the AI exactly what to do.** As Simon Willison puts it: "For production code my LLM usage is much more authoritarian: I treat it like a digital intern, hired to type code for me based on my detailed instructions." Provide function signatures, not vague requestsâ€”LLMs respond extremely well to precise specifications.

**Create specifications before coding.** Harper Reed's workflow generates detailed specs through brainstorming with a reasoning model, then creates structured prompts for implementation: `spec.md` â†’ `prompt_plan.md` â†’ `todo.md`. "You have to think about what the spec is for such a long time and so carefully."

**Read memory bank files at every session start.** Cline's documentation is explicit: "I MUST read ALL memory bank files at the start of EVERY taskâ€”this is not optional." This prevents context drift and ensures continuity.

**Use the Plan/Act pattern.** Ask for a plan first with the "think" keyword for extended thinking. Save the plan to a document. If implementation goes wrong, you can reset to this checkpoint without reconstructing everything.

**Add only relevant files to context.** "Just add those files to the chat. Usually when people want to add 'all the files' it's because they think it will give the LLM helpful context... Adding extra files will often distract or confuse the LLM." (Aider FAQ)

### The DON'Ts learned the hard way

**Don't reuse Composer/chat windows across tasks.** One task = one Composer. This is the single most common source of context pollution.

**Don't continue debugging beyond 20 messages.** If you're still stuck after 20 exchanges, the context is polluted. Start a new chat with a summary of what you've tried.

**Don't expect rules to persist automatically.** "As the context window moves, the AI forgets. No matter how well you write the rules, after a few messages, they're being ignored." Periodically reinforce rules with "remember the rules" or "read the rules again."

**Don't trust code without testing.** "The one thing you absolutely cannot outsource to the machine is testing that the code actually works. Your responsibility as a software developer is to deliver working systems." (Simon Willison)

**Don't switch models mid-conversation.** Stick to one model per conversationâ€”each has different context handling and switching causes confusion.

**Don't update memory files constantly during implementation.** Cline documentation specifies: "DO NOT update cline_docs after initializing your memory bank at the start of a task." Wait until task completion or major milestones.

---

## Part 6: Troubleshooting and Recovery

### Warning signs of context degradation

**Context pollution** creates measurable distance between original intent and current direction. The warning signs are consistent across tools:

- **The LLM keeps making the same class of mistakes** despite corrections
- **Logic breaks and functions stop working** as AI forgets earlier code
- **Confident hallucinations appear**â€”invented methods, nonexistent packages
- **Responses become vague or generic** instead of project-specific
- **Instructions from different tasks get mixed**â€”obsolete directives persist
- **Response latency increases** significantly for simple requests

Research documents "context rot": accuracy in recalling information decreases as tokens accumulate. One study found **42% of AI-generated code** contained references to nonexistent functions or APIs. Hallucinations increase when context is polluted or requirements conflict.

**Four context failure patterns (Drew Breunig):**

1. **Context Poisoning**: A hallucination enters context and gets repeatedly referenced
2. **Context Distraction**: Context grows so long the model over-focuses on it, ignoring training knowledge
3. **Context Confusion**: Superfluous information leads to low-quality responses
4. **Context Clash**: New information conflicts with existing context

### RAG-specific failure points

Research from Arxiv (2024) identifies where RAG systems fail:

1. **Missing content**: Knowledge base doesn't contain the answer
2. **Missed top ranked**: Correct answer retrieved but not in top-k
3. **Not in context**: Retrieved but not included in LLM prompt
4. **Not extracted**: LLM fails to use retrieved context
5. **Wrong format**: Answer correct but formatting wrong
6. **Incomplete**: Partial answer returned
7. **Incorrect specificity**: Too general or too specific

The key insight: "Validation of a RAG system is only feasible during operation. Robustness evolves rather than designed in." Build domain-specific test sets rather than relying on generic benchmarks.

### Recovery strategies

**For immediate relief**, start a fresh chat session. This "instantly restores speed" according to community reports. Use `/clear` in Claude Code or simply open a new conversation in Cursor.

**For memory bloat**, review and prune memory bank files aggressively. Keep only: current architectural decisions, active TODOs, recent progress. Remove: completed tasks, superseded decisions, stale context.

**For complete reset**, follow this procedure:

1. Export critical information: current task state, key decisions, active bugs
2. Delete all memory-bank files
3. Reinitialize with `mem:init` or `initialize memory bank`
4. Let AI scan project structure and regenerate context
5. **Critical**: Review generated files for accuracyâ€”misunderstandings propagate

**For performance crashes** (Cursor consuming 7GB+ RAM), a full restart is required: quit completely, clear workspace cache, delete `.cursor/` if necessary.

**The hard reset trigger**: If your AI-assisted coding is slower than doing it manually, stop. Reset the branch. Walk away. As one practitioner notes: "If you approach any limit, STOP, finalize docs, commit."

---

## Part 7: Implementation Roadmap

### Practical stack for solo developers

**Phase 1 - Essential (start here):**

```
Context: CLAUDE.md with project constraints, patterns, tech stack
Memory: status.md for session continuity
Indexing: Roo Code native indexing with OpenAI embeddings
```

Cost: ~$0-5/month

**Phase 2 - Enhanced:**

```
Embeddings: OpenAI text-embedding-3-small ($0.02/1M tokens)
Vector DB: ChromaDB (local) or Qdrant Docker
Framework: LlamaIndex for simpler RAG implementation
Memory: Mem0 for automatic fact extraction
Chunking: AST-based via astchunk or tree-sitter
```

Cost: ~$10-30/month

**Phase 3 - Advanced (if needed):**

```
Embeddings: Voyage Code-3 for maximum quality
Reranking: cross-encoder/ms-marco-MiniLM-L-12-v2
Graph DB: Neo4j for code relationships
Compression: LLMLingua-2 for context optimization
```

Cost: ~$30-75/month

### Quick-start code (LlamaIndex + ChromaDB)

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection("code_index")
vector_store = ChromaVectorStore(chroma_collection=collection)

documents = SimpleDirectoryReader("./src", recursive=True).load_data()
index = VectorStoreIndex.from_documents(documents, vector_store=vector_store)
query_engine = index.as_query_engine(similarity_top_k=5)
```

---

## The Meta-Lesson

The community consensus distills to a single principle from Simon Willison: "Most of the craft of getting good results out of an LLM comes down to managing its context."

Treat your AI assistant like a brilliant colleague with amnesia. Maintain excellent documentation. Provide precise, minimal context. Know when to start fresh. The tools are converging on similar solutions because the underlying constraintâ€”finite attention in finite context windowsâ€”is fundamental to how transformers work.

**The practitioners who report the best results share three habits:**

1. They start fresh conversations frequentlyâ€”far more often than feels necessary
2. They maintain persistent memory through version-controlled markdown files, not chat history
3. They treat context like a precious budget, adding only what's needed and pruning aggressively

Context window sizes will continue growing. But the research is clear: larger windows don't eliminate the need for context engineeringâ€”they just move the threshold. The patterns documented here will remain relevant because they address the fundamental challenge: helping a stateless system maintain coherent, focused assistance across complex, long-running projects.
