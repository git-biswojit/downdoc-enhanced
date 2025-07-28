"use strict";
import { NORMAL_SUBS, SUBSTITUTORS } from "../constants/constants.js";

export function applySubs(str, subs = NORMAL_SUBS) {
  return /[{\x60\x27*_:<[#]/.test(str)
    ? subs.reduce((str, name) => SUBSTITUTORS[name].call(this, str), str)
    : str;
}
