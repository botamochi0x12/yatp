
export class InvalidSyntax {
  type = "invalid-syntax"
  raw: string
  constructor (text: string, index: number) {
    this.raw = text.slice(index)
  }
}

export class FailingParsing {
  type = "failing-parsing"
  raw: string
  constructor (text: string, index: number) {
    this.raw = text.slice(index)
  }
}

export interface Node { type: string, raw: string, [index: string]: any }

export interface ContextToParse { text: string, index: number }

export interface ContextToBeParsed { node: Node, index: number }
