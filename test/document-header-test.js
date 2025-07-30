/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("document header", () => {
  it("should store document title in doctitle attribute", () => {
    const input = heredoc`
      = Document Title

      The title of this document is {doctitle}.
      `;
    const expected = heredoc`
      # Document Title

      The title of this document is Document Title.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should consume author line with single author", () => {
    const input = heredoc`
      = Title
      Doc Writer <doc@example.org>

      Body written by {author}.
      `;
    const expected = heredoc`
      # Title

      Body written by Doc Writer.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should consume author line with multiple authors", () => {
    const input = heredoc`
      = Title
      Doc Writer <doc@example.org>; Junior Écrivain <jr@example.org>

      This document was written by {authors}.
      It was lead by {author}.
      `;
    const expected = heredoc`
      # Title

      This document was written by Doc Writer, Junior Écrivain.
      It was lead by Doc Writer.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should consume revision line with only version", () => {
    const input = heredoc`
      = Title
      Author Name
      v1.0.0

      {revnumber}
      `;
    const expected = heredoc`
      # Title

      1.0.0
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should consume revision line with only date", () => {
    const input = heredoc`
      = Title
      Author Name
      2022-10-22

      {revdate}
      `;
    const expected = heredoc`
      # Title

      2022-10-22
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should consume revision line with version and date", () => {
    const input = heredoc`
      = Title
      Author Name
      v2, 2022-10-22

      Version {revnumber} released on {revdate}.
      `;
    const expected = heredoc`
      # Title

      Version 2 released on 2022-10-22.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should consume line after author line if only contains single number", () => {
    const input = heredoc`
      = Title
      Author Name
      22

      {revnumber}
      `;
    const expected = heredoc`
      # Title

      {revnumber}
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should process and remove attribute entries found in document header below doctitle", () => {
    const input = heredoc`
      = Title
      :foo: bar
      :yin: yang

      Body
      `;
    const expected = heredoc`
      # Title

      Body
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should consume attribute entries found in document header above doctitle", () => {
    const input = heredoc`
      :foo: bar
      :yin: yang
      = Title

      Body
      `;
    const expected = heredoc`
      # Title

      Body
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should consume attribute entries found in body", () => {
    const input = heredoc`
      = Title
      :foo: bar

      initial: {foo}

      :foo: baz

      after: {foo}
      `;
    const expected = heredoc`
      # Title

      initial: bar

      after: baz
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not recognize attribute entry if attribute name begins with -", () => {
    const input = heredoc`
      :-foo: bar

      {-foo} is not a valid attribute reference.
      `;
    const expected = heredoc`
      :-foo: bar

      {-foo} is not a valid attribute reference.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should substitute attribute reference in value of attribute entry", () => {
    const input = heredoc`
      :project-slug: acme
      = Title
      :url-org: https://example.org
      :url-project: {url-org}/{project-slug}

      The URL for this project is {url-project}.
      `;
    const expected = heredoc`
      # Title

      The URL for this project is [https://example.org/acme.](https://example.org/acme.)
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should permit underscore as attribute name", () => {
    const input = heredoc`
      = Title
      :_: {sp}

      one{_}two{_}three
      `;
    const expected = heredoc`
      # Title

      one two three
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should set value of attribute entry to empty string if value is not specified", () => {
    const input = heredoc`
      = Title
      :empty-string:

      foo{empty-string}bar
      `;
    const expected = heredoc`
      # Title

      foobar
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not set document attribute if name in attribute entry is negated", () => {
    const input = heredoc`
      = Title
      :!foo:

      ifndef::foo[]
      foo was not set
      endif::[]
      `;
    const expected = heredoc`
      # Title

      foo was not set
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should unset document attribute if name in attribute entry is negated", () => {
    const input = heredoc`
      = Title
      :foo: bar
      :!foo:

      ifndef::foo[]
      foo has been unset
      endif::[]
      `;
    const expected = heredoc`
      # Title

      foo has been unset
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should allow seed attributes to be passed in to API function", () => {
    const input = heredoc`
      = Title
      :attribute-from-document: from document
      :attribute-from-api: from document

      {attribute-from-api}

      {attribute-from-document}
      `;
    const expected = heredoc`
      # Title

      from API

      from document
      `;
    expect(downdoc(input, { attributes: { "attribute-from-api": "from API" } })).to.equal(
      expected
    );
  });

  it("should ignore doctitle attribute set from CLI", () => {
    const input = heredoc`
      = Document Title

      The doctitle is {doctitle}.
      `;
    const expected = heredoc`
      # Document Title

      The doctitle is Document Title.
      `;
    expect(downdoc(input, { attributes: { doctitle: "Title" } })).to.equal(expected);
  });
});
