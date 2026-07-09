#!/usr/bin/env node
// Codex update-message queue/state CLI. Zero deps, node builtins only.
// State: CODEX_UPDATES_STATE env overrides path (used for tests); default is
// state.json next to this file.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const CLEAN = {
  version: "1.0",
  codexUrl: "https://codex.viralmindlabs.com",
  pending: [],
  lastRelease: null,
  history: [],
};

const STATE_PATH =
  process.env.CODEX_UPDATES_STATE ||
  join(dirname(fileURLToPath(import.meta.url)), "state.json");

function load() {
  if (!existsSync(STATE_PATH)) return structuredClone(CLEAN);
  return JSON.parse(readFileSync(STATE_PATH, "utf8"));
}
function save(state) {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
}
function shortHead() {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}
// "1.0" -> "1.1" ... "1.9" -> "2.0" (roll minor over at 10)
function bump(v) {
  let [maj, min] = v.split(".").map(Number);
  min += 1;
  if (min >= 10) {
    maj += 1;
    min = 0;
  }
  return `${maj}.${min}`;
}

// bare-simple flag parser: --key value (and --key with no value -> true)
function flags(argv) {
  const f = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const val = argv[i + 1];
    if (val === undefined || val.startsWith("--")) f[key] = true;
    else {
      f[key] = val;
      i++;
    }
  }
  return f;
}

const [cmd, ...rest] = process.argv.slice(2);
const f = flags(rest);
const state = load();

switch (cmd) {
  case "add": {
    if (!["feature", "fix", "improvement"].includes(f.type)) {
      console.error("--type must be feature|fix|improvement");
      process.exit(1);
    }
    if (!f.summary) {
      console.error("--summary is required");
      process.exit(1);
    }
    const entry = {
      id: Date.now().toString(36),
      type: f.type,
      summary: f.summary,
      detail: f.detail || "",
      commit: f.commit || shortHead(),
      addedAt: new Date().toISOString(),
    };
    state.pending.push(entry);
    save(state);
    console.log(
      `Added ${entry.type}: "${entry.summary}" (${entry.commit}). Pending: ${state.pending.length}`
    );
    break;
  }

  case "list": {
    console.log(`version: ${state.version}`);
    console.log(`codexUrl: ${state.codexUrl}`);
    console.log(`pending: ${state.pending.length}`);
    for (const e of state.pending) {
      console.log(`  - [${e.type}] ${e.summary} (${e.commit})`);
    }
    console.log(
      `lastRelease: ${state.lastRelease ? state.lastRelease.version : "none"}`
    );
    break;
  }

  case "next": {
    let out;
    if (state.pending.length) {
      out = {
        repeat: false,
        empty: false,
        version: state.version,
        git: shortHead(),
        codexUrl: state.codexUrl,
        entries: state.pending,
      };
    } else if (state.lastRelease) {
      out = {
        repeat: true,
        empty: false,
        version: state.lastRelease.version,
        git: state.lastRelease.git,
        codexUrl: state.codexUrl,
        message: state.lastRelease.message,
      };
    } else {
      out = { repeat: false, empty: true };
    }
    console.log(JSON.stringify(out));
    break;
  }

  case "commit-release": {
    if (!state.pending.length) {
      console.error("commit-release: pending is empty, nothing to release");
      process.exit(1);
    }
    if (!f.version || !f.git || !f["product-summary"] || !f["message-file"]) {
      console.error(
        "requires --version --git --product-summary --message-file"
      );
      process.exit(1);
    }
    const message = readFileSync(f["message-file"], "utf8");
    const newRelease = {
      version: f.version,
      git: f.git,
      productSummary: f["product-summary"],
      message,
      changes: state.pending,
      releasedAt: new Date().toISOString(),
    };
    if (state.lastRelease) state.history.push(state.lastRelease);
    state.lastRelease = newRelease;
    state.pending = [];
    state.version = bump(f.version);
    save(state);
    console.log(
      `Released ${newRelease.version}. Next version: ${state.version}`
    );
    break;
  }

  default:
    console.error(
      "usage: cli.mjs <add|list|next|commit-release> [flags]  (see README.md)"
    );
    process.exit(1);
}
