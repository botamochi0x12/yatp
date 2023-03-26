import "jest"
import { parseLineComment, parseSingleLineTag, parseCharacterDeclaration, parseLabel, parseBlockComment, parseMultiLineTag, parseBareText, parseIdentifier } from './../src/parsers';
import { InvalidSyntaxError } from "../src/errors"

const EMPTY = { type: "empty", raw: "" }

describe("Minimal special symbols::", () => {
  it("should be valid for one line of line-comment with no content.", () => {
    const text = ";"
    const parsedText = parseLineComment({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "line-comment" }})
  })
  it("should be invalid for one line of block-comment with no content.", () => {
    const text = "/* */"
    // NOTE: Every closing block-comment pair (leading `*` and following `/`) needs to place alone inline.
    expect(parseBlockComment({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should be a monologue.", () => {
    const text = "#"
    expect(parseCharacterDeclaration({ text, index: 0 })).toMatchObject({ node: { type: "monologue" } })
  })
  it("should throw an error with the empty label.", () => {
    const text = "*"
    expect(parseLabel({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should throw an error with the empty single-line tag.", () => {
    const text = "@"
    expect(parseSingleLineTag({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should throw an error with the empty multi-line tag.", () => {
    const text = "[]"
    expect(parseMultiLineTag({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
})

describe("Simple single-lines::", () => {
  it("should be empty.", () => {
    const text = ""
    expect(parseBareText({ text, index: 0 })).toMatchObject({ node: EMPTY })
  })
  it("should be a valid line of line-comment.", () => {
    const text = ";Line Comment"
    expect(parseLineComment({ text, index: 0 })).toMatchObject({ node: { type: "line-comment" } })
  })
  it("should be invalid lines of block-comment.", () => {
    const text = "/* Block Comment */"
    expect(parseBlockComment({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should be valid lines of block-comment.", () => {
    const text = `/*
        Block Comment
        */`
    // NOTE: Every closing block-comment pair (leading `*` and following `/`) needs to place alone inline.
    expect(parseBlockComment({ text, index: 0 })).toMatchObject({ node : { type: "block-comment" } })
  })
  it("should be a valid line of text.", () => {
    const text = "I'm a line of text."
    expect(parseBareText({ text, index: 0 })).toMatchObject({ node : { type: "bare-text" } })
  })
  it("should be a valid character declaration.", () => {
    const text = "#character-declaration"
    expect(parseCharacterDeclaration({ text, index: 0 })).toMatchObject({ node : { type: "character-declaration" } })
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
    expect(parseCharacterDeclaration({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should be valid for an emotion declaration.", () => {
    const text = "#Jane:Angry"
    const parsedText = parseCharacterDeclaration({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "character-declaration", name: "Jane", emotion: "Angry" } })
  })
  it("should be invalid for a name with a trailing colon.", () => {
    const text = "#Jane:"
    expect(parseCharacterDeclaration({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should be invalid for an emotion declamation with a trailing colon.", () => {
    const text = "#Jane:Angry:"
    expect(parseCharacterDeclaration({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
})

describe("Complex labels::", () => {
  it("should be valid for a valid identifier.", () => {
    const text = "*_"
    expect(parseLabel({ text, index: 0 })).toMatchObject({ node: { type: "label" } })
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "*17" // NOTE: `17` is a prime number.
    expect(parseLabel({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "*-"
    expect(parseLabel({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should be valid for alternative text.", () => {
    const text = "*scene|extra"
    const parsedText = parseLabel({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "label-declaration", name: "scene", value: "extra" } })
  })
  it("should be invalid for space-separated parts.", () => {
    const text = "*scene extra"
    expect(parseLabel({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should be invalid for a colon-separated label.", () => {
    const text = "*scene:extra"
    expect(parseLabel({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
})

describe("Complex single-line tags::", () => {
  it("should be valid for a valid identifier.", () => {
    const text = "@_"
    expect(parseSingleLineTag({ text, index: 0 })).toMatchObject({ node: { type: "single-line-tag" } })
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "@17" // NOTE: `17` is a prime number.
    expect(parseSingleLineTag({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "@-"
    expect(parseSingleLineTag({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should be valid for space-separated parts.", () => {
    const text = "@tag switch"
    const parsedText = parseSingleLineTag({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "single-line-tag", tag: "tag", parameters: ["switch"] } })
  })
  it("should be valid for a KV pair.", () => {
    const text = "@tag key=value"
    const parsedText = parseSingleLineTag({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "single-line-tag", tag: "tag", parameters: ["key=value"] } })
  })
})

describe("Complex multi-line tags::", () => {
  it("should be valid for a valid identifier.", () => {
    const text = "[_]"
    expect(parseMultiLineTag({ text, index: 0 })).toMatchObject({ node: { type: "multi-line-tag", tag: "_"}})
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "[17]" // NOTE: `17` is a prime number.
    expect(parseMultiLineTag({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "[-]"
    expect(parseMultiLineTag({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should be valid for space-separated parts.", () => {
    const text = "[tag switch]"
    const parsedText = parseMultiLineTag({ text, index: 0 })
    expect(parsedText).toBeTruthy()
    expect(parsedText).toMatchObject({ node: { type: "multi-line-tag", tag: "tag", parameters: ["switch"] } })
  })
  it("should be valid for a KV pair.", () => {
    const text = "[tag key=value]"
    const parsedText = parseMultiLineTag({ text, index: 0 })
    expect(parsedText).toBeTruthy()
    expect(parsedText).toMatchObject({ node: { type: "multi-line-tag", tag: "tag", parameters: ["key=value"] } })
  })
})

describe("Complex multi-line tags containing lines::", () => {
  it("should be valid for a valid identifier.", () => {
    const text = `[
            _
            ]`
    expect(parseMultiLineTag({ text, index: 0 })).toMatchObject({ node: {type: "multi-line-tag", tag: "_" }})
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = `[
            17
            ]` // NOTE: `17` is a prime number.
    expect(parseMultiLineTag({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = `[
            -
            ]`
    expect(parseMultiLineTag({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should be valid for space-separated parts.", () => {
    const text = `[
            tag
            switch
            ]`
    const parsedText = parseMultiLineTag({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "multi-line-tag", tag: "tag", parameters: ["switch"] } })
  })
  it("should be valid for a KV pair.", () => {
    const text = `[
            tag
            key=value
        ]`
    const parsedText = parseMultiLineTag({ text, index: 0 })
    expect(parsedText).toMatchObject({ node: { type: "multi-line-tag", tag: "tag", parameters: ["key=value"] } })
  })
  it("should be invalid for a multi-line KV pair.", () => {
    const text = `[
            tag
            key
            =
            value
        ]`
    expect(parseMultiLineTag({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
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
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "identifier", raw: text }})
  })
  it("should not start with a number.", () => {
    const text = "7"
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should not start with a hyphen.", () => {
    const text = "-identifier"
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("can start with an underscore.", () => {
    const text = "_identifier"
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "identifier", raw: text }})
  })
  it("should not start with a number.", () => {
    const text = "0identifier"
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should not start with a dollar sign.", () => {
    const text = "$identifier"
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should not contain full-width characters.", () => {
    const text = "ＩＤＥＮＴＩＦＩＥＲ"
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should not contain a space.", () => {
    const text = "identifier identifier"
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
  })
  it("should not contain a hyphen.", () => {
    const text = "identifier-identifier"
    expect(parseIdentifier({ text, index: 0 })).toMatchObject({ node: { type: "failing-parsing" } })
    // NOTE: This is an invalid identifier in JavaScript.
  })
})
