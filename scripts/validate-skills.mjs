import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const root = process.cwd();
const skillsDir = join(root, "skills");
const errors = [];
const seen = new Set();
const valid = [];

function fail(message) {
  errors.push(message);
}

if (!existsSync(skillsDir)) {
  fail("skills/ directory is missing");
} else {
  const entries = readdirSync(skillsDir).filter((entry) => {
    const path = join(skillsDir, entry);
    return entry !== "references" && entry !== "README.md" && statSync(path).isDirectory();
  });

  if (entries.length === 0) fail("no skill directories found");

  for (const entry of entries) {
    const dir = join(skillsDir, entry);
    const file = join(dir, "SKILL.md");
    if (!existsSync(file)) {
      fail(`${entry}: missing SKILL.md`);
      continue;
    }

    const text = readFileSync(file, "utf8");
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) {
      fail(`${entry}: missing YAML frontmatter`);
      continue;
    }

    let data;
    try {
      data = parse(match[1]);
    } catch (error) {
      fail(`${entry}: invalid YAML: ${error.message}`);
      continue;
    }

    const name = data?.name;
    const description = data?.description;

    if (typeof name !== "string" || name.length === 0) {
      fail(`${entry}: frontmatter name is required`);
    } else {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
        fail(`${entry}: name must be lowercase hyphen-separated`);
      }
      if (name.length > 64) fail(`${entry}: name exceeds 64 characters`);
      if (name !== entry) fail(`${entry}: name must match folder (${name})`);
      if (seen.has(name)) fail(`${entry}: duplicate skill name ${name}`);
      seen.add(name);
    }

    if (typeof description !== "string" || description.trim().length === 0) {
      fail(`${entry}: frontmatter description is required`);
    } else if (description.length > 1024) {
      fail(`${entry}: description exceeds 1024 characters`);
    }

    if (/\b(Spikey|SPIKE|spikey)\b/.test(text)) {
      fail(`${entry}: contains a forbidden brand reference`);
    }

    const refs = [...text.matchAll(/\.\.\/references\/([A-Za-z0-9._-]+)/g)];
    for (const ref of refs) {
      const target = join(skillsDir, "references", ref[1]);
      if (!existsSync(target)) fail(`${entry}: missing reference ${ref[1]}`);
    }

    if (!errors.some((error) => error.startsWith(`${entry}:`))) {
      valid.push(name);
    }
  }
}

if (errors.length > 0) {
  console.error("Skill validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validated ${valid.length} skills: ${valid.join(", ")}`);
