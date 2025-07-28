"use strict";
import { applySubs } from "./applySubs.js";

export function writeBlockTitle(buffer, blockTitle, blockAttrs, attrs, refs) {
  const {
    id = blockAttrs?.get("id"),
    indent,
    text,
    subs,
    title = applySubs.call(attrs, text, subs),
  } = blockTitle;
  const anchor =
    id && refs.set(id, { title, reftext: blockAttrs.get("reftext") })
      ? '<a name="' + id + '"></a>'
      : "";
  buffer.push(indent + anchor + "**" + title + "**", "");
}
