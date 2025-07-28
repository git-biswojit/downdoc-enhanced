/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("document parts", () => {
  it("should convert empty document", () => {
    const input = "";
    expect(downdoc(input)).to.equal(input);
  });

  it("should convert document with only body", () => {
    const input = "Body.";
    expect(downdoc(input)).to.equal(input);
  });

  it("should convert document with only document title", () => {
    const input = "= Title";
    const expected = "# Title";
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert document with header and body", () => {
    const input = heredoc`
      = Title

      Body.
      `;
    const expected = heredoc`
      # Title

      Body.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert document with body directly adjacent to header", () => {
    const input = heredoc`
      = Title
      > Ignored

      Body.
      `;
    const expected = heredoc`
      # Title

      Body.
      `;
    expect(downdoc(input)).to.equal(expected);
  });
});
