/**
 * ESLint rule to prevent unsafe object property access without validation
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unsafe object property access without proper validation',
      category: 'Possible Errors',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      unsafeAccess: 'Unsafe access to "{{property}}" on "{{object}}". Use proper type guards or validation first.',
      unsafeBracketAccess: 'Unsafe bracket notation access on "{{object}}". Validate the object structure first.',
      unsafeOptionalChaining: 'Optional chaining on "{{object}}" without prior validation. Use type guards first.',
      unsafeTypeAssertion: 'Unsafe type assertion to "{{type}}". Use proper validation before casting.',
      jsonParseWithoutCatch: 'JSON.parse without try-catch. Use safe parsing with error handling.'
    }
  },

  create(context) {
    const unsafeObjectNames = [
      'body', 'data', 'metadata', 'session', 'payload', 'params', 
      'query', 'result', 'response', 'request', 'webhook'
    ];

    const typeGuardFunctions = [
      'isValid', 'validate', 'check', 'verify', 'ensure',
      'isObject', 'isString', 'isNumber', 'isBoolean', 'isArray'
    ];

    function isUnsafeObjectName(name) {
      if (!name || typeof name !== 'string') return false;
      return unsafeObjectNames.some(unsafe => 
        name.toLowerCase().includes(unsafe.toLowerCase())
      );
    }

    function hasRecentTypeGuard(node) {
      // Look for type guard usage in the preceding 20 lines
      const sourceCode = context.getSourceCode();
      const nodeStart = node.range[0];
      const text = sourceCode.getText();
      const precedingText = text.substring(Math.max(0, nodeStart - 1000), nodeStart);
      
      return typeGuardFunctions.some(guard => 
        new RegExp(`\\b${guard}\\w*\\s*\\(`).test(precedingText)
      );
    }

    function getBaseObject(node) {
      if (node.type === 'MemberExpression') {
        return getBaseObject(node.object);
      }
      return node;
    }

    return {
      // Detect unsafe property access
      MemberExpression(node) {
        if (node.object.type === 'Identifier' && isUnsafeObjectName(node.object.name)) {
          const propertyName = node.computed ? 
            (node.property.type === 'Literal' ? node.property.value : 'unknown') :
            node.property.name;

          if (!hasRecentTypeGuard(node)) {
            context.report({
              node,
              messageId: node.computed ? 'unsafeBracketAccess' : 'unsafeAccess',
              data: {
                object: node.object.name,
                property: propertyName
              }
            });
          }
        }
      },

      // Detect unsafe type assertions
      TSAsExpression(node) {
        const sourceCode = context.getSourceCode();
        const typeText = sourceCode.getText(node.typeAnnotation);
        
        // Check for assertions to 'any' or 'Record' without validation
        if (typeText.includes('any') || 
            (typeText.includes('Record') && !hasRecentTypeGuard(node))) {
          context.report({
            node,
            messageId: 'unsafeTypeAssertion',
            data: { type: typeText }
          });
        }
      },

      // Detect unsafe optional chaining
      ChainExpression(node) {
        if (node.expression.type === 'MemberExpression') {
          const baseObject = getBaseObject(node.expression);
          if (baseObject.type === 'Identifier' && 
              isUnsafeObjectName(baseObject.name) && 
              !hasRecentTypeGuard(node)) {
            context.report({
              node,
              messageId: 'unsafeOptionalChaining',
              data: { object: baseObject.name }
            });
          }
        }
      },

      // Detect JSON.parse without proper error handling
      CallExpression(node) {
        if (node.callee.type === 'MemberExpression' &&
            node.callee.object.name === 'JSON' &&
            node.callee.property.name === 'parse') {
          
          // Check if wrapped in try-catch
          let parent = node.parent;
          let inTryCatch = false;
          
          while (parent) {
            if (parent.type === 'TryStatement') {
              inTryCatch = true;
              break;
            }
            parent = parent.parent;
          }
          
          if (!inTryCatch) {
            context.report({
              node,
              messageId: 'jsonParseWithoutCatch'
            });
          }
        }
      }
    };
  }
};
