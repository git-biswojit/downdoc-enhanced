import { readFileSync } from "node:fs";
import fsp from "node:fs/promises";
import ospath from "node:path";
import { parseArgs } from "node:util";
import prettier from "prettier";
import downdoc from "./index.js";
import { matchLinksWithFiles } from "./match_links_with_files.js";
import {
  convertToReadmeCompatibleMarkdown,
  renameIfDuplicateDirPath,
  writeIndexesForFilePath,
} from "./md_to_readme.js";
import { preProcessTable } from "./pre_process_tables.js";
import readStream from "./util/read-stream.js";
const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));

async function run(p = process) {
  const options = {
    attribute: {
      type: "string",
      multiple: true,
      short: "a",
      desc: "set an AsciiDoc attribute",
      hint: "name=val",
    },
    output: {
      type: "string",
      short: "o",
      desc: "specify an output file or - for stdout",
      hint: "path",
    },
    readme: {
      type: "boolean",
      desc: "process README files",
    },
    postpublish: {
      type: "boolean",
      desc: "run the postpublish lifecycle routine (restore input file)",
    },
    prepublish: {
      type: "boolean",
      desc: "run the prepublish lifecycle routine (convert and hide input file)",
    },
    help: { type: "boolean", short: "h", desc: "output this help and exit" },
    version: { type: "boolean", short: "v", desc: "output version and exit" },
  };
  const { positionals, values } = parseArgs({
    args: p.args || (p.argv || []).slice(2),
    options,
    strict: false,
  });
  if (values.help) return printUsage.call(p, options);
  if (values.version) return printVersion.call(p);
  const inputPath =
    positionals[0] ??
    (values.postpublish || values.prepublish ? "README.adoc" : undefined);
  if (!inputPath) return printUsage.call(p, options, true);
  if (values.postpublish) return restoreInputFile(inputPath, values.output);
  if (values.prepublish) {
    values.attribute = ["env=npm", "env-npm"].concat(values.attribute || []);
  }
  const attributes = values.attribute?.reduce((accum, it) => {
    const [name, ...value] = it.split("=");
    accum[name] = value.join("=");
    return accum;
  }, {});
  if (!(await validateInputPath.call(p, inputPath))) return;

  const outputPath = positionals[1];

  const stat = await gracefulStat(inputPath);
  const isDirectory = stat.isDirectory();

  if (outputPath && inputPath !== "-") {
    const hasProcessedFiles = await processDirectory.call(p, inputPath, outputPath, {
      ...(attributes && { attributes }),
      readme: values.readme,
    });
    if (hasProcessedFiles) {
      const result = await matchLinksWithFiles(outputPath);
      if (!result.success) {
        this.stderr.write(`Warning: Failed to fix links: ${result.error}\n`);
      }
    }
  } else if (isDirectory && inputPath !== "-") {
    if (values.output) {
      const hasProcessedFiles = await processDirectory.call(p, inputPath, values.output, {
        ...(attributes && { attributes }),
        readme: values.readme,
      });
      if (hasProcessedFiles) {
        const result = await matchLinksWithFiles(values.output);
        if (!result.success) {
          this.stderr.write(`Warning: Failed to fix links: ${result.error}\n`);
        }
      }
    } else {
      const hasProcessedFiles = await processDirectory.call(p, inputPath, inputPath, {
        ...(attributes && { attributes }),
        readme: values.readme,
      });
      if (hasProcessedFiles) {
        const result = await matchLinksWithFiles(inputPath);
        if (!result.success) {
          this.stderr.write(`Warning: Failed to fix links: ${result.error}\n`);
        }
      }
    }
  } else {
    await convertFile.call(
      p,
      inputPath,
      { ...(attributes && { attributes }), readme: values.readme },
      values.output
    );
  }

  if (values.prepublish) await hideInputFile(inputPath);
}

async function processDirectory(inputDir, outputDir, opts) {
  const hasProcessedFiles = await processDirectoryRecursive(inputDir, outputDir, opts);

  if (hasProcessedFiles && inputDir !== outputDir) {
    await fsp.mkdir(outputDir, { recursive: true });
  }

  return hasProcessedFiles;
}

async function processDirectoryRecursive(inputDir, outputDir, opts) {
  const entries = await fsp.readdir(inputDir, { withFileTypes: true });
  let hasProcessedFiles = false;

  for (const entry of entries) {
    const inputPath = ospath.join(inputDir, entry.name);
    const outputPath = ospath.join(outputDir, entry.name);

    if (entry.isDirectory()) {
      const subHasProcessed = await processDirectoryRecursive(
        inputPath,
        outputPath,
        opts
      );
      hasProcessedFiles = hasProcessedFiles || subHasProcessed;
    } else if (entry.isFile() && entry.name.endsWith(".adoc")) {
      await fsp.mkdir(outputDir, { recursive: true });
      const mdOutputPath = outputPath.replace(/\.adoc$/, ".md");
      await convertFile.call(this, inputPath, opts, mdOutputPath);
      hasProcessedFiles = true;
    }
  }

  return hasProcessedFiles;
}

async function formatMarkdown(rawMd) {
  return await prettier.format(rawMd, {
    parser: "markdown",
  });
}

async function convertFile(inputPath, opts, outputPath = toOutputPath(inputPath)) {
  const write = async (data) => {
    if (opts?.readme) {
      data = convertToReadmeCompatibleMarkdown(data);
      data = await formatMarkdown(data);
      outputPath = renameIfDuplicateDirPath(outputPath);
      await writeIndexesForFilePath(outputPath);
    }
    if (outputPath === "-") {
      return this.stdout.write(data);
    }
    return fsp.writeFile(outputPath, data, "utf8");
  };
  const read = () =>
    inputPath === "-" ? readStream(this.stdin, "utf8") : fsp.readFile(inputPath, "utf8");

  const input = await read();
  const tableProcessedInput = preProcessTable(input);
  const output = downdoc(tableProcessedInput, opts) + "\n";

  await write(output);
  return output;
}

function toOutputPath(path) {
  return path === "-" ? path : path.replace(/\.adoc$/, ".md");
}

function hideInputFile(inputPath) {
  return fsp.rename(inputPath, toHiddenPath(inputPath));
}

function restoreInputFile(inputPath, outputPath = toOutputPath(inputPath)) {
  const hiddenInputPath = toHiddenPath(inputPath);
  return Promise.all([
    gracefulStat(hiddenInputPath).then((stat) =>
      stat.isFile() ? fsp.rename(hiddenInputPath, inputPath) : undefined
    ),
    gracefulStat(outputPath).then((stat) =>
      stat.isFile() ? fsp.unlink(outputPath) : undefined
    ),
  ]);
}

function toHiddenPath(path) {
  const { dir, base } = ospath.parse(path);
  return ospath.join(dir, "." + base);
}

function gracefulStat(path) {
  return fsp.stat(path).catch(() => ({ isDirectory: () => false, isFile: () => false }));
}

function printUsage(options, error) {
  error ? (this.exitCode = 1) : printVersion.call(this, true);
  let usage = [
    "Usage: downdoc [OPTION]... FILE/DIR [OUTPUT_DIR]",
    "Convert the specified AsciiDoc FILE/Files in a directory to Markdown file(s).",
    "If DIR is specified, process all .adoc files in the directory recursively.",
    "Example: downdoc README.adoc",
    "Example: downdoc docs/ output/",
  ];
  if (error) {
    usage = usage.slice(0, 1).concat("Run 'downdoc --help' for more information.");
  } else {
    usage.push("");
    Object.entries(options).forEach(([long, { short, hint, multiple, desc }]) => {
      const option = short
        ? `-${short}, --${long}${hint ? " " + hint : ""}`
        : `--${long}`;
      usage.push(
        `  ${option.padEnd(27, " ")}${desc}${
          multiple ? "; can be specified multiple times" : ""
        }`
      );
    });
    usage.push(
      "",
      "If --output is not specified, the output file path is derived from FILE (e.g., README.md)."
    );
  }
  usage.reduce(
    (stream, line) => typeof stream.write(line + "\n") && stream,
    error ? this.stderr : this.stdout
  );
}

function printVersion(withCommandName) {
  this.stdout.write(`${withCommandName ? "downdoc " : ""}${version}\n`);
}

function validateInputPath(path) {
  if (path === "-") return true;
  return gracefulStat(path).then((stat) => {
    if (stat.isFile() || stat.isDirectory()) return true;
    this.exitCode = 1;
    this.stderr.write(`downdoc: ${path}: No such file or directory\n`);
  });
}

export default run;
