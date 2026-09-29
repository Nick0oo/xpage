/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS entrypoint launched directly by Node. */
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

function findCodexDirectory() {
  const candidates = [];
  if (process.env.CODEX_CLI_PATH) {
    const configuredPath = process.env.CODEX_CLI_PATH;
    candidates.push(fs.existsSync(configuredPath) && fs.statSync(configuredPath).isDirectory()
      ? path.join(configuredPath, "codex.exe")
      : configuredPath);
  }

  // npm/nvm installs the CLI under the active Node installation. Eve's
  // spawn('codex') cannot execute the .cmd shim, so add the native binary dir.
  const nodeModules = path.join(path.dirname(process.execPath), "node_modules");
  candidates.push(path.join(
    nodeModules,
    "@openai",
    "codex",
    "node_modules",
    "@openai",
    "codex-win32-x64",
    "vendor",
    "x86_64-pc-windows-msvc",
    "bin",
    "codex.exe",
  ));
  candidates.push(path.join(
    nodeModules,
    "@openai",
    "codex-win32-x64",
    "vendor",
    "x86_64-pc-windows-msvc",
    "bin",
    "codex.exe",
  ));

  const installRoot = process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, "OpenAI", "Codex", "bin")
    : "";
  if (installRoot && fs.existsSync(installRoot)) {
    for (const entry of fs.readdirSync(installRoot, { withFileTypes: true })) {
      if (entry.isDirectory()) candidates.push(path.join(installRoot, entry.name, "codex.exe"));
    }
  }

  const executable = candidates.find((candidate) => {
    try {
      return fs.statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
  return executable ? path.dirname(executable) : null;
}

const codexDirectory = findCodexDirectory();
if (!codexDirectory) {
  console.error(
    "No se encontró codex.exe. Instala Codex para Windows o define CODEX_CLI_PATH con la ruta al ejecutable nativo.",
  );
  process.exit(1);
}

const [binary, ...args] = process.argv.slice(2);
if (binary !== "next" && binary !== "eve") {
  console.error("Uso: node scripts/with-codex-path.cjs <next|eve> [argumentos]");
  process.exit(2);
}

const binPath = path.resolve(
  process.cwd(),
  "node_modules",
  binary === "next" ? "next/dist/bin/next" : "eve/bin/eve.js",
);
if (!fs.existsSync(binPath)) {
  console.error(`No se encontró el ejecutable local de ${binary}: ${binPath}`);
  process.exit(1);
}

const env = {
  ...process.env,
  PATH: `${codexDirectory}${path.delimiter}${process.env.PATH ?? ""}`,
};
const child = spawn(process.execPath, [binPath, ...args], { stdio: "inherit", env });
child.on("error", (error) => {
  console.error(`No se pudo iniciar ${binary}: ${error.message}`);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = signal ? 1 : (code ?? 1);
});
