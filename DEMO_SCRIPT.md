# AccessibilityAlly — 3-Minute Demo Video Script

A beat-by-beat shooting script for the hackathon submission video. Target
runtime **3:00**. Each beat lists the on-screen action and the voiceover
(VO) line to read over it. Times are cumulative.

> Setup (channel + staged thread + tokens) is documented separately in
> [DEMO.md](DEMO.md). This script assumes the app is already running in
> Socket Mode and you are signed into the demo workspace.

---

## Pre-roll checklist (do **before** you hit record)

- [ ] `npm start` — Bolt app is up, no error logs.
- [ ] Demo channel `#backend-platform` is open with the staged dense thread
      pinned to the top.
- [ ] App Home tab for **AccessibilityAlly** is preloaded in a second tab.
- [ ] A screenshot/chart file is on the desktop, ready to drag-drop.
- [ ] Slash command focus: click into the channel composer once so `/ally`
      autocompletes on the first keystroke.
- [ ] Mode is reset to `translate` (the default) in App Home.
- [ ] Notifications muted, DM list scrolled to the bot at the top.

---

## Script

### 0:00 – 0:15 · Cold open: the problem

| On screen | VO |
| --- | --- |
| Scroll the dense `#backend-platform` thread fast. Pause on a line with acronyms (`KAN-5`, `RCA`, `canary`). | *“Every Slack thread is written for the people already in the room. Acronyms unexplained. Decisions implied. If you joined late — a PM, a new hire, a screen-reader user — you are doing the translation in your head.”* |

### 0:15 – 0:25 · Name the agent

| On screen | VO |
| --- | --- |
| Cut to App Home for **AccessibilityAlly**. Mode radio is visible. | *“AccessibilityAlly is a Slack agent that rewrites the thread for **you**. Pick a mode, hit a shortcut, get the version you can actually read.”* |

### 0:25 – 1:05 · Beat 1 — Catch me up (the hero flow)

| On screen | VO |
| --- | --- |
| Back to the thread. Right-click the top message → **More message shortcuts → Catch me up**. | *“Right-click any message, choose ‘Catch me up’.”* |
| Modal opens. Pick **Translate — cross-functional PM**. Type a focus question: `what is blocking the auth rollout?` Submit. | *“Pick a mode — I’m a PM visiting from another team — and optionally tell it what I care about.”* |
| Ephemeral reply renders: TL;DR → Decisions → Blockers → Glossary. Hover the glossary. | *“The reply is ephemeral, only I see it. Bottom line first. Decisions and owners surfaced. Every acronym defined in a glossary at the end. Same thread, rewritten for me.”* |

### 1:05 – 1:30 · Beat 2 — Switch the mode, same thread

| On screen | VO |
| --- | --- |
| Run `/ally mode brief`. Confirmation appears. | *“Now I’m an exec with thirty seconds.”* |
| Run **Catch me up** again on the same message. Pick **Brief — executive**. | |
| Ephemeral reply shows the same thread compressed to two bullets + `DECISION NEEDED:`. | *“Same thread, same data — two bullets, the dollar impact, the decision needed. Mode changes the summary, not just the wording.”* |

### 1:30 – 1:55 · Beat 3 — MCP tool calls (Slack RTS + Jira)

| On screen | VO |
| --- | --- |
| Open the bot DM. Type: `what's the status of KAN-5 and any related conversations this week?` | *“Ally is an agent, not a one-shot summarizer.”* |
| Reply streams in. Highlight the section that quotes Jira (status, assignee) and the section that cites a message from another channel. | *“Under the hood it calls Slack’s Real-Time Search to pull in related messages across channels, and the Jira MCP for ticket state — then writes one answer with sources.”* |

### 1:55 – 2:15 · Beat 4 — Plain-language rewrite

| On screen | VO |
| --- | --- |
| In any channel, run `/ally plainify We need to revert the canary before the RCA lands or we'll page the on-call again.` | *“For one-off jargon, ‘plainify’ rewrites a single line in your current mode.”* |
| Ephemeral reply: short sentences, defined acronyms. | *“Short sentences. Active voice. Every acronym defined. Screen-reader and ESL friendly by default.”* |

### 2:15 – 2:35 · Beat 5 — Image alt-text on upload

| On screen | VO |
| --- | --- |
| Drag a chart/screenshot into the channel and send. | *“Accessibility isn’t a separate feature — it’s in the workflow.”* |
| Ally posts a short alt-text reply in the thread. | *“Upload an image, Ally drops alt-text into the thread so screen-reader users get the same context as everyone else.”* |

### 2:35 – 2:50 · Beat 6 — App Home control surface

| On screen | VO |
| --- | --- |
| Switch to the App Home tab. Click each mode pill. Show the Real-Time Search status row. | *“App Home is the control panel — switch modes, see your search permissions, all in one place.”* |

### 2:50 – 3:00 · Close

| On screen | VO |
| --- | --- |
| Cut back to the original dense thread, then dissolve to the TL;DR reply. Logo + repo URL: `github.com/faketut/AccessibilityAlly`. | *“AccessibilityAlly. One thread. Everyone in the room.”* |

---

## VO-only script (for teleprompter)

> Every Slack thread is written for the people already in the room. Acronyms unexplained. Decisions implied. If you joined late — a PM, a new hire, a screen-reader user — you are doing the translation in your head.
>
> AccessibilityAlly is a Slack agent that rewrites the thread for you. Pick a mode, hit a shortcut, get the version you can actually read.
>
> Right-click any message, choose ‘Catch me up’. Pick a mode — I’m a PM visiting from another team — and optionally tell it what I care about. The reply is ephemeral, only I see it. Bottom line first. Decisions and owners surfaced. Every acronym defined in a glossary at the end. Same thread, rewritten for me.
>
> Now I’m an exec with thirty seconds. Same thread, same data — two bullets, the dollar impact, the decision needed. Mode changes the summary, not just the wording.
>
> Ally is an agent, not a one-shot summarizer. Under the hood it calls Slack’s Real-Time Search to pull in related messages across channels, and the Jira MCP for ticket state — then writes one answer with sources.
>
> For one-off jargon, ‘plainify’ rewrites a single line in your current mode. Short sentences. Active voice. Every acronym defined. Screen-reader and ESL friendly by default.
>
> Accessibility isn’t a separate feature — it’s in the workflow. Upload an image, Ally drops alt-text into the thread so screen-reader users get the same context as everyone else.
>
> App Home is the control panel — switch modes, see your search permissions, all in one place.
>
> AccessibilityAlly. One thread. Everyone in the room.

---

## Fallback beats (if a live call fails on camera)

- **Catch me up errors** → cut to a pre-recorded clip of the ephemeral
  reply; keep VO going. Don’t retry on camera.
- **Tool call returns no Jira hit** → fall back to a DM that asks
  `summarize the auth-rollout thread and pull in anything from this week`
  — the Slack RTS call will still land.
- **Image alt-text slow** → skip Beat 5 and extend Beat 6 to ~25s by
  walking through each mode pill in App Home.

---

## What the judges should remember

1. **Same thread, different reader** — modes change the *summary*, not
   just the tone.
2. **Real agent** — Slack Real-Time Search + Jira MCP, with sourced
   answers.
3. **Accessibility is the default** — Simplify mode, alt-text on upload,
   ephemeral replies, glossary on every summary.
