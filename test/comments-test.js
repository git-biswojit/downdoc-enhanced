/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("comments", () => {
  it("should skip line comments", () => {
    const input = heredoc`
      // This is an AsciiDoc document.
      = Title
      // This line defines an attribute.
      :summary: Summary
      // This line is simply ignored.

      // This outputs the value of the summary attribute.
      {summary}

      // This is just a regular paragraph.
      More summary
      //fin
      `;
    const expected = heredoc`
      # Title

      Summary

      More summary
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should skip line comment that contains a dlist term", () => {
    const input = heredoc`
      //old term:: description
      new term:: description
      `;
    const expected = heredoc`
      * **new term**\\
      description
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  // NOTE: it's an open question about whether a block comment breaks a paragraph
  it("should skip block comments", () => {
    const input = heredoc`
      ////
      Maybe a license header?

      Any amount of lines are skipped.
      ////
      = Title
      :summary: Summary

      ////
      - ignore
      - these
      - lines

      these are just notes
      ////

      {summary}

      More summary
      ////
      Maybe some instructions to the author here?
      ////
      . Wrap it up!
      `;
    const expected = heredoc`
      # Title

      Summary

      More summary
      1. Wrap it up!
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not stop skipping block comment that contains other skipping line", () => {
    const input = heredoc`
      before

      ////
      comment

      |===

      still comment

      endif::[]

      still comment
      ////

      after
      `;
    const expected = heredoc`
      before

      after
      `;
    expect(downdoc(input)).to.equal(expected);
  });
});
