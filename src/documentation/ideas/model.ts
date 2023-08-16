/**
 * (c) 2021-2022, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { SanityContent, Slug } from "../../common/sanity";
import { HasCompatibility } from "../common/model";

export interface Idea extends HasCompatibility {
  _id: string;
  name: string;
  sanityContent?: SanityContent;
  simpleContent?: SimpleIdeaContent,
  language: string;
  slug: Slug;
}

/**
 * Wrapper around simple content format, rendering markdown
 */
export interface SimpleIdeaContent {
  //image
  code:string,
  markdownContent?:string,
}
