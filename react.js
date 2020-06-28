module.exports = {
  extends: [
    "./index",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "@sequoiacapital/eslint-config-scc",
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    project: "./tsconfig.json",
  },
  plugins: ["react"],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    curly: "error",
    "spaced-comment": "error",
    "multiline-comment-style": "error",
    // React
    "react/jsx-closing-bracket-location": ["error", "line-aligned"],
    "react/self-closing-comp": "error",
    "react/jsx-wrap-multilines": "error",
    "react/jsx-pascal-case": "error",
    "react/jsx-tag-spacing": "error",
    "react/prop-types": "off",
    "react/jsx-sort-props": "error",
    "react/jsx-boolean-value": "error",
    "react/no-array-index-key": "error",
  },
};
