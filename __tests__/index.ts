import "jest"
import { parseLineComment, parseSingleLineTag, parseCharacterDeclaration, parseLabel, parseBlockComment, parseMultiLineTag, parseBareText, parseIdentifier } from './../src/parsers';
import { InvalidSyntaxError } from "../src/errors"

const EMPTY = { type: "empty", raw: "" }

describe("Minimal special symbols::", () => {
  it("should be valid for one line of line-comment with no content.", () => {
    const text = ";"
    const parsedText = parseLineComment({ text, index: 0 })
    expect(parsedText).toBeTruthy()
  })
  it("should be invalid for one line of block-comment with no content.", () => {
    const text = "/* */"
    // NOTE: Every closing block-comment pair (leading `*` and following `/`) needs to place alone inline.
    expect(parseBlockComment({ text, index: 0 })).toBeFalsy()
  })
  it("should be a monologue.", () => {
    const text = "#"
    expect(parseCharacterDeclaration({ text, index: 0 })).toEqual({ type: "monologue" })
  })
  it("should throw an error with the empty label.", () => {
    const text = "*"
    expect(() => parseLabel({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should throw an error with the empty single-line tag.", () => {
    const text = "@"
    expect(() => parseSingleLineTag({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should throw an error with the empty multi-line tag.", () => {
    const text = "[]"
    expect(() => parseMultiLineTag({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
})

describe("Simple single-lines::", () => {
  it("should be empty.", () => {
    const text = ""
    expect(parseSingleLineTag({ text, index: 0 })).toEqual(EMPTY)
  })
  it("should be a valid line of line-comment.", () => {
    const text = ";Line Comment"
    expect(parseLineComment({ text, index: 0 })).toBeTruthy()
  })
  it("should be invalid lines of block-comment.", () => {
    const text = "/* Block Comment */"
    expect(() => parseBlockComment({ text, index: 0 })).toThrowError(InvalidSyntaxError)
  })
  it("should be valid lines of block-comment.", () => {
    const text = `/*
        Block Comment
        */`
    // NOTE: Every closing block-comment pair (leading `*` and following `/`) needs to place alone inline.
    expect(parseLineComment({ text, index: 0 })).toBeTruthy()
  })
  it("should be a valid line of text.", () => {
    const text = "I'm a line of text."
    expect(parseLineComment({ text, index: 0 })).toBeTruthy()
  })
  it("should be a valid character declaration.", () => {
    const text = "#character-declaration"
    expect(parseLineComment({ text, index: 0 })).toBeTruthy()
  })
  it("should be a valid label.", () => {
    const text = "*label"
    expect(parseLineComment({ text, index: 0 })).toBeTruthy()
  })
  it("should be a valid single-line tag.", () => {
    const text = "@tag"
    expect(parseLineComment({ text, index: 0 })).toBeTruthy()
  })
  it("should be a valid line of a multi-line tag.", () => {
    const text = "[tag]"
    expect(parseLineComment({ text, index: 0 })).toBeTruthy()
  })
})

describe("Complex character declarations::", () => {
  it("should be invalid for nobody with no emotion.", () => {
    const text = "#:"
    expect(() => parseCharacterDeclaration({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should be valid for an emotion declaration.", () => {
    const text = "#Jane:Angry"
    const parsedText = parseCharacterDeclaration({ text, index: 0 })
    expect(parsedText).toBeTruthy()
    expect(parsedText).toEqual({ type: "character-declaration", name: "Jane", emotion: "Angry" })
  })
  it("should be invalid for a name with a trailing colon.", () => {
    const text = "#Jane:"
    expect(() => parseCharacterDeclaration({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should be invalid for an emotion declamation with a trailing colon.", () => {
    const text = "#Jane:Angry:"
    expect(() => parseCharacterDeclaration({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
})

describe("Complex labels::", () => {
  it("should be valid for a valid identifier.", () => {
    const text = "*_"
    expect(parseLabel({ text, index: 0 })).toBeTruthy()
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "*17" // NOTE: `17` is a prime number.
    expect(() => parseLabel({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "*-"
    expect(() => parseLabel({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should be valid for alternative text.", () => {
    const text = "*scene|extra"
    const parsedText = parseLabel({ text, index: 0 })
    expect(parsedText).toBeTruthy()
    expect(parsedText).toEqual({ type: "label-declaration", name: "scene", value: "extra" })
  })
  it("should be invalid for space-separated parts.", () => {
    const text = "*scene extra"
    expect(() => parseLabel({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should be invalid for a colon-separated label.", () => {
    const text = "*scene:extra"
    expect(() => parseLabel({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
})

describe("Complex single-line tags::", () => {
  it("should be valid for a valid identifier.", () => {
    const text = "@_"
    expect(parseSingleLineTag({ text, index: 0 })).toBeTruthy()
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "@17" // NOTE: `17` is a prime number.
    expect(() => parseSingleLineTag({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "@-"
    expect(() => parseSingleLineTag({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should be valid for space-separated parts.", () => {
    const text = "@tag switch"
    const parsedText = parseSingleLineTag({ text, index: 0 })
    expect(parsedText).toBeTruthy()
    expect(parsedText).toEqual({ type: "tag", parameters: ["switch"] })
  })
  it("should be valid for a KV pair.", () => {
    const text = "@tag key=value"
    const parsedText = parseSingleLineTag({ text, index: 0 })
    expect(parsedText).toBeTruthy()
    expect(parsedText).toEqual({ type: "tag", parameters: ["key=value"] })
  })
})

describe("Complex multi-line tags::", () => {
  it("should be valid for a valid identifier.", () => {
    const text = "[_]"
    expect(parseMultiLineTag({ text, index: 0 })).toBeTruthy()
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "[17]" // NOTE: `17` is a prime number.
    expect(() => parseMultiLineTag({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = "[-]"
    expect(() => parseMultiLineTag({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should be valid for space-separated parts.", () => {
    const text = "[tag switch]"
    const parsedText = parseMultiLineTag({ text, index: 0 })
    expect(parsedText).toBeTruthy()
    expect(parsedText).toEqual({ type: "tag", parameters: ["switch"] })
  })
  it("should be valid for a KV pair.", () => {
    const text = "[tag key=value]"
    const parsedText = parseMultiLineTag({ text, index: 0 })
    expect(parsedText).toBeTruthy()
    expect(parsedText).toEqual({ type: "tag", parameters: ["key=value"] })
  })
})

describe("Complex multi-line tags containing lines::", () => {
  it("should be invalid for an invalid identifier.", () => {
    const text = `[
            _
            ]`
    expect(parseMultiLineTag({ text, index: 0 })).toBeTruthy()
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = `[
            17
            ]` // NOTE: `17` is a prime number.
    expect(() => parseMultiLineTag({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should be invalid for an invalid identifier.", () => {
    const text = `[
            -
            ]`
    expect(() => parseMultiLineTag({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should be valid for space-separated parts.", () => {
    const text = `[
            tag
            switch
            ]`
    const parsedText = parseMultiLineTag({ text, index: 0 })
    expect(parsedText).toBeTruthy()
    expect(parsedText).toEqual({ type: "tag", parameters: ["switch"] })
  })
  it("should be valid for a KV pair.", () => {
    const text = `[
            tag
            key=value
        ]`
    const parsedText = parseMultiLineTag({ text, index: 0 })
    expect(parsedText).toBeTruthy()
    expect(parsedText).toEqual({ type: "tag", parameters: ["key=value"] })
  })
  it("should be invalid for a multi-line KV pair.", () => {
    const text = `[
            tag
            key
            =
            value
        ]`
    expect(() => parseMultiLineTag({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
})

describe("Simple text::", () => {
  it("should be valid.", () => {
    const text = "I'm a line of text."
    const parsedText = parseBareText({ text, index: 0 })
    expect(parsedText).toBeTruthy()
    expect(parsedText).toEqual({ type: "text", raw: "I'm a line of text." })
  })
  it("should trim leading spaces.", () => {
    const text = " I'm a line of text."
    const parsedText = parseBareText({ text, index: 0 })
    expect(parsedText).toBeTruthy()
    expect(parsedText).toEqual({ type: "text", raw: "I'm a line of text." })
    // NOTE: The leading space character is removed.
    // NOTE: See also: <https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String/trim>
  })
  it("should not trim leading spaces on starting with a underscore.", () => {
    const text = "_   I'm a line of text."
    const parsedText = parseBareText({ text, index: 0 })
    expect(parsedText).toBeTruthy()
    expect(parsedText).toEqual({ type: "text", raw: "   I'm a line of text." })
    // NOTE: The leading underscore is removed
    // NOTE: but any leading space characters just after the underscore is kept.
  })
})

describe("Identifiers::", () => {
  it("should start with an alphabet.", () => {
    const text = "a"
    expect(parseIdentifier({ text, index: 0 })).toBeTruthy()
  })
  it("should not start with a number.", () => {
    const text = "7"
    expect(() => parseIdentifier({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should not start with a hyphen.", () => {
    const text = "-identifier"
    expect(() => parseIdentifier({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should start with an underscore.", () => {
    const text = "_identifier"
    expect(parseIdentifier({ text, index: 0 })).toBeTruthy()
  })
  it("should not start with a number.", () => {
    const text = "0identifier"
    expect(() => parseIdentifier({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should not start with a dollar sign.", () => {
    const text = "$identifier"
    expect(() => parseIdentifier({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should not contain full-width characters.", () => {
    const text = "ＩＤＥＮＴＩＦＩＥＲ"
    expect(() => parseIdentifier({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should not contain a space.", () => {
    const text = "identifier identifier"
    expect(() => parseIdentifier({ text, index: 0 })).toThrow(InvalidSyntaxError)
  })
  it("should not contain a hyphen.", () => {
    const text = "identifier-identifier"
    expect(() => parseIdentifier({ text, index: 0 })).toThrow(InvalidSyntaxError)
    // NOTE: This is an invalid identifier in JavaScript.
  })
})
