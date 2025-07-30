"use strict";

import {
  BlockAnchorRx,
  ElementAttributeRx,
  StyleShorthandMarkersRx,
} from "../constants/constants.js";

export function parseAttrlist(attrlist, attrs = new Map()) {
  if (!attrlist) return attrs;
  attrs.set(0, attrlist);
  let chr0, idx, m, shorthand, style;
  if ((chr0 = attrlist[0]) === "[" && (m = BlockAnchorRx.exec(attrlist))) {
    return m[2] ? attrs.set("id", m[1]).set("reftext", m[2]) : attrs.set("id", m[1]);
  }
  if (!(idx = 0) && (~attrlist.indexOf("=") || ~attrlist.indexOf('"'))) {
    while ((m = ElementAttributeRx.exec(attrlist))) {
      attrs.set(m[1] ?? ++idx, m[4] ?? m[3]);
      if (!m.index) attrlist = (ElementAttributeRx.lastIndex = 1) && "," + attrlist;
    }
  } else if (chr0 === "," || ~attrlist.indexOf(",")) {
    for (const it of attrlist.split(",")) attrs.set(++idx, it.trimStart());
  } else attrs.set(1, attrlist);

  // Handle options attribute
  if (attrs.has("options")) {
    const options = attrs.get("options");
    if (options === "header") {
      attrs.set("header-option", "");
    } else if (options === "noheader") {
      attrs.set("noheader-option", "");
    }
  }

  if (
    !(shorthand = attrs.get(1)) ||
    (m = shorthand.split(StyleShorthandMarkersRx)).length < 2
  ) {
    return attrs;
  }
  for (let i = 0, len = m.length, val; i < len; i += 2) {
    if ((val = m[i]) && ((chr0 = m[i - 1]) || !(style = val))) {
      if (chr0 === "#") {
        attrs.set("id", val);
      } else if (chr0 === ".") {
        attrs.set("role", val);
      } else {
        attrs.set(val + "-option", "");
      }
    }
  }
  return attrs.set(1, style);
}
