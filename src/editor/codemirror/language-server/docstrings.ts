/**
 * This file is also used by the worker so should have no dependencies.
 */

export interface DocSectionsSplit {
  summary: string;
  example?: string;
  return?: string;
  params: string[];
  remainder? : string;
}

// possibly want a more robust docs parser
export const splitDocString = (markup: string): DocSectionsSplit => {
  const parts = markup.split("@");

  let split : DocSectionsSplit = {
    summary: parts.shift()!,
    params: [],
  };

  let remainder : string[] = [];

  parts.forEach((part : string) => {
    if(part.startsWith("param"))
      split.params.push(part.slice(6).trim());  //remove 'param ' from start
    else if(part.startsWith("return"))
      split.return = part.slice(7).trim();      //remove 'return ' from start           
    else if(part.startsWith("code"))
      split.example = part.slice(4).trim();
    else if(part.startsWith("endcode")){}   // check for code between @code and @endcode in future?
    else
      remainder.push(part);
  });

  split.remainder = remainder.length > 0 ? remainder.join("\n\n") : undefined;
  return split;
}
