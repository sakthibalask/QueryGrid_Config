import { spawn } from "child_process";
import electron from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appPath = path.join(__dirname, "main.js");

const child = spawn(electron, [appPath], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "development",
  },
});

child.on("close", (code) => {
  process.exit(code);
});
