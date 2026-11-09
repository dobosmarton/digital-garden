import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = [
  { ignores: [".next/**", ".contentlayer/**", "node_modules/**", "next-env.d.ts"] },
  ...nextCoreWebVitals,
  prettier,
];

export default eslintConfig;
