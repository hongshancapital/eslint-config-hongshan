/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    "./index",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["react"],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    // base
    "max-lines": ["error", { max: 490, skipComments: true }],
    "space-before-function-paren": "off",
    "arrow-parens": ["error", "always"],
    "no-throw-literal": "off",
    "import/order": [
      "error",
      {
        "newlines-between": "always",
        pathGroups: [
          {
            pattern: "*.{less,css,scss}",
            patternOptions: { matchBase: true },
            group: "sibling",
            position: "after",
          },
          {
            pattern: "@/**",
            group: "internal",
          },
        ],
        groups: [
          "builtin",
          "external",
          "type",
          "internal",
          ["parent", "sibling", "index"],
          "object",
        ],
      },
    ],
    "import/no-duplicates": "error",

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
    "react/jsx-no-bind": ["error", { allowArrowFunctions: true }],
    "react/jsx-curly-brace-presence": "error",
    "react/destructuring-assignment": "error",
    "react/no-deprecated": "error",
    // no need to include React after use new JSX transform
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/display-name': 'off',

    // typescript
    "@typescript-eslint/no-throw-literal": ["error"],
    "@typescript-eslint/no-inferrable-types": "error",
    "@typescript-eslint/adjacent-overload-signatures": "error",
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    "@typescript-eslint/no-unnecessary-condition": "error",
    "@typescript-eslint/method-signature-style": "error",
    "@typescript-eslint/no-for-in-array": "error",
    "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
  },
};
