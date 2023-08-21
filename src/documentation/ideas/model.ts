/**
 * (c) 2021-2022, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { SanityContent, Slug } from "../../common/sanity";
import { HasCompatibility, MarkdownContent } from "../common/model";

export interface Idea extends HasCompatibility {
  _id: string;
  name: string;
  sanityContent?: SanityContent;
  markdownContent?: MarkdownContent[],
  language: string;
  slug: Slug;
}
