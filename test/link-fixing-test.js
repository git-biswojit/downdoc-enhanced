/* eslint-env mocha */

import { execSync } from "node:child_process";
import fsp from "node:fs/promises";
import { tmpdir } from "node:os";
import ospath from "node:path";
import { expect } from "./harness/index.js";

const downdoc = ospath.join(process.cwd(), "bin", "downdoc");

describe("Link Fixing", () => {
  let testDir;

  beforeEach(async () => {
    testDir = ospath.join(tmpdir(), `downdoc-test-${Date.now()}`);
    await fsp.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fsp.rm(testDir, { recursive: true, force: true });
  });

  it("should fix links missing .md extension", async () => {
    // Create test structure
    const inputDir = ospath.join(testDir, "input");
    const outputDir = ospath.join(testDir, "output");
    await fsp.mkdir(inputDir, { recursive: true });
    await fsp.mkdir(outputDir, { recursive: true });

    // Create source files
    await fsp.writeFile(
      ospath.join(inputDir, "main.adoc"),
      `= Main Document

This links to <<api.adoc>> and <<providers/providers.adoc>>.

Also check <<utils/helper.adoc>>.`
    );

    await fsp.writeFile(
      ospath.join(inputDir, "api.adoc"),
      `= API Documentation

This is the API documentation.`
    );

    await fsp.mkdir(ospath.join(inputDir, "providers"), { recursive: true });
    await fsp.writeFile(
      ospath.join(inputDir, "providers", "providers.adoc"),
      `= Providers

This is the providers documentation.`
    );

    await fsp.mkdir(ospath.join(inputDir, "utils"), { recursive: true });
    await fsp.writeFile(
      ospath.join(inputDir, "utils", "helper.adoc"),
      `= Helper

This is the helper documentation.`
    );

    // Run downdoc
    execSync(`${downdoc} ${inputDir} ${outputDir}`, { stdio: "inherit" });

    // Check that the main.md file has correct links
    const mainContent = await fsp.readFile(ospath.join(outputDir, "main.md"), "utf8");

    expect(mainContent).to.include("[api.md](api.md)");
    expect(mainContent).to.include("[providers/providers.md](providers/providers.md)");
    expect(mainContent).to.include("[utils/helper.md](utils/helper.md)");
  });

  it("should fix relative links in subdirectories", async () => {
    // Create test structure with nested directories
    const inputDir = ospath.join(testDir, "input");
    const outputDir = ospath.join(testDir, "output");
    await fsp.mkdir(inputDir, { recursive: true });
    await fsp.mkdir(outputDir, { recursive: true });

    // Create nested structure
    await fsp.mkdir(ospath.join(inputDir, "docs", "api"), { recursive: true });
    await fsp.mkdir(ospath.join(inputDir, "docs", "providers"), { recursive: true });

    // Main file in docs/api that links to providers
    await fsp.writeFile(
      ospath.join(inputDir, "docs", "api", "linker.adoc"),
      `= API Documentation

See <<../providers/providers.adoc>> for provider information.

Also check <<../../README.adoc>>.`
    );

    // Providers file
    await fsp.writeFile(
      ospath.join(inputDir, "docs", "providers", "providers.adoc"),
      `= Providers

This is the providers documentation.`
    );

    // README file
    await fsp.writeFile(
      ospath.join(inputDir, "README.adoc"),
      `= Project Documentation

This is the main documentation.`
    );

    // Run downdoc
    execSync(`${downdoc} ${inputDir} ${outputDir}`, { stdio: "inherit" });

    // Check that the links are correctly resolved
    const apiContent = await fsp.readFile(
      ospath.join(outputDir, "docs", "api", "linker.md"),
      "utf8"
    );

    expect(apiContent).to.include(
      "[../providers/providers.md](../providers/providers.md)"
    );
    expect(apiContent).to.include("[../../README.md](../../README.md)");
  });

  it("should handle complex nested directory structures", async () => {
    // Create complex nested structure
    const inputDir = ospath.join(testDir, "input");
    const outputDir = ospath.join(testDir, "output");
    await fsp.mkdir(inputDir, { recursive: true });
    await fsp.mkdir(outputDir, { recursive: true });

    // Create nested structure: docs/api/v1/endpoints/
    await fsp.mkdir(ospath.join(inputDir, "docs", "api", "v1", "endpoints"), {
      recursive: true,
    });
    await fsp.mkdir(ospath.join(inputDir, "docs", "providers", "auth"), {
      recursive: true,
    });

    // File deep in the structure that links to other files
    await fsp.writeFile(
      ospath.join(inputDir, "docs", "api", "v1", "endpoints", "users.adoc"),
      `= Users API

See <<../../../providers/auth/auth.adoc>> for authentication.

Also check <<../../../../README.adoc>> for overview.`
    );

    // Auth provider file
    await fsp.writeFile(
      ospath.join(inputDir, "docs", "providers", "auth", "auth.adoc"),
      `= Authentication

This is the authentication documentation.`
    );

    // README file
    await fsp.writeFile(
      ospath.join(inputDir, "README.adoc"),
      `= Project Documentation

This is the main documentation.`
    );

    // Run downdoc
    execSync(`${downdoc} ${inputDir} ${outputDir}`, { stdio: "inherit" });

    // Check that the links are correctly resolved with proper relative paths
    const usersContent = await fsp.readFile(
      ospath.join(outputDir, "docs", "api", "v1", "endpoints", "users.md"),
      "utf8"
    );

    expect(usersContent).to.include(
      "[../../../providers/auth/auth.md](../../../providers/auth/auth.md)"
    );
    expect(usersContent).to.include("[../../../../README.md](../../../../README.md)");
  });

  it("should not modify external links", async () => {
    const inputDir = ospath.join(testDir, "input");
    const outputDir = ospath.join(testDir, "output");
    await fsp.mkdir(inputDir, { recursive: true });
    await fsp.mkdir(outputDir, { recursive: true });

    await fsp.writeFile(
      ospath.join(inputDir, "main.adoc"),
      `= Main Document

Check https://example.com for external link.

Also see <<api.adoc>> for internal link.`
    );

    await fsp.writeFile(
      ospath.join(inputDir, "api.adoc"),
      `= API Documentation

This is the API documentation.`
    );

    // Run downdoc
    execSync(`${downdoc} ${inputDir} ${outputDir}`, { stdio: "inherit" });

    // Check that external links are preserved and internal links are fixed
    const mainContent = await fsp.readFile(ospath.join(outputDir, "main.md"), "utf8");

    expect(mainContent).to.include("https://example.com");
    expect(mainContent).to.include("[api.md](api.md)");
  });

  it("should handle anchor links correctly", async () => {
    const inputDir = ospath.join(testDir, "input");
    const outputDir = ospath.join(testDir, "output");
    await fsp.mkdir(inputDir, { recursive: true });
    await fsp.mkdir(outputDir, { recursive: true });

    await fsp.writeFile(
      ospath.join(inputDir, "main.adoc"),
      `= Main Document

See <<api.adoc#section>> for specific section.

Also check <<#local-anchor>> for local anchor.`
    );

    await fsp.writeFile(
      ospath.join(inputDir, "api.adoc"),
      `= API Documentation

== Section

This is the API documentation.`
    );

    // Run downdoc
    execSync(`${downdoc} ${inputDir} ${outputDir}`, { stdio: "inherit" });

    // Check that anchor links are preserved
    const mainContent = await fsp.readFile(ospath.join(outputDir, "main.md"), "utf8");

    expect(mainContent).to.include("[api.adoc#section](api.adoc#section)");
    expect(mainContent).to.include("[local-anchor](#local-anchor)");
  });

  it("should fix incorrect relative paths even when .md extension is present", async () => {
    // Create test structure with nested directories
    const inputDir = ospath.join(testDir, "input");
    const outputDir = ospath.join(testDir, "output");
    await fsp.mkdir(inputDir, { recursive: true });
    await fsp.mkdir(outputDir, { recursive: true });

    // Create nested structure
    await fsp.mkdir(ospath.join(inputDir, "docs", "api"), { recursive: true });
    await fsp.mkdir(ospath.join(inputDir, "docs", "providers"), { recursive: true });

    // Main file in docs/api that has incorrect relative path
    await fsp.writeFile(
      ospath.join(inputDir, "docs", "api", "linker.adoc"),
      `= API Documentation

See <<providers/providers.adoc>> for provider information.

Also check <<../../README.adoc>> for overview.`
    );

    // Providers file
    await fsp.writeFile(
      ospath.join(inputDir, "docs", "providers", "providers.adoc"),
      `= Providers

This is the providers documentation.`
    );

    // README file
    await fsp.writeFile(
      ospath.join(inputDir, "README.adoc"),
      `= Project Documentation

This is the main documentation.`
    );

    // Run downdoc
    execSync(`${downdoc} ${inputDir} ${outputDir}`, { stdio: "inherit" });

    // Check that the incorrect relative path is fixed
    const apiContent = await fsp.readFile(
      ospath.join(outputDir, "docs", "api", "linker.md"),
      "utf8"
    );

    // The link should be fixed from "providers/providers.md" to "../providers/providers.md"
    expect(apiContent).to.include("[providers/providers.md](../providers/providers.md)");
    expect(apiContent).to.include("[../../README.md](../../README.md)");
  });

  it("should fix links with .md extension but wrong relative path in complex structure", async () => {
    // Create complex nested structure
    const inputDir = ospath.join(testDir, "input");
    const outputDir = ospath.join(testDir, "output");
    await fsp.mkdir(inputDir, { recursive: true });
    await fsp.mkdir(outputDir, { recursive: true });

    // Create nested structure: docs/api/v1/endpoints/
    await fsp.mkdir(ospath.join(inputDir, "docs", "api", "v1", "endpoints"), {
      recursive: true,
    });
    await fsp.mkdir(ospath.join(inputDir, "docs", "providers", "auth"), {
      recursive: true,
    });

    // File deep in the structure with incorrect relative path
    await fsp.writeFile(
      ospath.join(inputDir, "docs", "api", "v1", "endpoints", "users.adoc"),
      `= Users API

See <<providers/auth/auth.adoc>> for authentication.

Also check <<../../../../README.adoc>> for overview.`
    );

    // Auth provider file
    await fsp.writeFile(
      ospath.join(inputDir, "docs", "providers", "auth", "auth.adoc"),
      `= Authentication

This is the authentication documentation.`
    );

    // README file
    await fsp.writeFile(
      ospath.join(inputDir, "README.adoc"),
      `= Project Documentation

This is the main documentation.`
    );

    // Run downdoc
    execSync(`${downdoc} ${inputDir} ${outputDir}`, { stdio: "inherit" });

    // Check that the links are correctly resolved with proper relative paths
    const usersContent = await fsp.readFile(
      ospath.join(outputDir, "docs", "api", "v1", "endpoints", "users.md"),
      "utf8"
    );

    // The link should be fixed from "providers/auth/auth.md" to "../../../providers/auth/auth.md"
    expect(usersContent).to.include(
      "[providers/auth/auth.md](../../../providers/auth/auth.md)"
    );
    expect(usersContent).to.include("[../../../../README.md](../../../../README.md)");
  });
});
