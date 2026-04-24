import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const soundsRoot = path.join(projectRoot, "sounds");
const outputPath = path.join(soundsRoot, "sound-manifest.js");
const supportedExtensions = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac"]);

async function listSoundFiles(category) {
  const categoryPath = path.join(soundsRoot, category);
  const entries = await readdir(categoryPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => supportedExtensions.has(path.extname(fileName).toLowerCase()))
    .sort((left, right) => left.localeCompare(right))
    .map((fileName) => `sounds/${category}/${fileName}`);
}

async function generateManifest() {
  const entries = await readdir(soundsRoot, { withFileTypes: true });
  const categories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const manifest = {};

  for (const category of categories) {
    manifest[category] = await listSoundFiles(category);
  }

  const manifestScript = `window.__QUIZ_SOUND_MANIFEST__ = ${JSON.stringify(manifest, null, 2)};\n`;
  await writeFile(outputPath, manifestScript, "utf8");
  console.log(`Generated ${path.relative(projectRoot, outputPath)}`);
}

generateManifest().catch((error) => {
  console.error("Failed to generate sound manifest.", error);
  process.exitCode = 1;
});
