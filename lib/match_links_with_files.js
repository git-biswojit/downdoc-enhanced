import fsp from "node:fs/promises";
import ospath from "node:path";

// Regex to match markdown links: [text](url)
const markdownLinkRx = /\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Recursively find all .md files in a directory
 */
async function findMarkdownFiles(dir) {
  const files = [];
  const entries = await fsp.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = ospath.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findMarkdownFiles(fullPath)));
    } else if (entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Check if a file exists at the given path
 */
async function fileExists(filePath) {
  try {
    const stat = await fsp.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Fix markdown links in a file to point to actual files
 */
async function fixLinksInFile(filePath, outputDir) {
  const content = await fsp.readFile(filePath, "utf8");
  let modified = false;
  let newContent = content;

  // Find all markdown links
  const matches = [...content.matchAll(markdownLinkRx)];

  for (const match of matches) {
    const [fullMatch, linkText, linkUrl] = match;

    // Skip external links (http/https)
    if (linkUrl.startsWith("http://") || linkUrl.startsWith("https://")) {
      continue;
    }

    // Skip anchor links (starting with #)
    if (linkUrl.startsWith("#")) {
      continue;
    }

    // Handle relative paths
    let targetPath;
    if (linkUrl.startsWith("/")) {
      // Absolute path from output directory root
      targetPath = ospath.join(outputDir, linkUrl.substring(1));
    } else {
      // Relative path from current file
      const currentDir = ospath.dirname(filePath);
      targetPath = ospath.resolve(currentDir, linkUrl);
    }

    // Check if the target file exists
    const targetExists = await fileExists(targetPath);

    if (!targetExists) {
      // Try with .md extension if not already present
      if (!targetPath.endsWith(".md")) {
        const targetWithMd = targetPath + ".md";
        const targetWithMdExists = await fileExists(targetWithMd);

        if (targetWithMdExists) {
          // Update the link to include .md extension
          const newLinkUrl = linkUrl.endsWith(".md") ? linkUrl : linkUrl + ".md";
          newContent = newContent.replace(fullMatch, `[${linkText}](${newLinkUrl})`);
          modified = true;
        }
      }
    }

    // If target still doesn't exist, try to find the correct relative path
    if (!targetExists && !modified) {
      // Get the relative path from current file to the target
      const currentDir = ospath.dirname(filePath);
      const targetRelativeToOutput = ospath.relative(outputDir, targetPath);

      // Try to find the file in the output directory
      const possibleTargetPath = ospath.join(outputDir, targetRelativeToOutput);
      const possibleTargetWithMd = possibleTargetPath + ".md";

      if (await fileExists(possibleTargetWithMd)) {
        // Calculate the correct relative path from current file to target
        const correctRelativePath = ospath.relative(currentDir, possibleTargetWithMd);
        newContent = newContent.replace(
          fullMatch,
          `[${linkText}](${correctRelativePath})`
        );
        modified = true;
      }
    }

    // If target still doesn't exist and we haven't modified yet, try to find the correct relative path
    // even when the link already has .md extension but wrong relative path
    if (!targetExists && !modified) {
      const currentDir = ospath.dirname(filePath);

      // Try to find the file by searching in the output directory
      const allMdFiles = await findMarkdownFiles(outputDir);

      for (const mdFile of allMdFiles) {
        const fileName = ospath.basename(mdFile);

        // Check if this file matches what we're looking for (ignoring path)
        const targetFileName = ospath.basename(targetPath);
        const targetFileNameWithoutExt = targetFileName.replace(/\.md$/, "");

        if (
          fileName === targetFileName ||
          fileName === targetFileNameWithoutExt + ".md" ||
          fileName === targetFileNameWithoutExt
        ) {
          // Calculate the correct relative path from current file to this target
          const correctRelativePath = ospath.relative(currentDir, mdFile);

          // Update the link with the correct relative path
          newContent = newContent.replace(
            fullMatch,
            `[${linkText}](${correctRelativePath})`
          );
          modified = true;
          break;
        }
      }
    }
  }

  if (modified) {
    await fsp.writeFile(filePath, newContent, "utf8");
  }

  return modified;
}

/**
 * Process all markdown files in the output directory to fix links
 */
export async function matchLinksWithFiles(outputDir) {
  try {
    const mdFiles = await findMarkdownFiles(outputDir);
    let totalFixed = 0;

    for (const file of mdFiles) {
      const fixed = await fixLinksInFile(file, outputDir);
      if (fixed) {
        totalFixed++;
      }
    }

    return {
      success: true,
      filesProcessed: mdFiles.length,
      filesFixed: totalFixed,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
