import { describe, it, expect } from "vitest"
import {
  parseBareText,
  parseBlockComment,
  parseCharacterDeclaration,
  parseEmpty,
  parseIdentifier,
  parseLabel,
  parseLineComment,
  parseNarrative,
  parseMultiLineTag,
  parseQuotedString,
  parseSingleLineTag
} from "./../src/parsers"

const EMPTY = { type: "empty", raw: "" }

describe("Minimal special symbols::", () => {
  it("should be valid for one line of line-comment with no content.", () => {
    const text = ";"
    const parsedText = parseLineComment({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "line-comment" } })
  })
  it("should be invalid for one line of block-comment with no content.", () => {
    const text = "/* */"
    // NOTE: Every closing block-comment pair (leading `*` and following `/`) needs to place alone inline.
    expect(parseBlockComment({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it("should be a narrative.", () => {
    const text = "#"
    expect(parseNarrative({ text, index: 0 })).toMatchObject({ node: { type: "narrative" } })
  })
  it("should throw an error with the empty label.", () => {
    const text = "*"
    expect(parseLabel({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it("should throw an error with the empty single-line tag.", () => {
    const text = "@"
    expect(parseSingleLineTag({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it("should throw an error with the empty multi-line tag.", () => {
    const text = "[]"
    expect(parseMultiLineTag({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
})

describe("Simple single-lines::", () => {
  it("should be empty.", () => {
    const text = ""
    expect(parseEmpty({ text, index: 0 })).toMatchObject({ node: EMPTY })
  })
  it("should be a valid line of line-comment.", () => {
    const text = ";Line Comment"
    expect(parseLineComment({ text, index: 0 })).toMatchObject({ node: { type: "line-comment" } })
  })
  it("should be invalid lines of block-comment.", () => {
    const text = "/* Block Comment */"
    expect(parseBlockComment({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it("should be valid lines of block-comment.", () => {
    const text = `/*
        Block Comment
        */`
    // NOTE: Every closing block-comment pair (leading `*` and following `/`) needs to place alone inline.
    expect(parseBlockComment({ text, index: 0 })).toMatchObject({ node: { type: "block-comment" } })
  })
  it("should be a valid line of text.", () => {
    const text = "I'm a line of text."
    expect(parseBareText({ text, index: 0 })).toMatchObject({ node: { type: "bare-text" } })
  })
  it("should be a valid character declaration.", () => {
    const text = "#character-declaration"
    expect(parseCharacterDeclaration({ text, index: 0 })).toMatchObject({ node: { type: "character-declaration" } })
  })
  it("should be a valid label.", () => {
    const text = "*label"
    expect(parseLabel({ text, index: 0 })).toMatchObject({ node: { type: "label" } })
  })
  it("should be a valid single-line tag.", () => {
    const text = "@tag"
    expect(parseSingleLineTag({ text, index: 0 })).toMatchObject({ node: { type: "single-line-tag" } })
  })
  it("should be a valid line of a multi-line tag.", () => {
    const text = "[tag]"
    expect(parseMultiLineTag({ text, index: 0 })).toMatchObject({ node: { type: "multi-line-tag" } })
  })
})

describe("Complex character declarations::", () => {
  it("should be invalid for nobody with no emotion.", () => {
    const text = "#:"
    expect(parseCharacterDeclaration({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
    // NOTE: This behavior is better than ignoring potential typographic errors,
    // NOTE: however it can be different from another implementation.
  })
  it("should be valid for an emotion declaration.", () => {
    const text = "#Jane:Angry"
    const parsedText = parseCharacterDeclaration({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "character-declaration", narrative: "Jane", emotion: "Angry" } })
  })
  it("should be invalid for a name with a trailing colon.", () => {
    const text = "#Jane:"
    expect(parseCharacterDeclaration({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
    // NOTE: This behavior is better than ignoring potential typographic errors,
    // NOTE: however it can be different from another implementation.
  })
  it("should be invalid for an emotion declamation with a trailing colon.", () => {
    const text = "#Jane:Angry:"
    expect(parseCharacterDeclaration({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
    // NOTE: This behavior is better than ignoring potential typographic errors,
    // NOTE: however it can be different from another implementation.
  })
})

describe("Complex labels::", () => {
  it("should be valid for a valid identifier.", () => {
    const text = "*_"
    expect(parseLabel({ text, index: 0 })).toMatchObject({ node: { type: "label" } })
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "*17" // NOTE: `17` is a prime number.
    expect(parseLabel({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "*-"
    expect(parseLabel({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it("should be valid for alternative text.", () => {
    const text = "*scene|extra"
    const parsedText = parseLabel({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "label", label: "scene", extra: "extra" } })
  })
  it("should be invalid for space-separated parts.", () => {
    const text = "*scene extra"
    expect(parseLabel({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it("should be invalid for a colon-separated label.", () => {
    const text = "*scene:extra"
    expect(parseLabel({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
})

describe("Complex single-line tags::", () => {
  it("should be valid for a valid identifier.", () => {
    const text = "@_"
    expect(parseSingleLineTag({ text, index: 0 })).toMatchObject({ node: { type: "single-line-tag" } })
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "@17" // NOTE: `17` is a prime number.
    expect(parseSingleLineTag({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "@-"
    expect(parseSingleLineTag({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it("should be valid for space-separated parts.", () => {
    const text = "@tag switch"
    const parsedText = parseSingleLineTag({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "single-line-tag", tag: "tag", parameters: { switch: true } } })
  })
  it("should be valid for a KV pair.", () => {
    const text = "@tag key=value"
    const parsedText = parseSingleLineTag({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "single-line-tag", tag: "tag", parameters: { key: "value" } } })
  })
})

describe("Complex multi-line tags::", () => {
  it("should be valid for a valid identifier.", () => {
    const text = "[_]"
    expect(parseMultiLineTag({ text, index: 0 })).toMatchObject({ node: { type: "multi-line-tag", tag: "_" } })
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "[17]" // NOTE: `17` is a prime number.
    expect(parseMultiLineTag({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "[-]"
    expect(parseMultiLineTag({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it("should be valid for space-separated parts.", () => {
    const text = "[tag switch]"
    const parsedText = parseMultiLineTag({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "multi-line-tag", tag: "tag", parameters: { switch: true } } })
  })
  it("should be valid for a KV pair.", () => {
    const text = "[tag key=value]"
    const parsedText = parseMultiLineTag({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "multi-line-tag", tag: "tag", parameters: { key: "value" } } })
  })
})

describe("Complex multi-line tags containing lines::", () => {
  it("should be valid for a valid identifier.", () => {
    const text = `[
            _
            ]`
    expect(parseMultiLineTag({ text, index: 0 })).toMatchObject({ node: { type: "multi-line-tag", tag: "_" } })
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = `[
            17
            ]` // NOTE: `17` is a prime number.
    expect(parseMultiLineTag({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = `[
            -
            ]`
    expect(parseMultiLineTag({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it("should be valid for space-separated parts.", () => {
    const text = `[
            tag
            switch
            ]`
    const parsedText = parseMultiLineTag({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "multi-line-tag", tag: "tag", parameters: { switch: true } } })
  })
  it("should be valid for a KV pair.", () => {
    const text = `[
            tag
            key=value
        ]`
    const parsedText = parseMultiLineTag({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "multi-line-tag", tag: "tag", parameters: { key: "value" } } })
  })
  it("should be invalid for a multi-line KV pair.", () => {
    const text = `[
            tag
            key
            =
            value
        ]`
    expect(parseMultiLineTag({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
})

describe("Simple text::", () => {
  it("should be valid.", () => {
    const text = "I'm a line of text."
    const parsedText = parseBareText({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "bare-text", raw: "I'm a line of text." } })
  })
  it("should trim leading spaces.", () => {
    const text = " I'm a line of text."
    const parsedText = parseBareText({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "bare-text", raw: "I'm a line of text." } })
    // NOTE: The leading space character is removed.
    // NOTE: See also: <https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String/trim>
  })
  it("should not trim leading spaces on starting with a underscore.", () => {
    const text = "_   I'm a line of text."
    const parsedText = parseBareText({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "bare-text", raw: "   I'm a line of text." } })
    // NOTE: The leading underscore is removed
    // NOTE: but any leading space characters just after the underscore is kept.
  })
})

describe("Identifiers::", () => {
  it("can start with an alphabet.", () => {
    const text = "a"
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "identifier", raw: text } })
  })
  it("should not start with a number.", () => {
    const text = "7"
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it("should not start with a hyphen.", () => {
    const text = "-identifier"
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it("can start with an underscore.", () => {
    const text = "_identifier"
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "identifier", raw: text } })
  })
  it("should not start with a number.", () => {
    const text = "0identifier"
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it("should not start with a dollar sign.", () => {
    const text = "$identifier"
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it("should not contain full-width characters.", () => {
    const text = "ＩＤＥＮＴＩＦＩＥＲ"
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it.todo("should not contain a space.", () => {
    const text = "identifier identifier"
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it.todo("should not contain a hyphen.", () => {
    const text = "identifier-identifier"
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
    // NOTE: This is an invalid identifier in JavaScript.
  })
})

describe("Quoted Strings::", () => {
  it("should be valid with a line of single-quoted string.", () => {
    const text = "'string-surrounded-by-single-quotations'"
    expect(parseQuotedString({ text, index: 0 })).toMatchObject({ node: { type: "quoted-string" } })
  })
  it("should be valid with a line of double-quoted string.", () => {
    const text = '"string-surrounded-by-double-quotations"'
    expect(parseQuotedString({ text, index: 0 })).toMatchObject({ node: { type: "quoted-string" } })
  })
  it("should be invalid with backtick quotations.", () => {
    const text = "`backtick-quoted region is invalid`"
    expect(parseQuotedString({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it.todo("should not contain any bare single quotes inside single quotations.", () => {
    const text = "'''"
    expect(parseQuotedString({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
  it.todo("should not contain any bare single quotes inside single quotations.", () => {
    const text = '"""'
    expect(parseQuotedString({ text, index: 0 })).toMatchObject({ node: { type: "invalid-syntax" } })
  })
})
