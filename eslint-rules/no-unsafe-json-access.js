/**
 * ESLint rule to prevent unsafe JSON operations
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent unsafe JSON operations without proper error handling',
      category: 'Possible Errors',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      unsafeJsonParse: 'JSON.parse should be wrapped in try-catch or use a safe parsing utility',
      unsafeJsonAccess: 'Accessing JSON response without validation. Use type guards to validate structure first.',
      missingErrorHandling: 'JSON operation missing error handling for malformed data'
    }
  },

  create(context) {
    function isInTryCatch(node) {
      let parent = node.parent;
      while (parent) {
        if (parent.type === 'TryStatement') {
          return true;
        }
        parent = parent.parent;
      }
      return false;
    }

    function hasErrorHandling(node) {
      // Check if the call is part of a conditional or has .catch()
      let parent = node.parent;
      while (parent) {
        if (parent.type === 'ConditionalExpression' ||
            parent.type === 'LogicalExpression' ||
            parent.type === 'IfStatement' ||
            (parent.type === 'CallExpression' && 
             parent.callee.type === 'MemberExpression' &&
             parent.callee.property.name === 'catch')) {
          return true;
        }
        parent = parent.parent;
      }
      return false;
    }

    return {
      // Detect JSON.parse without error handling
      CallExpression(node) {
        if (node.callee.type === 'MemberExpression' &&
            node.callee.object.name === 'JSON' &&
            node.callee.property.name === 'parse') {
          
          if (!isInTryCatch(node) && !hasErrorHandling(node)) {
            context.report({
              node,
              messageId: 'unsafeJsonParse'
            });
          }
        }

        // Detect .json() calls on responses without error handling
        if (node.callee.type === 'MemberExpression' &&
            node.callee.property.name === 'json') {
          
          const sourceCode = context.getSourceCode();
          const objectText = sourceCode.getText(node.callee.object);
          
          if (objectText.includes('response') || objectText.includes('fetch')) {
            if (!isInTryCatch(node) && !hasErrorHandling(node)) {
              context.report({
                node,
                messageId: 'unsafeJsonAccess'
              });
            }
          }
        }
      },

      // Detect await expressions with JSON operations
      AwaitExpression(node) {
        if (node.argument.type === 'CallExpression') {
          const sourceCode = context.getSourceCode();
          const callText = sourceCode.getText(node.argument);
          
          if (callText.includes('.json()') || callText.includes('JSON.parse')) {
            if (!isInTryCatch(node)) {
              context.report({
                node,
                messageId: 'missingErrorHandling'
              });
            }
          }
        }
      }
    };
  }
};
