/* eslint-env mocha */

import { postProcessCsvToMdTable } from "../lib/post_process_csv_table.js";
import { expect, heredoc } from "./harness/index.js";

describe("post process csv to markdown table", () => {
  it("should convert basic CSV to markdown", () => {
    const input = heredoc`
      \`\`\`csv
      header1, header2, header3
      value1, value2, value3
      val1, val2, val3
      \`\`\`
    `;

    const expected = heredoc`
      | header1 | header2 | header3 |
      | --- | --- | --- |
      | value1 | value2 | value3 |
      | val1 | val2 | val3 |
    `;

    expect(postProcessCsvToMdTable(input)).to.equal(expected);
  });

  it("should handle missing values", () => {
    const input = heredoc`
      \`\`\`csv
      name, age, city
      Alice, 30,
      Bob,,New York
      ,25,Boston
      \`\`\`
    `;

    const expected = heredoc`
      | name | age | city |
      | --- | --- | --- |
      | Alice | 30 |  |
      | Bob |  | New York |
      |  | 25 | Boston |
    `;

    expect(postProcessCsvToMdTable(input)).to.equal(expected);
  });

  it("should handle quoted values and commas inside quotes", () => {
    const input = heredoc`
      \`\`\`csv
      name, comment
      "Alice", "Hello, world"
      "Bob", "New, York"
      \`\`\`
    `;

    const expected = heredoc`
      | name | comment |
      | --- | --- |
      | Alice | Hello, world |
      | Bob | New, York |
    `;

    expect(postProcessCsvToMdTable(input)).to.equal(expected);
  });

  it("should ignore empty lines inside CSV block", () => {
    const input = heredoc`
      \`\`\`csv
      a,b,c

      1,2,3

      4,5,6
      \`\`\`
    `;

    const expected = heredoc`
      | a | b | c |
      | --- | --- | --- |
      | 1 | 2 | 3 |
      | 4 | 5 | 6 |
    `;

    expect(postProcessCsvToMdTable(input)).to.equal(expected);
  });

  it("should preserve multiple CSV blocks", () => {
    const input = heredoc`
      # Table One
      \`\`\`csv
      x, y
      1, 2
      \`\`\`

      # Table Two
      \`\`\`csv
      name, score
      John, 90
      \`\`\`
    `;

    const expected = heredoc`
      # Table One
      | x | y |
      | --- | --- |
      | 1 | 2 |

      # Table Two
      | name | score |
      | --- | --- |
      | John | 90 |
    `;

    expect(postProcessCsvToMdTable(input)).to.equal(expected);
  });

  it("should trim excessive whitespace", () => {
    const input = heredoc`
      \`\`\`csv
        col1 ,  col2 , col3
        val1 , val2 , val3
      \`\`\`
    `;

    const expected = heredoc`
      | col1 | col2 | col3 |
      | --- | --- | --- |
      | val1 | val2 | val3 |
    `;

    expect(postProcessCsvToMdTable(input)).to.equal(expected);
  });
});
