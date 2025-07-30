/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("tables", () => {
  it("should convert table with only body", () => {
    const input = heredoc`
      |===
      | A1 | B1
      | A2 | B2
      | A3 | B3
      |===
      `;
    const expected = heredoc`
      |     |     |
      | --- | --- |
      | A1 | B1 |
      | A2 | B2 |
      | A3 | B3 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert table with header with implicit column count", () => {
    const input = heredoc`
      |===
      | Col A | Col B

      | A1
      | B1
      | A2
      | B2
      |===
      `;
    const expected = heredoc`
      | Col A | Col B |
      | --- | --- |
      | A1 | B1 |
      | A2 | B2 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should collapse empty lines between rows", () => {
    const input = heredoc`
      |===
      | Col A | Col B

      | A1
      | B1


      | A2
      | B2
      |===
      `;
    const expected = heredoc`
      | Col A | Col B |
      | --- | --- |
      | A1 | B1 |
      | A2 | B2 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert table with each row on its own line", () => {
    const input = heredoc`
      |===
      | Col A | Col B

      | A1 | B1
      | A2 | B2
      |===
      `;
    const expected = heredoc`
      | Col A | Col B |
      | --- | --- |
      | A1 | B1 |
      | A2 | B2 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert table with ragged rows", () => {
    const input = heredoc`
      |===
      | Col A | Col B | Col C

      | A1
      | B1 | C1
      | A2 | B2 | C2 | A3
      | B3 | C3
      | A4
      | B4 | C4 | A5 | B5 | C5
      |===
      `;
    const expected = heredoc`
      | Col A | Col B | Col C |
      | --- | --- | --- |
      | A1 | B1 | C1 |
      | A2 | B2 | C2 |
      | A3 | B3 | C3 |
      | A4 | B4 | C4 |
      | A5 | B5 | C5 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should end table at closing delimiter", () => {
    const input = heredoc`
      before

      |===
      | Name | Description

      | dryRun
      | Report what actions will be taken without doing them.
      |===

      after | not a table cell
      `;
    const expected = heredoc`
      before

      | Name | Description |
      | --- | --- |
      | dryRun | Report what actions will be taken without doing them. |

      after | not a table cell
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not promote first row to header if preceded by empty line", () => {
    const input = heredoc`
      |===

      | A1

      | A2
      |===
      `;
    const expected = heredoc`
      |     |
      | --- |
      | A1 |
      | A2 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert table with explicit header", () => {
    const input = heredoc`
      [%header]
      |===
      | Col A | Col B
      | A1
      | B1
      |===
      `;
    const expected = heredoc`
      | Col A | Col B |
      | --- | --- |
      | A1 | B1 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not promote first row to header if noheader option is set", () => {
    const input = heredoc`
      [%noheader]
      |===
      | A1

      | A2
      |===
      `;
    const expected = heredoc`
      |     |
      | --- |
      | A1 |
      | A2 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert table with header with explicit cols as repeater", () => {
    const input = heredoc`
      [cols=2*d]
      |===
      | Col A | Col B

      | A1
      | B1
      |===
      `;
    const expected = heredoc`
      | Col A | Col B |
      | --- | --- |
      | A1 | B1 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert table with header with explicit cols with comma separator", () => {
    const input = heredoc`
      [cols="1,.^2"]
      |===
      | Col A | Col B

      | A1
      | B1
      |===
      `;
    const expected = heredoc`
      | Col A | Col B |
      | --- | --- |
      | A1 | B1 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert table with header with explicit cols with semi-colon separator", () => {
    const input = heredoc`
      [cols=1;2d]
      |===
      | Col A | Col B

      | A1
      | B1
      |===
      `;
    const expected = heredoc`
      | Col A | Col B |
      | --- | --- |
      | A1 | B1 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert table with explicit cols containing repeater and columns separated by comma", () => {
    const input = heredoc`
      [cols="2*d,1"]
      |===
      | Col A | Col B | Col C

      | A1
      | B1
      | C1
      |===
      `;
    const expected = heredoc`
      | Col A | Col B | Col C |
      | --- | --- | --- |
      | A1 | B1 | C1 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert table with explicit cols containing repeater and columns separated by semi-colon", () => {
    const input = heredoc`
      [cols="2*d;2"]
      |===
      | Col A | Col B | Col C

      | A1
      | B1
      | C1
      |===
      `;
    const expected = heredoc`
      | Col A | Col B | Col C |
      | --- | --- | --- |
      | A1 | B1 | C1 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert table with explicit cols defined in attribute followed by other attributes with quotes", () => {
    const input = heredoc`
      [%header,cols="20,20a",width="75%"]
      |===
      | A | B
      | A1
      | B1
      |===
      `;
    const expected = heredoc`
      | A | B |
      | --- | --- |
      | A1 | B1 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert table with cols attribute followed by other attributes without quotes", () => {
    const input = heredoc`
      [%header,cols=>1;2d,width=75%,frame=none,grid=cols]
      |===
      | A | B
      | A1
      | B1
      |===
      `;
    const expected = heredoc`
      | A | B |
      | --: | --- |
      | A1 | B1 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should honor horizontal column alignments in value of cols attribute", () => {
    const input = heredoc`
      [%header,cols=2*^.>10;>40;.^40]
      |===
      | A | B | C | D
      | A1
      | B1
      | C1
      | D1
      |===
      `;
    const expected = heredoc`
      | A | B | C | D |
      | :-: | :-: | --: | --- |
      | A1 | B1 | C1 | D1 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should normalize space around cell text", () => {
    const input = heredoc`
      |===
      |Col A |  Col B  |   Col C

      |A1    |  B1   | C1

      |   A2 |     B2|  C2

      |foo|bar|baz
      |===
      `;
    const expected = heredoc`
      | Col A | Col B | Col C |
      | --- | --- | --- |
      | A1 | B1 | C1 |
      | A2 | B2 | C2 |
      | foo | bar | baz |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should create empty header row if first row has less columns than specified", () => {
    const input = heredoc`
      [cols=3*]
      |===
      | A1
      | B1
      | C1
      | A2
      | B2
      | C2
      |===
      `;
    const expected = heredoc`
      |     |     |     |
      | --- | --- | --- |
      | A1 | B1 | C1 |
      | A2 | B2 | C2 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should use first row to determine number of columns without creating header", () => {
    const input = heredoc`
      |===
      | A
      |===
      `;
    const expected = heredoc`
      |     |
      | --- |
      | A |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert block title on table", () => {
    const input = heredoc`
      .Table caption
      |===
      | foo | bar

      | yin
      | yang
      |===
      `;
    const expected = heredoc`
      **Table caption**

      | foo | bar |
      | --- | --- |
      | yin | yang |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert block title on table with no header", () => {
    const input = heredoc`
      .Table caption
      |===
      | foo | bar
      |===
      `;
    const expected = heredoc`
      **Table caption**

      |     |     |
      | --- | --- |
      | foo | bar |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should support table with no empty lines attached to list item", () => {
    const input = heredoc`
      * list item
      +
      .Table caption
      |===
      | A | B

      | A1
      | B1
      | A2 | B2
      |===

      after
      `;
    const expected = heredoc`
      * list item

        **Table caption**

        | A | B |
        | --- | --- |
        | A1 | B1 |
        | A2 | B2 |

      after
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should support table with empty lines attached to list item", () => {
    const input = heredoc`
      * list item
      +
      .Table caption
      |===
      | A | B

      | A1
      | B1

      | A2 | B2
      |===

      after
      `;
    const expected = heredoc`
      * list item

        **Table caption**

        | A | B |
        | --- | --- |
        | A1 | B1 |
        | A2 | B2 |

      after
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should support table with explicit cols and ragged first row attached to list item", () => {
    const input = heredoc`
      * list item
      +
      [cols=3*]
      |===
      | A | B
      | C

      | A1
      | B1 | C1

      | A2 | B2
      | C2
      |===

      after
      `;
    const expected = heredoc`
      * list item

        |     |     |     |
        | --- | --- | --- |
        | A | B | C |
        | A1 | B1 | C1 |
        | A2 | B2 | C2 |

      after
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not carry over block title on empty table to next adjacent block", () => {
    const input = heredoc`
      .Table caption
      |===
      |===
      ----
      verbatim
      ----
      `;
    const expected = heredoc`
      \`\`\`
      verbatim
      \`\`\`
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert table header with wrapped text in final cell", () => {
    const input = heredoc`
      [%header]
      |===
      | A
      and no more
      |===

      [%header]
      |===
      | A | B
      more
      | A1
      | B1
      |===
      `;
    const expected = heredoc`
      | A and no more |
      | --- |

      | A | B more |
      | --- | --- |
      | A1 | B1 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert cell with wrapped text at start of row", () => {
    const input = heredoc`
      [cols=2*]
      |===
      | Feature | Description

      | Autopilot
      Only available on certain models.
      Requires an autopilot subscription.
      | Drives the vehicle automatically.

      | Bluetooth audio
      Available on all models.
      | Plays music from an external device over bluetooth.
      |===
      `;
    const expected = heredoc`
      | Feature | Description |
      | --- | --- |
      | Autopilot Only available on certain models. Requires an autopilot subscription. | Drives the vehicle automatically. |
      | Bluetooth audio Available on all models. | Plays music from an external device over bluetooth. |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert cell with wrapped text in subsequent column", () => {
    const input = heredoc`
      [cols=2*]
      |===
      | Feature | Description

      | Autopilot
      | Drives the vehicle automatically.
      Only available on certain models.
      Requires an autopilot subscription.

      | Bluetooth audio
      | Plays music from an external device over bluetooth.
      Available on all models.
      |===
      `;
    const expected = heredoc`
      | Feature | Description |
      | --- | --- |
      | Autopilot | Drives the vehicle automatically. Only available on certain models. Requires an autopilot subscription. |
      | Bluetooth audio | Plays music from an external device over bluetooth. Available on all models. |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert cells with text starting on separate line", () => {
    const input = heredoc`
      |===
      | foo | bar

      |
      fizz
      |
      buzz
      |===
      `;
    const expected = heredoc`
      | foo | bar |
      | --- | --- |
      | fizz | buzz |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should apply substitutions to cells in header row", () => {
    const input = heredoc`
      |===
      | _Emphasis_ | *Strong Emphasis* | https://example.org[Link]

      | text formatting
      | text formatting
      | macro
      |===
      `;
    const expected = heredoc`
      | _Emphasis_ | **Strong Emphasis** | [Link](https://example.org) |
      | --- | --- | --- |
      | text formatting | text formatting | macro |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should apply substitutions to cells in body row", () => {
    const input = heredoc`
      |===
      | Emphasis | Strong Emphasis | Link

      | _emphasis_
      | *strong emphasis*
      *still strong*
      | https://example.org[link]
      https://example.com[another link]
      |===
      `;
    const expected = heredoc`
      | Emphasis | Strong Emphasis | Link |
      | --- | --- | --- |
      | _emphasis_ | **strong emphasis** **still strong** | [link](https://example.org) [another link](https://example.com) |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert hardbreak character at end wrapped line in table cell", () => {
    const input = heredoc`
      [cols=2*]
      |===
      | A +
      1
      | B +
      1
      |===
      `;
    const expected = heredoc`
      |     |     |
      | --- | --- |
      | A<br> 1 | B<br> 1 |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not convert hardbreak character at end of table cell", () => {
    const input = heredoc`
      [cols=2*]
      |===
      | A
      1 +
      | B
      1 +
      |===
      `;
    const expected = heredoc`
      |     |     |
      | --- | --- |
      | A 1 + | B 1 + |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should convert URLs in table cells to proper markdown links", () => {
    const input = heredoc`
      [cols="1,1,2", options="header"]
      .demo One Provider Search and Cost Estimate
      |===
      |Endpoint | Environment | Description

      |https://api-gateway.demo.ts.com/stateless-facade/
      |UAT
      |Intended for provider search and/or cost estimate API calls to the UAT environment

      |https://api-gateway.ts.com/stateless-facade/
      |PROD
      |Intended for provider search and/or cost estimate API calls to the production environment
      |===
      `;
    const expected = heredoc`
      **demo One Provider Search and Cost Estimate**

      | Endpoint | Environment | Description |
      | --- | --- | --- |
      | [https://api-gateway.demo.ts.com/stateless-facade/](https://api-gateway.demo.ts.com/stateless-facade/) | UAT | Intended for provider search and/or cost estimate API calls to the UAT environment |
      | [https://api-gateway.ts.com/stateless-facade/](https://api-gateway.ts.com/stateless-facade/) | PROD | Intended for provider search and/or cost estimate API calls to the production environment |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should handle mixed single-line and multi-line table formats", () => {
    const input = heredoc`
      [options="header"]
      |===
      |Endpoint | Environment | Description

      |https://api-gateway.demo.ts.com/stateless-facade/
      |UAT
      |Intended for provider search and/or cost estimate API calls to the UAT environment

      |https://api-gateway.ts.com/stateless-facade/ | PROD | Intended for provider search and/or cost estimate API calls to the production environment
      |===
      `;
    const expected = heredoc`
      | Endpoint | Environment | Description |
      | --- | --- | --- |
      | [https://api-gateway.demo.ts.com/stateless-facade/](https://api-gateway.demo.ts.com/stateless-facade/) | UAT | Intended for provider search and/or cost estimate API calls to the UAT environment |
      | [https://api-gateway.ts.com/stateless-facade/](https://api-gateway.ts.com/stateless-facade/) | PROD | Intended for provider search and/or cost estimate API calls to the production environment |
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should handle header cells on separate lines", () => {
    const input = heredoc`
      [options="header"]
      |===
      |Endpoint
      |Environment
      |Description

      |https://api-gateway.demo.ts.com/stateless-facade/
      |UAT
      |Intended for provider search and/or cost estimate API calls to the UAT environment

      |https://api-gateway.ts.com/stateless-facade/
      |PROD
      |Intended for provider search and/or cost estimate API calls to the production environment
      |===
      `;
    const expected = heredoc`
      | Endpoint | Environment | Description |
      | --- | --- | --- |
      | [https://api-gateway.demo.ts.com/stateless-facade/](https://api-gateway.demo.ts.com/stateless-facade/) | UAT | Intended for provider search and/or cost estimate API calls to the UAT environment |
      | [https://api-gateway.ts.com/stateless-facade/](https://api-gateway.ts.com/stateless-facade/) | PROD | Intended for provider search and/or cost estimate API calls to the production environment |
      `;
    expect(downdoc(input)).to.equal(expected);
  });
});
