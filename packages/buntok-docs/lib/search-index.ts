import MiniSearch from "minisearch";
import { DOC_ROUTES } from "./doc-routes";

export interface SearchResult {
  id: string;
  title: string;
  section: string;
  href: string;
  snippet: string;
}

let searchIndex: MiniSearch | null = null;

function getSearchIndex(): MiniSearch {
  if (searchIndex) return searchIndex;

  searchIndex = new MiniSearch({
    fields: ["title", "section", "snippet"],
    storeFields: ["title", "section", "href", "snippet"],
    searchOptions: {
      boost: { title: 3, section: 2 },
      fuzzy: 0.2,
      prefix: true,
    },
  });

  const docs = DOC_ROUTES.map((route) => ({
    id: route.href,
    title: route.title,
    section: route.section,
    href: route.href,
    snippet: route.description,
  }));

  searchIndex.addAll(docs);
  return searchIndex;
}

export function searchDocs(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const index = getSearchIndex();
  return index.search(query).slice(0, 8).map((r) => ({
    id: r.id,
    title: r.title,
    section: r.section,
    href: r.href,
    snippet: r.snippet,
  }));
}
