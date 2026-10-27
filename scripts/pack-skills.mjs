import { createHash } from "node:crypto";
import { createWriteStream, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ZipArchive } from "archiver";

const root = process.cwd();
const skillsDir = join(root, "skills");
const outDir = join(root, "artifacts");
const zipPath = join(outDir, "hoglet-agent-skills.zip");
const checksumPath = `${zipPath}.sha256`;

mkdirSync(outDir, { recursive: true });

const sdkPackage = JSON.parse(readFileSync(join(root, "packages", "sdk", "package.json"), "utf8"));
const skillNames = readdirSync(skillsDir)
  .filter((entry) => {
    const path = join(skillsDir, entry);
    return entry !== "references" && entry !== "README.md" && statSync(path).isDirectory();
  })
  .sort();

const output = createWriteStream(zipPath);
const archive = new ZipArchive({ zlib: { level: 9 } });

const done = new Promise((resolve, reject) => {
  output.on("close", resolve);
  output.on("error", reject);
  archive.on("error", reject);
});

archive.pipe(output);

for (const entry of readdirSync(skillsDir)) {
  const path = join(skillsDir, entry);
  if (entry === "README.md") {
    archive.file(path, { name: "README.md" });
  } else if (entry !== "references" && statSync(path).isDirectory()) {
    archive.directory(path, entry);
  } else if (entry === "references") {
    archive.directory(path, "references");
  }
}

archive.append(
  JSON.stringify(
    {
      name: "hoglet-agent-skills",
      version: sdkPackage.version,
      generatedAt: new Date().toISOString(),
      skills: skillNames,
    },
    null,
    2,
  ),
  { name: "manifest.json" },
);

await archive.finalize();
await done;

const hash = createHash("sha256").update(readFileSync(zipPath)).digest("hex");
writeFileSync(checksumPath, `${hash}  hoglet-agent-skills.zip\n`);

console.log(`Packed ${skillNames.length} skills -> ${zipPath}`);
console.log(`SHA256 ${hash}`);
