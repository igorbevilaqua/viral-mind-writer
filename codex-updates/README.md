# Codex update-message queue

Zero-dependency Node CLI that manages the changelog queue + versioned releases
for Codex (Viral Mind, https://codex.viralmindlabs.com) WhatsApp update messages.
This tool ONLY manages state — the prose/message is composed by the skill, which
reads `next` and writes back via `commit-release`.

## State file

`state.json` (single source of truth). Override the path with the
`CODEX_UPDATES_STATE` env var (used for tests so the real file stays clean):

```
CODEX_UPDATES_STATE=/tmp/test-state.json node codex-updates/cli.mjs list
```

Missing state file is recreated as the clean initial state.

### Schema

```json
{
  "version": "1.0",            // version the NEXT release will carry
  "codexUrl": "https://codex.viralmindlabs.com",
  "pending": [],               // queued entries not yet released
  "lastRelease": null,         // most recent release (see below)
  "history": []                // past releases, oldest -> newest
}
```

Pending entry:
```json
{ "id": "s3k1", "type": "feature|fix|improvement", "summary": "...",
  "detail": "" , "commit": "8731951", "addedAt": "<ISO>" }
```

Release (`lastRelease` and each `history` item):
```json
{ "version": "1.0", "git": "8731951", "productSummary": "...",
  "message": "<composed WhatsApp text>", "changes": [ ...entries ],
  "releasedAt": "<ISO>" }
```

## Commands

```
# queue a change (commit auto-fills from `git rev-parse --short HEAD` if omitted)
node codex-updates/cli.mjs add --type <feature|fix|improvement> \
     --summary "<s>" [--detail "<d>"] [--commit <hash>]

# human-readable status
node codex-updates/cli.mjs list

# read-only: what the next release looks like (JSON on stdout, no mutation)
node codex-updates/cli.mjs next
#  pending non-empty -> { repeat:false, empty:false, version, git, codexUrl, entries }
#  pending empty + lastRelease -> { repeat:true, empty:false, version, git, codexUrl, message }
#  pending empty + none        -> { repeat:false, empty:true }

# drain pending into a release (only when pending non-empty; skill passes values from `next`)
node codex-updates/cli.mjs commit-release --version <v> --git <hash> \
     --product-summary "<s>" --message-file <path>
#  stores release, clears pending, bumps version minor (1.9 -> 2.0)
```

`commit-release` on empty pending errors and exits 1.
