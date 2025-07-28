/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("code blocks", () => {
  it("should convert literal paragraph", () => {
    const input = heredoc`
      = Title

      beginning

       literal

      middle

          literal
            so literal

      end
      `;
    const expected = heredoc`
      # Title

      beginning

          literal

      middle

          literal
            so literal

      end
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert literal paragraph at start of document", () => {
    const input = heredoc`
       literal paragraph

      normal paragraph
      `;
    const expected = heredoc`
          literal paragraph

      normal paragraph
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should terminate literal paragraph at start of delimited block", () => {
    const input = heredoc`
      = Title

       literal paragraph
      ----
      literal block
      ----
      `;
    const expected = heredoc`
      # Title

          literal paragraph
      \`\`\`
      literal block
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should promote literal paragraph that starts with command prompt to a console code block", () => {
    const input = heredoc`
      Example:

       $ npx downdoc README.adoc

      Get more information:

       $ npx downdoc -h
      `;
    const expected = heredoc`
      Example:

      \`\`\`console
      $ npx downdoc README.adoc
      \`\`\`

      Get more information:

      \`\`\`console
      $ npx downdoc -h
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not apply subs to literal paragraph by default", () => {
    const input = heredoc`
      = Title
      :foo: bar

       *{foo}*

      fin
      `;
    const expected = heredoc`
      # Title

          *{foo}*

      fin
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should honor subs attribute on all lines of literal paragraph", () => {
    const input = heredoc`
      :install-prefix: /usr/local

      installing

      [subs=attributes+]
       {install-prefix}/bin/downdoc
       {install-prefix}/lib/downdoc/index.js

      installed
      `;
    const expected = heredoc`
      installing

          /usr/local/bin/downdoc
          /usr/local/lib/downdoc/index.js

      installed
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should honor subs attribute on all lines of literal paragraph promoted to a console code block", () => {
    const input = heredoc`
      :version-downdoc: 1.0.0

      [subs=attributes+]
       $ npx downdoc@{version-downdoc} -v
       #=> {version-downdoc}
      `;
    const expected = heredoc`
      \`\`\`console
      $ npx downdoc@1.0.0 -v
      #=> 1.0.0
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should support title on promoted console literal paragraph", () => {
    const input = heredoc`
      = Document Title

      .Install
       $ npm i downdoc

      All set.
      `;
    const expected = heredoc`
      # Document Title

      **Install**

      \`\`\`console
      $ npm i downdoc
      \`\`\`

      All set.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should close implicit console code block at end of document after trimming trailing newline", () => {
    const input = heredoc`
      = Document Title

       $ npx downdoc -h

      ////
      -h and also be written as --help
      ////
      `;
    const expected = heredoc`
      # Document Title

      \`\`\`console
      $ npx downdoc -h
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert source block with language", () => {
    const input = heredoc`
      = Title

      [,js]
      ----
      const downdoc = require('downdoc')
      console.log(downdoc('= Document Title'))
      ----
      `;
    const expected = heredoc`
      # Title

      \`\`\`js
      const downdoc = require('downdoc')
      console.log(downdoc('= Document Title'))
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert source block with language preceded by space", () => {
    const input = heredoc`
      = Title

      [, text]
      ----
      just plain text
      ----
      `;
    const expected = heredoc`
      # Title

      \`\`\`text
      just plain text
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert implicit source block with language and role", () => {
    const input = heredoc`
      [.hide-imports,java]
      ----
      import java.util.*;

      public class Example {
        public static void main (String[] args) {
          System.out.println(Arrays.asList(args));
        }
      }
      ----
      `;
    const expected = heredoc`
      \`\`\`java
      import java.util.*;

      public class Example {
        public static void main (String[] args) {
          System.out.println(Arrays.asList(args));
        }
      }
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert explicit source block with language and role", () => {
    const input = heredoc`
      [source.hide-imports,java]
      ----
      import java.util.*;

      public class Example {
        public static void main (String[] args) {
          System.out.println(Arrays.asList(args));
        }
      }
      ----
      `;
    const expected = heredoc`
      \`\`\`java
      import java.util.*;

      public class Example {
        public static void main (String[] args) {
          System.out.println(Arrays.asList(args));
        }
      }
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert source block with language and role set on separate lines", () => {
    const input = heredoc`
      [,java]
      [.hide-imports]
      ----
      import java.util.*;

      public class Example {
        public static void main (String[] args) {
          System.out.println(Arrays.asList(args));
        }
      }
      ----
      `;
    const expected = heredoc`
      \`\`\`java
      import java.util.*;

      public class Example {
        public static void main (String[] args) {
          System.out.println(Arrays.asList(args));
        }
      }
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert source block with source language set on document", () => {
    const input = heredoc`
      = Title
      :source-language: js

      ----
      const downdoc = require('downdoc')
      console.log(downdoc('= Document Title'))
      ----
      `;
    const expected = heredoc`
      # Title

      \`\`\`js
      const downdoc = require('downdoc')
      console.log(downdoc('= Document Title'))
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert source block with attrlist and source language set on document", () => {
    const input = heredoc`
      = Title
      :source-language: js

      [#hello]
      ----
      const downdoc = require('downdoc')
      console.log(downdoc('= Document Title'))
      ----
      `;
    const expected = heredoc`
      # Title

      \`\`\`js
      const downdoc = require('downdoc')
      console.log(downdoc('= Document Title'))
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert promoted source block with language", () => {
    const input = heredoc`
      = Title

      [source,js]
      ....
      const downdoc = require('downdoc')
      console.log(downdoc('= Document Title'))
      ....
      `;
    const expected = heredoc`
      # Title

      \`\`\`js
      const downdoc = require('downdoc')
      console.log(downdoc('= Document Title'))
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert source block with language with block title above or below block attribute line", () => {
    const input = heredoc`
      = Title

      .Print 1 in JavaScript
      [,js]
      ----
      console.log(1)
      ----

      [,ruby]
      .Print 1 in Ruby
      ----
      puts 1
      ----
      `;
    const expected = heredoc`
      # Title

      **Print 1 in JavaScript**

      \`\`\`js
      console.log(1)
      \`\`\`

      **Print 1 in Ruby**

      \`\`\`ruby
      puts 1
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert source block without language", () => {
    const input = heredoc`
      = Title

      [source]
      ----
      /.cache/
      /node_modules/
      ----
      `;
    const expected = heredoc`
      # Title

      \`\`\`
      /.cache/
      /node_modules/
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not carry over block attributes from adjacent code block", () => {
    const input = heredoc`
      = Title

      [,ruby]
      ----
      puts 1
      ----
      ----
      puts 1
      ----
      `;
    const expected = heredoc`
      # Title

      \`\`\`ruby
      puts 1
      \`\`\`
      \`\`\`
      puts 1
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert listing block", () => {
    const input = heredoc`
      = Title

      ----
      folder/
        file.yml
        subfolder/
          file.js
      ----
      `;
    const expected = heredoc`
      # Title

      \`\`\`
      folder/
        file.yml
        subfolder/
          file.js
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert literal block without block style", () => {
    const input = heredoc`
      = Title

      [,tree]
      ....
      folder/
        file.yml
        subfolder/
          file.js
      ....
      `;
    const expected = heredoc`
      # Title

      \`\`\`
      folder/
        file.yml
        subfolder/
          file.js
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should ignore language on listing block with listing style", () => {
    const input = heredoc`
      = Title

      [listing,ignored]
      ----
      plain
      verbatim
      ----
      `;
    const expected = heredoc`
      # Title

      \`\`\`
      plain
      verbatim
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert literal block with style (diagram)", () => {
    const input = heredoc`
      = Title

      [plantuml]
      ....
      start;
      stop;
      ....
      `;
    const expected = heredoc`
      # Title

      \`\`\`plantuml
      start;
      stop;
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not substitute text in a verbatim block without block metadata", () => {
    const input = heredoc`
      = Title
      :project-name: ACME

      The name of the project is {project-name}.

      ----
      {project-name}
      ----

      {project-name} is awesome.
      `;
    const expected = heredoc`
      # Title

      The name of the project is ACME.

      \`\`\`
      {project-name}
      \`\`\`

      ACME is awesome.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not substitute text in a verbatim block with block metadata", () => {
    const input = heredoc`
      = Title
      :project-name: ACME

      The name of the project is {project-name}.

      [,ruby]
      ----
      puts '{project-name}'
      ----

      {project-name} is awesome.
      `;
    const expected = heredoc`
      # Title

      The name of the project is ACME.

      \`\`\`ruby
      puts '{project-name}'
      \`\`\`

      ACME is awesome.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not process line-oriented syntax inside verbatim block", () => {
    const input = heredoc`
      = Title

      [,asciidoc]
      ----
      = Document Title
      :toc: preamble
      :toc-title: Contents

      preamble

      == Section

      content
      ----

      Isn't AsciiDoc grand?
      `;
    const expected = heredoc`
      # Title

      \`\`\`asciidoc
      = Document Title
      :toc: preamble
      :toc-title: Contents

      preamble

      == Section

      content
      \`\`\`

      Isn’t AsciiDoc grand?
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not terminate verbatim block at alternate delimiter line", () => {
    const input = heredoc`
      ----
      above
      ....
      below
      ----
      `;
    const expected = heredoc`
      \`\`\`
      above
      ....
      below
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should outdent contents of verbatim block if indent=0 attribute is set", () => {
    const input = heredoc`
      [indent=0]
      ----
        key-1:
          - |
            val

            val
        key-2: ~
      ----

      [indent=0]
      ----
          foo
        bar
      &
      baz
      ----

      [indent=0]
      ----
      \tdef save record
      \t\tthis.db.store(record)
      \tend
      ----

      [indent=0]
      ----
      ----
      `;
    const expected = heredoc`
      \`\`\`
      key-1:
        - |
          val

          val
      key-2: ~
      \`\`\`

      \`\`\`
          foo
        bar
      &
      baz
      \`\`\`

      \`\`\`
      def save record
      \tthis.db.store(record)
      end
      \`\`\`

      \`\`\`
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should outdent contents of verbatim block inside quote block if indent=0 attribute is set", () => {
    const input = heredoc`
      ____
      [,java,indent=0]
      ----
        public class Hello {
          public static void main (String... args) {
            System.out.println("Hello, World!");
          }
        }
      ----
      ____
      `;
    const expected = heredoc`
      > \`\`\`java
      > public class Hello {
      >   public static void main (String... args) {
      >     System.out.println("Hello, World!");
      >   }
      > }
      > \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should outdent contents of verbatim block inside quote block attached to list item", () => {
    const input = heredoc`
      * list item
      +
      ____
      [,java,indent=0]
      ----
        public class Hello {
          public static void main (String... args) {
            System.out.println("Hello, World!");
          }
        }
      ----
      ____
      `;
    const expected = heredoc`
      * list item

        > \`\`\`java
        > public class Hello {
        >   public static void main (String... args) {
        >     System.out.println("Hello, World!");
        >   }
        > }
        > \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should outdent contents of verbatim block attached to list item inside quote block", () => {
    const input = heredoc`
      ____
      * list item
      +
      [,java,indent=0]
      ----
        public class Hello {
          public static void main (String... args) {
            System.out.println("Hello, World!");
          }
        }
      ----
      ____
      `;
    const expected = heredoc`
      > * list item
      >
      >   \`\`\`java
      >   public class Hello {
      >     public static void main (String... args) {
      >       System.out.println("Hello, World!");
      >     }
      >   }
      >   \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should honor subs=+attributes on source block", () => {
    const input = heredoc`
      = Title
      :url-repo: https://github.com/octocat/Spoon-Knife

      [,console,subs=+attributes]
      ----
      $ git clone {url-repo}
      ----
      `;
    const expected = heredoc`
      # Title

      \`\`\`console
      $ git clone https://github.com/octocat/Spoon-Knife
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it('should honor subs="attributes+" on source block', () => {
    const input = heredoc`
      = Title
      :url-repo: https://github.com/octocat/Spoon-Knife

      [,console,subs="attributes+"]
      ----
      $ git clone {url-repo}
      ----
      `;
    const expected = heredoc`
      # Title

      \`\`\`console
      $ git clone https://github.com/octocat/Spoon-Knife
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not mistake subs attribute for language on listing block", () => {
    const input = heredoc`
      = Title
      :url-repo: https://github.com/octocat/Spoon-Knife

      [,subs="attributes+"]
      ----
      Enter URL: {url-repo}
      ----
      `;
    const expected = heredoc`
      # Title

      \`\`\`
      Enter URL: https://github.com/octocat/Spoon-Knife
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should replace conums in source block with circled numbers", () => {
    const input = heredoc`
      = Title

      [,js]
      ----
      'use strict' // <1>

      const fs = require('node:fs') // <2>
      ----
      <1> Enables strict mode.
      <2> Requires the built-in fs module.
      `;
    const expected = heredoc`
      # Title

      \`\`\`js
      'use strict' // ①

      const fs = require('node:fs') // ②
      \`\`\`
      1. Enables strict mode.
      2. Requires the built-in fs module.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should replace autonumbered conumms in source block", () => {
    const input = heredoc`
      = Title

      [,js]
      ----
      'use strict' // <.>

      const fs = require('node:fs') // <.>
      ----
      <.> Enables strict mode.
      <.> Requires the built-in fs module.

      [,ruby]
      ----
      # frozen_string_literal: true # <.>

      File.write('bar', 'foo.txt') # <.>
      ----
      <.> Prevents strings from being mutable.
      <.> The File API is part of the stdlib.
      `;
    const expected = heredoc`
      # Title

      \`\`\`js
      'use strict' // ①

      const fs = require('node:fs') // ②
      \`\`\`
      1. Enables strict mode.
      2. Requires the built-in fs module.

      \`\`\`ruby
      # frozen_string_literal: true # ①

      File.write('bar', 'foo.txt') # ②
      \`\`\`
      1. Prevents strings from being mutable.
      2. The File API is part of the stdlib.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should support conums up to 10", () => {
    const input = heredoc`
      ----
      ${[...Array(10)].map((_, i) => "<" + (i + 1) + ">").join("\n")}
      ----
      `;
    expect(downdoc(input)).to.include("⑩");
  });

  it("should support autonumbered conums up to 10", () => {
    const input = heredoc`
      ----
      ${Array(10).fill("<.>").join("\n")}
      ----
      `;
    expect(downdoc(input)).to.include("⑩");
  });

  it("should replace conum at start of otherwise blank line", () => {
    const input = heredoc`
      ....
      first line
      <1>
      last line
      ....
      <1> blank line
      `;
    const expected = heredoc`
      \`\`\`
      first line
      ①
      last line
      \`\`\`
      1. blank line
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should substitute all conums on same line in verbatim block", () => {
    const input = heredoc`
      ----
      const Asciidoctor = require('asciidoctor')() <.> <.>

      const doc = Asciidoctor.loadFile('doc.adoc', { safe: 'safe' }) <.> <4>
      ----
      <.> Requires the Asciidoctor.js library.
      <.> Instantiates the Asciidoctor object.
      <.> Parses the AsciiDoc file into a Document object.
      <.> Sets the safe mode from the default of secure to safe.
      `;
    const expected = heredoc`
      \`\`\`
      const Asciidoctor = require('asciidoctor')() ① ②

      const doc = Asciidoctor.loadFile('doc.adoc', { safe: 'safe' }) ③ ④
      \`\`\`
      1. Requires the Asciidoctor.js library.
      2. Instantiates the Asciidoctor object.
      3. Parses the AsciiDoc file into a Document object.
      4. Sets the safe mode from the default of secure to safe.
      `;
    expect(downdoc(input)).to.equal(expected);
  });
});
