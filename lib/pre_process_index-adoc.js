import fsp from "fs/promises";

export async function preProcessIndexAdoc(baseDir) {
  const entries = await fsp.readdir(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      await preProcessIndexAdoc(`${baseDir}/${entry.name}`);
    } else if (entry.isFile() && entry.name === "index.adoc") {
      try {
        await renameToHomeAdoc(`${baseDir}/${entry.name}`);
      } catch (error) {
        console.error(`Error processing ${baseDir}/${entry.name}:`, error);
      }
    }
  }
}

async function renameToHomeAdoc(filePath) {
  await fsp.rename(filePath, filePath.replace(/index\.adoc$/, "home.adoc"));
}
