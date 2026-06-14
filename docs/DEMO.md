# AccessibilityAlly — Demo Script

Goal: record a short demo that shows how Ally makes a dense Slack thread legible to different audiences.
Time budget: ~5 minutes to stage the workspace, ~3 minutes to record.

---

## 0. What you need

| Need | Notes |
| --- | --- |
| Node.js 20+ | Already used by the app |
| Slack workspace | Any workspace where the app is installed |
| Google API key | Set as `GOOGLE_API_KEY` in `.env` |
| Slack bot/app tokens | Set as `SLACK_BOT_TOKEN` and `SLACK_APP_TOKEN` in `.env` |
| Slack user token | Set as `SLACK_USER_TOKEN` in `.env` (optional, for seeding) |

---

## 1. Start the app

```sh
cp .env.sample .env
# fill in Google / Slack env vars
npm install
npm start
```

You should see the Bolt app start cleanly in Socket Mode.

---

## 2. Stage the Data (Automated)

Instead of manually typing out tickets and threads, use the automated seed scripts to populate Jira and Slack. 

### A. Seed Jira Issues
```sh
# Requires JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN in .env
npm run seed:jira
```
This populates the project with issues like `KAN-5` and `KAN-6`.

### B. Seed the Slack Thread
```sh
npm run seed:slack -- --channel "#backend-platform"
```
This script acts via the `SLACK_USER_TOKEN` (or bot token) to automatically post a dense, jargon-heavy thread into the specified channel, and pins the thread to the channel for easy access.

---

## 3. Demo flow

### A. Catch me up
1. Go to `#backend-platform` and locate the newly seeded thread.
2. Right-click the top message.
3. Choose **More message shortcuts → Catch me up**.
4. Pick a mode and optionally add a focus question.
5. Call out the output shape: TL;DR first, Decisions and blockers, Glossary. Show that it's an ephemeral message.

### B. Mode switch
1. Run `/ally mode brief`.
2. Do a **Catch me up** again on the same message to see how the tone tightens.

### C. Plain-language rewrite
1. Run `/ally plainify We need to revert the canary before the RCA lands or we'll page the on-call again.`
2. Show how the jargon is rewritten.

### D. Agent Context (Jira & Slack Search)
1. Open a DM with the bot.
2. Ask: `What is the status of KAN-5 and the auth rollout?`
3. The agent pulls live state from the Jira mock data and searches for related messages.

### E. App Home & Alt Text
1. Open the app's Home tab to show settings.
2. Upload a screenshot or chart to the channel to show Ally automatically posting an alt-text description.

---

## 4. Clean finish

To reset the demo, either delete the channel or unpin/delete the seeded thread. Delete the Jira workspace if you want to rerun `seed:jira`.