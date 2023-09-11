import { Text } from "@chakra-ui/layout";
import MarkdownIt from "markdown-it";
import parse, {DOMNode, Element, HTMLReactParserOptions, domToReact} from 'html-react-parser';

import { ContextualCodeEmbed } from "./DocumentationContent";
import { Link } from "@chakra-ui/react";
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
}

const allKeywords: KeywordLinkMap = {  //placeholder
    "display":"display", 
    "infinite loop":"loops-while-true",
}

export const RenderedMarkdownContent = ({
    content,
    keywordBlacklist
}: RenderedMarkdownContentProps) => {
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
            // return <Link key={index} color="brand.600" href={href}>{part}</Link>
            return <InternalLink key={index} slug={href}>{part}</InternalLink>
        });

        return replacedParts;
    }

    const parseOptions: HTMLReactParserOptions = {
        replace: (node: DOMNode) => {
            if (node.type === "text") {
                return <>{addKeywordLinks((node as unknown as Text).data)}</>
            }

            const element = node as Element;
            if (!element) return node;

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
        
            return element;
        }
    }

    const renderContent = (markdown: string) => {
        const md = new MarkdownIt();
        const html =  md.render(markdown)

        return parse(html, parseOptions);
    }
    
    return (
        <>
            {content.map((content, i)=> {
                switch(content._type) {
                    case "block": return <div key={i}>{renderContent(content.content)}</div>;
                    case "code": return <ContextualCodeEmbed key={i} code={content.content} />;
                    default: console.warn("No rendering rule for markdown content type " + content._type);
                }
            })}
        </>
    );
}
