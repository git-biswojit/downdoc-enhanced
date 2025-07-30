/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("text formatting", () => {
  it("should convert bold formatting", () => {
    const input = heredoc`
      = Title

      You *really* need to check *this* * out!
      `;
    const expected = heredoc`
      # Title

      You **really** need to check **this** * out!
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not convert bold phrase inside a word", () => {
    const input = heredoc`
      *foo*bar

      foo[.role]*bar*

      *_foo or *_bar

      *l'*élection

      é*t*é
      `;
    const expected = heredoc`
      *foo*bar

      foo[.role]**bar**

      *_foo or *_bar

      *l'*élection

      é*t*é
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should leave escaped bold formatting escaped", () => {
    const input = heredoc`
      Use the syntax \\*phrase here* to render text in bold.

      \\*a becomes b*
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should convert bold formatting in unordered list item", () => {
    const input = "* be *bold*";
    const expected = "* be **bold**";
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert italic formatting", () => {
    const input = heredoc`
      = Title

      The _ is _so_ incredibly _useful_ when making snake_case.
      `;
    const expected = heredoc`
      # Title

      The _ is _so_ incredibly _useful_ when making snake_case.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not convert italic phrase inside a word", () => {
    const input = heredoc`
      foo[.role]_bar_

      [.conj]_l'_élection

      é[.role]*t*é
      `;
    const expected = heredoc`
      foo[.role]_bar_

      [.conj]_l'_élection

      é[.role]*t*é
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should leave escaped italic formatting escaped", () => {
    const input = heredoc`
      Use the syntax [.example]\\_phrase here_ to render text in italic.

      \\_layouts or layouts_ contain the layout files.
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should convert bold italic formatting in specific order", () => {
    const input = heredoc`
      = Title

      If you really want to put some _*emphasis*_ on it, use *_bold italic_*.
      `;
    const expected = heredoc`
      # Title

      If you really want to put some _*emphasis*_ on it, use **_bold italic_**.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert monospace formatting", () => {
    const input = heredoc`
      = Title

      A boolean value can be \`true\` or \`false\`.

      In Java, a boolean is designated by the [.keyword]\`boolean\` keyword.
      `;
    const expected = heredoc`
      # Title

      A boolean value can be \`true\` or \`false\`.

      In Java, a boolean is designated by the \`boolean\` keyword.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not escape < inside monospace phrase", () => {
    const input = heredoc`
      The name of an XML tag is enclosed in \`<\` and \`>\` characters, such as \`<root>\`.

      An inline macro follows the format \`<name>:<target>[<attrlist>]\`.
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should escape < outside of monospace phrase", () => {
    const input = heredoc`
      = Title

      a < b < c

      * List<Object>
      `;
    const expected = heredoc`
      # Title

      a &lt; b &lt; c

      * List&lt;Object>
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should remove backslashes in front of URL or ellipsis in monospace phrase", () => {
    const input = heredoc`
      = Title

      Use the \`\\\` character to escape special syntax.

      Visit \`\\http://localhost:8080\` or \`\\http://127.0.0.1:8080\` in your browser to see a preview.

      The text \`lorem ipsum\\...\` will be replaced with the real content.

      All I hear is \`\\...yada, yada, yada\\...\`.

      Use \`\\xref:page.adoc#fragment[]\` to link to a fragment in another page.
      `;
    const expected = heredoc`
      # Title

      Use the \`\\\` character to escape special syntax.

      Visit \`[http://localhost:8080](http://localhost:8080)\` or \`[http://127.0.0.1:8080](http://127.0.0.1:8080)\` in your browser to see a preview.

      The text \`lorem ipsum...\` will be replaced with the real content.

      All I hear is \`...yada, yada, yada...\`.

      Use \`xref:page.adoc#fragment[]\` to link to a fragment in another page.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should remove passthrough formatting marks in literal monospace phrase", () => {
    const input = heredoc`
      = Title

      Formatting is not interpretted within a \`+literal monospace+\` phrase.

      The target of an inline macro is preceded by \`+:+\` and followed by an attrlist enclosed in \`+[]+\`.
      `;
    const expected = heredoc`
      # Title

      Formatting is not interpretted within a \`literal monospace\` phrase.

      The target of an inline macro is preceded by \`:\` and followed by an attrlist enclosed in \`[]\`.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should automatically escape attribute references in literal monospace phrase", () => {
    const input = heredoc`
      = Title
      :owner: opendevise
      :repo: downdoc

      Use the endpoint \`+/{owner}/{repo}+\` to get information about the repository.
      `;
    const expected = heredoc`
      # Title

      Use the endpoint \`/{owner}/{repo}\` to get information about the repository.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not try to escape lone { in literal monospace phrase", () => {
    const input = heredoc`
      = Title

      An attribute reference is an attribute name surrounded by \`+{+\` and \`+}+\`.
      `;
    const expected = heredoc`
      # Title

      An attribute reference is an attribute name surrounded by \`{\` and \`}\`.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not try to escape { not followed by attribute name in literal monospace phrase", () => {
    const input = heredoc`
      = Title

      The range \`+{1..9}+\` represents all non-zero numbers.
      `;
    const expected = heredoc`
      # Title

      The range \`{1..9}\` represents all non-zero numbers.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert marked phrase", () => {
    const input = heredoc`
      = Title

      #highlight this# to remember it later.
      `;
    const expected = heredoc`
      # Title

      <mark>highlight this</mark> to remember it later.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not convert marked phrase inside a word", () => {
    const input = heredoc`
      #foo#bar

      foo[.role]#bar#

      #_foo or #_bar

      #l'#élection

      é#t#é
      `;
    const expected = heredoc`
      #foo#bar

      foo[.role]<mark>bar</mark>

      #_foo or #_bar

      #l'#élection

      é#t#é
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not convert character reference as marked phrase", () => {
    const input = heredoc`
      &#169; and &#174; are trademark symbols

      [.role]#&169; and [.role]&#174; should be left as is.
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should leave escaped marked phrase escaped", () => {
    const input = heredoc`
      Use the syntax \\#phrase here# to highlight text.

      \\#hashtag is a tag or a URL fragment, but not a phone#
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should convert phrase with line-through role", () => {
    const input = heredoc`
      = Title

      [.line-through]#strike it#, that was incorrect.
      `;
    const expected = heredoc`
      # Title

      ~~strike it~~, that was incorrect.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should allow strikethrough mark to be configured using markdown-strikethrough attribute", () => {
    const input = heredoc`
      = Title
      :markdown-strikethrough: ~

      [.line-through]#strike it#, that was incorrect.
      `;
    const expected = heredoc`
      # Title

      ~strike it~, that was incorrect.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should allow strikethrough tag pair to be configured using markdown-strikethrough attribute", () => {
    const input = heredoc`
      = Title

      [.line-through]#strike it#, that was incorrect.
      `;
    const expected = heredoc`
      # Title

      <s>strike it</s>, that was incorrect.
      `;
    expect(
      downdoc(input, { attributes: { "markdown-strikethrough": "<s> </s>" } })
    ).to.equal(expected);
  });

  it("should convert generic phrase with role", () => {
    const input = heredoc`
      = Title

      Something [.special]#special#.
      `;
    const expected = heredoc`
      # Title

      Something special.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert directly adjacent marked phrases with or without role", () => {
    const input = heredoc`
      = Title

      #no##footer#

      [.basename]#script#[.ext]#.js#
      `;
    const expected = heredoc`
      # Title

      <mark>no</mark><mark>footer</mark>

      script.js
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should drop boxed attrlist in front of formatted text", () => {
    const input = heredoc`
      = Title

      Use downdoc to convert [.path]_README.adoc_ to [.path]_README.md_ *before* publishing [.path]_downdoc.tgz_.

      [x]_foo_bar
      `;
    const expected = heredoc`
      # Title

      Use downdoc to convert _README.adoc_ to _README.md_ **before** publishing _downdoc.tgz_.

      [x]_foo_bar
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not be greedy when matching boxed attrlist on formatted text", () => {
    const input = heredoc`
      = Title

      key: [ "before [.redacted]#redacted# after" ]

      [[bold]]*bold*

      [[italic]]_italic_

      [[marked]]#marked#
      `;
    const expected = heredoc`
      # Title

      key: [ "before redacted after" ]

      <a name="bold"></a>**bold**

      <a name="italic"></a>_italic_

      <a name="marked"></a><mark>marked</mark>
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert formatted text with single character", () => {
    const input = heredoc`
      *b*

      [.path]_._

      \`<\`

      "\`q\`"

      #h#
      `;
    const expected = heredoc`
      **b**

      _._

      \`<\`

      <q>q</q>

      <mark>h</mark>
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not drop line that starts with formatting text with attribute list", () => {
    const input = heredoc`
      = Title

      [.path]_README.adoc_ contains all the essential information.
      `;
    const expected = heredoc`
      # Title

      _README.adoc_ contains all the essential information.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should replace quotes around double quoted text", () => {
    const input = heredoc`
      Before you say "\`no way\`", I say "\`try before you deny\`".

      That "\`bug\`" is actually a feature of the software.
      `;
    const expected = heredoc`
      Before you say <q>no way</q>, I say <q>try before you deny</q>.

      That <q>bug</q> is actually a feature of the software.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should replace quotes around single quoted text", () => {
    const input = heredoc`
      = Title

      Accept the terms by typing '\`yes\`' when prompted.
      `;
    const expected = heredoc`
      # Title

      Accept the terms by typing <q>yes</q> when prompted.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should allow double smart quotes replacement to be controlled by quotes attribute", () => {
    const input = heredoc`
      :quotes: “ ”

      Before you say "\`no way\`", I say "\`try before you deny\`".

      That "\`bug\`" is actually a feature of the software.
      `;
    const expected = heredoc`
      Before you say “no way”, I say “try before you deny”.

      That “bug” is actually a feature of the software.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should substitute curly apostrophe", () => {
    const input = heredoc`
      That\`'s probably not going to work.

      That's probably not going to work.

      The \`'90s was the heydey of alternative rock.

      Ruby 2.6's endless range operator is a useful addition.

      Qu'est ce qu'AsciiDoc ?

      Enclose the value in single quotes (\`'\`) to apply normal substitutions to it.

      6'5"

      x'

      \`'
      `;
    const expected = heredoc`
      That’s probably not going to work.

      That’s probably not going to work.

      The ’90s was the heydey of alternative rock.

      Ruby 2.6’s endless range operator is a useful addition.

      Qu’est ce qu’AsciiDoc ?

      Enclose the value in single quotes (\`'\`) to apply normal substitutions to it.

      6'5"

      x'

      ’
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert formatted text before replacing attribute references", () => {
    const input = heredoc`
      = Title
      :bold: *not actually bold*

      {bold}
      `;
    const expected = heredoc`
      # Title

      *not actually bold*
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should replace inline anchor with anchor tag", () => {
    const input = heredoc`
      You can learn about <<foo,foo>>, <<bar,bar>>, and <<baz,baz>>.

      [[foo]]all about foo

      * [[bar]]all about bar

      |===
      | [[baz]]all about baz
      |===
      `;
    const expected = heredoc`
      You can learn about [foo](#foo), [bar](#bar), and [baz](#baz).

      <a name="foo"></a>all about foo

      * <a name="bar"></a>all about bar

      |     |
      | --- |
      | <a name="baz"></a>all about baz |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should put inline anchor in block title if paragraph has ID and block title", () => {
    const input = heredoc`
      To learn more, come <<chat>>

      .Chat with us!
      [#chat]
      You can communicate with project members and fellow users in the community chat.
      `;
    const expected = heredoc`
      To learn more, come [Chat with us!](#chat)

      <a name="chat"></a>**Chat with us!**

      You can communicate with project members and fellow users in the community chat.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should ignore inline anchor with invalid syntax", () => {
    const input = heredoc`
      = Title

      [[text inside]]text outside
      `;
    const expected = heredoc`
      # Title

      [[text inside]]text outside
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert inline stem macro and unescape escaped closing square bracket", () => {
    const input = heredoc`
      = Title

      The solution is stem:[x^2 + y^2].

      We arrive at stem:[4 \\times [(3 + 2) \\times 6\\]].
      `;
    const expected = heredoc`
      # Title

      The solution is $x^2 + y^2$.

      We arrive at $4 \\times [(3 + 2) \\times 6]$.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert standalone bold lines to h4 headers", () => {
    const input = heredoc`
      = Title

      Some regular text here.

      *Helpful Links*

      More content here.

      *Another Section*

      And more content.
      `;
    const expected = heredoc`
      # Title

      Some regular text here.

      #### Helpful Links

      More content here.

      #### Another Section

      And more content.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not convert bold lines that are part of lists", () => {
    const input = heredoc`
      = Title

      * *Install*
      * *Use*
      * *Configure*

      *Standalone Header*

      More content.
      `;
    const expected = heredoc`
      # Title

      * **Install**
      * **Use**
      * **Configure**

      #### Standalone Header

      More content.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not convert bold lines that are part of paragraphs", () => {
    const input = heredoc`
      = Title

      This is a paragraph with *bold text* inside it.

      *Standalone Header*

      Another paragraph with *more bold* text.
      `;
    const expected = heredoc`
      # Title

      This is a paragraph with **bold text** inside it.

      #### Standalone Header

      Another paragraph with **more bold** text.
      `;
    expect(downdoc(input)).to.equal(expected);
  });
});
