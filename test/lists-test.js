/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("lists", () => {
  it("should not process list marker within a paragraph", () => {
    const input = heredoc`
      Let the paragraph begin.
      * is the formatting mark for bold.
      - is only a list marker.

      Let another paragraph begin.
      . followed by a space starts an ordered list outside a paragraph.

      One more for the road.
      <1> is a callout list marker and conum.
      `;
    expect(downdoc(input)).to.equal(input.replace(/</g, "&lt;"));
  });

  it("should retain unordered list", () => {
    const input = heredoc`
      * work
      * play
      * drink

      paragraph

      * and party!
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should trim extra spaces following list marker", () => {
    const input = heredoc`
      * ready
      *  set
      *   go!
      `;
    const expected = heredoc`
      * ready
      * set
      * go!
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should remove blank lines between unordered list items", () => {
    const input = heredoc`
      * work

      ** more work

      * play


      * drink

      and party!
      `;
    const expected = heredoc`
      * work
        * more work
      * play
      * drink

      and party!
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert nested unordered lists", () => {
    const input = heredoc`
      * foo
      ** bar
      *** baz
      ** bar
      * foo
      ** bar
      *** baz
      * foo
      `;
    const expected = heredoc`
      * foo
        * bar
          * baz
        * bar
      * foo
        * bar
          * baz
      * foo
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert nested unordered lists if they are indented", () => {
    const input = heredoc`
      * foo
       ** bar
        *** baz
       ** bar
      * foo
      `;
    const expected = heredoc`
      * foo
        * bar
          * baz
        * bar
      * foo
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should honor markdown-list-indent when converting nested unordered lists", () => {
    const input = heredoc`
      * foo
      ** bar
      *** baz
      ** bar
      * foo
      `;
    const expected = heredoc`
      * foo
          * bar
              * baz
          * bar
      * foo
      `;
    expect(downdoc(input, { attributes: { "markdown-list-indent": "4" } })).to.equal(
      expected
    );
  });

  it("should not indent empty line in nested list", () => {
    const input = heredoc`
      * foo
      ** bar
      {empty}
      baz
      `;
    const expected = heredoc`
      * foo
        * bar

        baz
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should unwrap principal text and paragraph on list item when markdown-unwrap-prose attributes is set", () => {
    const input = heredoc`
      :markdown-unwrap-prose:

      * foo
      bar
      +
      fizz
      buzz
      ** bar
      baz
      `;
    const expected = heredoc`
      * foo bar

        fizz buzz
        * bar baz
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should support single hyphen as unordered list marker", () => {
    const input = heredoc`
      * Do
      - Re
      * Do
      `;
    const expected = heredoc`
      * Do
        * Re
      * Do
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not recognize repeating hyphens as list marker", () => {
    const input = heredoc`
      -- foo
      -- bar
      `;
    const expected = input;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should support block title and ID on list", () => {
    const input = heredoc`
      [#staples]
      .Staples
      * Flour
      * Sugar
      * Oil
      `;
    const expected = heredoc`
      <a name="staples"></a>**Staples**

      * Flour
      * Sugar
      * Oil
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert checklist", () => {
    const input = heredoc`
      * [x] done
      * [ ] not done
      * nothing special
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should convert ordered list to numbered list", () => {
    const input = heredoc`
      = Title

      . one
      . two
      . three
      . _done!_

      paragraph

      . and one
      `;
    const expected = heredoc`
      # Title

      1. one
      2. two
      3. three
      4. _done!_

      paragraph

      1. and one
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert ordered list that uses explicit arabic numerals", () => {
    const input = heredoc`
      1. one
      2. two
      3. three
      4. four
      5. five
      6. six
      7. seven
      8. eight
      9. nine
      10. *10!*
      ** out of 10!
      `;
    const expected = heredoc`
      1. one
      2. two
      3. three
      4. four
      5. five
      6. six
      7. seven
      8. eight
      9. nine
      10. **10!**
         * out of 10!
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should remove blank lines between ordered list items", () => {
    const input = heredoc`
      . one

      .. extra step

      . two


      . three

      done
      `;
    const expected = heredoc`
      1. one
         1. extra step
      2. two
      3. three

      done
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should break list at block attribute line if preceded by an empty line", () => {
    const input = heredoc`
      . one
      [loweralpha]
      .. nested in one
      . two

      []
      . one
      `;
    const expected = heredoc`
      1. one
         1. nested in one
      2. two

      1. one
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert nested ordered lists", () => {
    const input = heredoc`
      . foo
      .. bar
      ... baz
      .. bar
      . foo
      .. bar
      ... baz
      . foo
      `;
    const expected = heredoc`
      1. foo
         1. bar
            1. baz
         2. bar
      2. foo
         1. bar
            1. baz
      3. foo
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert nested ordered lists if they are indented", () => {
    const input = heredoc`
      . foo
       .. bar
        ... baz
       .. bar
      . foo
      `;
    const expected = heredoc`
      1. foo
         1. bar
            1. baz
         2. bar
      2. foo
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should honor markdown-list-indent when converting nested ordered lists", () => {
    const input = heredoc`
      :markdown-list-indent: 4

      . foo
      .. bar
      ... baz
      .. bar
      . foo
      `;
    const expected = heredoc`
      1. foo
          1. bar
              1. baz
          2. bar
      2. foo
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert mixed nested lists", () => {
    const input = heredoc`
      * unordered
       .. ordered
        *** unordered
       .. ordered
      * unordered
      `;
    const expected = heredoc`
      * unordered
        1. ordered
           * unordered
        2. ordered
      * unordered
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should continue numbering from ancestor list", () => {
    const input = heredoc`
      . foo
      .. bar
      ... baz
      . foo
      `;
    const expected = heredoc`
      1. foo
         1. bar
            1. baz
      2. foo
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert description list into unordered list with bold first line", () => {
    const input = heredoc`
      term:: desc

      another term::
      desc
      +
      attached paragraph

      yet another term:: desc

      one more term::
      desc
      more desc
      `;
    const expected = heredoc`
      * **term**\\
      desc
      * **another term**\\
      desc

        attached paragraph
      * **yet another term**\\
      desc
      * **one more term**\\
      desc
      more desc
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not add hard line break mark to description list term if description resolves to empty", () => {
    const input = heredoc`
      term::

      separator

      term:: {empty}

      term::
      {empty}

      separator

      term::
      `;
    const expected = heredoc`
      * **term**

      separator

      * **term**
      * **term**\\

      separator

      * **term**
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should allow hard line break mark for dlist term to be configured using markdown-line-break attribute", () => {
    const input = heredoc`
      term:: desc

      another term::
      desc
      `;
    const expected = heredoc`
      * **term**<br>
      desc
      * **another term**<br>
      desc
      `;
    expect(downdoc(input, { attributes: { "markdown-line-break": "<br>" } })).to.equal(
      expected
    );
  });

  it("should support block title and ID on description list", () => {
    const input = heredoc`
      [#terms]
      .Glossary
      terroir:: A wine's sense of place.
      complexity:: A wine's characteristic qualities.
      `;
    const expected = heredoc`
      <a name="terms"></a>**Glossary**

      * **terroir**\\
      A wine’s sense of place.
      * **complexity**\\
      A wine’s characteristic qualities.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should allow dlist term to start with list marker", () => {
    const input = heredoc`
      -:: subtract
      <:: check if less than
      `;
    const expected = heredoc`
      * **-**\\
      subtract
      * **&lt;**\\
      check if less than
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should allow repeating colon in description list term", () => {
    const input = heredoc`
      foo::bar:: baz

      ::foo::
      bar

      :::fizz::: buzz
      `;
    const expected = heredoc`
      * **foo::bar**\\
      baz
      * **::foo**\\
      bar
        * **:::fizz**\\
        buzz
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  // FIXME any repeating colon shouldn't be matched
  it("should not match line with only double colon at start of line as description list entry", () => {
    const input = heredoc`
      ::

      ::foo
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should convert description list nested in unordered list", () => {
    const input = heredoc`
      * foo
      term:: desc
      * bar
      `;
    const expected = heredoc`
      * foo
        * **term**\\
        desc
      * bar
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert description list nested in unordered list and indented", () => {
    const input = heredoc`
      * foo

        term:: desc

      * bar
      `;
    const expected = heredoc`
      * foo
        * **term**\\
        desc
      * bar
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert description list nested in ordered list", () => {
    const input = heredoc`
      . foo
      term:: desc
      . bar
      `;
    const expected = heredoc`
      1. foo
         * **term**\\
         desc
      2. bar
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert description list nested in ordered list and indented", () => {
    const input = heredoc`
      . foo

        term:: desc

      . bar
      `;
    const expected = heredoc`
      1. foo
         * **term**\\
         desc
      2. bar
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert unordered list nested in description list", () => {
    const input = heredoc`
      term::
      * foo
      ** bar
      * baz
      another term::
      `;
    const expected = heredoc`
      * **term**
        * foo
          * bar
        * baz
      * **another term**
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert nested description list into unordered list with bold first line", () => {
    const input = heredoc`
      term:: desc

      nested term::: desc

      another nested term:::
      desc

      another term::
      desc
      `;
    const expected = heredoc`
      * **term**\\
      desc
        * **nested term**\\
        desc
        * **another nested term**\\
        desc
      * **another term**\\
      desc
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert nested description lists", () => {
    const input = heredoc`
      foo:: bar
      yin::: yang
      fizz:::: buzz
      yin::: yang
      foo:: bar
      yin::: yang
      fizz:::: buzz
      foo::
      bar
      `;
    const expected = heredoc`
      * **foo**\\
      bar
        * **yin**\\
        yang
          * **fizz**\\
          buzz
        * **yin**\\
        yang
      * **foo**\\
      bar
        * **yin**\\
        yang
          * **fizz**\\
          buzz
      * **foo**\\
      bar
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not leave behind hard line break marker after description list term followed by separate block", () => {
    const input = heredoc`
      term::
      ----
      listing
      ----
      `;
    const expected = heredoc`
      * **term**
      \`\`\`
      listing
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not leave behind hard line break marker after description list entry with attached block", () => {
    const input = heredoc`
      term::
      +
      ----
      listing
      ----
      `;
    const expected = heredoc`
      * **term**

        \`\`\`
        listing
        \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert qanda list", () => {
    const input = heredoc`
      [qanda]
      What's the answer to the ultimate question?:: 47

      What's a group of lemurs called?::
      A conspiracy.
      `;
    const expected = heredoc`
      1. _What’s the answer to the ultimate question?_\\
      47
      2. _What’s a group of lemurs called?_\\
      A conspiracy.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert nested qanda list", () => {
    const input = heredoc`
      [qanda]
      Did you read the novel?::
      [qanda]
      Who is the main character?:::
      Jon

      What is the main character's personal conflict?:::
      Lack of respect from parents.
      `;
    const expected = heredoc`
      1. _Did you read the novel?_
         1. _Who is the main character?_\\
         Jon
         2. _What is the main character’s personal conflict?_\\
         Lack of respect from parents.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should continue numbering after list item with attached block followed by blank line", () => {
    const input = heredoc`
      . one

       literal paragraph
      +
      paragraph

      . two
      +
       literal paragraph

      paragraph
      `;
    const expected = heredoc`
      1. one

             literal paragraph

         paragraph
      2. two

             literal paragraph

      paragraph
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not process section title inside list item", () => {
    const input = heredoc`
      * first list item
      == not a section title
      ** nested list item
      * last list item
      `;
    const expected = heredoc`
      * first list item
      == not a section title
        * nested list item
      * last list item
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert colist to numbered list", () => {
    const input = heredoc`
      = Document Title

      <1> Prints the number 1.
      <2> Exits the program.
      <3> Explain me.
      <4> Explain me.
      <5> Explain me.
      <6> Explain me.
      <7> Explain me.
      <8> Explain me.
      <9> Explain me.
      <10> Explain me.
      `;
    const expected = heredoc`
      # Document Title

      1. Prints the number 1.
      2. Exits the program.
      3. Explain me.
      4. Explain me.
      5. Explain me.
      6. Explain me.
      7. Explain me.
      8. Explain me.
      9. Explain me.
      10. Explain me.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert colist with autonumbering to numbered list", () => {
    const input = heredoc`
      = Document Title

      <.> Prints the number 1.
      <.> Exits the program.
      `;
    const expected = heredoc`
      # Document Title

      1. Prints the number 1.
      2. Exits the program.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should indent block following a list continuation", () => {
    const input = heredoc`
      * Install
      +
      [,console]
      ----
      $ npm i downdoc
      ----

      * Use
      +
      [,console]
      ----
      $ npx downdoc README.adoc
      ----
      `;
    const expected = heredoc`
      * Install

        \`\`\`console
        $ npm i downdoc
        \`\`\`
      * Use

        \`\`\`console
        $ npx downdoc README.adoc
        \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should indent block following a list continuation on description list item", () => {
    const input = heredoc`
      Install::
      +
      [,console]
      ----
      $ npm i downdoc
      ----

      Use::
      +
      [,console]
      ----
      $ npx downdoc README.adoc
      ----
      `;
    const expected = heredoc`
      * **Install**

        \`\`\`console
        $ npm i downdoc
        \`\`\`
      * **Use**

        \`\`\`console
        $ npx downdoc README.adoc
        \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should indent block following a list continuation on colist item", () => {
    const input = heredoc`
      = Document Title

      <.> Prints the number 1.
      <.> Exits the program.
      +
      This happens automatically when all statements have been exhausted.
      `;
    const expected = heredoc`
      # Document Title

      1. Prints the number 1.
      2. Exits the program.

         This happens automatically when all statements have been exhausted.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should indent block following a list continuation of nested list item", () => {
    const input = heredoc`
      * Install
      ** npx
      +
       $ npx downdoc -v
      * Use
      +
       $ npx downdoc README.adoc
      `;
    const expected = heredoc`
      * Install
        * npx

          \`\`\`console
          $ npx downdoc -v
          \`\`\`
      * Use

        \`\`\`console
        $ npx downdoc README.adoc
        \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should interpret literal paragraph in list as having an implicit list continuation", () => {
    const input = heredoc`
      * Query the version of the app that is installed:

       $ app -v

      * Look for the following output:

       v1.0.0
       [node: v16]

      * Now you are ready to go.
      `;
    const expected = heredoc`
      * Query the version of the app that is installed:

        \`\`\`console
        $ app -v
        \`\`\`
      * Look for the following output:

            v1.0.0
            [node: v16]
      * Now you are ready to go.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should restore indent after literal paragraph attached to block attached to list item", () => {
    const input = heredoc`
      * top-level list
      ** nested list

       attached literal paragraph
      +
      attached paragraph

       attached literal paragraph
      +
      attached paragraph

      after list
      `;
    const expected = heredoc`
      * top-level list
        * nested list

              attached literal paragraph

          attached paragraph

              attached literal paragraph

          attached paragraph

      after list
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should close promoted console code block at list continuation", () => {
    const input = heredoc`
      :foo: bar

      * li
      +
      para

       $ cmd
      +
      para
       {foo}

      after list
      `;
    const expected = heredoc`
      * li

        para

        \`\`\`console
        $ cmd
        \`\`\`

        para
         bar

      after list
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should retain blockquote indent on list continuation line", () => {
    const input = heredoc`
      ____
      * foo
      +
      bar
      ____
      `;
    const expected = heredoc`
      > * foo
      >
      >   bar
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should create isolated list context inside block attached to a list", () => {
    const input = heredoc`
      * outside
      +
      --
      * inside
      +
      more
      --
      * outside
      `;
    const expected = heredoc`
      * outside

        * inside

          more
      * outside
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should end list when followed by non-adjacent delimited block", () => {
    const input = heredoc`
      . list item
      ** list item

      ----
      verbatim stuff
      ----
      . list item
      `;
    const expected = heredoc`
      1. list item
         * list item

      \`\`\`
      verbatim stuff
      \`\`\`
      1. list item
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should end list when followed by adjacent delimited block", () => {
    const input = heredoc`
      . list item
      ** list item
      ----
      verbatim stuff
      ----
      . list item
      `;
    const expected = heredoc`
      1. list item
         * list item
      \`\`\`
      verbatim stuff
      \`\`\`
      1. list item
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should end list if literal paragraph in list item has block attributes", () => {
    const input = heredoc`
      * Query the version of the app that is installed:

       $ app -v

      * Look for the following output:

      [.output]
       v1.0.0

      Now you are ready to go.
      `;
    const expected = heredoc`
      * Query the version of the app that is installed:

        \`\`\`console
        $ app -v
        \`\`\`
      * Look for the following output:

          v1.0.0

      Now you are ready to go.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should interpret block title following list continuation", () => {
    const input = heredoc`
      * Say hello
      +
      .With Ruby
      [,ruby]
      ----
      puts 'Hello!'
      ----
      +
      .With JavaScript
      [,js]
      ----
      console.log('Hello!')
      ----
      `;
    const expected = heredoc`
      * Say hello

        **With Ruby**

        \`\`\`ruby
        puts 'Hello!'
        \`\`\`

        **With JavaScript**

        \`\`\`js
        console.log('Hello!')
        \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should apply correct indentation to literal paragraph in list", () => {
    const input = heredoc`
      * Option to print version:
      +
       -v
      * Option to see help:
      +
       -h
      `;
    const expected = heredoc`
      * Option to print version:

            -v
      * Option to see help:

            -h
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should close implicit console listing before starting next list item", () => {
    const input = heredoc`
      :foo: bar

      . Run this:
      +
       $ cmd
      . Follow the instructions in the console.
       {foo}
      `;
    const expected = heredoc`
      1. Run this:

         \`\`\`console
         $ cmd
         \`\`\`
      2. Follow the instructions in the console.
       bar
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should indent verbatim blocks in list item", () => {
    const input = heredoc`
      * run this:
      +
       $ command
      * look for this:
      +
       output
      * enter this:
      +
      .code
      ----
      listing

      another line
      ----

      all done
      `;
    const expected = heredoc`
      * run this:

        \`\`\`console
        $ command
        \`\`\`
      * look for this:

            output
      * enter this:

        **code**

        \`\`\`
        listing

        another line
        \`\`\`

      all done
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should continue list item throughout attached container", () => {
    const input = heredoc`
      * list item
      +
      --
      attached

      keep it going

      not done yet
      --

      done now
      `;
    const expected = heredoc`
      * list item

        attached

        keep it going

        not done yet

      done now
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should restore indent after literal paragraph inside block attached to list item", () => {
    const input = heredoc`
      * list item
      +
      --
      attached

       literal paragraph

      still attached
      --

      not attached
      `;
    const expected = heredoc`
      * list item

        attached

            literal paragraph

        still attached

      not attached
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should continue list item throughout attached container with nested container", () => {
    const input = heredoc`
      * list item
      +
      --
      attached

      ====
      keep it going

      still going
      ====

      not done yet
      --

      done now
      `;
    const expected = heredoc`
      * list item

        attached

        keep it going

        still going

        not done yet

      done now
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should continue list item throughout attached container with nested verbatim block", () => {
    const input = heredoc`
      * list item
      +
      --
      attached

      ....
      keep it going

      still going
      ....

      not done yet
      --

      done now
      `;
    const expected = heredoc`
      * list item

        attached

        \`\`\`
        keep it going

        still going
        \`\`\`

        not done yet

      done now
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not process list continuation outside of list", () => {
    const input = heredoc`
      +
      paragraph
      `;
    expect(downdoc(input)).to.equal(input);
  });

  it("should reset indent when starting new ordered list item", () => {
    const input = heredoc`
      . Install
      +
      [,console]
      ----
      $ npm i downdoc
      ----
      . Use
      +
      [,console]
      ----
      $ npx downdoc README.adoc
      ----
      `;
    const expected = heredoc`
      1. Install

         \`\`\`console
         $ npm i downdoc
         \`\`\`
      2. Use

         \`\`\`console
         $ npx downdoc README.adoc
         \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });
});
