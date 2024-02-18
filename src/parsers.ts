import { InvalidSyntax, FailingParsing } from "./conditions"
import type { ContextToBeParsed, ContextToParse } from "./conditions"
import { u } from "unist-builder/index.js"

/**
 * Parse a scenario.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >>> parseScenario({text: "Hello, world!", index: 0})
 * { node: { type: "bare-text", text: "Hello, world!" }, index: 13 }
 */
export const parseScenario = ({
  text,
  index
}: ContextToParse): ContextToBeParsed => {
  if (text.length === 0) return parseEmpty({ text, index })
  const anyContext = ({ text, index }: ContextToParse): ContextToBeParsed => {
    let context: ContextToBeParsed
    context = parseLineComment({ text, index })
    if (context.node.type === "line-comment") return context
    context = parseBlockComment({ text, index })
    if (context.node.type === "block-comment") return context
    context = parseMultiLineTag({ text, index })
    if (context.node.type === "multi-line-tag") return context
    return parseScenarioLine({ text, index })
  }
  const contexts: ContextToBeParsed[] = []
  for (
    let context = anyContext({ text, index });
    index < text.length;
    index = context.index
  ) {
    contexts.push(context)
  }
  const root = u("scenario", { raw: text }, contexts as [])
  if (root.children.length !== 0) return { node: root, index: text.length }
  return { node: new InvalidSyntax(text, text.length), index: text.length }
}

/**
 * Parse a scenario line.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >>> parseScenarioLine({text: "Hello, world!", index: 0})
 * { node: { type: "bare-text", text: "Hello, world!" }, index: 13 }
 */
export const parseScenarioLine = ({
  text,
  index
}: ContextToParse): ContextToBeParsed => {
  let context: ContextToBeParsed
  context = parseLabel({ text, index })
  if (context.node.type === "label") return context
  context = parseNarrative({ text, index })
  if (context.node.type === "narrative") return context
  context = parseNarratorDeclaration({ text, index })
  if (context.node.type === "narrator-declaration") return context
  context = parseSingleLineTag({ text, index })
  if (context.node.type === "single-line-tag") return context
  return { node: new InvalidSyntax(text, text.length), index: text.length }
}

/**
 * Parse a narrator declaration.
 * @param text The text to parse.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index ti continue parsing from.
 * ---
 * @example
 * >>> parseNarratorDeclaration({text: "#Name", index: 0})
 * { node: { type: "narrator-declaration", text: "#Name" }, index: 5 }
 */
export const parseNarratorDeclaration = ({
  text,
  index: prev
}: ContextToParse): ContextToBeParsed => {
  const lineOfInterest = text.slice(prev).split(/\n/, 1)[0]
  if (!lineOfInterest.startsWith("#")) return { node: new FailingParsing(text, prev), index: prev }
  const curr = prev + lineOfInterest.length
  const [narrative, ...adjectives] = lineOfInterest.slice(1).split(/:/)
  if (narrative.length === 0) {
    return { node: new InvalidSyntax(text, prev), index: curr + 1 }
  }
  if (adjectives.length > 1) {
    return { node: new InvalidSyntax(text, prev), index: curr + 1 }
  }
  if (adjectives.length === 1 && adjectives[0].length === 0) {
    return { node: new InvalidSyntax(text, prev), index: curr + 1 }
  }
  const emotion = adjectives.length === 1 ? adjectives[0] : undefined
  return { node: u("narrator-declaration", { narrative, emotion, raw: lineOfInterest.slice(1) }, narrative), index: curr + 1 }
}

/**
 * Parse a narrative.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >>> parseNarrative({text: "#\nHello, world!", index: 0})
 * { node: { type: "narrative", raw: "Hello, world!" }, index: 13 }
 */
export const parseNarrative = ({
  text,
  index
}: ContextToParse): ContextToBeParsed => {
  const lineOfInterest = text.slice(index).split(/\n/, 1)[0]
  if (lineOfInterest.trimEnd() !== "#") {
    return { node: new FailingParsing(text, index), index }
  }
  const nextIndex = index + lineOfInterest.length
  return { node: u("narrative", { raw: text.slice(index, nextIndex) }), index: nextIndex + 1 }
}

/**
 * Parse a label.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >>> parseLabel({text: "*label", index: 0})
 * { node: { type: "label", raw: "*label", label: "label" }, index: 6 }
 * >>> parseLabel({text: "*label|extra", index: 0})
 * { node: { type: "label", raw: "*label", lable: "label", extra: "extra" }, index: 6 }
 */
export const parseLabel = ({
  text,
  index
}: ContextToParse): ContextToBeParsed => {
  const lineOfInterest = text.slice(index).split(/\n/, 1)[0]
  // TODO: Check if the label is valid.
  if (!lineOfInterest.startsWith("*")) { return { node: new FailingParsing(text, index), index } }
  if (lineOfInterest.length === ("*").length) { return { node: new InvalidSyntax(text, index), index: index + lineOfInterest.length + 1 } }
  const label = lineOfInterest.slice(1).match(/^[a-zA-Z_]+/)?.[0]
  if (label === undefined) {
    return { node: new InvalidSyntax(text, index), index: index + lineOfInterest.length + 1 }
  }
  const extra = (({
    text,
    index
  }: ContextToParse): string | undefined | InvalidSyntax => {
    const textOfInterest = text.slice(index)
    if (textOfInterest.length == 0) {
      return undefined  // No need to parse more
    }
    if (!textOfInterest.startsWith("|")) {
      return new InvalidSyntax(text, index+1)
    }
    return textOfInterest.slice(1).match(/^[a-zA-Z_]+/)?.[0]
  })({text: lineOfInterest, index: 1 + label.length})
  if (extra instanceof InvalidSyntax) {
    return { node: extra, index: index + lineOfInterest.length + 1 }
  }
  return { node: u("label", { label, extra, raw: lineOfInterest.slice(1) }, label), index: index + lineOfInterest.length + 1 }
}

/**
 * Parse a single-line tag.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >>> parseOneLinerTag({text: "@single_line_tag", index: 0})
 * { node: { type: "single-line-tag", text: "@single_line_tag" }, index: 14 }
 */
export const parseSingleLineTag = ({
  text,
  index: prev
}: ContextToParse): ContextToBeParsed => {
  if (!text.startsWith("@")) return { node: new FailingParsing(text, prev), index: prev }
  const lineOfInterest = text.slice(prev).split(/\n/, 1)[0]
  // TODO: Check if the components of the tag are valid.
  const curr = prev + lineOfInterest.length
  if (curr - prev === ("@").length) {
    return { node: new InvalidSyntax(text, curr), index: curr }
  }
  const tag = lineOfInterest.slice(1).match(/^[a-zA-Z_]+/)?.[0]
  if (typeof tag === "undefined") {
    return { node: new InvalidSyntax(text, curr), index: curr }
  }
  // TODO: Parse parameters.
  const parameters = {}
  return { node: u("single-line-tag", { raw: lineOfInterest.slice(1), tag, parameters }, tag), index: curr + 1 }
}

/**
 * Parse a multi-line tag.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >>> parseMultiLineTag({text: "[multi_line_tag]", index: 0})
 * { node: { type: "multi-line-tag", raw: "[multi_line_tag]" }, index: 17 }
 */
export const parseMultiLineTag = ({
  text,
  index: prev
}: ContextToParse): ContextToBeParsed => {
  if (!text.startsWith("[")) {
    return { node: new FailingParsing(text, prev), index: prev }
  }
  const indexOfClosingTag = text.slice(prev).search(/\]/)
  if (indexOfClosingTag < 0) {
    return { node: new FailingParsing(text, prev), index: prev }
  }
  const textOfInterest = text.slice(prev, indexOfClosingTag + 1)
  const curr = prev + textOfInterest.length
  const lineOfInterest = textOfInterest.replace(/\n/g, " ")
  if (lineOfInterest.slice(1, -1).replace(/\s/g, "").length === 0) {
    return { node: new InvalidSyntax(text, prev), index: curr }
  }
  let node
  let nextIndex = lineOfInterest.search(/[^ \t　]/)
  for (let i = nextIndex; i < lineOfInterest.length - 1; i++) {
    ({ node, index: nextIndex } = parseIdentifier({ text: lineOfInterest, index: i }))
    if (node.type === "identifier") {
      break
    }
  }
  const tag = node?.value
  if (typeof tag === "undefined") {
    return { node: new InvalidSyntax(text, curr), index: curr }
  }
  const parameters = {node: u("parameters", parseParameters())}
  return { node: u("multi-line-tag", { raw: textOfInterest.slice(1, -1).replace("\n", " "), tag, parameters }, tag), index: nextIndex }
}

/** */
const parseParameters = () => { return {key: "value"} }

/**
 * Parse a key-value pair.
 * ---
 * @example
 * >>> parseKVPair({text: "text='string'", index: 0})
 * { node: { type: "key-value-pair", key: "text", value: "string" }, index: 13 }
 * >>> parseKVPair({text: "text=string", index: 0})
 * { node: { type: "key-value-pair", key: "text", value: "string" }, index: 13 }
 * >>> parseKVPair({text: "zero=0", index: 0})
 * { node: { type: "key-value-pair", key: "zero", value: "0" }, index: 6 }
 * >>> parseKVPair({text: "truthy=true", index: 0})
 * { node: { type: "key-value-pair", key: "truthy", value: "true" }, index: 10 }
 * >>> parseKVPair({text: "expr="1 + 2"", index: 0})
 * { node: { type: "key-value-pair", key: "expr", value: "1 + 2" }, index: 12 }
 */
export const parseKVPair = ({text, index}: ContextToParse): ContextToBeParsed => {
  const indexOfEqualSign = text.search(/=/)
  if (indexOfEqualSign < 0) {
    return { node: new FailingParsing(text, index), index }
  }
  const key = text.slice(0, indexOfEqualSign)
  const textAfterEqualSign = text.slice(indexOfEqualSign + 1)
  // NOTE: `value` can be quoted-expr or string literal or integer literal or boolean literal.
  const [valueBare, nextIndexAfterKV] = (() => {
    const indexOfQuote = textAfterEqualSign.search(/"/) // TODO
    if (indexOfQuote < 0) {
      const nextIndex = textAfterEqualSign.search(/ /)
      return [textAfterEqualSign.slice(indexOfEqualSign + 1, nextIndex), nextIndex]
    }
    const indexOfQuoteEnd = textAfterEqualSign.slice(indexOfQuote + 1).search(/"/) // TODO
    if (indexOfQuoteEnd < 0 || textAfterEqualSign.at(indexOfQuoteEnd + 1) !== " ") {
      return new FailingParsing(textAfterEqualSign, indexOfQuote)
    }
    return [textAfterEqualSign.slice(indexOfQuote + 1, indexOfQuoteEnd - 1), indexOfQuoteEnd + 1]
  })()
  const valueQuoted = `"${valueBare}"`
  return { node: u("key-value-pair", { raw: "", key, value: valueQuoted }), index: nextIndexAfterKV }
}

/**
 * Parse a left hand value.
 * ---
 * @example
 * >>> parseLeftHandValue({text: "0", index: 0})
 */

/**
 * Parse a line comment.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >>> parseLineComment({text: "; Line Comment", index: 0})
 * { node: { type: "line-comment", raw: "; Line Comment" }, index: 14 }
 */
export const parseLineComment = ({
  text,
  index: prev
}: ContextToParse): ContextToBeParsed => {
  const line = text.slice(prev).split(/\n/, 1)[0]
  if (!line.startsWith(";")) return { node: new FailingParsing(text, prev), index: prev }
  return {
    node: u("line-comment", { raw: line.slice(1) }, line.slice(1)),
    index: prev + line.length + 1
  }
}

/**
 * Parse a block comment.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >>> parseBlockComment({text: "\/* Block Comment *\/", index: 0})
 * { node: { type: "block-comment", raw: "\/* Block Comment *\/" }, index: 19 }
 */
export const parseBlockComment = ({
  text,
  index
}: ContextToParse): ContextToBeParsed => {
  const textOfInterest = text.slice(index)
  if (!textOfInterest.startsWith("/*")) {
    return { node: new FailingParsing(text, index), index }
  }
  const indexOfClosingBlock = textOfInterest.search(/\*\//)
  if (indexOfClosingBlock < 0) {
    return { node: new InvalidSyntax(text, index), index }
    // NOTE: The block comment should be closed.
  }
  const textMatched = textOfInterest.slice(0, indexOfClosingBlock + ("*/").length)
  if (!textMatched.includes("\n")) {
    return { node: new InvalidSyntax(text, index), index }
    // NOTE: The block comment should be in multiple lines.
  }
  return { node: u("block-comment", { raw: textMatched }, textMatched.slice(("/*").length, -(("*/").length))), index: index + textMatched.length }
}

/**
 * Parse a string.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >>> parseBareText({text: "Hello, world!", index: 0})
 * { node: { type: "string", raw: "Hello, world!" }, index: 13 }
 * @example
 * >>> parseBareText({text: "_ Hello, world!", index: 0})
 * { node: { type: "string", raw: " Hello, world!" }, index: 14 }
 */
export const parseBareText = ({
  text,
  index: prev
}: ContextToParse): ContextToBeParsed => {
  const curr = prev + text.length
  if (text.slice(prev, prev + 1) === "_") {
    // Reserve head and tail spaces.
    return {
      node: { type: "bare-text", raw: text.slice(prev + 1, curr) },
      index: curr + 1
    }
  }
  // NOTE: Treat every character as a set of character sequence.
  return {
    node: { type: "bare-text", raw: text.slice(prev, curr).trim() },
    index: curr + 1
  }
}

/**
 * Parse an identifier.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >>> parseIdentifier({text: "Name", index: 0})
 * { node: { type: "identifier", raw: "Name" }, index: 4 }
 */
export const parseIdentifier = ({
  text,
  index: prev
}: ContextToParse): ContextToBeParsed => {
  const maybeIdentifiers = text.slice(prev).match(/^[a-zA-Z_][a-zA-Z0-9_]*/)
  if ((maybeIdentifiers == null) || maybeIdentifiers.length === 0) {
    return { node: new InvalidSyntax(text, prev), index: prev }
  }
  const identifier = maybeIdentifiers[0]
  const nextIndex = prev + identifier.length
  return { node: u("identifier", { raw: text.slice(prev, nextIndex) }, identifier), index: nextIndex }
}

/**
 * Parse an empty.
 * @param text The text to parsed but being empty.
 * @param index The index to start parsing from but 0.
 * @return The EMPTY node and the index 0.
 * ---
 * @example
 * >>> parseEmpty({text: "", index: 0});
 * { node: { type: "empty", raw: ""}, index: 0 }
 */
export const parseEmpty = ({
  text,
  index
}: ContextToParse): ContextToBeParsed => {
  if (index !== 0 || text.length !== 0) {
    return { node: new FailingParsing(text, index), index }
  }
  return { node: u("empty", { raw: "" }), index: 0 }
}

/**
 * Parse a quoted string.
 * @param text The string to parse
 * @param index The index to start parsing from.
 * @return The parsed node and the index to continue parsing from.
 * ---
 * @example
 * ```
 * >>> parseQuotedString({text: `"quoted-string"`, index: 0})
 * { node: { type: "quoted-string" }, index: 13 }
 * ```
 */
export const parseQuotedString = ({
  text,
  index: curr
}: ContextToParse): ContextToBeParsed => {
  const eatQuoteHeader = (
    text: string, index: number, markRegExp: RegExp = /^["']{1}/
  ): [null | string, number] => {
    const mark = text[index]
    return mark.search(markRegExp) >= 0 ? [mark, index + mark.length] : [null, index]
  }
  const eatQuoteBody = (
    text: string, index: number, mark: string
  ): [null | string, number] => {
    const offsetToEndQuote = text.slice(index).indexOf(mark)
    if (offsetToEndQuote < 0) {
      return [null, index]
    }
    return [text.slice(index, index + offsetToEndQuote), index + (offsetToEndQuote + 1)]
    // TODO: Treat escaped characters.
  }
  const eatQuoteFooter = (
    text: string, index: number, mark: string
  ): [string, number] => {
    return [mark, index + mark.length]
  }
  const [mark, indexToStartQuoting] = eatQuoteHeader(text, curr)
  if (mark === null) {
    return { node: new FailingParsing(text, curr), index: curr }
  }
  const [body, indexToEndQuoteBody] = eatQuoteBody(text, indexToStartQuoting, mark)
  if (body === null) {
    return { node: new FailingParsing(text, curr), index: curr }
  }
  if (body === "") {
    return { node: u("quoted-string", { raw: `${mark}${mark}` }, [u("undefined")]), index: indexToStartQuoting }
  }
  const [markOfFooter, indexToEndQuoting] = eatQuoteFooter(text, indexToEndQuoteBody, mark)
  // NOTE: Should raise a runtime error if `mark` and `markOfFooter` would be not the same.
  return {
    node: u("quoted-string", { raw: `${mark}${body}${markOfFooter}` }, body),
    index: curr + (indexToEndQuoting - indexToStartQuoting)
  }
}
