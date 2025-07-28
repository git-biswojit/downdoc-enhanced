/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("blockquotes", () => {
  it("should retain Markdown-style blockquotes", () => {
    const input = heredoc`
      = Title

      > Roads?
      >
      > Where we're going, we don't need _roads_!

      The rest is...the future!

      > And away we go!
      `;
    const expected = heredoc`
      # Title

      > Roads?
      >
      > Where we’re going, we don’t need _roads_!

      The rest is...the future!

      > And away we go!
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should unwrap consecutive non-empty lines in Markdown-style blockquote", () => {
    const input = heredoc`
      = Title
      :markdown-unwrap-prose:

      > Where we're going,
      > we don't need _roads_!
      `;
    const expected = heredoc`
      # Title

      > Where we’re going, we don’t need _roads_!
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should preserve paragraph break when unwrapping Markdown-style blockquote", () => {
    const input = heredoc`
      = Title
      :markdown-unwrap-prose:

      > hi
      >
      > bye
      `;
    const expected = heredoc`
      # Title

      > hi
      >
      > bye
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert quote block", () => {
    const input = heredoc`
      = Title

      [,Doc Brown]
      ____
      Roads?

      Where we're going, we don't need _roads_!
      ____

      The rest is...the future!

      ____
      . Fasten seatbelt
      . And away we go!
      ____
      `;
    const expected = heredoc`
      # Title

      > Roads?
      >
      > Where we’re going, we don’t need _roads_!
      >
      > — Doc Brown

      The rest is...the future!

      > 1. Fasten seatbelt
      > 2. And away we go!
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should preserve indentation of literal paragraph inside quote block", () => {
    const input = heredoc`
      = Title

      ____
      Mind the gap.

       literally
      ____
      `;
    const expected = heredoc`
      # Title

      > Mind the gap.
      >
      >     literally
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should preserve indentation of empty line in verbatim block inside quote block", () => {
    const input = heredoc`
      = Title

      ____
      ----
      foo

      bar
      ----

      [indent=0]
      ----
       foo

       bar
      ----
      ____
      `;
    const expected = heredoc`
      # Title

      > \`\`\`
      > foo
      >
      > bar
      > \`\`\`
      >
      > \`\`\`
      > foo
      >
      > bar
      > \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should indent quote block attached to list item properly", () => {
    const input = heredoc`
      * yin
      +
      ____
      yang
      ____

      * foo
      +
      ____
      bar

      baz
      ____

      fin
      `;
    const expected = heredoc`
      * yin

        > yang
      * foo

        > bar
        >
        > baz

      fin
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should indent paragraph attached to list inside quote block attached to list", () => {
    const input = heredoc`
      * foo
      +
      ____
      * bar
      +
      baz
      ____
      `;
    const expected = heredoc`
      * foo

        > * bar
        >
        >   baz
      `;
    expect(downdoc(input)).to.equal(expected);
  });
});
