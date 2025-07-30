/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("footnotes", () => {
  it("should convert basic footnote syntax", () => {
    const input = heredoc`
      This API is for demonstration purposes only.footnote:[Do not use with real patient data.]
      `;
    const expected = heredoc`
      This API is for demonstration purposes only.[^1]

      [^1]: Do not use with real patient data.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should handle multiple footnotes in same paragraph", () => {
    const input = heredoc`
      This is the first sentence.footnote:[First footnote content.] This is the second sentence.footnote:[Second footnote content.]
      `;
    const expected = heredoc`
      This is the first sentence.[^1] This is the second sentence.[^2]

      [^1]: First footnote content.
      [^2]: Second footnote content.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should handle footnotes across different paragraphs", () => {
    const input = heredoc`
      First paragraph with footnote.footnote:[First footnote.]

      Second paragraph with another footnote.footnote:[Second footnote.]
      `;
    const expected = heredoc`
      First paragraph with footnote.[^1]

      Second paragraph with another footnote.[^2]

      [^1]: First footnote.
      [^2]: Second footnote.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should handle footnote with simple text content", () => {
    const input = heredoc`
      The quick brown fox.footnote:[Jumped over the lazy dog.]
      `;
    const expected = heredoc`
      The quick brown fox.[^1]

      [^1]: Jumped over the lazy dog.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should handle footnote with single word content", () => {
    const input = heredoc`
      This is a test.footnote:[Test]
      `;
    const expected = heredoc`
      This is a test.[^1]

      [^1]: Test
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should handle footnote at end of line", () => {
    const input = heredoc`
      This line ends with a footnote.footnote:[End note.]
      `;
    const expected = heredoc`
      This line ends with a footnote.[^1]

      [^1]: End note.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should handle footnote in middle of sentence", () => {
    const input = heredoc`
      This sentence has a footnote.footnote:[Middle note.] in the middle.
      `;
    const expected = heredoc`
      This sentence has a footnote.[^1] in the middle.

      [^1]: Middle note.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should handle footnote with punctuation", () => {
    const input = heredoc`
      This sentence has a footnote.footnote:[Note with period.] And another.footnote:[Note with exclamation!]
      `;
    const expected = heredoc`
      This sentence has a footnote.[^1] And another.[^2]

      [^1]: Note with period.
      [^2]: Note with exclamation!
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should handle footnote with special characters", () => {
    const input = heredoc`
      This has special chars.footnote:[Note with @#$%^&*() characters.]
      `;
    const expected = heredoc`
      This has special chars.[^1]

      [^1]: Note with @#$%^&*() characters.
      `;
    expect(downdoc(input)).to.equal(expected);
  });
});
