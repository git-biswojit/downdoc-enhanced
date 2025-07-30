"use strict";
import {
  InlineAnchorRx,
  InlineImageMacroRx,
  InlineStemMacroRx,
  LinkMacroRx,
  XrefMacroRx,
} from "../constants/constants.js";

import { image } from "./image.js";

// Global footnote tracking
let footnoteCounter = 0;
const footnotes = [];

// Reset footnotes for new document
export function resetFootnotes() {
  footnoteCounter = 0;
  footnotes.length = 0;
}

// Get all footnotes for output
export function getFootnotes() {
  return footnotes.map((content, index) => `[^${index + 1}]: ${content}`).join("\n");
}

// Process footnotes in a string and return processed string and any footnotes
export function processFootnotes(str) {
  const FootnoteRx = /footnote:\[([^\]]*)\]/g;
  let hasFootnotes = false;
  const paragraphFootnotes = [];

  const processed = str.replace(FootnoteRx, (match, content) => {
    footnoteCounter++;
    footnotes.push(content);
    paragraphFootnotes.push(`[^${footnoteCounter}]: ${content}`);
    hasFootnotes = true;
    return `[^${footnoteCounter}]`;
  });

  return {
    processed,
    hasFootnotes,
    footnotes: paragraphFootnotes,
  };
}

// Regex to match bare URLs (http/https) but not those already in markdown links
const BareUrlRx = /(?<!\]\()(https?:\/\/[^\s<>"{}|\\^`[\]]+)(?!\))/g;

function convertBareUrls(str) {
  return str.replace(BareUrlRx, (url) => {
    return `[${url}](${url})`;
  });
}

export function macros(str) {
  if (!~str.indexOf(":")) {
    return ~str.indexOf("[[")
      ? str.replace(InlineAnchorRx, '<a name="$1"></a>')
      : convertBareUrls(str);
  }

  // Process footnotes first
  if (~str.indexOf("footnote:")) {
    const FootnoteRx = /footnote:\[([^\]]*)\]/g;
    str = str.replace(FootnoteRx, (match, content) => {
      footnoteCounter++;
      footnotes.push(content);
      return `[^${footnoteCounter}]`;
    });
  }

  if (~str.indexOf("m:[")) {
    str = str.replace(
      InlineStemMacroRx,
      (_, expr) => "$" + expr.replace(/\\]/g, "]") + "$"
    );
  }
  if (~str.indexOf("image:")) str = str.replace(InlineImageMacroRx, image.bind(this));
  if (~str.indexOf(":/") || ~str.indexOf("link:")) {
    str = str.replace(
      LinkMacroRx,
      (_, esc, scheme = "", url, boxed = "", text, bareScheme = scheme, bareUrl) => {
        if (esc) {
          return bareScheme
            ? "<span>" + bareScheme + "</span>" + (bareUrl ?? url + boxed)
            : "link:" + url + boxed;
        }
        if (!bareUrl) {
          return (
            "[" +
            (text ||= this.has("hide-uri-scheme") ? url : scheme + url) +
            "](" +
            scheme +
            url +
            ")"
          );
        }
        return this.has("hide-uri-scheme")
          ? "[" + bareUrl + "](" + bareScheme + bareUrl + ")"
          : bareScheme + bareUrl;
      }
    );
  }
  if (~str.indexOf("[[")) str = str.replace(InlineAnchorRx, '<a name="$1"></a>');
  if (!~str.indexOf("xref:")) return convertBareUrls(str);
  return convertBareUrls(
    str.replace(XrefMacroRx, (m, esc, p, ext, id_, id = id_, txt) =>
      esc
        ? m.substring(1)
        : "[" +
          (p && (ext === "#" || (p += ext)) ? txt || p : (p = "#!" + id) && txt).replace(
            /\.(adoc|asciidoc)$/,
            ".md"
          ) +
          "](" +
          p.replace(/\.(adoc|asciidoc)$/, ".md") +
          ")"
    )
  );
}
