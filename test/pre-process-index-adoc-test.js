/* eslint-env mocha */

import fs from "fs/promises";
import { temporaryDirectory } from "tempy";
import { preProcessIndexAdoc } from "../lib/pre_process_index-adoc.js";
import { expect, heredoc } from "./harness/index.js";

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
describe("rename index.adoc files to home.adoc", () => {
  it("should rename index.adoc file to home.adoc", async () => {
    const content = heredoc`
    = Member Example Benefits

    == Overview
    This guide will help you see some of the benefits of being a member of the example organization.
    `;
    const baseDir = temporaryDirectory();
    const inputFile = `${baseDir}/index.adoc`;
    const expectedFile = `${baseDir}/home.adoc`;
    const expectedContent = heredoc`
    = Member Example Benefits

    == Overview
    This guide will help you see some of the benefits of being a member of the example organization.
    `;
    await fs.writeFile(inputFile, content);

    await preProcessIndexAdoc(baseDir);
    await expect(await exists(expectedFile)).to.be.true;
    await expect(await exists(inputFile)).to.be.false;

    await expect(await fs.readFile(expectedFile, "utf8")).to.equal(expectedContent);
  });

  it("should rename index.adoc files recursively in any subdirectory", async () => {
    const content = heredoc`
    = Member Example Benefits

    == Overview
    This guide will help you see some of the benefits of being a member of the example organization.
    `;
    const baseDir = temporaryDirectory();
    const inputFile = `${baseDir}/subdir/index.adoc`;
    const expectedFile = `${baseDir}/subdir/home.adoc`;
    const expectedContent = heredoc`
    = Member Example Benefits

    == Overview
    This guide will help you see some of the benefits of being a member of the example organization.
    `;
    await fs.mkdir(`${baseDir}/subdir`, { recursive: true });
    await fs.writeFile(inputFile, content);

    await preProcessIndexAdoc(baseDir);
    await expect(await exists(expectedFile)).to.be.true;
    await expect(await exists(inputFile)).to.be.false;

    await expect(await fs.readFile(expectedFile, "utf8")).to.equal(expectedContent);
  });
});
