# AccessibilityAlly

[![Node](https://img.shields.io/badge/node-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Bolt for JavaScript](https://img.shields.io/badge/Bolt%20for%20JS-4.7-4A154B?logo=slack&logoColor=white)](https://docs.slack.dev/tools/bolt-js/)
[![Gemini](https://img.shields.io/badge/Gemini-2.0%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Biome](https://img.shields.io/badge/Biome-2.4-60A5FA?logo=biome&logoColor=white)](https://biomejs.dev)
[![GitHub](https://img.shields.io/badge/github-repo-blue?logo=github)](#)

Every Slack thread is written for the people already in the room — acronyms unexplained, decisions implied, links assumed. **AccessibilityAlly** is the quiet translator who joins late and catches you up: a PM dropped into `#backend-platform`, a new hire on day three, a screen-reader user skimming for the decision, an ESL teammate parsing the jargon. Pick a persona, hit a shortcut, and the thread arrives rewritten for *you* — bottom line first, acronyms defined, decisions and owners surfaced, with a glossary at the end.

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
  R -->|persona pm·exec·new_hire·plain| P[Save to prefs] --> M1[DM confirm]
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

| id         | for                                               |
| ---------- | ------------------------------------------------- |
| `pm`       | cross-functional visitor in a technical channel   |
| `exec`     | leader who needs the decision and the risk        |
| `new_hire` | someone with zero tribal knowledge                |
| `plain`    | plain-language, screen-reader & ESL friendly      |

---

## Run it

```sh
cp .env.sample .env   # fill in GOOGLE_API_KEY, SLACK_BOT_TOKEN, SLACK_APP_TOKEN
npm install
npm start
```
