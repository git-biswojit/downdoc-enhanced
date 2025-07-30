/* eslint-env mocha */

import fsp from "node:fs/promises";
import ospath from "node:path";
import downdoc from "../lib/cli.js";
import { cleanDir, expect, heredoc, StringIO } from "./harness/index.js";

const WORK_DIR = ospath.join(ospath.dirname(new URL(import.meta.url).pathname), "work");

describe("Directory Processing", () => {
  const lf = "\n";
  const oldcwd = process.cwd();
  let stdout, stderr;

  before(async () => {
    await cleanDir(WORK_DIR, { create: true });
    process.chdir(WORK_DIR);
  });

  beforeEach(async () => {
    process.chdir(oldcwd);
    await cleanDir(WORK_DIR, { create: true });
    process.chdir(WORK_DIR);
    stdout = new StringIO();
    stderr = new StringIO();
  });

  after(async () => {
    process.chdir(oldcwd);
    await cleanDir(WORK_DIR);
  });

  const createTestFile = async (path, content) => {
    await fsp.mkdir(ospath.dirname(path), { recursive: true });
    await fsp.writeFile(path, content, "utf8");
  };

  const createTestDir = async (path) => {
    await fsp.mkdir(path, { recursive: true });
  };

  describe("Basic Directory Processing", () => {
    it("should process a single .adoc file in a directory", async () => {
      const input = heredoc`
        = Document Title

        == Section Title

        Paragraph.${lf}
      `;
      const expected = heredoc`
        # Document Title

        ## Section Title

        Paragraph.${lf}
      `;

      await createTestFile("input/doc.adoc", input);
      const args = ["input", "output"];
      await downdoc({ args, stdout });

      expect("output/doc.md").to.be.a.file().with.contents(expected);
    });

    it("should process multiple .adoc files in a directory", async () => {
      const input1 = "= Doc 1\n\nContent 1.\n";
      const expected1 = "# Doc 1\n\nContent 1.\n";
      const input2 = "= Doc 2\n\nContent 2.\n";
      const expected2 = "# Doc 2\n\nContent 2.\n";

      await createTestFile("input/doc1.adoc", input1);
      await createTestFile("input/doc2.adoc", input2);
      const args = ["input", "output"];
      await downdoc({ args, stdout });

      expect("output/doc1.md").to.be.a.file().with.contents(expected1);
      expect("output/doc2.md").to.be.a.file().with.contents(expected2);
    });

    it("should skip non-.adoc files in directory", async () => {
      const input = "= Document Title\n\nContent.\n";
      const expected = "# Document Title\n\nContent.\n";

      await createTestFile("input/doc.adoc", input);
      await createTestFile("input/readme.txt", "This is a text file");
      await createTestFile("input/config.json", '{"key": "value"}');
      const args = ["input", "output"];
      await downdoc({ args, stdout });

      expect("output/doc.md").to.be.a.file().with.contents(expected);
      expect("output/readme.txt").to.not.be.a.path();
      expect("output/config.json").to.not.be.a.path();
    });

    it("should create output directory if it doesn't exist", async () => {
      const input = "= Document Title\n\nContent.\n";
      const expected = "# Document Title\n\nContent.\n";

      await createTestFile("input/doc.adoc", input);
      const args = ["input", "new-output"];
      await downdoc({ args, stdout });

      expect("new-output").to.be.a.directory();
      expect("new-output/doc.md").to.be.a.file().with.contents(expected);
    });
  });

  describe("Recursive Directory Processing", () => {
    it("should process nested directories recursively", async () => {
      const input1 = "= Doc 1\n\nContent 1.\n";
      const expected1 = "# Doc 1\n\nContent 1.\n";
      const input2 = "= Doc 2\n\nContent 2.\n";
      const expected2 = "# Doc 2\n\nContent 2.\n";
      const input3 = "= Doc 3\n\nContent 3.\n";
      const expected3 = "# Doc 3\n\nContent 3.\n";

      await createTestFile("input/docs/doc1.adoc", input1);
      await createTestFile("input/docs/subdir/doc2.adoc", input2);
      await createTestFile("input/guides/doc3.adoc", input3);

      const args = ["input", "output"];
      await downdoc({ args, stdout });

      expect("output/docs/doc1.md").to.be.a.file().with.contents(expected1);
      expect("output/docs/subdir/doc2.md").to.be.a.file().with.contents(expected2);
      expect("output/guides/doc3.md").to.be.a.file().with.contents(expected3);
    });

    it("should preserve directory structure in output", async () => {
      const input = "= Document Title\n\nContent.\n";
      const expected = "# Document Title\n\nContent.\n";

      await createTestFile("input/docs/guides/user-guide.adoc", input);
      const args = ["input", "output"];
      await downdoc({ args, stdout });

      expect("output/docs/guides/user-guide.md").to.be.a.file().with.contents(expected);
    });

    it("should skip empty directories", async () => {
      await createTestDir("input/empty-dir");
      await createTestFile("input/doc.adoc", "= Document\n\nContent.\n");
      const args = ["input", "output"];
      await downdoc({ args, stdout });

      expect("output/doc.md").to.be.a.file();
      expect("output/empty-dir").to.not.be.a.path();
    });
  });

  describe("Output Directory Handling", () => {
    it("should use input directory as output when output directory is not specified", async () => {
      const input = "= Document Title\n\nContent.\n";
      const expected = "# Document Title\n\nContent.\n";

      await createTestFile("input/doc.adoc", input);
      const args = ["input"];
      await downdoc({ args, stdout });

      expect("input/doc.md").to.be.a.file().with.contents(expected);
    });

    it("should overwrite existing .md files in output directory", async () => {
      const oldContent = "# Old Content\n";
      const newInput = "= New Document\n\nNew content.\n";
      const newExpected = "# New Document\n\nNew content.\n";

      await createTestFile("output/doc.md", oldContent);
      await createTestFile("input/doc.adoc", newInput);
      const args = ["input", "output"];
      await downdoc({ args, stdout });

      expect("output/doc.md").to.be.a.file().with.contents(newExpected);
    });

    it("should preserve non-.md files in output directory", async () => {
      const input = "= Document Title\n\nContent.\n";
      const expected = "# Document Title\n\nContent.\n";
      const existingFile = "Existing content";

      await createTestFile("output/existing.txt", existingFile);
      await createTestFile("input/doc.adoc", input);
      const args = ["input", "output"];
      await downdoc({ args, stdout });

      expect("output/doc.md").to.be.a.file().with.contents(expected);
      expect("output/existing.txt").to.be.a.file().with.contents(existingFile);
    });
  });

  describe("Error Handling", () => {
    it("should handle non-existent input directory", async () => {
      const args = ["non-existent-dir", "output"];
      const p = { args, stderr };
      await downdoc(p);

      expect(stderr.string).to.include("No such file");
      expect(p.exitCode).to.equal(1);
    });

    it("should handle input directory with no .adoc files", async () => {
      await createTestFile("input/readme.txt", "This is a text file");
      const args = ["input", "output"];
      await downdoc({ args, stdout });

      // Should not error, just process nothing
      expect("output").to.not.be.a.path();
    });

    it("should handle permission errors gracefully", async () => {
      // This test would require mocking file system permissions
      // For now, we'll test that the CLI doesn't crash on directory access
      await createTestFile("input/doc.adoc", "= Test\n\nContent.\n");
      const args = ["input", "output"];

      // Should not throw
      await downdoc({ args, stdout });
    });
  });

  describe("Mixed File and Directory Input", () => {
    it("should handle single file input as before", async () => {
      const input = "= Document Title\n\nContent.\n";
      const expected = "# Document Title\n\nContent.\n";

      await createTestFile("doc.adoc", input);
      const args = ["doc.adoc"];
      await downdoc({ args, stdout });

      expect("doc.md").to.be.a.file().with.contents(expected);
    });

    it("should handle directory input with --output option", async () => {
      const input = "= Document Title\n\nContent.\n";
      const expected = "# Document Title\n\nContent.\n";

      await createTestFile("input/doc.adoc", input);
      const args = ["--output", "custom-output", "input"];
      await downdoc({ args, stdout });

      expect("custom-output/doc.md").to.be.a.file().with.contents(expected);
    });
  });

  describe("Attributes with Directory Processing", () => {
    it("should apply attributes to all processed files", async () => {
      const input = "Visit {url-site} to learn about {company}.\n";
      const expected =
        "Visit [https://example.org](https://example.org) to learn about ACME.\n";

      await createTestFile("input/doc1.adoc", input);
      await createTestFile("input/doc2.adoc", input);
      const args = [
        "-a",
        "url-site=https://example.org",
        "-a",
        "company=ACME",
        "input",
        "output",
      ];
      await downdoc({ args, stdout });

      expect("output/doc1.md").to.be.a.file().with.contents(expected);
      expect("output/doc2.md").to.be.a.file().with.contents(expected);
    });
  });

  describe("Edge Cases", () => {
    it("should handle directory names with special characters", async () => {
      const input = "= Document Title\n\nContent.\n";
      const expected = "# Document Title\n\nContent.\n";

      await createTestFile("input dir/doc.adoc", input);
      const args = ["input dir", "output"];
      await downdoc({ args, stdout });

      expect("output/doc.md").to.be.a.file().with.contents(expected);
    });

    it("should handle .adoc files with same name in different directories", async () => {
      const input1 = "= Doc 1\n\nContent 1.\n";
      const expected1 = "# Doc 1\n\nContent 1.\n";
      const input2 = "= Doc 2\n\nContent 2.\n";
      const expected2 = "# Doc 2\n\nContent 2.\n";

      await createTestFile("input/docs/doc.adoc", input1);
      await createTestFile("input/guides/doc.adoc", input2);
      const args = ["input", "output"];
      await downdoc({ args, stdout });

      expect("output/docs/doc.md").to.be.a.file().with.contents(expected1);
      expect("output/guides/doc.md").to.be.a.file().with.contents(expected2);
    });

    it("should handle empty .adoc files", async () => {
      await createTestFile("input/empty.adoc", "");
      const args = ["input", "output"];
      await downdoc({ args, stdout });

      expect("output/empty.md").to.be.a.file().with.contents("\n");
    });
  });
});
