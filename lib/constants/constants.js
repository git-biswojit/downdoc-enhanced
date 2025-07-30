import { attributes } from "../functions/attributes.js";
import { callouts } from "../functions/callouts.js";
import { macros } from "../functions/macros.js";
import { quotes } from "../functions/quotes.js";

export const ADMONS = JSON.parse(
  '{"CAUTION":"\ud83d\udd25","IMPORTANT":"\u2757","NOTE":"\ud83d\udccc","TIP":"\ud83d\udca1","WARNING":"\u26a0\ufe0f"}'
);
export const ATTRIBUTES = JSON.parse(
  '{"empty":"","idprefix":"_","idseparator":"_","markdown-line-break":"\\\\","markdown-strikethrough":"~~",' +
    '"nbsp":"&#160;","quotes":"<q> </q>","sp":" ","vbar":"|","zwsp":"&#8203;"}'
);
export const BREAKS = {
  "'''": "---",
  "***": "---",
  "---": "---",
  "<<<": undefined,
  "toc::[]": undefined,
};
export const CONUMS = [...Array(19)].reduce(
  (obj, _, i) => (obj[i + 1] = String.fromCharCode(0x2460 + i)) && obj,
  {}
);
export const DELIMS = {
  "----": "v",
  "....": "v",
  "====": "c",
  "|===": "t",
  "--": "c",
  "****": "c",
  ____: "c",
  "++++": "p",
};
export const LIST_MARKERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, "*", ".", "<", "-"].reduce(
  (obj, c) => (obj["" + c] = true) && obj,
  {}
);
export const NORMAL_SUBS = ["quotes", "attributes", "macros"];
export const SUBSTITUTORS = { quotes, attributes, macros, callouts };
export const TDIV = { "": "| --- ", "<": "| :-- ", "^": "| :-: ", ">": "| --: " };
export const AttributeEntryRx = /^:(!)?([^:-][^:]*):(?:$| (.+))/;
export const AttributeRefRx = /(\\)?\{([\p{Ll}\d_][\p{Ll}\d_-]*)\}/gu;
export const AuthorInfoLineRx =
  /^(?:[\p{Alpha}\d_]+(?: +[\p{Alpha}\d_]+){0,2}(?: +<([^>]+)>)?(?:; |$))+$/u;
export const BlockAnchorRx = /^\[([\p{L}_][\p{Alpha}\d_\-:.]*)(?:, ?(.+))?\]$/u;
export const BlockImageMacroRx = /^image::([^\s[][^[]*)\[(.*)\]$/;
export const CellDelimiterRx = /(?:(?:^| +)(?:[<>^.]*[a-z]?)|)\| */;
export const ConumRx = /(^| )<([.1-9]|1\d)>(?=(?: <(?:[.1-9]|1\d)>)*$)/g;
export const DlistItemRx = /^(?!\/\/)(\S.*?)(:{2,4})(?: (.+))?($)/;
export const ElementAttributeRx =
  /(?:^|, *)(?:(\w[\w-]*)=)?(?:("|')([^\2]+?)\2|([^,]+|))/g;
export const EmphasisSpanMetaRx =
  /(?<![\p{L}\d_\\])\[[^[\]]+\](?=_(?:\S|\S.*?\S)_(?![\p{L}\d_]))/gu;
export const InlineAnchorRx = /\[\[([\p{L}_][\p{Alpha}\d_\-:.]*)\]\]/u;
export const InlineImageMacroRx = /image:([^\s:`[\\][^[\\]*)\[(|.*?[^\\])\]/g;
export const InlineStemMacroRx = /stem:\[(.*?[^\\])\]/g;
export const LinkMacroRx =
  /(\\)?(?:(?:link:(?!:)|(https?:\/\/))([^\s[\\]+)(\[(|.*?[^\\])\^?\])|(https?:\/\/)([^\s[\]]+))/g;
export const ListItemRx = /^(\*+|\.+|<(?:[.1-9]|1\d)>|-|\d+\.) +(.+)/;
export const MarkedSpanRx =
  /(?<![\p{L}\d_\\])(?:\[((\.line-through)|[^[\]]+)\])?#(\S|\S.*?\S)#(?![\p{L}\d_])/gu;
export const PreprocessorDirectiveRx = /^\\?(?:(if)(n)?def|(include))::([^[]+)\[(.+)?\]$/;
export const QuotedSpanRx = /("|')`(\S|\S.*?\S)`\1/g;
export const RevisionInfoLineRx =
  /^v(\d+(?:[-.]\w+)*)(?:, (\d+-\d+-\d+))?|(\d+-\d+-\d+)$/;
export const RewriteInternalXrefRx = /\[([^[]*?)\]\(#!([^)]+)\)/g;
export const StrongSpanRx =
  /(?<![\p{L}\d_\\])(?:\[[^[\]]+\])?(\*(?:\S|\S.*?\S)\*)(?![\p{L}\d_])/gu;
export const StyleShorthandMarkersRx = /([.#%])/;
export const XrefMacroRx =
  /(\\)?xref:(?![\s:`])(?:([^#[\\]+)(#[^\s[\\]*|\.adoc)|#([^\s[\\]+)|([^#[\\]+))\[(|.*?[^\\])\]/g;
export const XrefShorthandRx = /<<([^\s,>][^,>]*)(?:, ?([^>]+))?>>/g;
