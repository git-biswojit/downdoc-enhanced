/* eslint-env mocha */
import { preProcessTable } from "../lib/pre_process_tables.js";
import { expect, heredoc } from "./harness/index.js";

describe("ascii table header fix", () => {
  const tests = [
    {
      name: "basic multiline header conversion",
      input: heredoc`
        [cols="1,1", options="header"]
        .Example
        |===
        |Key
        |Value`,
      expected: heredoc`
        [cols="1,1", options="header"]
        .Example
        |===
        |Key | Value`,
    },
    {
      name: "already single line header — no change",
      input: heredoc`
        [cols="1,1", options="header"]
        .Example
        |===
        |Key | Value`,
      expected: heredoc`
        [cols="1,1", options="header"]
        .Example
        |===
        |Key | Value`,
    },
    {
      name: "edgecase with second row starting with pipe — preserve",
      input: heredoc`
        [cols="1,1", options="header"]
        .Example
        |===
        |Key | Something
        |Valuee`,
      expected: heredoc`
        [cols="1,1", options="header"]
        .Example
        |===
        |Key | Something
        |Valuee`,
    },
    {
      name: "table with extra whitespace between lines — combine",
      input: heredoc`
        [cols="1,1", options="header"]
        .Example
        |===

        |Key
        |Value`,
      expected: heredoc`
        [cols="1,1", options="header"]
        .Example
        |===

        |Key | Value`,
    },
    {
      name: "no header option — skip conversion",
      input: heredoc`
        [cols="1,1"]
        .Example
        |===
        |Key
        |Value`,
      expected: heredoc`
        [cols="1,1"]
        .Example
        |===
        |Key
        |Value`,
    },
    {
      name: "header with 3 columns",
      input: heredoc`
        [cols="1,1,1", options="header"]
        .Example
        |===
        |Col1
        |Col2
        |Col3`,
      expected: heredoc`
        [cols="1,1,1", options="header"]
        .Example
        |===
        |Col1 | Col2 | Col3`,
    },
    {
      name: "header line but only 1 header column — preserve",
      input: heredoc`
        [cols="1", options="header"]
        .Example
        |===
        |SingleHeader`,
      expected: heredoc`
        [cols="1", options="header"]
        .Example
        |===
        |SingleHeader`,
    },
    {
      name: "comment before table — still works",
      input: heredoc`
        // some comment
        [cols="1,1", options="header"]
        .Example
        |===
        |A
        |B`,
      expected: heredoc`
        // some comment
        [cols="1,1", options="header"]
        .Example
        |===
        |A | B`,
    },
    {
      name: "table caption with dot in name — should not break",
      input: heredoc`
        [cols="1,1", options="header"]
        .Example.to.test.dot
        |===
        |One
        |Two`,
      expected: heredoc`
        [cols="1,1", options="header"]
        .Example.to.test.dot
        |===
        |One | Two`,
    },
    {
      name: "multiple tables — each independently handled",
      input: heredoc`
        [cols="1,1", options="header"]
        .Example1
        |===
        |A
        |B

        [cols="1,1", options="header"]
        .Example2
        |===
        |C | D`,
      expected: heredoc`
        [cols="1,1", options="header"]
        .Example1
        |===
        |A | B

        [cols="1,1", options="header"]
        .Example2
        |===
        |C | D`,
    },
  ];

  for (const { name, input, expected } of tests) {
    it(name, () => {
      const result = preProcessTable(input);
      expect(result).to.equal(expected);
    });
  }
});
