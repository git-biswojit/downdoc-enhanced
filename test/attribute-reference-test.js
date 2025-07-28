/* eslint-env mocha */

import downdoc from "../lib/index.js";
import { expect, heredoc } from "./harness/index.js";

describe("attribute references", () => {
  it("should substitute attribute reference in paragraph", () => {
    const input = heredoc`
      = Title
      :project-name: ACME

      The name of this project is {project-name}.
      `;
    const expected = heredoc`
      # Title

      The name of this project is ACME.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should permit all unicode letter characters in attribute name when assigned and referenced", () => {
    const input = heredoc`
      = Le Titre
      :dépôt-git: opendevise/downdoc

      Vous pouvez aussi récupérer les sources via le dépôt Git à {dépôt-git}.
      `;
    const expected = heredoc`
      # Le Titre

      Vous pouvez aussi récupérer les sources via le dépôt Git à opendevise/downdoc.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should not recognize attribute reference that begins with -", () => {
    const input = heredoc`
      = Title

      {-foo} is not a valid attribute reference.
      `;
    const expected = heredoc`
      # Title

      {-foo} is not a valid attribute reference.
      `;
    expect(downdoc(input, { attributes: { "-foo": "bar" } })).to.equal(expected);
  });

  // NOTE this test also asserts that attribute name can begin with number
  it("should substitute multiple attribute references in same line", () => {
    const input = heredoc`
      = Title
      :1st-author: Jim
      :2nd-author: Jane

      This project was created by {1st-author} and {2nd-author}.
      `;
    const expected = heredoc`
      # Title

      This project was created by Jim and Jane.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should substitute attribute reference in section title", () => {
    const input = heredoc`
      = Title
      :product: ACME

      == Introduction to {product}

      Let's get acquainted.
      `;
    const expected = heredoc`
      # Title

      ## Introduction to ACME

      Let’s get acquainted.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should substitute attribute reference in unordered list item", () => {
    const input = heredoc`
      = Title
      :product: ACME
      :url-product: https://example.org/acme

      . First, download the {product} installer from the {url-product}[{product} website].
      `;
    const expected = heredoc`
      # Title

      1. First, download the ACME installer from the [ACME website](https://example.org/acme).
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should skip unresolved attribute reference", () => {
    const input = heredoc`
      = Title

      This project is named {unknown}.
      `;
    const expected = heredoc`
      # Title

      This project is named {unknown}.
      `;
    expect(downdoc(input)).to.equal(expected);
  });

  it("should unescape escaped attribute references in monospace phrase", () => {
    const input = heredoc`
      = Title

      Use \`\\{nbsp}\` to insert a no-break space (\`{nbsp}\`).
      Use \`\\\\{nbsp}\` to display an escaped attribute reference.

      Use the endpoint \`/repos/\\{owner}/\\{repo}\` to retrieve information about a repository.
      `;
    const expected = heredoc`
      # Title

      Use \`{nbsp}\` to insert a no-break space (\`&#160;\`).
      Use \`\\{nbsp}\` to display an escaped attribute reference.

      Use the endpoint \`/repos/{owner}/{repo}\` to retrieve information about a repository.
      `;
    expect(input).to.include("\\");
    expect(downdoc(input)).to.equal(expected);
  });

  it("should unescape escaped attribute references in normal phrase", () => {
    const input = heredoc`
      Replace the token \\{owner} with the username or organization and replace the token \\{repo} with the name of the repository.
      `;
    const expected = heredoc`
      Replace the token {owner} with the username or organization and replace the token {repo} with the name of the repository.
      `;
    expect(input).to.include("\\");
    expect(downdoc(input)).to.equal(expected);
  });

  it("should resolve all intrinsic attributes", () => {
    const input = heredoc`
      Valid responses: y {vbar} yes {vbar} n {vbar} no

      Part{nbsp}number—{zwsp}(PN)

      Add it to the _{empty}_layouts_ folder.

      Insert a \`{sp}\` character.
      `;
    const expected = heredoc`
      Valid responses: y | yes | n | no

      Part&#160;number—&#8203;(PN)

      Add it to the __layouts_ folder.

      Insert a \` \` character.
      `;
    expect(downdoc(input)).to.equal(expected);
  });
});
