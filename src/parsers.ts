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
 * >> // => { node: { type: "monologue", text: "Hello, world!" }, index: 13 }
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
  index
}: ContextToParse): ContextToBeParsed => {
  return { node: new FailingParsing(text, index), index }
}

/**
 * Parse a monologue.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >> parseMonologue({text: "#\nHello, world!", index: 0})
 * >> // => { node: { type: "monologue", text: "Hello, world!" }, index: 13 }
 */
export const parseMonologue = ({
  text,
  index
}: ContextToParse): ContextToBeParsed => {
  return { node: new FailingParsing(text, index), index }
}

/**
 * Parse a label.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >> parseLabel({text: "*label", index: 0})
 * >> // => { node: { type: "label", text: "*label" }, index: 6 }
 */
export const parseLabel = ({
  text,
  index
}: ContextToParse): ContextToBeParsed => {
  return { node: new FailingParsing(text, index), index }
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
  index
}: ContextToParse): ContextToBeParsed => {
  return { node: new FailingParsing(text, index), index }
}

/**
 * Parse a multi-line tag.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >> parseMultiLineTag({text: "[multi_line_tag]", index: 0})
 * >> // => { node: { type: "multi-line-tag", text: "[multi_line_tag]" }, index: 17 }
 */
export const parseMultiLineTag = ({
  text,
  index
}: ContextToParse): ContextToBeParsed => {
  return { node: new FailingParsing(text, index), index }
}

/**
 * Parse a line comment.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >> parseLineComment({text: "; Line Comment", index: 0})
 * >> // => { node: { type: "line-comment", text: "; Line Comment" }, index: 14 }
 */
export const parseLineComment = ({
  text,
  index: prev
}: ContextToParse): ContextToBeParsed => {
  const line = text.slice(prev).split(/\n/, 1)[0]
  const curr = line.search(";")
  if (curr === -1) return { node: new FailingParsing(text, prev), index: prev }
  return {
    node: { type: "line-comment", raw: text.slice(prev, curr) },
    index: prev + curr
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
 * >> // => { node: { type: "block-comment", text: "\/* Block Comment *\/" }, index: 19 }
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
  }
  const textMatched = textOfInterest.slice(0, indexOfClosingBlock+2)
  return { node: {type: "block-comment", raw: textMatched, value: textMatched.slice("/*".length, -("*/".length))}, index: index + textMatched.length }
}

/**
 * Parse a string.
 * @param text The text to be parsed.
 * @param index The index to start parsing from.
 * @returns The parsed node and the index to continue parsing from.
 * ---
 * @example
 * >> parseBareText({text: "Hello, world!", index: 0})
 * >> // => { node: { type: "string", text: "Hello, world!" }, index: 13 }
 * @example
 * >> parseBareText({text: "_ Hello, world!", index: 0})
 * >> // => { node: { type: "string", text: " Hello, world!" }, index: 14 }
 */
export const parseBareText = ({
  text,
  index: prev
}: ContextToParse): ContextToBeParsed => {
  const curr = text.length + prev
  if (text.slice(prev, prev + 1) === "_") {
    // Reserve head and tail spaces.
    return {
      node: {type: "bare-text", raw: text.slice(prev + 1, curr) },
      index: curr
    }
  }
  // NOTE: Treat every character as a set of character sequence.
  return {
    node: {type: "bare-text", raw: text.slice(prev, curr).trim() },
    index: curr
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
 * >> // => { node: { type: "identifier", text: "Name" }, index: 4 }
 */
export const parseIdentifier = ({
  text,
  index: prev
}: ContextToParse): ContextToBeParsed => {
  const maybeIdentifiers = text.slice(prev).match(/^[a-zA-Z_][a-zA-Z0-9_]*?$/)
  if (!maybeIdentifiers || maybeIdentifiers.length === 0) {
    return { node: new InvalidSyntax(text, prev), index: prev }
  }
  const identifier = maybeIdentifiers[0]
  const nextIndex = prev + identifier.length
  return { node: { type: "identifier", raw: text.slice(prev, nextIndex), value: identifier}, index: nextIndex }
}

/**
 * Parse an empty.
 * @param text The text to parsed but being empty.
 * @param index The index to start parsing from but 0.
 * @return The EMPTY node and the index 0.
 * ---
 * @example
 * >> parseEmpty({text: "", index: 0});
 * >> // => { node: { type: "empty", text: ""}, index: 0 }
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
