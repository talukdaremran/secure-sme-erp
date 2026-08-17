import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceRoot = path.join(__dirname, "frontend");
const targetRoot = path.join(process.cwd(), "frontend");

function copyRecursive(source, target) {
  if (!fs.existsSync(source)) return;
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const item of fs.readdirSync(source)) {
      copyRecursive(path.join(source, item), path.join(target, item));
    }
    return;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

if (!fs.existsSync(targetRoot)) {
  console.error("Run this from your project root. Could not find frontend/ folder.");
  process.exit(1);
}

copyRecursive(sourceRoot, targetRoot);
console.log("CSS files copied. Now add the imports listed in CSS_SPLIT_README.md.");
