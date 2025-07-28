/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("output", () => {
  it("should trim trailing blank line", () => {
    const input = heredoc`
      = Document Title

      Content.

      ////
      Comments about this document.
      ////
      `;
    const expected = heredoc`
      # Document Title

      Content.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should trim trailing space", () => {
    const input = heredoc`
      first paragraph

      second paragraph
      `;
    expect(downdoc(input + "\n  ")).to.equal(input);
  });

  it("should trim leading blank lines", () => {
    const input = heredoc`
      // Note to self

      ifdef::not-set:[]
      Draft content.
      endif::[]
      Visible content.
      `;
    const expected = "Visible content.";
    expect(downdoc(input)).to.equal(expected);
  });

  it("should trim leading blank lines after applying subs", () => {
    const input = heredoc`
      {empty}
      Visible content.
      `;
    const expected = "Visible content.";
    expect(downdoc(input)).to.equal(expected);
  });
});
