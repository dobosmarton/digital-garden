import { defineNestedType } from "contentlayer2/source-files";

export const Author = defineNestedType(() => ({
  name: "Author",
  fields: {
    name: { type: "string", required: true },
    image: { type: "string" },
  },
}));
