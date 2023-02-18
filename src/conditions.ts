
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
