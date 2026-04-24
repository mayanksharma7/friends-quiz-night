import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const packsRoot = path.join(projectRoot, "question-packs");
const outputPath = path.join(packsRoot, "pack-manifest.js");

async function readQuizPack(fileName) {
  const raw = await readFile(path.join(packsRoot, fileName), "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed.questions) || !parsed.questions.length) {
    return null;
  }

  const questions = parsed.questions
    .map((question) => ({
      prompt: String(question.prompt || "").trim(),
      hint: String(question.hint || "").trim(),
      answer: String(question.answer || "").trim(),
    }))
    .filter((question) => question.prompt && question.answer);

  if (!questions.length) {
    return null;
  }

  return {
    id: String(parsed.id || fileName.replace(/\.json$/i, "")).trim(),
    title: String(parsed.title || parsed.id || fileName).trim(),
    description: String(parsed.description || "").trim(),
    questions,
  };
}

async function generateManifest() {
  const entries = await readdir(packsRoot, { withFileTypes: true });
  const packFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => fileName.endsWith(".json"))
    .filter((fileName) => !fileName.startsWith("template"))
    .sort((left, right) => left.localeCompare(right));

  const packs = [];

  for (const fileName of packFiles) {
    const pack = await readQuizPack(fileName);

    if (pack) {
      packs.push(pack);
    }
  }

  const manifestScript = `window.__QUIZ_PACK_MANIFEST__ = ${JSON.stringify(packs, null, 2)};\n`;
  await writeFile(outputPath, manifestScript, "utf8");
  console.log(`Generated ${path.relative(projectRoot, outputPath)}`);
}

generateManifest().catch((error) => {
  console.error("Failed to generate question pack manifest.", error);
  process.exitCode = 1;
});
