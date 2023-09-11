import { Stack, Text } from "@chakra-ui/layout";
import MarkdownIt from "markdown-it";
import parse, {DOMNode, Element, HTMLReactParserOptions, domToReact} from 'html-react-parser';

import { ContextualCodeEmbed, ContextualCollapseReactNode, DocumentationCollapseMode } from "./DocumentationContent";
import { Collapse, Link } from "@chakra-ui/react";
import { MarkdownContent } from "./model";
import { useRouterState } from "../../router-hooks";
import { ReactNode } from "react";

interface KeywordLinkMap {
    [key: string]: string;
}

interface InternalLinkProps {
    slug: string,
    children: ReactNode
}

const InternalLink = ({slug, children}:InternalLinkProps) => {
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
}

interface RenderedMarkdownContentProps {
    content: MarkdownContent[],
    keywordBlacklist?: string[],
    collapseMode?: DocumentationCollapseMode
}

const allKeywords: KeywordLinkMap = {  //placeholder
    "display":"display", 
    "infinite loop":"loops-while-true",
}

export const RenderedMarkdownContent = ({
    content,
    keywordBlacklist,
    collapseMode = DocumentationCollapseMode.ShowAll,
}: RenderedMarkdownContentProps) => {
    const collapseNode = 
        collapseMode === DocumentationCollapseMode.ExpandCollapseExceptCode ||
        collapseMode === DocumentationCollapseMode.ExpandCollapseExceptCodeAndFirstLine;
    
    //initialise this to true if we are keeping the first line
    let isFirstLine = collapseMode === DocumentationCollapseMode.ExpandCollapseExceptCodeAndFirstLine;

    let keywords: KeywordLinkMap = {}
    if (keywordBlacklist) { 
        for(const keyword in allKeywords) {
            if(!keywordBlacklist.includes(keyword)) keywords[keyword] = allKeywords[keyword];
        }
    } else {
        keywords = {...allKeywords};
    }
    
    const addKeywordLinks = (text: string) => {
        const keys = Object.keys(keywords);
        const keywordRegex = new RegExp(`(${keys.join('|')})`, "g");

        const parts = text.split(keywordRegex);
        const replacedParts = parts.map((part, index) => {
            const href = keywords[part];
            if (!href) return <span key={index}>{part}</span>;
            return <InternalLink key={index} slug={href}>{part}</InternalLink>
        });

        return replacedParts;
    }

    const elementIsCode = (element: Element) => {
        if(!element) return false;
        if (element.name === "pre") {
            const child = (element.childNodes[0] as Element)
            return child.name === "code"
        }

        return false;
    }  

    const replaceNode = (node: DOMNode): JSX.Element => {
        const element = node as Element;
        if (element) {
            if (/^h\d/.test(element.name)) {
                //h1 should not be used as this would represent a section header
                if (element.name === "h1") return (<></>);

                // For the moment we only support displaying as a h3.
                return (
                    <Text fontSize="lg" fontWeight="semibold">
                        {domToReact(element.children)}
                    </Text>
                );
            }

            if (element.name === "pre") {
                const child = (element.childNodes[0] as Element)
                if (child.name === "code") {
                    return <ContextualCodeEmbed code={(child.childNodes[0] as unknown as Text).data} />
                }
            }
        }

        //nothing to replace, but we still want to convert the DOMNode to react JSX.Element 
        return <>{domToReact([node])}</>;
    }
     
    const parseOptions: HTMLReactParserOptions = {
        replace: (node: DOMNode) => {
            if (node.type === "text") {
                return <>{addKeywordLinks((node as unknown as Text).data)}</>
            }

            const jsx = replaceNode(node);
            const isLine = true; //might not be necessary, but unsure whether all elements will be lines (i.e. some may be structural elements)
            const isCode = elementIsCode(node as Element)

            const collapseToFirstLine = isFirstLine && isLine;
            if (isLine) isFirstLine = false;
            return wrapWithCollapseNode(
                collapseNode && !isCode,
                collapseToFirstLine,
                jsx,
            )
        }
    }

    const renderContent = (markdown: string) => {
        const md = new MarkdownIt();
        const html =  md.render(markdown)

        return parse(html, parseOptions);
    }

    const wrapWithCollapseNode = (condition: boolean, firstLine: boolean, node: JSX.Element): JSX.Element => {
        return condition
            ? <ContextualCollapseReactNode collapseToFirstLine={firstLine}>{node}</ContextualCollapseReactNode>
            : node
    }

    const contentNode = 
        <Stack spacing={3} mt={3}>
            {content.map((content, i) => {
            switch(content._type) {
                case "block": 
                    const blockNode = <div key={i}>{renderContent(content.content)}</div>;
                    return collapseMode === DocumentationCollapseMode.ExpandCollapseAll
                        ?  <ContextualCollapseReactNode key={i} collapseToFirstLine={false}>{blockNode}</ContextualCollapseReactNode>
                        : blockNode;
                case "code":
                    return <ContextualCodeEmbed key={i} code={content.content} />;
                default: console.warn("No rendering rule for markdown content type " + content._type);
            }
            })} 
        </Stack>

    return contentNode;
}
