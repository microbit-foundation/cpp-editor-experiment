/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  CompletionItem,
  CompletionItemKind,
  CompletionTriggerKind,
  HoverRequest,
  ProtocolRequestType,
} from "vscode-languageserver-protocol";
import { Hover, MarkupContent, MarkupKind } from "vscode-languageserver-types";
import { LanguageServerClient, createUri } from "./client";

// This duplicates the types we added to Pyright.

export interface ApiDocsParams {
  modules: string[];
  path: string;
  documentationFormat?: MarkupKind[];
}

export interface ApiDocsBaseClass {
  name: string;
  fullName: string;
}

export type ApiDocsFunctionParameterCategory =
  | "simple"
  | "varargList"
  | "varargDict";

export interface ApiDocsFunctionParameter {
  name: string;
  category: ApiDocsFunctionParameterCategory;
  defaultValue?: string;
}

export interface ApiDocsEntry {
  id: string;
  name: string;
  docString?: string;
  fullName: string;
  type?: string;
  kind: "function" | "module" | "class" | "variable";
  children?: ApiDocsEntry[];
  baseClasses?: ApiDocsBaseClass[];
  params?: ApiDocsFunctionParameter[];
}

export interface ApiDocsResponse extends Record<string, ApiDocsEntry> {}

export const apiDocsRequestType = new ProtocolRequestType<
  ApiDocsParams,
  ApiDocsResponse,
  never,
  void,
  void
>("pyright/apidocs");

export const apiDocs = (
  client: LanguageServerClient
): Promise<ApiDocsResponse> => {
  return requestAPI(client, "MicroBit");

  // // This is a non-standard LSP call that we've added support for to Pyright.
  // return client.connection.sendRequest(apiDocsRequestType, {
  //   path: client.rootUri,
  //   documentationFormat: [MarkupKind.Markdown],
  //   modules: [
  //     // For now, this omits a lot of modules that have stubs
  //     // derived from typeshed with no docs.
  //     // Note: "audio" is covered under micro:bit.
  //     "gc",
  //     "log",
  //     "machine",
  //     "math",
  //     "microbit",
  //     "micropython",
  //     "music",
  //     "neopixel",
  //     "os",
  //     "power",
  //     "radio",
  //     "random",
  //     "speech",
  //     "struct",
  //     "sys",
  //     "time",
  //   ],
  // });
};

const uri = createUri("temp.cpp");
const text = `#include "MicroBit.h"

MicroBit uBit;
  
int main() {
    uBit.
}`;

const requestAPI = async (
  client: LanguageServerClient,
  classname: string
): Promise<ApiDocsResponse> => {
  const apiDocs: ApiDocsResponse = {};
  apiDocs["MicroBit"] = {
    id: "MicroBit",
    name: "MicroBit",
    // docString: "MicroBit",
    fullName: "MicroBit",
    type: "MicroBit",
    kind: "class",
    // children?: ApiDocsEntry[];
    // baseClasses?: ApiDocsBaseClass[];
    // params?: ApiDocsFunctionParameter[];
  };

  console.log(`[API] MicroBit`);

  // hacky for now. Need to wait for LSP to be ready to go before sending this request. Waits 5 seconds
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Open a virtual document with the class declared
  client.didOpenTextDocument({
    textDocument: {
      languageId: "c++",
      text,
      uri,
    },
  });

  //wait after doc opens - want to change this ideally but lsp needs time to include headers etc.
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Get completions for the class
  // TODO: write a wrapper around this that filters for only whitelisted symbols. Replace all versions of this call
  const results = await client.completionRequest({
    textDocument: {
      uri,
    },
    position: {
      line: 5,
      character: 9,
    },
    context: {
      triggerKind: CompletionTriggerKind.TriggerCharacter,
      triggerCharacter: ".",
    },
  });

  const items = results.items;

  let children: ApiDocsEntry[] = [];
  // Request docs for each item
  for (let i in items) {
    const name = items[i].insertText || items[i].label;

    console.log(`[API] MicroBit -> ${name}`);
    const docsInfo: Hover = await requestMemberDocs(client, items[i]);

    children.push({
      id: name,
      name: name,
      fullName: `MicroBit.${name}`,
      docString: docsInfo.contents
        ? resolveDocsToString(docsInfo.contents)
        : "",
      kind:
        items[i].kind === CompletionItemKind.Method ? "function" : "variable",
    });
  }

  apiDocs["MicroBit"].children = children;

  //close virtual doc
  client.didCloseTextDocument({
    textDocument: {
      uri,
    },
  });

  console.log(`[API] API Request Complete`);
  return apiDocs;
};

const requestMemberDocs = async (
  client: LanguageServerClient,
  item: CompletionItem
) => {
  client.didChangeTextDocument(uri, [
    {
      text: `#include "MicroBit.h"

MicroBit uBit;
        
int main() {
    uBit.${item.insertText}${
        item.kind === CompletionItemKind.Method ? "()" : ""
      };
}`,
    },
  ]);

  // await new Promise((resolve) => setTimeout(resolve, 1000));

  const response: Hover = await client.connection.sendRequest(
    HoverRequest.method,
    {
      textDocument: {
        uri,
      },
      position: {
        line: 5,
        character: 11,
      },
    }
  );

  return response;
};

const resolveDocsToString = (docs: any): string => {
  if (typeof docs === typeof MarkupContent) {
    const markup: MarkupContent = docs as MarkupContent;
    return markup.value;
  } else {
    return docs;
  }
};
