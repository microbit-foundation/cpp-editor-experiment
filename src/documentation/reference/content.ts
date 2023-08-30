/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Toolkit, ToolkitTopic, ToolkitTopicEntry } from "./model";

export const fetchReferenceToolkit = async (
  languageId: string
): Promise<Toolkit> => {
  console.log("fetch Toolkit");

  const response = await fetch("reference.json");
  if (response.ok) {
    const { result } = await response.json();
    if (!result) {
      throw new Error("Unexpected response format");
    }
    const content = adaptContent(result);

    if (!content) throw new Error("Result is not a toolkit");

    console.log("Toolkit ok");
    return content;
  }
  throw new Error("Error fetching content: " + response.status);
}

export const getTopicAndEntry = (
  toolkit: Toolkit,
  topicOrEntryId: string | undefined
): [ToolkitTopic | undefined, ToolkitTopicEntry | undefined] => {
  const topic = toolkit.contents?.find(
    (t) => t.slug.current === topicOrEntryId
  );
  if (topic) {
    return [topic, undefined];
  }
  const entry = toolkit.contents
    ?.flatMap((topic) => topic.contents ?? [])
    .find((entry) => entry.slug.current === topicOrEntryId);
  if (!entry) {
    return [undefined, undefined];
  }
  return [entry.parent, entry];
};

const adaptContent = (result: any): Toolkit | undefined => {

  //parse md content into Toolkit format
  const toolkit = parseToolkit(result);
  if (!toolkit) return undefined;

  // const toolkits = result as Toolkit[];
  // if (toolkits.length === 0) {
  //   return undefined;
  // }
  // if (toolkits.length > 1) {
  //   throw new Error("Unexpected results");
  // }
  // Add topic entry parent for toolkit navigation.
  // const toolkit = toolkits[0];
  toolkit.contents?.forEach((topic) => {
    topic.contents?.forEach((entry) => {
      entry.parent = topic;
    });
  });
  return toolkit;
};

const parseToolkit = (result: any): Toolkit | undefined => {
  
  const topicsMarkdown = Object.values(result);
  const topics = topicsMarkdown.map((md) => parseTopicMarkdown(md as string))
  
  const toolkit: Toolkit = {
    id: "reference",
    name: "reference",
    description: "reference section",
    language: "en",
    contents: [
      ...topics
    ]
  }

  return toolkit;
}

const parseTopicMarkdown = (topicMarkdown: string) : ToolkitTopic => {
  const topic: any = {};
  let md = topicMarkdown;
  let slug = "unknown";

  //check for any front matter with metadata
  if (topicMarkdown.startsWith("---")) {
    const sections = topicMarkdown.split("---");
    const frontMatter = sections[1].trim().replace("\n", ",");
    const formattedFrontMatter = `{${frontMatter.replace(/(\w+):/g, '"$1":')}}`;

    try {
      const frontMatterJSON = JSON.parse(formattedFrontMatter);
      
      if (frontMatterJSON.slug) {
        slug = frontMatterJSON.slug;
        topic.slug = {
          _type: "slug",
          current: slug,
        }
      }

      topic.keywordBlacklist = frontMatterJSON.keywordBlacklist;
      
    } catch (e) { 
      console.warn("Front matter ignored")
      console.error(e); 
      console.error(formattedFrontMatter)
    }

    md = sections[2];
  }

  const parts = md.split("\r\n").filter((part) => part !== "");
  let part: string | undefined = parts.shift();

  while(part !== undefined) {
    if (!topic.name && part.startsWith("# ")) {
      topic.name = part.slice(2);
    }
    else if (!topic.subtitle && part.startsWith("## ")) {
      topic.subtitle = part.slice(3);
    }

    if (topic.subtitle && topic.name) break;
    
    part = parts.shift();
  }

  if (!topic.slug) {
    slug = topic.name.toLowerCase();
    topic.slug = {
      _type: "slug",
      current: slug,
    }
  }

  const firstEntryIndex = parts.findIndex((part) => part.startsWith("### "));
  topic.mdIntroduction = {
    _type: "block",
    content: firstEntryIndex === -1 ? parts.join("\n") : parts.slice(0, firstEntryIndex).join("\n"),
  }

  if (firstEntryIndex !== -1) {
    const entries = parts.slice(firstEntryIndex).join("\n").split("### ").filter((entry) => entry !== "");
    
    topic.contents = entries.map((entry) => {
      const entryParts = entry.split("\n");
      const entryName = entryParts.shift(); 
      const sections = entryParts.join("\n").split("```");

      const toolkitEntry = { 
        name: entryName,
        slug:{ _type:"slug", current:`${slug}-${entryName?.toLowerCase().replaceAll(" ", "-")}`},
        mdContent: [
          {_type:"block", content: sections[0]},
          sections.length > 1 && {_type:"code", content: sections[1]},
        ],
        mdDetailContent: sections.length > 2 ? [
          {_type:"block", content: sections[2]},
        ] : undefined,
      }
    
      return toolkitEntry;
    })
  }

  return topic as ToolkitTopic;
}
