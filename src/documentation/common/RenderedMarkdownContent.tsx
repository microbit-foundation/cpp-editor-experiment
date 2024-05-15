import { Stack, Text } from "@chakra-ui/layout";
import parse, {
  DOMNode,
  Element,
  HTMLReactParserOptions,
  domToReact,
} from "html-react-parser";
import MarkdownIt from "markdown-it";

import { Link } from "@chakra-ui/react";
import { ReactNode } from "react";
import { useRouterState } from "../../router-hooks";
import {
  ContextualCodeEmbed,
  ContextualCollapseReactNode,
  DocumentationCollapseMode,
} from "./DocumentationContent";
import { MarkdownContent } from "./model";

interface KeywordLinkMap {
  [key: string]: string;
}

interface InternalLinkProps {
  slug: string;
  children: ReactNode;
}

const InternalLink = ({ slug, children }: InternalLinkProps) => {
  const [state, setState] = useRouterState();
  return (
    <Link
      color="brand.600"
      onClick={(e) => {
        e.preventDefault();
        setState(
          {
            ...state,
            tab: "reference",
            slug: {
              id: slug,
            },
          },
          "documentation-user"
        );
      }}
    >
      {children}
    </Link>
  );
};

interface RenderedMarkdownContentProps {
  content: MarkdownContent[];
  keywordBlacklist?: string[];
  collapseMode?: DocumentationCollapseMode;
}

const allKeywords: KeywordLinkMap = {
  //placeholder
  display: "display",
  "infinite loop": "loops-while-true",
};

export const RenderedMarkdownContent = ({
  content,
  keywordBlacklist,
  collapseMode = DocumentationCollapseMode.ShowAll,
}: RenderedMarkdownContentProps) => {
  const collapseNode = collapseMode !== DocumentationCollapseMode.ShowAll;

  let keywords: KeywordLinkMap = {};
  if (keywordBlacklist) {
    for (const keyword in allKeywords) {
      if (!keywordBlacklist.includes(keyword))
        keywords[keyword] = allKeywords[keyword];
    }
  } else {
    keywords = { ...allKeywords };
  }

  const addKeywordLinks = (text: string) => {
    const keys = Object.keys(keywords);
    const keywordRegex = new RegExp(`(${keys.join("|")})`, "g");

    const parts = text.split(keywordRegex);
    const replacedParts = parts.map((part, index) => {
      const href = keywords[part];
      if (!href) return <span key={index}>{part}</span>;
      return (
        <InternalLink key={index} slug={href}>
          {part}
        </InternalLink>
      );
    });

    return replacedParts;
  };

  const parseOptions: HTMLReactParserOptions = {
    replace: (node: DOMNode) => {
      if (node.type === "text") {
        return <>{addKeywordLinks((node as unknown as Text).data)}</>;
      }

      const element = node as Element;
      if (element) {
        if (/^h\d/.test(element.name)) {
          //h1 should not be used as this would represent a section header
          if (element.name === "h1") return <></>;

          // For the moment we only support displaying as a h3.
          return (
            <Text fontSize="lg" fontWeight="semibold">
              {domToReact(element.children)}
            </Text>
          );
        }

        if (element.name === "pre") {
          const child = element.childNodes[0] as Element;
          if (child.name === "code") {
            return (
              <ContextualCodeEmbed
                code={(child.childNodes[0] as unknown as Text).data}
              />
            );
          }
        }
      }

      return node;
    },
  };

  const renderContent = (markdown: string) => {
    const md = new MarkdownIt();
    const html = md.render(markdown);

    return parse(html, parseOptions);
  };

  const renderContentWithCollapses = (markdown: string) => {
    if (collapseMode === DocumentationCollapseMode.ExpandCollapseAll) return;
    <ContextualCollapseReactNode collapseToFirstLine={false}>
      {renderContent(markdown)}
    </ContextualCollapseReactNode>;

    //otherwise split into blocks to wrap with collapses at appropriate points
    const codeBlockRegex = /(```)/g;
    const blocks = markdown.split(codeBlockRegex) || [];
    const nonEmptyBlocks = blocks.filter((block) => block.trim() !== "");
    const isCodeFirst = markdown.startsWith("```");

    const finalBlocks: string[] = [];
    let collectCode = isCodeFirst;
    for (let i = 0; i < nonEmptyBlocks.length; i++) {
      if (collectCode) {
        finalBlocks.push(nonEmptyBlocks.slice(i, i + 3).join(""));
        i += 2;
      } else finalBlocks.push(nonEmptyBlocks[i]);
      collectCode = !collectCode;
    }

    let isFirstLine = true;
    let isCode = !isCodeFirst;
    return finalBlocks.map((block, i) => {
      isCode = !isCode;
      const rendered = renderContent(block);

      if (isCode) return <div key={i}>{rendered}</div>;

      const collapseToFirstLine =
        isFirstLine &&
        collapseMode ===
          DocumentationCollapseMode.ExpandCollapseExceptCodeAndFirstLine;
      isFirstLine = false;

      return (
        <ContextualCollapseReactNode
          key={i}
          collapseToFirstLine={collapseToFirstLine}
        >
          {rendered}
        </ContextualCollapseReactNode>
      );
    });
  };

  const contentNode = (
    <Stack spacing={3} mt={3}>
      {content.map((content, i) => {
        switch (content._type) {
          case "block":
            return (
              <div key={i}>
                {collapseNode
                  ? renderContentWithCollapses(content.content)
                  : renderContent(content.content)}
              </div>
            );
          case "code":
            return <ContextualCodeEmbed key={i} code={content.content} />;
          default:
            console.warn(
              "No rendering rule for markdown content type " + content._type
            );
            return null;
        }
      })}
    </Stack>
  );

  return contentNode;
};
