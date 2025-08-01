export function postProcessCsvToMdTable(markdown) {
  const csvRegex = /```csv\s*([\s\S]*?)\s*```/g;

  return markdown.replace(csvRegex, (_, csvBlock) => {
    const lines = csvBlock
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return "";

    const parseCSVLine = (line) => {
      const result = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"' && inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const rows = lines.map(parseCSVLine);

    const maxCols = Math.max(...rows.map((row) => row.length));
    const normalizedRows = rows.map((row) => [
      ...row,
      ...Array(maxCols - row.length).fill(""),
    ]);

    const [headerRow, ...bodyRows] = normalizedRows;
    const headerLine = `| ${headerRow.join(" | ")} |`;
    const dividerLine = `| ${headerRow.map(() => "---").join(" | ")} |`;
    const bodyLines = bodyRows.map((row) => `| ${row.join(" | ")} |`);

    return [headerLine, dividerLine, ...bodyLines].join("\n");
  });
}
