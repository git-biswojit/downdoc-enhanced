/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("xrefs", () => {
  it("should convert internal xrefs", () => {
    const input = heredoc`
      = Title
      :idprefix:
      :idseparator: -

      == First Section

      Go to the <<second-section,next section>> or skip to <<#fin, the end>>.

      == Second Section

      Go to the xref:first-section[previous section] or continue to xref:#fin[the end].

      == Fin

      The end.
      `;
    const expected = heredoc`
      # Title

      ## First Section

      Go to the [next section](#second-section) or skip to [the end](#fin).

      ## Second Section

      Go to the [previous section](#first-section) or continue to [the end](#fin).

      ## Fin

      The end.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert internal xrefs when using default idprefix and idseparator", () => {
    const input = heredoc`
      = Title

      See <<#_foo_bar,Bar>> or xref:#_foo_baz[Baz].

      == Foo Bar

      == Foo Baz
      `;
    const expected = heredoc`
      # Title

      See [Bar](#foo-bar) or [Baz](#foo-baz).

      ## Foo Bar

      ## Foo Baz
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should unescape escaped xref macro", () => {
    const input = heredoc`
      = Title

      Use the syntax \\xref:page.adoc#fragment[] to link to a fragment in another page.
      `;
    const expected = heredoc`
      # Title

      Use the syntax xref:page.adoc#fragment[] to link to a fragment in another page.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not match internal xref macro if ID contains space characters", () => {
    const input = heredoc`
      = Title

      An internal xref macro starts with xref:#target and ends with [].
      `;
    const expected = heredoc`
      # Title

      An internal xref macro starts with xref:#target and ends with [].
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not match interdocument xref macro if fragment contains space characters", () => {
    const input = heredoc`
      = Title

      xref:doc.adoc# may be followed by a fragment before the [].
      `;
    const expected = heredoc`
      # Title

      xref:doc.adoc# may be followed by a fragment before the [].
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not match xref shorthand if ID contains space characters", () => {
    const input = heredoc`
      = Title

      The target of a shorthand xref is enclosed in \`<< >>\`.

      << and >> are the ASCII equivalent of double quotes in French.
      `;
    const expected = heredoc`
      # Title

      The target of a shorthand xref is enclosed in \`<< >>\`.

      &lt;&lt; and >> are the ASCII equivalent of double quotes in French.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should match shorthand xref inside monospace phrase", () => {
    const input = heredoc`
      = Title

      Use the \`<<replace>>\` method to replace characters in a string.

      [#replace]
      == replace

      All about the replace method.
      `;
    const expected = heredoc`
      # Title

      Use the \`[replace](#replace)\` method to replace characters in a string.

      ## replace

      All about the replace method.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert natural xref", () => {
    const input = heredoc`
      = Title

      <<Install>> xref:Section Title with Spaces[]

      == Install

      == Section Title with Spaces
      `;
    const expected = heredoc`
      # Title

      [Install](#install) [Section Title with Spaces](#section-title-with-spaces)

      ## Install

      ## Section Title with Spaces
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should match natural xref against first occurrence of title", () => {
    const input = heredoc`
      = Title

      <<Get Started>>

      [#get-started-1]
      == Get Started

      [#get-started-2]
      == Get Started
      `;
    const expected = heredoc`
      # Title

      [Get Started](#get-started)

      ## Get Started

      ## Get Started
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should fill in text for backward xref", () => {
    const input = heredoc`
      = HOWTO
      :idprefix:
      :idseparator: -

      == System Requirements

      A computer connected to the internet.

      == Usage

      Be sure you have read the <<system-requirements>>.
      `;
    const expected = heredoc`
      # HOWTO

      ## System Requirements

      A computer connected to the internet.

      ## Usage

      Be sure you have read the [System Requirements](#system-requirements).
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not fill in text for xref to doctitle without explicit ID", () => {
    const input = heredoc`
      = HOWTO

      In this <<_howto>>, you will learn how to do stuff.
      `;
    const expected = heredoc`
      # HOWTO

      In this [_howto](#_howto), you will learn how to do stuff.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should fill in text for xref to doctitle with explicit ID", () => {
    const input = heredoc`
      [#howto]
      = HOWTO downdoc

      In this <<howto>>, you will learn {doctitle}.
      `;
    const expected = heredoc`
      # HOWTO downdoc

      In this [HOWTO downdoc](#howto-downdoc), you will learn HOWTO downdoc.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should fill in text for forward xref", () => {
    const input = heredoc`
      = Title
      :idprefix:

      == System Requirements

      A computer connected to the internet.
      Once you have that, move on to <<usage>>.

      == Usage

      Let's get started.
      `;
    const expected = heredoc`
      # Title

      ## System Requirements

      A computer connected to the internet.
      Once you have that, move on to [Usage](#usage).

      ## Usage

      Let’s get started.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should use fill in text using reftext of target block with ID, title, and reftext", () => {
    const input = heredoc`
      = Title

      To get your feet wet, first try <<hello>>.

      .Hello, World example
      [[hello,Hello, World!]]
      ----
      puts 'hi'
      ----
      `;
    const expected = heredoc`
      # Title

      To get your feet wet, first try [Hello, World!](#hello).

      <a name="hello"></a>**Hello, World example**

      \`\`\`
      puts 'hi'
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should honor idprefix and idseparator when mapping autogenerated IDs", () => {
    const input = heredoc`
      = Title
      :idprefix: ref_
      :idseparator: -

      == System Requirements

      == Get Started

      Check the <<ref_system-requirements>>, then <<ref_get-started>>.
      `;
    const expected = heredoc`
      # Title

      ## System Requirements

      ## Get Started

      Check the [System Requirements](#system-requirements), then [Get Started](#get-started).
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should rewrite explicit ID to auto-generated ID and support explicit reftext", () => {
    const input = heredoc`
      = HOWTO

      You'll learn [how] to <<build>> and xref:deploy[] your site.

      [#build,reftext=Build]
      == Build Your Site

      Instructions go here.

      [[deploy, Deploy]]
      == Deploy Your Site

      Instructions go here.
      `;
    const expected = heredoc`
      # HOWTO

      You’ll learn [how] to [Build](#build-your-site) and [Deploy](#deploy-your-site) your site.

      ## Build Your Site

      Instructions go here.

      ## Deploy Your Site

      Instructions go here.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should support both forms of block attribute line on same section title", () => {
    const input = heredoc`
      = HOWTO

      You'll learn how to xref:deploy[].

      [[deploy,Deploy]]
      [reftext=Go Live]
      == Deploy Your Site

      Instructions go here.
      `;
    const expected = heredoc`
      # HOWTO

      You’ll learn how to [Go Live](#deploy-your-site).

      ## Deploy Your Site

      Instructions go here.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not match block anchor with invalid characters", () => {
    const input = heredoc`
      See <<-not-valid>>, <<.not.valid>>, <<$not-valid>>, <<0>>, or <<vérite>>.

      [[-not-valid]]
      == Nope

      [[.not.valid]]
      == Nope Again

      [[$not-valid]]
      == Still Nope

      [[0]]
      == Again Nope

      [[vérite]]
      == Yep
      `;
    const expected = heredoc`
      See [-not-valid](#-not-valid), [.not.valid](#.not.valid), [$not-valid](#$not-valid), [0](#0), or [Yep](#yep).

      ## Nope

      ## Nope Again

      ## Still Nope

      ## Again Nope

      ## Yep
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should preserve escaped square brackets in xref text", () => {
    const input = heredoc`
      = Title
      :idprefix:
      :idseparator: -

      The next section covers the xref:array-of-strings[String\\[\\] type].

      [#array-of-strings]
      == Array of strings

      A type that represents multiple string values.
      `;
    const expected = heredoc`
      # Title

      The next section covers the [String\\[\\] type](#array-of-strings).

      ## Array of strings

      A type that represents multiple string values.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should preserve escaped square brackets in xref text of xref enclosed in quotes", () => {
    const input = heredoc`
      = Title

      The next section covers the "\`xref:array-of-strings[String\\[\\] type]\`".

      [#array-of-strings]
      == Array of strings
      `;
    const expected = heredoc`
      # Title

      The next section covers the <q>[String\\[\\] type](#array-of-strings)</q>.

      ## Array of strings
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should replace attribute reference in title of internal reference", () => {
    const input = heredoc`
      = Title
      :product: ACME

      Let's <<get-started>>.

      [[get-started]]
      == Get Started with {product}

      Let’s go!
      `;
    const expected = heredoc`
      # Title

      Let’s [Get Started with ACME](#get-started-with-acme).

      ## Get Started with ACME

      Let’s go!
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should use ID as text for unresolved xref", () => {
    const input = heredoc`
      = Title

      Refer to <<webserver-instructions>> to set up your webserver.
      `;
    const expected = heredoc`
      # Title

      Refer to [webserver-instructions](#webserver-instructions) to set up your webserver.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should generate and rewrite ID for discrete heading", () => {
    const input = heredoc`
      = Title
      :idseparator: -

      [discrete]
      == Discrete Heading

      We can refer to a <<_discrete-heading>> using an xref.
      `;
    const expected = heredoc`
      # Title

      ## Discrete Heading

      We can refer to a [Discrete Heading](#discrete-heading) using an xref.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should use target as fallback text for external xref", () => {
    const input = heredoc`
      = Title

      Please refer to xref:contributing.adoc[].
      `;
    const expected = heredoc`
      # Title

      Please refer to [contributing.adoc](contributing.adoc).
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should drop trailing # from target used as fallback text for external xref", () => {
    const input = heredoc`
      = Title

      Please refer to xref:contributing.html#[].
      `;
    const expected = heredoc`
      # Title

      Please refer to [contributing.html](contributing.html).
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not prepend # to target of external xref", () => {
    const input = heredoc`
      = Title

      Please refer to the <<contributing.adoc#,contributing guide>>.
      The xref:contribution.adoc[contribution guide] will teach you how to <<contribution.adoc#build-project,build the project>>.
      `;
    const expected = heredoc`
      # Title

      Please refer to the [contributing guide](contributing.adoc).
      The [contribution guide](contribution.adoc) will teach you how to [build the project](contribution.adoc#build-project).
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should allow space in target of external xref", () => {
    const input = heredoc`
      = Title

      Please refer to the <<how to contribute.adoc#,contributing guide>>.
      The xref:how to contribute.adoc[contribution guide] will teach you how to contribute to the project.
      `;
    const expected = heredoc`
      # Title

      Please refer to the [contributing guide](how to contribute.adoc).
      The [contribution guide](how to contribute.adoc) will teach you how to contribute to the project.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should rewrite xref to verbatim block with title and ID", () => {
    const input = heredoc`
      = Title

      See <<ex1>>.

      .Configuration Example
      [#ex1]
      ----
      key: value
      ----
      `;
    const expected = heredoc`
      # Title

      See [Configuration Example](#ex1).

      <a name="ex1"></a>**Configuration Example**

      \`\`\`
      key: value
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not rewrite xref with explicit text to verbatim block with title and ID", () => {
    const input = heredoc`
      = Title

      See <<ex1,Example 1>>.

      .Configuration Example
      [#ex1]
      ----
      key: value
      ----
      `;
    const expected = heredoc`
      # Title

      See [Example 1](#ex1).

      <a name="ex1"></a>**Configuration Example**

      \`\`\`
      key: value
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should rewrite xref to promoted console block with title and ID", () => {
    const input = heredoc`
      = Title

      To begin, let's <<clone>>.

      .Clone the repository
      [#clone]
       $ git clone https://github.com/opendevise/downdoc
      `;
    const expected = heredoc`
      # Title

      To begin, let’s [Clone the repository](#clone).

      <a name="clone"></a>**Clone the repository**

      \`\`\`console
      $ git clone https://github.com/opendevise/downdoc
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should apply subs to title of block in xref", () => {
    const input = heredoc`
      = Title
      :product-name: ACME

      See <<ex1>>.

      .{product-name} _Config_
      [#ex1]
      ----
      key: value
      ----
      `;
    const expected = heredoc`
      # Title

      See [ACME _Config_](#ex1).

      <a name="ex1"></a>**ACME _Config_**

      \`\`\`
      key: value
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not match xref macro if macro name delimiter is followed by backtick", () => {
    const input = heredoc`
      xref:\`[]

      An xref macro consists of an \`xref:\` prefix, a target, and \`[]\` with optional link text.
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should not match xref: prefix followed by colon", () => {
    const input = heredoc`
      = Title

      See <<docname:xref:::link-text>>.

      [[docname:xref:::link-text]][link text] is the part where you specify the text of the link.
      `;
    const expected = heredoc`
      # Title

      See [docname:xref:::link-text](#docname:xref:::link-text).

      <a name="docname:xref:::link-text"></a>[link text] is the part where you specify the text of the link.
      `;
    expect(downdoc(input)).to.equal(expected);
  });
});
