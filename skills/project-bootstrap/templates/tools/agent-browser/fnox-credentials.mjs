#!/usr/bin/env node
// agent-browser credential plugin (agent-browser.plugin.v1) backed by fnox.
// `--item IMPACT` resolves IMPACT_EMAIL and IMPACT_PASSWORD with `fnox get`,
// so the password reaches the login form without entering the agent's
// environment, command arguments or output.
import { execFileSync } from "node:child_process";

const PROTOCOL = "agent-browser.plugin.v1";

function reply(body) {
  process.stdout.write(JSON.stringify({ protocol: PROTOCOL, ...body }));
}

function fnoxGet(key) {
  return execFileSync("fnox", ["get", key], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trimEnd();
}

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const input = JSON.parse(Buffer.concat(chunks).toString("utf8"));

if (input.protocol !== PROTOCOL) {
  reply({ success: false, error: "unsupported protocol" });
} else if (input.type === "plugin.manifest") {
  reply({
    success: true,
    manifest: {
      name: "fnox",
      capabilities: ["credential.read"],
      description: "Resolve <ITEM>_EMAIL and <ITEM>_PASSWORD with fnox get",
    },
  });
} else if (input.type === "credential.resolve") {
  const item = input.request?.itemRef;
  if (!/^[A-Z][A-Z0-9_]*$/.test(item ?? "")) {
    reply({ success: false, error: "--item must be an fnox key prefix such as IMPACT" });
  } else {
    try {
      reply({
        success: true,
        credential: {
          username: fnoxGet(`${item}_EMAIL`),
          password: fnoxGet(`${item}_PASSWORD`),
          ...(input.request.url ? { url: input.request.url } : {}),
        },
      });
    } catch {
      reply({ success: false, error: `fnox could not resolve ${item}_EMAIL or ${item}_PASSWORD` });
    }
  }
} else {
  reply({ success: false, error: `unsupported request type ${input.type}` });
}
