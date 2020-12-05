/**
 * The whole script only to support cross platform. Windows doesn't recognize bash commands unless WSL,
 * hence using child_process method from nodeJS
 */

const execSync = require("child_process").execSync;

const arg = process.argv[2] || "createSchema";

execSync("functions-framework --target=" + arg, { stdio: [0, 1, 2] });
