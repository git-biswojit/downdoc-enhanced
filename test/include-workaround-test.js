/* eslint-env mocha */
import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("include workaround", () => {
  it("should process <<include>> directive", () => {
    const input = heredoc`
      = Title

      <<some-other-file.adoc>>
    `;
    const expected = heredoc`
      # Title

      [some-other-file.md](some-other-file.md)
    `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should process include directive with file extension(adoc->md)", () => {
    const input = heredoc`
      = Title

      include::file.adoc[]
    `;
    const expected = heredoc`
      # Title

      [file](file.md)
    `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not drop include directive", () => {
    const input = heredoc`
          = Title

          == Chapter A

          include::chapter-b[]

          == Chapter C
          `;
    const expected = heredoc`
          # Title

          ## Chapter A

          [chapter-b](chapter-b.md)

          ## Chapter C
          `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should process multiple include directives", () => {
    const input = heredoc`
      = Title

      == Chapter A

      include::chapter-b[]

      == Chapter C

      include::chapter-d[]
    `;
    const expected = heredoc`
      # Title

      ## Chapter A

      [chapter-b](chapter-b.md)

      ## Chapter C

      [chapter-d](chapter-d.md)
    `;
    expect(downdoc(input)).to.equal(expected);
  });
});
