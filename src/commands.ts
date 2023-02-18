import { InvalidSyntaxError } from "./errors"
import { parseScenario } from "./parsers"
import type { Node } from "./conditions"

export const parse = (text: string): Node => {
  const context = parseScenario({ text, index: 0 })
  if (context.node.type === "failing-parsing") throw new InvalidSyntaxError()
  if (context.node.type === "invalid-syntax") throw new InvalidSyntaxError()
  return context.node
}
