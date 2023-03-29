import type { Node as _Node } from "unist"

export class InvalidSyntax implements _Node {
  type = "invalid-syntax"
  raw: string
  constructor (text: string, index: number) {
    this.raw = text.slice(index)
  }
}

export class FailingParsing implements _Node {
  type = "failing-parsing"
  raw: string
  constructor (text: string, index: number) {
    this.raw = text.slice(index)
  }
}

export interface Node extends _Node { type: string, raw: string, [index: string]: any }

export interface ContextToParse { text: string, index: number }

export interface ContextToBeParsed { node: Node, index: number }
