import fs from "fs/promises";
import path from "path";

export function wrapPlaceholdersInStringTemplate(markdown) {
  const lines = markdown.split("\n");
  const output = [];
  let inCodeBlock = false;

  for (let line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      output.push(line);
      continue;
    }

    if (!inCodeBlock) {
      // Use a fresh regex for each line to avoid global state issues
      const regex = /(?<![`$]){([^{}`$]+?)}(?![`}$])/g;
      line = line.replace(regex, "`$&`");
    }

    output.push(line);
  }

  return output.join("\n");
}

export function getDocumentTitle(markdown) {
  const match = markdown.trim().match(/^#(?!#)\s+(.+)$/m);
  return match ? match[1].trim() : "Document";
}

export function getDocumentBody(markdown) {
  return markdown
    .trim()
    .replace(/^#(?!#)\s+(.+)$/m, "")
    .trim();
}

export function getReadmeTemplate(title, body) {
  if (Array.isArray(body)) {
    body = body.join("\n");
  }
  return `---
title: ${title}
hidden: false
---

${body}`;
}

export function toTitleCase(str) {
  return str.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function writeIndexesForFilePath(filePath) {
  const dirs = path.dirname(filePath).split(path.sep);

  let actualPath = path.isAbsolute(filePath)
    ? path.parse(filePath).root // e.g. "/" or "C:\\"
    : "";

  for (const dir of dirs) {
    actualPath = path.join(actualPath, dir);
    if (shouldSkip(dir, filePath)) {
      continue;
    } else {
      const indexPath = path.join(actualPath, "index.md");
      const title = toTitleCase(dir);
      const content = `---\ntitle: ${title}\nhidden: false\n---\n`;
      await fs.mkdir(actualPath, { recursive: true });
      await fs.writeFile(indexPath, content, "utf8");
    }
  }
}

export function shouldSkip(currDir, fullDir) {
  const BANNED_DIR = "docs";
  const segments = fullDir.split(path.sep);
  const bannedDirIndex = segments.lastIndexOf(BANNED_DIR);
  const currDirIndex = segments.lastIndexOf(currDir);
  if (currDir === "." || currDir === "..") {
    return true;
  }
  if (bannedDirIndex === -1 || bannedDirIndex >= currDirIndex) {
    return true;
  }
  return false;
}

export function convertToReadmeCompatibleMarkdown(markdown) {
  markdown = wrapPlaceholdersInStringTemplate(markdown);
  const title = getDocumentTitle(markdown);
  const body = getDocumentBody(markdown);
  return getReadmeTemplate(title, body);
}

export function renameIfDuplicateDirPath(filePath) {
  const dirPath = path.dirname(filePath);
  const fileName = path.basename(filePath);
  const fileNameWithoutExt = path.parse(fileName).name;

  const segments = dirPath.split(path.sep);
  const lastDir = segments[segments.length - 1];

  if (lastDir === fileNameWithoutExt) {
    const newFileName = `${fileNameWithoutExt}_.md`;
    return path.join(dirPath, newFileName);
  }

  return filePath;
}
