/* eslint-env mocha */

import {
  convertToReadmeCompatibleMarkdown,
  getDocumentBody,
  getDocumentTitle,
  getReadmeTemplate,
  renameIfDuplicateDirPath,
  shouldSkip,
  toTitleCase,
  wrapPlaceholdersInStringTemplate,
  writeIndexesForFilePath,
} from "../lib/md_to_readme.js";

import fs from "fs/promises";
import path from "path";
import { temporaryDirectory } from "tempy";

import { expect, heredoc } from "./harness/index.js";

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

describe("wrapPlaceholdersInStringTemplate", () => {
  it("wraps a single placeholder", () => {
    const md = "Hello {user}";
    expect(wrapPlaceholdersInStringTemplate(md)).to.equal("Hello `{user}`");
  });

  it("wraps multiple placeholders", () => {
    const md = "User: {name}, ID: {id}";
    expect(wrapPlaceholdersInStringTemplate(md)).to.equal("User: `{name}`, ID: `{id}`");
  });

  it("skips placeholders in code blocks", () => {
    const md = heredoc`
      \`\`\`
      const x = {id};
      \`\`\`
    `;
    expect(wrapPlaceholdersInStringTemplate(md)).to.equal(md);
  });

  it("wraps outside code but not inside code", () => {
    const md = heredoc`
      Hello {name}

      \`\`\`
      const name = {name};
      \`\`\`
    `;
    const expected = heredoc`
      Hello \`{name}\`

      \`\`\`
      const name = {name};
      \`\`\`
    `;
    expect(wrapPlaceholdersInStringTemplate(md)).to.equal(expected);
  });

  it("skips placeholders inside inline backticks", () => {
    const md = "Use `{username}` in your app";
    expect(wrapPlaceholdersInStringTemplate(md)).to.equal(md);
  });

  it("ignores text without placeholders", () => {
    const md = "Just a normal line.";
    expect(wrapPlaceholdersInStringTemplate(md)).to.equal(md);
  });

  // eslint-disable-next-line no-template-curly-in-string
  it("does not wrap ${amount} style variables", () => {
    // eslint-disable-next-line no-template-curly-in-string
    const md = "Total: ${amount}";
    expect(wrapPlaceholdersInStringTemplate(md)).to.equal(md);
  });

  it("wraps placeholder next to punctuation", () => {
    const md = "Hello, {name}!";
    expect(wrapPlaceholdersInStringTemplate(md)).to.equal("Hello, `{name}`!");
  });

  it("skips double curly placeholders", () => {
    const md = "This is {{double}} curly";
    expect(wrapPlaceholdersInStringTemplate(md)).to.equal(md);
  });

  it("works inside markdown tables", () => {
    const md = heredoc`
      | Key   | Value    |
      |-------|----------|
      | Name  | {user}   |
    `;
    const expected = heredoc`
      | Key   | Value    |
      |-------|----------|
      | Name  | \`{user}\`   |
    `;
    expect(wrapPlaceholdersInStringTemplate(md)).to.equal(expected);
  });

  it("works inside markdown tables with multiple vars", () => {
    const md = heredoc`
  | Endpoint | Method | Description |
  | --- | --- | --- |
  | /v1/providers | GET | List all providers |
  | /v1/providers/{id} | GET | Get provider details |
  | /v1/providers/appointments | POST | Schedule appointment |
  | /v1/providers/credentialing | POST | Submit credentialing info |
    `;
    const expected = heredoc`
  | Endpoint | Method | Description |
  | --- | --- | --- |
  | /v1/providers | GET | List all providers |
  | /v1/providers/\`{id}\` | GET | Get provider details |
  | /v1/providers/appointments | POST | Schedule appointment |
  | /v1/providers/credentialing | POST | Submit credentialing info |
    `;
    expect(wrapPlaceholdersInStringTemplate(md)).to.equal(expected);
  });
});

describe("getDocumentTitle", () => {
  it("returns title from first H1", () => {
    const md = "# My Document\n\nContent here.";
    expect(getDocumentTitle(md)).to.equal("My Document");
  });

  it("returns 'Document' if no H1 found", () => {
    const md = "No title here.";
    expect(getDocumentTitle(md)).to.equal("Document");
  });

  it("handles multiple lines before H1", () => {
    const md = "Intro text.\n\n# Another Title";
    expect(getDocumentTitle(md)).to.equal("Another Title");
  });

  it("ignores non-H1 headings", () => {
    const md = "## Not a title\n# Main Title";
    expect(getDocumentTitle(md)).to.equal("Main Title");
  });

  it("trims whitespace around title", () => {
    const md = "   # Indented Title   \n\nContent.";
    expect(getDocumentTitle(md)).to.equal("Indented Title");
  });
});

describe("getDocumentBody", () => {
  it("returns body after title", () => {
    const md = "# Title\n\nBody content.";
    expect(getDocumentBody(md)).to.equal("Body content.");
  });

  it("returns empty string if only title exists", () => {
    const md = "# Only Title";
    expect(getDocumentBody(md)).to.equal("");
  });

  it("handles multiple paragraphs after title", () => {
    const md = "# Title\n\nFirst paragraph.\n\nSecond paragraph.";
    expect(getDocumentBody(md)).to.equal("First paragraph.\n\nSecond paragraph.");
  });

  it("ignores leading whitespace before title", () => {
    const md = "   # Indented Title\n\nContent.";
    expect(getDocumentBody(md)).to.equal("Content.");
  });
});

describe("getReadmeTemplate", () => {
  it("creates template with title and body", () => {
    const title = "My Title";
    const body = "This is the body content.";
    const expected = `---
title: My Title
hidden: false
---

${body}`;
    expect(getReadmeTemplate(title, body)).to.equal(expected);
  });

  it("handles empty body", () => {
    const title = "Empty Body";
    const expected = `---
title: Empty Body
hidden: false
---

`;
    expect(getReadmeTemplate(title, "")).to.equal(expected);
  });
  it("joins body array into string", () => {
    const title = "Array Body";
    const body = ["Line 1", "Line 2"];
    const expected = `---
title: Array Body
hidden: false
---

Line 1
Line 2`;
    expect(getReadmeTemplate(title, body)).to.equal(expected);
  });
  it("handles multiline body", () => {
    const title = "Multiline Body";
    const body = "Line 1\nLine 2\nLine 3";
    const expected = `---
title: Multiline Body
hidden: false
---

Line 1\nLine 2\nLine 3`;
    expect(getReadmeTemplate(title, body)).to.equal(expected);
  });
});

describe("convertToReadmeSupportedMarkdown", () => {
  it("converts markdown to README format", () => {
    const md = "# My Document\n\nContent here.";
    const expected = `---
title: My Document
hidden: false
---

Content here.`;
    expect(convertToReadmeCompatibleMarkdown(md)).to.equal(expected);
  });
});

describe("writeIndexesForFilePath", () => {
  it("should stop creating index.md if it finds a 'docs' folder", async () => {
    const baseDir = temporaryDirectory();
    const fullPath = path.join(baseDir, "path1", "docs", "path2");
    await fs.mkdir(fullPath, { recursive: true });

    const filePath = path.join(fullPath, "document.md");
    await fs.writeFile(filePath, "# Some doc");

    const indexInPath1 = path.join(baseDir, "path1", "index.md");
    const indexInDocs = path.join(baseDir, "path1", "docs", "index.md");
    const indexAfterDocs = path.join(fullPath, "index.md");

    expect(await exists(indexInPath1)).to.equal(false);
    expect(await exists(indexInDocs)).to.equal(false);
    expect(await exists(indexAfterDocs)).to.equal(false);

    await writeIndexesForFilePath(filePath);

    expect(await exists(indexInPath1)).to.equal(
      false,
      "Index in path1 should not be created"
    );
    expect(await exists(indexInDocs)).to.equal(
      false,
      "Index in docs should not be created"
    );
    expect(await exists(indexAfterDocs)).to.equal(
      true,
      "Index after docs should be created"
    );
  });

  it("writes index.md in all parent directories with correct title", async () => {
    const baseDir = temporaryDirectory();
    const relativeFilePath = "docs/path1/path2/file.md";
    const fullFilePath = path.join(baseDir, relativeFilePath);

    // Ensure the path exists
    await fs.mkdir(path.dirname(fullFilePath), { recursive: true });
    await fs.writeFile(fullFilePath, "# some content");

    await writeIndexesForFilePath(fullFilePath);

    const path1Index = await fs.readFile(
      path.join(baseDir, "docs/path1", "index.md"),
      "utf8"
    );
    const path2Index = await fs.readFile(
      path.join(baseDir, "docs/path1/path2", "index.md"),
      "utf8"
    );

    expect(path1Index).to.include("title: Path1");
    expect(path2Index).to.include("title: Path2");
    expect(path1Index).to.include("hidden: false");
    expect(path2Index).to.include("hidden: false");
  });

  it("does not overwrite existing index.md files", async () => {
    const baseDir = temporaryDirectory();
    const relativeFilePath = "path1/path2/file.md";
    const fullFilePath = path.join(baseDir, relativeFilePath);

    await fs.mkdir(path.dirname(fullFilePath), { recursive: true });
    await fs.writeFile(fullFilePath, "# some content");

    const existingIndexPath = path.join(baseDir, "path1", "index.md");
    await fs.writeFile(existingIndexPath, "Existing content");

    await writeIndexesForFilePath(baseDir, relativeFilePath);

    const indexContent = await fs.readFile(existingIndexPath, "utf8");
    expect(indexContent).to.equal("Existing content");
  });

  it("handles empty relative file paths", async () => {
    const baseDir = temporaryDirectory();
    const relativeFilePath = "";

    await writeIndexesForFilePath(baseDir, relativeFilePath);

    const indexPath = path.join(baseDir, "index.md");
    await expect(fs.access(indexPath)).to.not.be.rejected;
  });

  it("should remove - from folder names", async () => {
    const baseDir = temporaryDirectory();
    const relativeFilePath = "docs/path2-hyphen/file.md";
    const fullFilePath = path.join(baseDir, relativeFilePath);
    await fs.mkdir(path.dirname(fullFilePath), { recursive: true });
    await fs.writeFile(fullFilePath, "# some content");

    await writeIndexesForFilePath(fullFilePath);

    const indexPath = path.join(baseDir, "docs/path2-hyphen", "index.md");
    const indexContent = await fs.readFile(indexPath, "utf8");
    expect(indexContent).to.include("title: Path2 Hyphen");
    expect(indexContent).to.include("hidden: false");
  });

  it("should handle paths with underscores", async () => {
    const baseDir = temporaryDirectory();
    const relativeFilePath = "docs/path_with_underscores/file.md";
    const fullFilePath = path.join(baseDir, relativeFilePath);
    await fs.mkdir(path.dirname(fullFilePath), { recursive: true });
    await fs.writeFile(fullFilePath, "# some content");

    await writeIndexesForFilePath(fullFilePath);

    const indexPath = path.join(baseDir, "docs/path_with_underscores", "index.md");
    const indexContent = await fs.readFile(indexPath, "utf8");
    expect(indexContent).to.include("title: Path With Underscores");
    expect(indexContent).to.include("hidden: false");
  });
});

describe("shouldSkip", () => {
  it("skips '.' directory", () => {
    const fullDir = "/a/b/docs/c";
    expect(shouldSkip(".", fullDir)).to.equal(true);
  });

  it("skips '..' directory", () => {
    const fullDir = "/a/b/docs/c";
    expect(shouldSkip("..", fullDir)).to.equal(true);
  });

  it("skips if docs is not in path", () => {
    const fullDir = "/a/b/c/d";
    expect(shouldSkip("d", fullDir)).to.equal(true);
  });

  it("skips 'docs' directory itself", () => {
    const fullDir = "/a/b/docs";
    expect(shouldSkip("docs", fullDir)).to.equal(true);
  });

  it("skips parents of docs", () => {
    const fullDir = "/a/b/docs";
    expect(shouldSkip("b", fullDir)).to.equal(true);
  });

  it("skips ancestor of docs", () => {
    const fullDir = "/a/docs/c";
    expect(shouldSkip("a", fullDir)).to.equal(true);
  });

  it("processes child directory under docs", () => {
    const fullDir = "/a/b/docs/path2";
    expect(shouldSkip("path2", fullDir)).to.equal(false);
  });

  it("processes deep child under docs", () => {
    const fullDir = "/a/b/docs/path2/deep";
    expect(shouldSkip("deep", fullDir)).to.equal(false);
  });

  it("processes nested child with multiple docs", () => {
    const fullDir = "/docs/a/docs/b/z";
    expect(shouldSkip("z", fullDir)).to.equal(false);
  });
});

describe("toTitleCase", () => {
  it("converts hyphenated words to title case", () => {
    const str = "my-title-case-string";
    expect(toTitleCase(str)).to.equal("My Title Case String");
  });

  it("converts underscored words to title case", () => {
    const str = "my_underscored_string";
    expect(toTitleCase(str)).to.equal("My Underscored String");
  });

  it("handles mixed hyphens and underscores", () => {
    const str = "my-title_case-string";
    expect(toTitleCase(str)).to.equal("My Title Case String");
  });

  it("does not change already title-cased strings", () => {
    const str = "Already Title Cased";
    expect(toTitleCase(str)).to.equal("Already Title Cased");
  });
});

describe("renameIfDuplicateDirPath", () => {
  it("renames file if parent has same name", async () => {
    const duplicatedFileNameWithDir = "docs/docs.md";
    const expectedFileNameWithDir = "docs/docs_.md";

    const newFilePath = renameIfDuplicateDirPath(duplicatedFileNameWithDir);
    expect(newFilePath).to.equal(expectedFileNameWithDir);
  });
  it("does not rename if parent directory is different", () => {
    const filePath = "docs/other.md";
    const newFilePath = renameIfDuplicateDirPath(filePath);
    expect(newFilePath).to.equal(filePath);
  });
  it("does not rename if parent directory is empty", () => {
    const filePath = "docs/.md";
    const newFilePath = renameIfDuplicateDirPath(filePath);
    expect(newFilePath).to.equal(filePath);
  });
});
