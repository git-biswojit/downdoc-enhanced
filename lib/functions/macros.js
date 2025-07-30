"use strict";
import {
  InlineAnchorRx,
  InlineImageMacroRx,
  InlineStemMacroRx,
  LinkMacroRx,
  XrefMacroRx,
} from "../constants/constants.js";

import { image } from "./image.js";

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
