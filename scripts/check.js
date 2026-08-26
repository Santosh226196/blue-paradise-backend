import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function javascriptFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (name === "node_modules" || name === ".git") return [];
    return statSync(path).isDirectory() ? javascriptFiles(path) : path.endsWith(".js") ? [path] : [];
  });
}

let failed = false;
for (const file of [...javascriptFiles("src"), ...javascriptFiles("scripts"), ...javascriptFiles("test")]) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    failed = true;
    process.stderr.write(result.stderr);
  }
}
if (failed) process.exit(1);
console.log("All JavaScript files passed syntax validation.");
