const WHITESPACE = /\s+/;

// Lower-cased, whitespace-separated search terms; compute once per query, not per item.
export const toSearchTerms = (query: string) => query.toLowerCase().split(WHITESPACE).filter(Boolean);

// True when `text` contains every term (case-insensitive). No terms matches everything.
export const includesAllTerms = (text: string, terms: string[]) => {
  const haystack = text.toLowerCase();
  return terms.every((term) => haystack.includes(term));
};
