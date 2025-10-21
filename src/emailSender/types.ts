export type EndOfLine = 'lf' | 'crlf' | 'auto';
export type HtmlWhitespaceSensitivity = 'ignore' | 'css' | 'strict';
export type WrapAttributes = 'force-aligned' | 'force' | 'force-expand-multiline' | 'auto';
export type EmbeddedLanguageFormatting = 'auto' | 'off';
export type TrailingComma = 'none' | 'es5' | 'all';
export type ArrowParens = 'avoid' | 'always';
export type QuoteProps = 'as-needed' | 'consistent' | 'preserve';
export type ProseWrap = 'always' | 'never' | 'preserve';

export interface PrettierOptions {
  endOfLine: EndOfLine;
  useTabs: boolean;
  htmlWhitespaceSensitivity: HtmlWhitespaceSensitivity;
  wrapAttributes: WrapAttributes;
  embeddedLanguageFormatting: EmbeddedLanguageFormatting;
  maxPreserveNewLines: number;
  trailingComma: TrailingComma;
  arrowParens: ArrowParens;
  quoteProps: QuoteProps;
  proseWrap: ProseWrap;
}
