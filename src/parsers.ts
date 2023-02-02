import { InvalidSyntaxError } from "./errors";

type Node = { type: string; raw: string; [key: string]: any };

type ContextToParse = { text: string; index: number };

type ContextToBeParsed = { node: Node; index: number };

class InvalidSyntax {
  type = "invalid-syntax";
  raw: string;
  constructor(text: string, index: number) {
    this.raw = text.slice(index);
  }
}

class FailingParsing {
  type = "failing-parsing";
  raw: string;
  constructor(text: string, index: number) {
    this.raw = text.slice(index);
  }
}

export const parse = (text: string) => {
  const context = parseScenario({ text, index: 0 });
  if (context.node.type === "failing-parsing") throw new InvalidSyntaxError();
  if (context.node.type === "invalid-syntax") throw new InvalidSyntaxError();
  return context.node;
};

export const parseScenario = ({
  text,
  index,
}: ContextToParse): ContextToBeParsed => {
  if (text.length === 0) return { node: { type: "empty", raw: "" }, index };
  let context: ContextToBeParsed;
  context = parseLineComment({ text, index });
  if (context.node.type === "line-comment") return context;
  context = parseBlockComment({ text, index });
  if (context.node.type === "block-comment") return context;
  context = parseMultiLineTag({ text, index });
  if (context.node.type === "multi-line-tag") return context;
  return { node: new InvalidSyntax(text, text.length), index: text.length };
};

export const parseScenarioLine = ({
  text,
  index,
}: ContextToParse): ContextToBeParsed => {
  let context: ContextToBeParsed;
  if (text.length === 0) return { node: { type: "empty", raw: "" }, index };
  context = parseLabel({ text, index });
  if (context.node.type === "label") return context;
  context = parseMonologue({ text, index });
  if (context.node.type === "monologue") return context;
  context = parseCharacterDeclaration({ text, index });
  if (context.node.type === "character-declaration") return context;
  context = parseOneLinerTag({ text, index });
  if (context.node.type === "one-liner-tag") return context;
  return { node: new InvalidSyntax(text, text.length), index: text.length };
};

export const parseCharacterDeclaration = ({
  text,
  index,
}: ContextToParse): ContextToBeParsed => {
  return { node: new FailingParsing(text, index), index };
};

export const parseMonologue = ({
  text,
  index,
}: ContextToParse): ContextToBeParsed => {
  return { node: new FailingParsing(text, index), index };
};

export const parseLabel = ({
  text,
  index,
}: ContextToParse): ContextToBeParsed => {
  return { node: new FailingParsing(text, index), index };
};

export const parseOneLinerTag = ({
  text,
  index,
}: ContextToParse): ContextToBeParsed => {
  return { node: new FailingParsing(text, index), index };
};

export const parseMultiLineTag = ({
  text,
  index,
}: ContextToParse): ContextToBeParsed => {
  return { node: new FailingParsing(text, index), index };
};

export const parseLineComment = ({
  text,
  index: prev,
}: ContextToParse): ContextToBeParsed => {
  const line = text.split(/\n/, 1)[0];
  let curr = line.search(";");
  if (curr === -1) return { node: new FailingParsing(text, curr), index: curr };
  curr;
  return {
    node: { type: "line-comment", raw: text.slice(curr, prev) },
    index: prev + curr,
  };
};

export const parseBlockComment = ({
  text,
  index,
}: ContextToParse): ContextToBeParsed => {
  return { node: new FailingParsing(text, index), index };
};
