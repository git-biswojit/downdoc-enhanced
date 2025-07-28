/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("block titles", () => {
  it("should convert block title above literal paragraph", () => {
    const input = heredoc`
      .Usage
       downdoc [OPTION]... FILE
      `;
    const expected = heredoc`
      **Usage**

          downdoc [OPTION]... FILE
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert block title with ID above literal paragraph", () => {
    const input = heredoc`
      .Usage
      [#usage]
       downdoc [OPTION]... FILE
      `;
    const expected = heredoc`
      <a name="usage"></a>**Usage**

          downdoc [OPTION]... FILE
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert block title with ID above verbatim block", () => {
    const input = heredoc`
      .Hello, World!
      [source#hello,ruby]
      ----
      puts 'Hello, World!'
      ----
      `;
    const expected = heredoc`
      <a name="hello"></a>**Hello, World!**

      \`\`\`ruby
      puts 'Hello, World!'
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert block title with ID above block image", () => {
    const input = heredoc`
      .Package Explorer
      [#package-explorer]
      image::package-explorer-screenshot.png[Package Explorer]
      `;
    const expected = heredoc`
      <a name="package-explorer"></a>**Package Explorer**

      ![Package Explorer](package-explorer-screenshot.png)
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert block title above delimited quote block", () => {
    const input = heredoc`
      .Words to code by
      ____
      Test, always test.
      ____
      `;
    const expected = heredoc`
      **Words to code by**

      > Test, always test.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert block title with ID above delimited quote block", () => {
    const input = heredoc`
      [#test-test-test]
      .Words to code by
      ____
      Test, always test.
      ____
      `;
    const expected = heredoc`
      <a name="test-test-test"></a>**Words to code by**

      > Test, always test.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert block title that begins with .", () => {
    const input = heredoc`
      ..npmrc
      ----
      omit=optional
      ----
      `;
    const expected = heredoc`
      **.npmrc**

      \`\`\`
      omit=optional
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert block title on consecutive blocks", () => {
    const input = heredoc`
      .Purpose
      To convert AsciiDoc to Markdown.

      .In Action
      image::screenshot.png[Screenshot]
      `;
    const expected = heredoc`
      **Purpose**

      To convert AsciiDoc to Markdown.

      **In Action**

      ![Screenshot](screenshot.png)
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should ignore dangling block title", () => {
    const input = heredoc`
      last paragraph

      .dangling block title
      `;
    const expected = "last paragraph";
    expect(downdoc(input)).to.equal(expected);
  });

  it("should ignore block title above section title", () => {
    const input = heredoc`
      = Document Title

      .ignored block title
      == Section Title

      content
      `;
    const expected = heredoc`
      # Document Title

      ## Section Title

      content
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not apply strong emphasis to block title with emphasis", () => {
    const input = heredoc`
      = Title

      .*To make butter:*
      . Mix ingredients
      . Chill
      . Whip
      `;
    const expected = heredoc`
      # Title

      **To make butter:**

      1. Mix ingredients
      2. Chill
      3. Whip
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should apply normal substitutions to title of verbatim block", () => {
    const input = heredoc`
      :product: ACME Cloud
      :url-host: https://cloud.example.org

      .Configuration using {product} on {url-host}[host]
      ----
      auto=true
      ----
      `;
    const expected = heredoc`
      **Configuration using ACME Cloud on [host](https://cloud.example.org)**

      \`\`\`
      auto=true
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should add anchor to block with title and ID attached to list item", () => {
    const input = heredoc`
      = Title

      * list item
      +
      .Configuration Example In List
      [#ex-in-list]
      ----
      key: value
      ----
      `;
    const expected = heredoc`
      # Title

      * list item

        <a name="ex-in-list"></a>**Configuration Example In List**

        \`\`\`
        key: value
        \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not add anchor to verbatim block with only ID", () => {
    const input = heredoc`
      = Title

      [#ex1]
      ----
      key: value
      ----
      `;
    const expected = heredoc`
      # Title

      \`\`\`
      key: value
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not process . on a line by itself as a block title", () => {
    const input = heredoc`
      before

      .

      after
      `;
    expect(downdoc(input)).to.equal(input);
  });
});
