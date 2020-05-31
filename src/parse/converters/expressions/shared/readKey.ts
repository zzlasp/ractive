import { StandardParser } from 'parse/_parse';
import { ValueTemplateItem } from 'parse/converters/expressions/expressionDefinitions';

import readNumberLiteral from '../primary/literal/readNumberLiteral';
import readStringLiteral from '../primary/literal/readStringLiteral';

import { name as namePattern } from './patterns';

const identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;

/**
 * can be any name, string literal, or number literal
 *
 * @see http://mathiasbynens.be/notes/javascript-properties
 */
export default function readKey(parser: StandardParser): string {
  let token: ValueTemplateItem | string;

  if ((token = readStringLiteral(parser))) {
    return identifier.test(token.v) ? token.v : '"' + token.v.replace(/"/g, '\\"') + '"';
  }

  if ((token = readNumberLiteral(parser))) {
    return token.v;
  }

  if ((token = parser.matchPattern(namePattern) as string)) {
    return token;
  }

  return null;
}
