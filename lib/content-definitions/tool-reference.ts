import { defineNestedType } from "contentlayer2/source-files";

export const ToolReference = defineNestedType(() => ({
  name: "ToolReference",
  fields: {
    slug: { type: "string", required: true },
    note: { type: "string", required: false },
  },
}));
