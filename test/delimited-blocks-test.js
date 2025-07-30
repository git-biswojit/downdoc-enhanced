/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("delimited blocks", () => {
  it("should drop block delimiters for example and sidebar blocks", () => {
    const input = heredoc`
      = Title

      ====
      This paragraph is promoted to the top level.
      ====

      This is already a top-level paragraph.

      ****
      This paragraph is also promoted to the top level.
      ****

      ****
      ====
      Even this paragraph is promoted to the top level.
      ====
      ****
      `;
    const expected = heredoc`
      # Title

      This paragraph is promoted to the top level.

      This is already a top-level paragraph.

      This paragraph is also promoted to the top level.

      Even this paragraph is promoted to the top level.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should support block title with ID on example block", () => {
    const input = heredoc`
      = Title

      .A paragraph
      [#ex-p]
      ====
      This is a paragraph.
      ====
      `;
    const expected = heredoc`
      # Title

      <a name="ex-p"></a>**A paragraph**

      This is a paragraph.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should unwrap example block with title that encloses verbatim block with title", () => {
    const input = heredoc`
      = Title

      .Something like this
      ====
      .Verbatim title
      ....
      verbatim content
      ....
      ====

      == Following Section

      content
      `;
    const expected = heredoc`
      # Title

      **Something like this**

      **Verbatim title**

      \`\`\`
      verbatim content
      \`\`\`

      ## Following Section

      content
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should support block title on sidebar block", () => {
    const input = heredoc`
      = Title

      .Stuff you will skip
      ====
      If you saw this in a text book, you would likely skip it.
      Or would you?
      ====
      `;
    const expected = heredoc`
      # Title

      **Stuff you will skip**

      If you saw this in a text book, you would likely skip it.
      Or would you?
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not convert section title inside delimited block", () => {
    const input = heredoc`
      = Title

      ====
      == Not a Section Title
      ====
      `;
    const expected = heredoc`
      # Title

      == Not a Section Title
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert discrete heading inside delimited block", () => {
    const input = heredoc`
      = Title

      ====
      [discrete]
      == Heading

      Explain this example here.
      ====
      `;
    const expected = heredoc`
      # Title

      ## Heading

      Explain this example here.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert admonition block", () => {
    const input = heredoc`
      = Title

      [WARNING]
      ====
      Beware of dog.

      Oh, and watch out for zombies too.
      ====
      `;
    const expected = heredoc`
      # Title

      > **⚠️ _WARNING:_**
      > Beware of dog.
      >
      > Oh, and watch out for zombies too.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should support block title with ID on admonition block", () => {
    const input = heredoc`
      = Title

      .Key points to remember
      [IMPORTANT#key-points]
      ====
      * Verify your sources.
      * Cite your references.
      * Proofread!
      ====
      `;
    const expected = heredoc`
      # Title

      > **❗ _IMPORTANT:_** Key points to remember
      > * Verify your sources.
      > * Cite your references.
      > * Proofread!
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should ignore unknown admonition type", () => {
    const input = heredoc`
      = Title

      [INFO]
      ====
      Not a valid admonition type.

      You will just see paragraphs.
      ====
      `;
    const expected = heredoc`
      # Title

      Not a valid admonition type.

      You will just see paragraphs.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert collapsible block with title", () => {
    const input = heredoc`
      = Title

      .Reveal Answer
      [%collapsible]
      ====
      This is the answer.
      ====
      `;
    const expected = heredoc`
      # Title

      <details>
      <summary>Reveal Answer</summary>

      This is the answer.
      </details>
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert collapsible block without title", () => {
    const input = heredoc`
      = Title

      [%collapsible]
      ====
      These are the details.
      ====
      `;
    const expected = heredoc`
      # Title

      <details>
      <summary>Details</summary>

      These are the details.
      </details>
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should indent collapsible block attached to list item", () => {
    const input = heredoc`
      = Title

      . What is the square root of 4?
      +
      .Reveal Answer
      [%collapsible]
      ====
      2
      ====

      . What is the capital of Italy?
      +
      .Reveal Answer
      [%collapsible]
      ====
      Rome
      ====
      `;
    const expected = heredoc`
      # Title

      1. What is the square root of 4?

         <details>
         <summary>Reveal Answer</summary>

         2
         </details>
      2. What is the capital of Italy?

         <details>
         <summary>Reveal Answer</summary>

         Rome
         </details>
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should start collapsible block open if open option is set", () => {
    const input = heredoc`
      = Title

      .Spoiler, sorry, not sorry
      [%collapsible%open]
      ====
      They made it out alive.
      ====
      `;
    const expected = heredoc`
      # Title

      <details open>
      <summary>Spoiler, sorry, not sorry</summary>

      They made it out alive.
      </details>
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should process options on separate lines", () => {
    const input = heredoc`
      = Title

      .Spoiler, sorry, not sorry
      [%collapsible]
      [%open]
      ====
      They made it out alive.
      ====
      `;
    const expected = heredoc`
      # Title

      <details open>
      <summary>Spoiler, sorry, not sorry</summary>

      They made it out alive.
      </details>
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert collapsible block to spoiler variant if markdown-collapsible-variant is spoiler", () => {
    const input = heredoc`
      = Title
      :subject: summary

      .Always visible {subject}
      [%collapsible]
      ====
      This text won't be visible until the user clicks the always visible text.

      TIP: Click *Always visible {subject}* to hide this text again.
      ====
      `;
    const expected = heredoc`
      # Title

      \`\`\`spoiler Always visible summary
      This text won’t be visible until the user clicks the always visible text.

      > **💡 _TIP:_** Click **Always visible summary** to hide this text again.
      \`\`\`
      `;
    expect(
      downdoc(input, { attributes: { "markdown-collapsible-variant": "spoiler" } })
    ).to.equal(expected);
  });

  it("should convert collapsible block without title to spoiler", () => {
    const input = heredoc`
      = Title
      :markdown-collapsible-variant: spoiler

      [%collapsible]
      ====
      This is the spoiler.
      ====
      `;
    const expected = heredoc`
      # Title

      \`\`\`spoiler
      This is the spoiler.
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should pass through content of passthrough block as is", () => {
    const input = heredoc`
      ++++
      <table>
      <tr>
      <td>cell</td>
      </tr>
      </table>
      ++++
      `;
    const expected = heredoc`
      <table>
      <tr>
      <td>cell</td>
      </tr>
      </table>
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should support passthrough block inside another block", () => {
    const input = heredoc`
      .Click to show supporting data
      [%collapsible]
      ====
      ++++
      <table>
      <tr>
      <td>cell</td>
      </tr>
      </table>
      ++++
      ====
      `;
    const expected = heredoc`
      <details>
      <summary>Click to show supporting data</summary>

      <table>
      <tr>
      <td>cell</td>
      </tr>
      </table>
      </details>
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should ignore block title on passthrough block", () => {
    const input = heredoc`
      .ignored
      ++++
      <aside>
      <p>just an aside</p>
      </aside>
      ++++
      `;
    const expected = heredoc`
      <aside>
      <p>just an aside</p>
      </aside>
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert passthrough block with stem style to display (block) match", () => {
    const input = heredoc`
      [stem]
      ++++
      a^2 = b^2 + c^2
      ++++
      `;
    const expected = heredoc`
      \`\`\`math
      a^2 = b^2 + c^2
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });
});
