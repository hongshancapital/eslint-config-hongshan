module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow using optional chaining with concat method",
      category: "Possible Errors",
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    return {
      'MemberExpression[optional=true][property.name="concat"]'(node) {
        context.report({
          node,
          message: "Optional chaining should not be used with array concat",
        });
      },
    };
  },
};
