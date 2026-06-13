# AccessibilityAlly — Demo Script

Goal: record a short demo that shows how Ally makes a dense Slack thread legible to different audiences.

Time budget: ~10 minutes to stage the workspace, ~3 minutes to record.

---

## 0. What you need

| Need | Notes |
| --- | --- |
| Node.js 20+ | Already used by the app |
| Slack workspace | Any workspace where the app is installed |
| Google API key | Set as `GOOGLE_API_KEY` in `.env` |
| Slack bot/app tokens | Set as `SLACK_BOT_TOKEN` and `SLACK_APP_TOKEN` in `.env` |

---

## 1. Start the app

```sh
cp .env.sample .env
npm install
npm start
```

You should see the Bolt app start cleanly in Socket Mode.

---

## 2. Stage the Slack demo thread

Create or use a channel such as `#backend-platform`. Add a thread that is packed with:

- acronyms
- owner names
- a decision or blocker
- one screenshot or chart if you want to show alt-text later

Example thread shape:

> Heads up: the auth rollout is blocked on the canary error spike. KAN-5 is still open, KAN-6 has the RCA, and we should hold the migration until the rollback patch lands.

Replies can add more detail, but the important thing is that the thread feels dense to someone who is not already in the conversation.

---

## 3. Demo flow

### A. Mode switch

1. Open the bot DM or use `/ally mode translate`.
2. Show that Ally remembers the mode setting.
3. Switch to `/ally mode brief` and point out that the tone changes to a tighter summary.

### B. Catch me up

1. Right-click the top message in the thread.
2. Choose **More message shortcuts → Catch me up**.
3. Pick a mode and optionally add a focus question.
4. Call out the output shape:
   - TL;DR first
   - Decisions and blockers
   - Glossary for acronyms and codenames
   - Ephemeral delivery, visible only to the requester

### C. Plain-language rewrite

1. Run `/ally plainify <jargon-heavy text>`.
2. Show how the same idea gets rewritten for screen-reader users, ESL readers, and non-technical teammates.

### D. App Home

1. Open the app's Home tab.
2. Show the mode picker and the Slack Real-Time Search status.

### E. Alt text

1. Upload a screenshot or chart to the channel.
2. Show that Ally posts a short alt-text description back into the channel.

---

## 4. What to emphasize while recording

- The same thread means different things to different readers.
- Mode selection changes the summary, not just the wording.
- Accessibility is built into the workflow, not added as a separate feature.
- The app keeps the response ephemeral, which matches the privacy posture.

---

## 5. Clean finish

If you want to reset the demo, just clear the channel thread and change the mode back to the default in App Home.
