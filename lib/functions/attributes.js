"use strict";
import { AttributeRefRx } from "../constants/constants.js";

export function attributes(str) {
  return ~str.indexOf("{")
    ? str.replace(AttributeRefRx, (m, bs, n) => (bs ? m.substring(1) : this.get(n) ?? m))
    : str;
}
