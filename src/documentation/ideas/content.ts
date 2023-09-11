/**
 * (c) 2021-2022, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { fetchContent } from "../../common/sanity";
import { Idea } from "./model";

export const fetchIdeas = async (languageId: string): Promise<Idea[]> => {
  const response = await fetch("examples.json");
  if (response.ok) {
    const { result } = await response.json();
    if (!result) {
      throw new Error("Unexpected response format");
    }
    const content = adaptContent(result)
    return content || [];
  }
  throw new Error("Error fetching content: " + response.status);
}
  // => fetchContent(languageId, ideasQuery, adaptContent);

const ideasQuery = (languageId: string): string => {
  return `
    *[_type == "pythonIdeasConfig" && language == "${languageId}" && !(_id in path("drafts.**"))][0]{
      pythonIdeasOrder[]->{
        _id, name, language, compatibility, image, slug,
        content[] {
          ...,
          markDefs[]{
            ...,
            _type == "toolkitInternalLink" => {
                "slug": @.reference->slug,
                "targetType": @.reference->_type
            }
          }
        },
      }
    }`;
};

const adaptContent = (result: any): Idea[] | undefined => {
  const ideas = result as Idea[];
  if (!ideas) {
    return undefined;
  }
  if (ideas.length === 0) {
    return undefined;
  }
  return ideas;
};
