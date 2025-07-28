"use strict";
import { ConumRx, CONUMS } from "../constants/constants.js";

export function callouts(str, apply = str[str.length - 1] === ">") {
  return apply
    ? str.replace(ConumRx, (_, sp, chr) => sp + CONUMS[chr === "." ? this.coseq++ : chr])
    : str;
}
