/* eslint-env mocha */

import fsp from "node:fs/promises";
import ospath from "node:path";
import downdoc from "../lib/cli.js";
import { cleanDir, expect, heredoc, StringIO } from "./harness/index.js";

const WORK_DIR = ospath.join(
  ospath.dirname(new URL(import.meta.url).pathname),
  "work-readme"
);

describe("downdoc --readme", () => {
  const lf = "\n";
  const oldcwd = process.cwd();
  let stdout, example;

  before(async () => {
    await cleanDir(WORK_DIR, { create: true });
    process.chdir(WORK_DIR);
  });

  beforeEach(async () => {
    process.chdir(oldcwd);
    await cleanDir(WORK_DIR, { create: true });
    process.chdir(WORK_DIR);
    stdout = new StringIO();
    example = {
      input: heredoc`
        = Document Title

        == Section Title

        Paragraph content.${lf}
      `,
      expectedMarkdown: heredoc`
        # Document Title

        ## Section Title

        Paragraph content.${lf}
      `,
      expectedReadmeFormat: heredoc`
        ---
        title: Document Title
        hidden: false
        ---

        ## Section Title

        Paragraph content.${lf}
      `,
    };
  });

  after(async () => {
    process.chdir(oldcwd);
    await cleanDir(WORK_DIR);
  });

  describe("single file processing", () => {
    it("should convert FILE to README format when --readme option is specified", async () => {
      const { input, expectedReadmeFormat } = example;
      await fsp.writeFile("doc.adoc", input, "utf8");
      const args = ["--readme", "doc.adoc"];
      await downdoc({ args, stdout });
      expect("doc.md").to.be.a.file().with.contents(expectedReadmeFormat);
    });

    it("should convert FILE to README format and write to stdout when --readme and -o - are specified", async () => {
      const { input, expectedReadmeFormat } = example;
      await fsp.writeFile("doc.adoc", input, "utf8");
      const args = ["--readme", "-o", "-", "doc.adoc"];
      await downdoc({ args, stdout });
      expect(stdout.string).to.include(expectedReadmeFormat);
      expect("doc.md").to.not.be.a.path();
    });

    it("should convert FILE to README format with custom output path", async () => {
      const { input, expectedReadmeFormat } = example;
      await fsp.writeFile("doc.adoc", input, "utf8");
      const args = ["--readme", "-o", "custom.md", "doc.adoc"];
      await downdoc({ args, stdout });
      expect("custom.md").to.be.a.file().with.contents(expectedReadmeFormat);
      expect("doc.md").to.not.be.a.path();
    });

    it("should handle file with duplicate directory name when --readme is specified", async () => {
      const { input, expectedReadmeFormat } = example;
      await fsp.mkdir("docs", { recursive: true });
      await fsp.writeFile("docs/docs.adoc", input, "utf8");
      const args = ["--readme", "docs/docs.adoc"];
      await downdoc({ args, stdout });
      expect("docs/docs_.md").to.be.a.file().with.contents(expectedReadmeFormat);
    });
  });

  describe("directory processing", () => {
    it("should process all .adoc files in directory with --readme option", async () => {
      const { input, expectedReadmeFormat } = example;
      await fsp.mkdir("docs", { recursive: true });
      await fsp.writeFile("docs/doc1.adoc", input, "utf8");
      await fsp.writeFile(
        "docs/doc2.adoc",
        input.replace("Document Title", "Second Document"),
        "utf8"
      );

      const args = ["--readme", "docs"];
      await downdoc({ args, stdout });

      expect("docs/doc1.md").to.be.a.file().with.contents(expectedReadmeFormat);
      expect("docs/doc2.md")
        .to.be.a.file()
        .with.contents(expectedReadmeFormat.replace("Document Title", "Second Document"));
    });

    it("should create index.md files when processing directory with --readme", async () => {
      const { input } = example;
      await fsp.mkdir("docs/subfolder", { recursive: true });
      await fsp.writeFile("docs/subfolder/doc.adoc", input, "utf8");

      const args = ["--readme", "docs"];
      await downdoc({ args, stdout });

      expect("docs/subfolder/index.md").to.be.a.file();
      const indexContent = await fsp.readFile("docs/subfolder/index.md", "utf8");
      expect(indexContent).to.include("title: Subfolder");
      expect(indexContent).to.include("hidden: false");
    });
  });

  describe("integration with other options", () => {
    it("should work with --readme and -a attribute options", async () => {
      const input = "= My Custom Title\n\nGo to {url-order} to purchase.\n";
      const expectedOutput = heredoc`
        ---
        title: My Custom Title
        hidden: false
        ---

        Go to [https://example.org/order](https://example.org/order) to purchase.${lf}
      `;
      await fsp.writeFile("doc.adoc", input, "utf8");
      const args = ["--readme", "-a", "url-order=https://example.org/order", "doc.adoc"];
      await downdoc({ args, stdout });
      expect("doc.md").to.be.a.file().with.contents(expectedOutput);
    });

    it("should handle --readme with attributes in any order", async () => {
      const input = "= Company Site\n\nVisit {url-site} to learn about {company}.\n";
      const expectedOutput = heredoc`
        ---
        title: Company Site
        hidden: false
        ---

        Visit [https://example.org](https://example.org) to learn about ACME.${lf}
      `;
      await fsp.writeFile("doc.adoc", input, "utf8");
      const args = [
        "-a",
        "url-site=https://example.org",
        "--readme",
        "doc.adoc",
        "-a",
        "company=ACME",
      ];
      await downdoc({ args, stdout });
      expect("doc.md").to.be.a.file().with.contents(expectedOutput);
    });
  });

  describe("placeholder handling", () => {
    it("should wrap placeholders in backticks when using --readme", async () => {
      const input = heredoc`
        = API Documentation

        Use the endpoint /api/users/{id} to get user details.

        The {username} parameter is required.
      `;
      const expectedOutput = heredoc`
        ---
        title: API Documentation
        hidden: false
        ---

        Use the endpoint /api/users/\`{id}\` to get user details.

        The \`{username}\` parameter is required.${lf}
      `;
      await fsp.writeFile("api.adoc", input, "utf8");
      const args = ["--readme", "api.adoc"];
      await downdoc({ args, stdout });
      expect("api.md").to.be.a.file().with.contents(expectedOutput);
    });

    it("should handle placeholders in tables when using --readme", async () => {
      const input = heredoc`
        = API Endpoints

        |===
        | Endpoint | Method | Description
        | /api/users/{id} | GET | Get user details
        | /api/posts/{postId} | DELETE | Delete post
        |===
      `;
      await fsp.writeFile("endpoints.adoc", input, "utf8");
      const args = ["--readme", "endpoints.adoc"];
      await downdoc({ args, stdout });

      const output = await fsp.readFile("endpoints.md", "utf8");
      expect(output).to.include("/api/users/`{id}`");
      expect(output).to.include("/api/posts/`{postId}`");
    });
  });

  describe("file naming conflicts", () => {
    it("should rename output when parent directory has same name", async () => {
      const { input, expectedReadmeFormat } = example;
      await fsp.mkdir("project", { recursive: true });
      await fsp.writeFile("project/project.adoc", input, "utf8");
      const args = ["--readme", "project/project.adoc"];
      await downdoc({ args, stdout });
      expect("project/project_.md").to.be.a.file().with.contents(expectedReadmeFormat);
      expect("project/project.md").to.not.be.a.path();
    });

    it("should not rename when parent directory name is different", async () => {
      const { input, expectedReadmeFormat } = example;
      await fsp.mkdir("project", { recursive: true });
      await fsp.writeFile("project/other.adoc", input, "utf8");
      const args = ["--readme", "project/other.adoc"];
      await downdoc({ args, stdout });
      expect("project/other.md").to.be.a.file().with.contents(expectedReadmeFormat);
      expect("project/other_.md").to.not.be.a.path();
    });
  });

  describe("complex directory structures", () => {
    it("should stop creating indexes at docs folder", async () => {
      const { input } = example;
      await fsp.mkdir("path1/docs/path2", { recursive: true });
      await fsp.writeFile("path1/docs/path2/document.adoc", input, "utf8");

      const args = ["--readme", "path1/docs/path2/document.adoc"];
      await downdoc({ args, stdout });

      expect("path1/index.md").to.not.be.a.path();
      expect("path1/docs/index.md").to.not.be.a.path();
      expect("path1/docs/path2/index.md").to.be.a.file();
    });

    it("should create indexes with proper titles from folder names", async () => {
      const { input } = example;
      await fsp.mkdir("docs/my-project/sub-folder", { recursive: true });
      await fsp.writeFile("docs/my-project/sub-folder/doc.adoc", input, "utf8");

      const args = ["--readme", "docs/my-project/sub-folder/doc.adoc"];
      await downdoc({ args, stdout });

      const projectIndex = await fsp.readFile("docs/my-project/index.md", "utf8");
      const subIndex = await fsp.readFile("docs/my-project/sub-folder/index.md", "utf8");

      expect(projectIndex).to.include("title: My Project");
      expect(subIndex).to.include("title: Sub Folder");
    });
  });
});
