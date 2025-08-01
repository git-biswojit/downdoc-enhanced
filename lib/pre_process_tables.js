export function preProcessTable(markdown) {
  const lines = markdown.split("\n");
  const output = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    const tableHeaderMatch = line.match(/^\[.*cols\s*=\s*"(.*?)".*options=.*header.*\]/);
    if (tableHeaderMatch && i + 2 < lines.length && lines[i + 2].trim() === "|===") {
      const cols = tableHeaderMatch[1].split(",").length;

      output.push(lines[i]); // [cols="..."]
      output.push(lines[i + 1]); // .Example
      output.push(lines[i + 2]); // |===

      let j = i + 3;

      // Preserve blank lines after |===
      const blankLines = [];
      while (j < lines.length && lines[j].trim() === "") {
        blankLines.push(lines[j]);
        j++;
      }

      const headerLines = [];

      // Collect `cols` number of single-pipe lines
      while (
        j < lines.length &&
        lines[j].trim().startsWith("|") &&
        (lines[j].match(/\|/g) || []).length === 1 &&
        headerLines.length < cols
      ) {
        headerLines.push(lines[j].trim().slice(1).trim());
        j++;
      }

      if (headerLines.length === cols) {
        output.push(...blankLines);
        output.push(`|${headerLines.join(" | ")}`);
        i = j;
      } else {
        output.push(...blankLines);
        for (let k = j - headerLines.length; k < j; k++) {
          output.push(lines[k]);
        }
        i = j;
      }
    } else {
      output.push(line);
      i++;
    }
  }

  return output.join("\n");
}
