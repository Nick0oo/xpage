import { spawn, type ChildProcess } from "node:child_process";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AuthRuntime = {
  loginProcess: ChildProcess | null;
  loginTimer: NodeJS.Timeout | null;
  launchFailed: boolean;
};

const globalForAuth = globalThis as typeof globalThis & { eveCodexAuth?: AuthRuntime };
const authRuntime = globalForAuth.eveCodexAuth ??= { loginProcess: null, loginTimer: null, launchFailed: false };

function isLocalRequest(request: Request, requireSameOrigin: boolean) {
  if (process.env.NODE_ENV !== "development") return false;
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  const requestUrl = new URL(request.url);
  if (!localHosts.has(requestUrl.hostname)) return false;
  const origin = request.headers.get("origin");
  if (!origin) return !requireSameOrigin;
  try {
    const originUrl = new URL(origin);
    return originUrl.origin === requestUrl.origin && localHosts.has(originUrl.hostname);
  } catch {
    return false;
  }
}

function startLogin() {
  authRuntime.launchFailed = false;
  const child = spawn("codex", ["login"], {
    shell: false,
    windowsHide: true,
    stdio: ["ignore", "ignore", "ignore"],
  });
  authRuntime.loginProcess = child;
  authRuntime.loginTimer = setTimeout(() => {
    authRuntime.launchFailed = true;
    child.kill();
  }, 5 * 60_000);
  child.once("error", () => {
    if (authRuntime.loginProcess === child) authRuntime.loginProcess = null;
    if (authRuntime.loginTimer) clearTimeout(authRuntime.loginTimer);
    authRuntime.loginTimer = null;
    authRuntime.launchFailed = true;
  });
  child.once("close", (code) => {
    if (authRuntime.loginProcess === child) authRuntime.loginProcess = null;
    if (authRuntime.loginTimer) clearTimeout(authRuntime.loginTimer);
    authRuntime.loginTimer = null;
    if (code !== 0) authRuntime.launchFailed = true;
  });
}

async function getLoginStatus() {
  return await new Promise<{ available: boolean; loggedIn: boolean }>((resolve) => {
    let settled = false;
    let statusOutput = "";
    const finish = (result: { available: boolean; loggedIn: boolean }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(result);
    };
    const child = spawn("codex", ["login", "status"], {
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "ignore"],
    });
    child.stdout?.on("data", (chunk: Buffer | string) => {
      if (statusOutput.length < 512) statusOutput += chunk.toString().slice(0, 512 - statusOutput.length);
    });
    const timeout = setTimeout(() => {
      child.kill();
      finish({ available: true, loggedIn: false });
    }, 8_000);
    child.once("error", () => finish({ available: false, loggedIn: false }));
    child.once("close", (code) => finish({
      available: true,
      loggedIn: code === 0 && /logged in using chatgpt/i.test(statusOutput),
    }));
  });
}

export async function GET(request: Request) {
  if (!isLocalRequest(request, false)) {
    return NextResponse.json({ error: "Solo disponible desde XPage en desarrollo local." }, { status: 404 });
  }
  if (authRuntime.loginProcess && !authRuntime.loginProcess.killed) {
    return NextResponse.json({ state: "connecting", codexAvailable: true });
  }
  const status = await getLoginStatus();
  return NextResponse.json({
    state: status.loggedIn ? "connected" : authRuntime.launchFailed ? "error" : "disconnected",
    codexAvailable: status.available,
  });
}

export async function POST(request: Request) {
  if (!isLocalRequest(request, true)) {
    return NextResponse.json({ error: "Solo disponible desde la interfaz local de XPage." }, { status: 404 });
  }
  if (authRuntime.loginProcess && !authRuntime.loginProcess.killed) {
    return NextResponse.json({ state: "connecting" });
  }
  startLogin();
  return NextResponse.json({ state: "connecting" }, { status: 202 });
}
