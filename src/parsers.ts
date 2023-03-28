import { InvalidSyntax, FailingParsing } from "./conditions"
import type { ContextToBeParsed, ContextToParse } from "./conditions"

/**
 * Parse a scenario.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >> parseScenario({text: "Hello, world!", index: 0})
 * >> // => { node: { type: "bare-text", text: "Hello, world!" }, index: 13 }
 */
export const parseScenario = ({
  text,
  index
}: ContextToParse): ContextToBeParsed => {
  if (text.length === 0) return { node: { type: "empty", raw: "" }, index }
  let context: ContextToBeParsed
  context = parseLineComment({ text, index })
  if (context.node.type === "line-comment") return context
  context = parseBlockComment({ text, index })
  if (context.node.type === "block-comment") return context
  context = parseMultiLineTag({ text, index })
  if (context.node.type === "multi-line-tag") return context
  return { node: new InvalidSyntax(text, text.length), index: text.length }
}

/**
 * Parse a scenario line.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >> parseScenarioLine({text: "Hello, world!", index: 0})
 * >> // => { node: { type: "bare-text", text: "Hello, world!" }, index: 13 }
 */
export const parseScenarioLine = ({
  text,
  index
}: ContextToParse): ContextToBeParsed => {
  let context: ContextToBeParsed
  context = parseLabel({ text, index })
  if (context.node.type === "label") return context
  context = parseMonologue({ text, index })
  if (context.node.type === "monologue") return context
  context = parseCharacterDeclaration({ text, index })
  if (context.node.type === "character-declaration") return context
  context = parseSingleLineTag({ text, index })
  if (context.node.type === "single-line-tag") return context
  return { node: new InvalidSyntax(text, text.length), index: text.length }
}

/**
 * Parse a character declaration.
 * @param text The text to parse.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index ti continue parsing from.
 * ---
 * @example
 * >> parseCharacterDeclaration({text: "#Name", index: 0})
 * >> // => { node: { type: "character-declaration", text: "#Name" }, index: 5 }
 */
export const parseCharacterDeclaration = ({
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
  return { node: { type: "character-declaration", narrative, emotion, raw: lineOfInterest.slice(1) }, index: curr + 1 }
}

/**
 * Parse a monologue.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >> parseMonologue({text: "#\nHello, world!", index: 0})
 * >> // => { node: { type: "monologue", raw: "Hello, world!" }, index: 13 }
 */
export const parseMonologue = ({
  text,
  index
}: ContextToParse): ContextToBeParsed => {
  const lineOfInterest = text.slice(index).split(/\n/, 1)[0]
  if (lineOfInterest.trimEnd() !== "#") {
    return { node: new FailingParsing(text, index), index }
  }
  const nextIndex = index + lineOfInterest.length
  return { node: { type: "monologue", raw: text.slice(index, nextIndex) }, index: nextIndex + 1 }
}

/**
 * Parse a label.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >> parseLabel({text: "*label", index: 0})
 * >> // => { node: { type: "label", raw: "*label" }, index: 6 }
 */
export const parseLabel = ({
  text,
  index
}: ContextToParse): ContextToBeParsed => {
  const lineOfInterest = text.slice(index).split(/\n/, 1)[0]
  // TODO: Check if the label is valid.
  if (!lineOfInterest.startsWith("*")) { return { node: new FailingParsing(text, index), index } }
  if (lineOfInterest.length == ("*").length) { return { node: new InvalidSyntax(text, index), index: index + lineOfInterest.length + 1 } }
  const label = lineOfInterest.slice(1).match(/^[a-zA-Z_]+/)?.[0]
  if (label === undefined) {
    return { node: new InvalidSyntax(text, index), index: index + lineOfInterest.length + 1 }
  }
  const extra = undefined
  // TODO: Parse the extra label.
  return { node: { type: "label", label, extra, raw: lineOfInterest.slice(1) }, index: index + lineOfInterest.length + 1 }
}

/**
 * Parse a single-line tag.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >> parseOneLinerTag({text: "@single_line_tag", index: 0})
 * >> // => { node: { type: "single-line-tag", text: "@single_line_tag" }, index: 14 }
 */
export const parseSingleLineTag = ({
  text,
  index: prev
}: ContextToParse): ContextToBeParsed => {
  if (!text.startsWith("@")) return { node: new FailingParsing(text, prev), index: prev }
  const lineOfInterest = text.slice(prev).split(/\n/, 1)[0]
  // TODO: Check if the components of the tag are valid.
  const curr = prev + lineOfInterest.length
  if (curr - prev == ("@").length) {
    return { node: new InvalidSyntax(text, curr), index: curr }
  }
  const tag = lineOfInterest.slice(1).match(/^[a-zA-Z_]+/)?.[0]
  if (typeof tag === "undefined") {
    return { node: new InvalidSyntax(text, curr), index: curr }
  }
  // TODO: Parse parameters.
  const parameters = {}
  return { node: { type: "single-line-tag", raw: lineOfInterest.slice(1), tag, parameters }, index: curr + 1 }
}

/**
 * Parse a multi-line tag.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >> parseMultiLineTag({text: "[multi_line_tag]", index: 0})
 * >> // => { node: { type: "multi-line-tag", raw: "[multi_line_tag]" }, index: 17 }
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
  let node = undefined
  let nextIndex = undefined
  for (let i = 1; i < lineOfInterest.length - 1; i++) {
    ({node, index: nextIndex} = parseIdentifier({text: lineOfInterest, index: i}))
    if (node.type === "identifier") {
      break
    }
  }
  const tag = node?.value
  if (typeof tag === "undefined") {
    return { node: new InvalidSyntax(text, curr), index: curr }
  }
  // TODO: Parse parameters.
  const parameters = {}
  return { node: { type: "multi-line-tag", raw: textOfInterest.slice(1, -1).replace("\n", " "), tag, parameters }, index: curr }
}

/**
 * Parse a line comment.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >> parseLineComment({text: "; Line Comment", index: 0})
 * >> // => { node: { type: "line-comment", raw: "; Line Comment" }, index: 14 }
 */
export const parseLineComment = ({
  text,
  index: prev
}: ContextToParse): ContextToBeParsed => {
  const line = text.slice(prev).split(/\n/, 1)[0]
  if (!line.startsWith(";")) return { node: new FailingParsing(text, prev), index: prev }
  return {
    node: { type: "line-comment", raw: line.slice(1) },
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
 * >> parseBlockComment({text: "\/* Block Comment *\/", index: 0})
 * >> // => { node: { type: "block-comment", raw: "\/* Block Comment *\/" }, index: 19 }
 */
export const parseBlockComment = ({
  text,
  index
}: ContextToParse): ContextToBeParsed => {
  const textOfInterest = text.slice(index)
  if (!textOfInterest.startsWith("/*")) {
    return { node: new FailingParsing(text, index), index }
  }
  const indexOfClosingBlock = textOfInterest.search(/\*\//);
  if (indexOfClosingBlock < 0) {
    return { node: new InvalidSyntax(text, index), index }
    // NOTE: The block comment should be closed.
  }
  const textMatched = textOfInterest.slice(0, indexOfClosingBlock + ("*/").length)
  if (!textMatched.includes("\n")) {
    return { node: new InvalidSyntax(text, index), index }
    // NOTE: The block comment should be in multiple lines.
  }
  return { node: { type: "block-comment", raw: textMatched, value: textMatched.slice(("/*").length, -(("*/").length)) }, index: index + textMatched.length }
}

/**
 * Parse a string.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >> parseBareText({text: "Hello, world!", index: 0})
 * >> // => { node: { type: "string", raw: "Hello, world!" }, index: 13 }
 * @example
 * >> parseBareText({text: "_ Hello, world!", index: 0})
 * >> // => { node: { type: "string", raw: " Hello, world!" }, index: 14 }
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
 * >> parseIdentifier({text: "Name", index: 0})
 * >> // => { node: { type: "identifier", raw: "Name" }, index: 4 }
 */
export const parseIdentifier = ({
  text,
  index: prev
}: ContextToParse): ContextToBeParsed => {
  const maybeIdentifiers = text.slice(prev).match(/^[a-zA-Z_][a-zA-Z0-9_]*/)
  if (!maybeIdentifiers || maybeIdentifiers.length === 0) {
    return { node: new InvalidSyntax(text, prev), index: prev }
  }
  const identifier = maybeIdentifiers[0]
  const nextIndex = prev + identifier.length
  return { node: { type: "identifier", raw: text.slice(prev, nextIndex), value: identifier }, index: nextIndex }
}

/**
 * Parse an empty.
 * @param text The text to parsed but being empty.
 * @param index The index to start parsing from but 0.
 * @return The EMPTY node and the index 0.
 * ---
 * @example
 * >> parseEmpty({text: "", index: 0});
 * >> // => { node: { type: "empty", raw: ""}, index: 0 }
 */
export const parseEmpty = ({
  text,
  index
}: ContextToParse): ContextToBeParsed => {
  if (index !== 0 || text.length !== 0) {
    return { node: new FailingParsing(text, index), index }
  }
  return { node: { type: "empty", raw: "" }, index: 0 }
}
