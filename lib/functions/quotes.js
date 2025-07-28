"use strict";
import {
  EmphasisSpanMetaRx,
  MarkedSpanRx,
  QuotedSpanRx,
  StrongSpanRx,
  XrefShorthandRx,
} from "../constants/constants.js";

export function quotes(str, idx) {
  const hasLt = ~(
    ~str.indexOf("<<") ? (str = str.replace(XrefShorthandRx, "xref:$1[$2]")) : str
  ).indexOf("<");
  if (hasLt) str = str.replace(/</g, "&lt;");
  if (~(idx = str.indexOf("*")) && ~str.indexOf("*", idx + 1)) {
    str = str.replace(StrongSpanRx, "*$1*");
  }
  if (~str.indexOf("`") && ((idx = ~str.indexOf('"`') || ~str.indexOf("'`")) || true)) {
    if (idx) {
      str = str.replace(
        QuotedSpanRx,
        (this.q ??= this.get("quotes").split(" ").slice(0, 2).join("$2"))
      );
    }
    if (hasLt || ~str.indexOf("`+") || ~str.indexOf("]`") || ~str.indexOf("\\")) {
      str = str.replace(/(?:\[[^[\]]+\])?`(\+)?(\S|\S.*?\S)\1`/g, (_, pass, text) => {
        if (hasLt && text.length > 3 && ~text.indexOf("&lt;")) {
          text = text.replace(/&lt;/g, "<");
        }
        if (pass) {
          return (
            "`" + (~text.indexOf("{") ? text.replace(/\{(?=[a-z])/g, "\\{") : text) + "`"
          );
        }
        return (
          "`" +
          (~text.indexOf("\\") ? text.replace(/\\(?=https?:|\.\.\.)/g, "") : text) +
          "`"
        );
      });
    }
  }
  if (~str.indexOf("]_")) str = str.replace(EmphasisSpanMetaRx, "");
  if (~(idx = str.indexOf("#")) && ~str.indexOf("#", idx + 1)) {
    str = str.replace(MarkedSpanRx, (_, roles, s, text) => {
      s &&= this.s ??=
        (s = this.get("markdown-strikethrough").split(" ")).length > 1
          ? s.slice(0, 2)
          : [s[0], s[0]];
      return roles ? (s ? s[0] + text + s[1] : text) : "<mark>" + text + "</mark>";
    });
  }
  if (!~str.indexOf("'")) return str;
  return str.replace(/.'/g, (m, i, s, l = m[0], r = s[i + 2] || "") =>
    l === "`"
      ? r === "`"
        ? m
        : "\u2019"
      : /\p{L}/u.test(r) && /[\p{L}\d]/u.test(l)
        ? l + "\u2019"
        : m
  );
}
