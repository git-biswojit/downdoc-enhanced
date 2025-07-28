/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("preprocessor conditionals", () => {
  it("should expand ifdef enclosure on attribute entry in header for defined attribute", () => {
    const input = heredoc`
      = Title
      :project-handle: downdoc
      ifdef::project-handle[:url-project: https://example.org/{project-handle}]

      This project is named {project-handle}.
      The URL of the project is {url-project}.
      `;
    const expected = heredoc`
      # Title

      This project is named downdoc.
      The URL of the project is https://example.org/downdoc.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should permit use of conditional directive above doctitle", () => {
    const input = heredoc`
      ifdef::not-set[ignore line]
      = Title
      :project-handle: downdoc

      This project is named {project-handle}.
      `;
    const expected = heredoc`
      # Title

      This project is named downdoc.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should skip ifdef enclosure on attribute entry in header for undefined attribute", () => {
    const input = heredoc`
      = Title
      ifdef::env-github[:toc-title: Contents]

      {toc-title}
      `;
    const expected = heredoc`
      # Title

      {toc-title}
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should expand ifndef enclosure on attribute entry in header for undefined attribute", () => {
    const input = heredoc`
      = Title
      ifndef::project-handle[:project-handle: downdoc]
      :url-project: https://example.org/{project-handle}

      This project is named {project-handle}.
      The URL of the project is {url-project}.
      `;
    const expected = heredoc`
      # Title

      This project is named downdoc.
      The URL of the project is https://example.org/downdoc.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should skip ifndef enclosure on attribute entry in header for defined attribute", () => {
    const input = heredoc`
      = Title
      :project-handle: downdoc
      ifndef::project-handle[:project-handle: foobar]
      :url-project: https://example.org/{project-handle}

      This project is named {project-handle}.
      The URL of the project is {url-project}.
      `;
    const expected = heredoc`
      # Title

      This project is named downdoc.
      The URL of the project is https://example.org/downdoc.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should keep contents of ifdef directive block if attribute is set", () => {
    const input = heredoc`
      = Title
      :badges:

      ifdef::badges[]
      image:https://img.shields.io/npm/v/downdoc[npm version]
      endif::[]

      Summary
      `;
    const expected = heredoc`
      # Title

      ![npm version](https://img.shields.io/npm/v/downdoc)

      Summary
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should keep contents of ifndef directive block if attribute is not set", () => {
    const input = heredoc`
      = Title

      ifndef::author[]
      There is no author.
      endif::[]

      Summary
      `;
    const expected = heredoc`
      # Title

      There is no author.

      Summary
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should skip ifdef directive block if attribute is not set and collapse empty lines", () => {
    const input = heredoc`
      = Title

      ifdef::not-set[]
      image:https://img.shields.io/npm/v/downdoc[link="https://www.npmjs.com/package/downdoc",title="npm version"]
      endif::[]

      Summary
      `;
    const expected = heredoc`
      # Title

      Summary
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should skip ifndef directive block if attribute is set and collapse empty lines", () => {
    const input = heredoc`
      = Title
      Author Name
      ifdef::author[:attribution: written by {author}]
      Ignored.

      ifndef::author[]
      There is no author.
      endif::[]

      Summary {attribution}.
      `;
    const expected = heredoc`
      # Title

      Summary written by Author Name.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not stop skipping ifdef enclosure if it contains another skipping line", () => {
    const input = heredoc`
      = Title

      ifdef::not-set[]
      skipped

      ////

      also skipped
      endif::[]

      Summary
      `;
    const expected = heredoc`
      # Title

      Summary
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should skip single-line conditional directive if condition is false", () => {
    const input = heredoc`
      = Title

      ifdef::flag[ignored line]
      Summary
      `;
    const expected = heredoc`
      # Title

      Summary
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should keep and process text from single-line conditional directive if condition is true", () => {
    const input = heredoc`
      = Title
      :foo: bar

      ifndef::bar[{foo}]
      `;
    const expected = heredoc`
      # Title

      bar
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should allow single-line conditional directive to enclose block macro", () => {
    const input = heredoc`
      = Title
      :imagesdir: img

      ifdef::imagesdir[image::screenshot.png[Screenshot]]
      `;
    const expected = heredoc`
      # Title

      ![Screenshot](img/screenshot.png)
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not remove unmatched endif::[] directive", () => {
    const input = heredoc`
      before
      endif::[]
      after
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should not remove unmatched endif::[] directive following single-line conditional directive", () => {
    const input = heredoc`
      ifndef::not-set[before]
      endif::[]
      after
      `;
    const expected = heredoc`
      before
      endif::[]
      after
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should support nested preprocessor conditionals that evaluate to true", () => {
    const input = heredoc`
      = Title
      :foo: bar

      ifdef::foo[]
      foo is set
      ifndef::yin[]
      yin is not set
      endif::[]
      ifdef::foo[foo is still set]
      endif::[]
      fin
      `;
    const expected = heredoc`
      # Title

      foo is set
      yin is not set
      foo is still set
      fin
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should support nested preprocessor conditionals that evaluate to false", () => {
    const input = heredoc`
      = Title
      :foo: bar

      ifndef::foo[]
      foo is not set
      ifdef::yin[]
      yin is set
      endif::[]
      foo is still not set
      endif::[]
      fin
      `;
    const expected = heredoc`
      # Title

      fin
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should support preprocessor conditional that evaluates to false inside one that evaluates to true", () => {
    const input = heredoc`
      = Title
      :foo: bar
      :yin: yang

      ifdef::foo[]
      foo is set
      ifndef::yin[]
      yin is not set
      endif::[]
      foo is still set
      endif::[]
      fin
      `;
    const expected = heredoc`
      # Title

      foo is set
      foo is still set
      fin
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should support preprocessor conditional that evaluates to true inside one that evaluates to false", () => {
    const input = heredoc`
      = Title
      :yin: yang

      ifdef::foo[]
      foo is set
      ifdef::yin[]
      yin is set
      endif::[]
      foo is still set
      endif::[]
      fin
      `;
    const expected = heredoc`
      # Title

      fin
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should support block comment inside preprocessor conditional that resolves to true", () => {
    const input = heredoc`
      = Title
      :foo: bar

      ifdef::foo[]
      foo is set
      ////
      comment
      ////
      endif::[]
      fin
      `;
    const expected = heredoc`
      # Title

      foo is set
      fin
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should unescape escaped preprocessor directive in verbatim block", () => {
    const input = heredoc`
      ----
      \\image::banner.png[]

      \\ifndef::show-notice[]
      \\include::notice.adoc[]
      \\endif::[]
      ----
      `;
    const expected = heredoc`
      \`\`\`
      \\image::banner.png[]

      ifndef::show-notice[]
      include::notice.adoc[]
      endif::[]
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should unescape escaped preprocessor directive outside verbatim block", () => {
    const input = heredoc`
      \\ifndef::show-notice[]
      \\include::notice.adoc[]
      \\endif::[]
      `;
    const expected = heredoc`
      ifndef::show-notice[]
      include::notice.adoc[]
      endif::[]
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should process preprocessor conditionals inside verbatim block", () => {
    const input = heredoc`
      :foo: bar

      ----
      ifdef::foo[]
      foo is set
      endif::[]
      include::ignored.adoc[]
      ----
      `;
    const expected = heredoc`
      \`\`\`
      foo is set
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });
});
