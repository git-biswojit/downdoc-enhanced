/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("image macros", () => {
  it("should convert local inline image", () => {
    const input = heredoc`
      = Title

      When you see image:images/green-bar.png[green bar], you know the tests have passed!
      `;
    const expected = heredoc`
      # Title

      When you see ![green bar](images/green-bar.png), you know the tests have passed!
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should generate alt text from basename of target if alt text not specified", () => {
    const input = heredoc`
      = Title

      When you see image:images/red-bar.png[], something has gone wrong.

      Fix the code and click image:run[] to run the test again.

      image::project/3.1/_images/test-result.svg[]
      `;
    const expected = heredoc`
      # Title

      When you see ![red-bar](images/red-bar.png), something has gone wrong.

      Fix the code and click ![run](run) to run the test again.

      ![test-result](project/3.1/_images/test-result.svg)
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert remote inline image", () => {
    const input = heredoc`
      = Title

      * image:https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/FR.png[fr]
      `;
    const expected = heredoc`
      # Title

      * ![fr](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/FR.png)
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert inline image with space in target", () => {
    const input = heredoc`
      = Title

      An image macro consists of an image: prefix, a target, and [] with optional alt text.

      When it works, I get a image:big grin.png[].
      `;
    const expected = heredoc`
      # Title

      An image macro consists of an image: prefix, a target, and [] with optional alt text.

      When it works, I get a ![big grin](big grin.png).
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not convert inline image macro if macro name delimiter is followed by backtick", () => {
    const input = heredoc`
      image:\`[]

      An image macro consists of an \`image:\` prefix, a target, and \`[]\` with optional alt text.
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should prepend value of imagesdir attribute to target of inline image", () => {
    const input = heredoc`
      = Title
      :imagesdir: images

      When you see image:green-bar.png[green bar], you know the tests have passed!

      When you see image:red-bar.png[], something has gone wrong.
      `;
    const expected = heredoc`
      # Title

      When you see ![green bar](images/green-bar.png), you know the tests have passed!

      When you see ![red-bar](images/red-bar.png), something has gone wrong.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert local block image", () => {
    const input = heredoc`
      = Title

      Here's a screenshot of the application in action.

      image::images/screenshot.png[]
      `;
    const expected = heredoc`
      # Title

      Here’s a screenshot of the application in action.

      ![screenshot](images/screenshot.png)
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert remote block image", () => {
    const input = heredoc`
      = Title

      image::https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/FR.png[fr,32]
      `;
    const expected = heredoc`
      # Title

      ![fr](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/FR.png)
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert block image with space in target", () => {
    const input = heredoc`
      = Title

      image::[not an image macro]

      image:: image.png[not an image macro]

      image::my image.png[my image]
      `;
    const expected = heredoc`
      # Title

      image::[not an image macro]

      * **image**\\
      image.png[not an image macro]

      ![my image](my image.png)
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should prepend value of imagesdir attribute to target of block image", () => {
    const input = heredoc`
      = Title
      :imagesdir: images

      Here's a screenshot of the application in action.

      image::screenshot.png[]
      `;
    const expected = heredoc`
      # Title

      Here’s a screenshot of the application in action.

      ![screenshot](images/screenshot.png)
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should substitute attribute reference in target of block image", () => {
    const input = heredoc`
      = Title
      :url-flags: https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG

      image::{url-flags}/FR.png[fr]
      `;
    const expected = heredoc`
      # Title

      ![fr](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/FR.png)
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not convert local block image within a paragraph", () => {
    const input = heredoc`
      A block image macro uses the following form:
      image::target[]
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should preserve escaped square brackets in image alt text", () => {
    const input = heredoc`
      = Title

      image::square-brackets.png[The \\[ and \\] brackets]
      `;
    const expected = heredoc`
      # Title

      ![The \\[ and \\] brackets](square-brackets.png)
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not match macro whose target contains backslash characters", () => {
    const input = heredoc`
      = Title

      Learn more about the xref:image-macro[image:\\[\\] macro].

      [#image-macro]
      == Image macro

      Similar to the xref:\\[\\] macro, but for images. The text between [ and ] is the alt text.
      `;
    const expected = heredoc`
      # Title

      Learn more about the [image:\\[\\] macro](#image-macro).

      ## Image macro

      Similar to the xref:\\[\\] macro, but for images. The text between [ and ] is the alt text.
      `;
    expect(downdoc(input)).to.equal(expected);
  });
});
