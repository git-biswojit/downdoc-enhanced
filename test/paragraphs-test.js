/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("paragraphs", () => {
  it("should preserve newlines in paragraph", () => {
    const input = heredoc`
      first line
      second line
      last line
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should collapse newlines in paragraph if markdown-unwrap-prose attribute is set", () => {
    const input = heredoc`
      no
      newlines
      here
      `;
    const expected = "no newlines here";
    expect(downdoc(input, { attributes: { "markdown-unwrap-prose": "" } })).to.equal(
      expected
    );
  });

  it("should treat ellipsis at start of paragraph as content not a block title", () => {
    const input = heredoc`
      ...and to *home*
      we shall go!
      `;
    const expected = heredoc`
      ...and to **home**
      we shall go!
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not process section title within a paragraph", () => {
    const input = heredoc`
      Let the paragraph begin.
      == only starts a section title outside of a paragraph.
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should not process attribute entry within a paragraph", () => {
    const input = heredoc`
      Let the paragraph begin.
      :name: declares an attibute in the document header.
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should not process block title within a paragraph", () => {
    const input = heredoc`
      Let the paragraph begin.
      .hidden.adoc is a hidden file.
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should not process indented line within a paragraph", () => {
    const input = heredoc`
      Let the paragraph begin.
        This paragraph uses a hanging indent.
      `;
    expect(downdoc(input)).to.equal(input);
  });

  //TODO: decide if to process or not admonition label within a paragraph
  it("should not process admonition label within a paragraph", () => {
    const input = heredoc`
      = Title

      Look
      for the
      NOTE: prefix.
      `;
    const expected = heredoc`
      # Title

      Look
      for the
      NOTE: prefix.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not process toc::[] macro within a paragraph", () => {
    const input = heredoc`
      Let the paragraph begin.
      When you see this line outside a paragraph:
      toc::[]
      it will be replaced with the table of contents.
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should convert paragraph prefixed with admonition label", () => {
    const input = heredoc`
      = Title
      :milk-type: oat

      NOTE: Remember the {milk-type} milk.

      IMPORTANT: Don't forget the children!

      TIP: Look for the https://en.wikipedia.org/wiki/Warp_(video_games)[warp] under the bridge.

      CAUTION: Slippery when wet.

      WARNING: The software you're about to use has *not* been tested.
      `;
    const expected = heredoc`
      # Title

      > **📌 _NOTE:_** Remember the oat milk.

      > **❗ _IMPORTANT:_** Don’t forget the children!

      > **💡 _TIP:_** Look for the [warp](https://en.wikipedia.org/wiki/Warp_(video_games)) under the bridge.

      > **🔥 _CAUTION:_** Slippery when wet.

      > **⚠️ _WARNING:_** The software you’re about to use has **not** been tested.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not add hard line break mark to admonition label if text resolves to empty", () => {
    const input = heredoc`
      = Title

      CAUTION: {empty}
      `;
    const expected = heredoc`
      # Title

      > **🔥 _CAUTION:_**
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should allow hard line break mark for admonition to be configured using markdown-line-break attribute", () => {
    const input = heredoc`
      = Title
      :markdown-line-break:

      CAUTION: Slippery when wet.
      `;
    const expected = heredoc`
      # Title

      > **🔥 _CAUTION:_** Slippery when wet.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should promote ID on paragraph to inline anchor", () => {
    const input = heredoc`
      = Title

      [#p-1]
      This is the first paragraph.
      `;
    const expected = heredoc`
      # Title

      <a name="p-1"></a>This is the first paragraph.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should ignore role on paragraph", () => {
    const input = heredoc`
      = Title

      [.lead]
      This is the lead paragraph.
      `;
    const expected = heredoc`
      # Title

      This is the lead paragraph.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should end paragraph at next block attribute line", () => {
    const input = heredoc`
      The paragraph before <<idname>>.
      [#idname]
      == Section Title
      `;
    const expected = heredoc`
      The paragraph before [Section Title](#section-title).
      ## Section Title
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should end literal paragraph at next block attribute line", () => {
    const input = heredoc`
       literal
       paragraph
      []
      paragraph

       more
       literal
      [foo:: bar]
      paragraph
      `;
    const expected = heredoc`
          literal
          paragraph
      paragraph

          more
          literal
      paragraph
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should end list and literal paragraph in list at next block attribute line", () => {
    const input = heredoc`
      . yin

       foo
      []
      bar
      . baz

      . yang
      `;
    const expected = heredoc`
      1. yin

             foo
      bar
      . baz

      1. yang
      `;
    expect(downdoc(input)).to.equal(expected);
  });
});
