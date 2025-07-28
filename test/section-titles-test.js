/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("section titles", () => {
  it("should convert section titles that follow doctitle", () => {
    const input = heredoc`
      = Title

      == Level 1

      content

      === Level 2

      ==== Level 3

      ===== Level 4

      ====== Level 5

      ======= just content

      more content

      == Another Level 1
      `;
    const expected = heredoc`
      # Title

      ## Level 1

      content

      ### Level 2

      #### Level 3

      ##### Level 4

      ###### Level 5

      ======= just content

      more content

      ## Another Level 1
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should process document that starts with section title", () => {
    const input = heredoc`
      == First Steps

      Let's get started!
      `;
    const expected = heredoc`
      ## First Steps

      Let’s get started!
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should process document that starts with discrete heading", () => {
    const input = heredoc`
      [discrete#tagline]
      == Your Way

      When we say <<tagline>>, we mean it.
      `;
    const expected = heredoc`
      ## Your Way

      When we say [Your Way](#your-way), we mean it.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not treat level-0 discrete heading at top of document as document title", () => {
    const input = heredoc`
      [discrete]
      = Heading
      Author Name

      {doctitle}
      `;
    const expected = heredoc`
      # Heading
      Author Name

      {doctitle}
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert part titles", () => {
    const input = heredoc`
      = Title
      :doctype: book

      = First Steps

      = Fundamentals

      = Going Further
      `;
    const expected = heredoc`
      # Title

      # First Steps

      # Fundamentals

      # Going Further
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert part title when document has no title", () => {
    const input = heredoc`
      :doctype: book
      This is the preface, not an author line.

      = First Steps

      == Installation
      `;
    const expected = heredoc`
      This is the preface, not an author line.

      # First Steps

      ## Installation
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should drop section title directly adjacent to document header", () => {
    const input = heredoc`
      = Title
      == First Steps

      == Fundamentals

      == Going Further
      `;
    const expected = heredoc`
      # Title

      ## Fundamentals

      ## Going Further
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert line with heading marker only as paragraph text", () => {
    const input = "==";
    expect(downdoc(input)).to.equal(input);
  });

  it("should convert line with heading marker followed by multiple spaces as paragraph text", () => {
    const input = heredoc`
      ==    Heading with Leading Spaces Trimmed

      ==

      fin
      `;
    const expected = heredoc`
      ## Heading with Leading Spaces Trimmed

      ==

      fin`;
    expect(downdoc(input.replace("\n==\n", "\n==  \n"))).to.equal(
      expected.replace("\n==\n", "\n==  \n")
    );
  });

  it("should clear block attributes after processing section title", () => {
    const input = heredoc`
      [,java]
      == Section Title
      ----
      plain listing block
      ----
      `;
    const expected = heredoc`
      ## Section Title
      \`\`\`
      plain listing block
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });
});
