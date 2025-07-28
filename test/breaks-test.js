/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("breaks", () => {
  it("should convert hard line break in a paragraph", () => {
    const input = heredoc`
      roses are red, +
      violets are blue.
      `;
    const expected = heredoc`
      roses are red,\\
      violets are blue.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should add hard line break character if hardbreaks option is set on paragraph", () => {
    const input = heredoc`
      [%hardbreaks]
      three
      two
      one
      blast off!
      `;
    const expected = heredoc`
      three\\
      two\\
      one\\
      blast off!
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should allow hard line break mark for paragraph to be configured using markdown-line-break attribute", () => {
    const input = heredoc`
      roses are red, +
      violets are blue.
      `;
    const expected = heredoc`
      roses are red,
      violets are blue.
      `;
    const attributes = { "markdown-line-break": "  " };
    expect(downdoc(input, { attributes })).to.equal(expected.replace("red,", "red,  "));
  });

  it("should convert hard line break on line by itself only if within a paragraph", () => {
    const input = heredoc`
      foo
       +
      bar

       +

       +
      baz
      `;
    const expected = heredoc`
      foo
      \\
      bar

          +

          +
      baz
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not convert hard line break in a block title", () => {
    const input = heredoc`
      .what color? +
      red
      `;
    const expected = heredoc`
      **what color? +**

      red
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not look for hard line break if previous line is empty", () => {
    const input = heredoc`
      foo

      {empty}
      bar
      `;
    const expected = heredoc`
      foo


      bar
      `;
    expect(downdoc(input, { attributes: { empty: "" } })).to.equal(expected);
  });

  it("should convert thematic breaks", () => {
    const input = heredoc`
      '''

      ---

      ***
      `;
    const expected = heredoc`
      ---

      ---

      ---
      `;
    expect(downdoc(input)).to.equal(expected);
  });
});
