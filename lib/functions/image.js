"use strict";

export function image(
  _,
  target,
  attrlist,
  _idx,
  _str,
  alt = attrlist.split(",")[0] || /(.*\/)?(.*?)($|\.)/.exec(target)[2]
) {
  return (
    "![" +
    alt +
    "](" +
    (this.get("imagesdir") ? this.get("imagesdir") + "/" : "") +
    target +
    ")"
  );
}
