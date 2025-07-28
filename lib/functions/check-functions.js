import { DlistItemRx, LIST_MARKERS, ListItemRx } from "../constants/constants.js";

export function isHeading(
  str,
  acceptAll,
  blockAttrs,
  marker,
  title,
  spaceIdx = str.indexOf(" ")
) {
  if (
    !(
      ~spaceIdx &&
      str.startsWith(
        (marker = ["=", "==", "===", "====", "=====", "======"][spaceIdx - 1])
      )
    )
  ) {
    return;
  }
  if (
    !(title = str.substring(spaceIdx + 1)) ||
    (title[0] === " " && !(title = title.trimStart()))
  ) {
    return;
  }
  if (acceptAll || (blockAttrs && blockAttrs.get(1) === "discrete")) {
    return [marker, title];
  }
}

export function hardbreak(str, mark, force, len = str.length) {
  return force || (str[len - 1] === "+" && str[len - 2] === " ")
    ? str.substring(0, str.length - 2) + mark
    : str;
}

export function isAnyListItem(
  chr0,
  str,
  mode = "test",
  match = chr0 in LIST_MARKERS && ListItemRx[mode](str)
) {
  return (
    match ||
    (str.endsWith("::") || ~str.indexOf(":: ") ? DlistItemRx[mode](str) : undefined)
  );
}
