# AccessibilityAlly

[![Node](https://img.shields.io/badge/node-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Bolt for JavaScript](https://img.shields.io/badge/Bolt%20for%20JS-4.7-4A154B?logo=slack&logoColor=white)](https://docs.slack.dev/tools/bolt-js/)
[![Gemini](https://img.shields.io/badge/Gemini-2.0%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Biome](https://img.shields.io/badge/Biome-2.4-60A5FA?logo=biome&logoColor=white)](https://biomejs.dev)
[![GitHub](https://img.shields.io/badge/github-repo-blue?logo=github)](https://github.com/faketut/AccessibilityAlly)

Every Slack thread is written for the people already in the room — acronyms unexplained, decisions implied, links assumed. **AccessibilityAlly** is the quiet translator who joins late and catches you up: a PM dropped into `#backend-platform`, a new hire on day three, a screen-reader user skimming for the decision, an ESL teammate parsing the jargon. Pick a persona, hit a shortcut, and the thread arrives rewritten for *you* — bottom line first, acronyms defined, decisions and owners surfaced, with a glossary at the end.

---

## Architecture

```mermaid
flowchart TB
  subgraph slack["Slack workspace"]
    U[User]
    Shortcut["Message shortcut<br/>'Catch me up'"]
    Slash["Slash command<br/>/ally"]
    Mention["@mention / DM"]
    File["Image upload<br/>(file_shared)"]
    Home["App Home tab"]
  end

  subgraph ally["AccessibilityAlly (Bolt for JS, Socket Mode)"]
    Router["Listener router<br/>app.js + /listeners/index.js"]
    CatchUp["catch-me-up<br/>shortcut + modal + submit"]
    Cmd["/ally subcommands<br/>persona · plainify · help"]
    Chat["@mention / DM handler"]
    AltText["alt-text generator<br/>(file_shared)"]
    Classifier["thread state classifier"]
    Prefs[("user prefs JSON<br/>persona per user")]
    Sessions[("thread session store<br/>in-memory, TTL")]
  end

  subgraph ai["Gemini 2.0 Flash"]
    Text["Text generation<br/>+ persona system prompt"]
    Vision["Multimodal image<br/>understanding"]
    Tools["Function calling<br/>search_slack · fetch_jira_issue"]
  end

  subgraph external["External data"]
    SlackAPI["Slack Web API<br/>search.messages, conversations.replies, files.info"]
    Jira["Jira REST API"]
  end

  U --> Shortcut & Slash & Mention & File & Home
  Shortcut --> CatchUp
  Slash --> Cmd
  Mention --> Chat
  File --> AltText
  Home --> Prefs

  CatchUp --> Classifier --> Text
  CatchUp --> Text
  Cmd --> Text
  Chat --> Text
  AltText --> Vision
  Text -.tool calls.-> Tools
  Tools --> SlackAPI
  Tools --> Jira

  CatchUp --> Sessions
  Chat --> Sessions
  Cmd --> Prefs
  Chat --> Prefs

  Text --> Router
  Vision --> Router
  Router -->|ephemeral or threaded reply| U
```

---

## Workflows

### Catch me up on a thread

```mermaid
sequenceDiagram
  actor U as User
  participant S as Slack
  participant A as Ally
  participant G as Gemini

  U->>S: Right-click message → "Catch me up"
  S->>A: shortcut(catch_me_up)
  A->>S: views.open (persona modal)
  U->>S: Submit persona + optional focus
  S->>A: view_submission
  A->>S: conversations.replies
  A->>G: thread + persona prompt
  G-->>A: translated summary
  A->>S: chat.postEphemeral (only you)
```

### Slash command

```mermaid
flowchart LR
  U[/ally …/] --> R{subcommand}
  R -->|persona translate·brief·onboard·simplify| P[Save to prefs] --> M1[DM confirm]
  R -->|plainify &lt;text&gt;| G[Gemini rewrite] --> M2[Ephemeral reply]
  R -->|help| H[Usage hint]
```

### DM / @mention

```mermaid
flowchart LR
  M[DM or @mention] --> L[Load persona from prefs]
  L --> G[Gemini with persona system prompt]
  G --> R[Threaded reply with feedback buttons]
```

### App Home persona switch

```mermaid
flowchart LR
  H[Open App Home] --> V[Render persona radio + MCP status]
  V --> C[User picks persona] --> S[Save to prefs] --> V
```

---

## Personas

| id          | for                                              |
| ----------- | ------------------------------------------------ |
| `translate` | cross-functional PM visiting a technical channel |
| `brief`     | executive who needs the decision and the risk    |
| `onboard`   | new hire with zero tribal knowledge              |
| `simplify`  | plain-language, screen-reader & ESL friendly     |

---

## Run it

```sh
cp .env.sample .env   # fill in GOOGLE_API_KEY, SLACK_BOT_TOKEN, SLACK_APP_TOKEN
npm install
npm start
```
