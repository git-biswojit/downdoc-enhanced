/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("link and URL macros", () => {
  it("should convert URL macro", () => {
    const input = heredoc`
      = Title

      These tests are run using https://mochajs.org[Mocha].
      `;
    const expected = heredoc`
      # Title

      These tests are run using [Mocha](https://mochajs.org).
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert URL macro defined using attribute reference", () => {
    const input = heredoc`
      = Title
      :url-mocha: https://mochajs.org

      These tests are run using {url-mocha}[Mocha].
      `;
    const expected = heredoc`
      # Title

      These tests are run using [Mocha](https://mochajs.org).
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert link macro to relative file", () => {
    const input = heredoc`
      = Title

      The link:[] macro is used to create a link with a non-URL target.

      See link:LICENSE[LICENSE] or link:LICENSE[] to find the license text.
      `;
    const expected = heredoc`
      # Title

      The link:[] macro is used to create a link with a non-URL target.

      See [LICENSE](LICENSE) or [LICENSE](LICENSE) to find the license text.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert URL macro with link macro prefix", () => {
    const input = heredoc`
      = Title

      These tests are run using link:https://mochajs.org[Mocha].
      `;
    const expected = heredoc`
      # Title

      These tests are run using [Mocha](https://mochajs.org).
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not match link: prefix followed by colon", () => {
    const input = heredoc`
      = Title

      See xref:docname:image-xref-and-link:::[link] to learn more.

      See <<docname:image-xref-and-link:::>> to learn more.

      [#docname:image-xref-and-link:::]
      == Link to Resource from Image
      `;
    const expected = heredoc`
      # Title

      See [link](#link-to-resource-from-image) to learn more.

      See [Link to Resource from Image](#link-to-resource-from-image) to learn more.

      ## Link to Resource from Image
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should remove open in blank window hint from end of link text", () => {
    const input = heredoc`
      = Title

      These tests are run using https://mochajs.org[Mocha^].
      `;
    const expected = heredoc`
      # Title

      These tests are run using [Mocha](https://mochajs.org).
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should remove open in blank window hint when used as link text", () => {
    const input = heredoc`
      = Title
      :hide-uri-scheme:

      These tests are run using https://mochajs.org[^].
      `;
    const expected = heredoc`
      # Title

      These tests are run using [mochajs.org](https://mochajs.org).
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should add markdown link to non-escaped bare URL", () => {
    const input = heredoc`
      Navigate to http://localhost:8080/app to view your application.

      The https://example.org domain name is for tests, tutorials, and examples.
      `;
    const expected = heredoc`
      Navigate to [http://localhost:8080/app](http://localhost:8080/app) to view your application.

      The [https://example.org](https://example.org) domain name is for tests, tutorials, and examples.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should obscure escaped bare URL", () => {
    const input = heredoc`
      The site will be running at \\http://localhost:8080/app.

      The \\https://example.org domain name is for tests, tutorials, and examples.
      `;
    const expected = heredoc`
      The site will be running at <span>http://</span>localhost:8080/app.

      The <span>https://</span>example.org domain name is for tests, tutorials, and examples.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should obscure escaped URL macro", () => {
    const input = heredoc`
      = Title

      Use \\https://example.org[text] to add a link to text.
      `;
    const expected = heredoc`
      # Title

      Use <span>https://</span>example.org[text] to add a link to text.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  // NOTE this does not handle case when URL macro is preceded by link:
  it("should unescape escaped link macro", () => {
    const input = heredoc`
      = Title

      Use \\link:file.ext[text] to link to a relative URL or local file.
      `;
    const expected = heredoc`
      # Title

      Use link:file.ext[text] to link to a relative URL or local file.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should hide scheme of URL if hide-uri-scheme attribute is set", () => {
    const input = heredoc`
      :hide-uri-scheme:

      You can usually use https://google.com[] to find what you're looking for.

      The http://example.org domain name is for tests, tutorials, and examples.
      `;
    const expected = heredoc`
      You can usually use [google.com](https://google.com) to find what you’re looking for.

      The [example.org](http://example.org) domain name is for tests, tutorials, and examples.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should preserve escaped square brackets in link text", () => {
    const input = heredoc`
      = Title

      The https://example.org[toc::\\[\\]] macro is not supported in Markdown.
      `;
    const expected = heredoc`
      # Title

      The [toc::\\[\\]](https://example.org) macro is not supported in Markdown.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  //TODO: check if this is correct
  it("should ignore/not ignore URL and link macros if target contains space", () => {
    const input = heredoc`
      link:not processed.html[]

      https://example.org/not processed.html[]
      `;
    const expected = heredoc`
      link:not processed.html[]

      [https://example.org/not](https://example.org/not) processed.html[]
      `;
    expect(downdoc(input)).to.equal(expected);
    // expect(downdoc(input)).to.equal(input); //select which one to use
  });

  it("should process xref macro if target has non-leading space", () => {
    const input = heredoc`
      = Title

      xref:is processed.adoc[is processed]

      xref: not processed.adoc[not processed]
      `;
    const expected = heredoc`
      # Title

      [is processed](is processed.md)

      xref: not processed.adoc[not processed]
      `;
    expect(downdoc(input)).to.equal(expected);
  });
});
