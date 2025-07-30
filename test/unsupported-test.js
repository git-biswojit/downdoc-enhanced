/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("unsupported", () => {
  it("should drop toc macro", () => {
    const input = heredoc`
      = Title

      toc::[]

      == First Section
      `;
    const expected = heredoc`
      # Title

      ## First Section
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should drop page break", () => {
    const input = heredoc`
      first page

      <<<

      second page
      `;
    const expected = heredoc`
      first page

      second page
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should ignore ID on block without title", () => {
    const input = heredoc`
      See <<fizz>>.

      [#fizz]
      ----
      buzz
      ----
      `;
    const expected = heredoc`
      See [fizz](#fizz).

      \`\`\`
      buzz
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should ignore cell specifier on table cells", () => {
    const input = heredoc`
      |===
      |A |B |C

      s| strong >m| monospace ^.<| normal
      |===
      `;
    const expected = heredoc`
      | A | B | C |
      | --- | --- | --- |
      | strong | monospace | normal |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  //TODO: decide if to process or not admonition label within a paragraph
  it("should not process non-paragraph blocks in Markdown-style blockquote", () => {
    const input = heredoc`
      > . one
      > . two
      > . three

      > NOTE: This is treated as a regular paragraph.

      > ====
      > example
      > ====
      `;
    expect(downdoc(input)).to.equal(input);
  });
});
