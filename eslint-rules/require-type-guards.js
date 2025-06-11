/**
 * ESLint rule to require type guards when accessing external data
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require type guards for external data validation',
      category: 'Best Practices',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      missingTypeGuard: 'External data from "{{source}}" should be validated with a type guard before use.',
      missingValidation: 'Variable "{{variable}}" from external source needs validation before property access.'
    }
  },

  create(context) {
    const externalDataSources = [
      'request.json',
      'response.json',
      'JSON.parse',
      'session.metadata',
      'body.data',
      'await request.json',
      '.json()',
      'req.body',
      'params.'
    ];

    const typeGuardPatterns = [
      /\bis[A-Z]\w*\s*\(/,  // isValidSomething()
      /\bvalidate\w*\s*\(/,  // validate()
      /\bcheck\w*\s*\(/,     // check()
      /\btypeof\s+\w+\s*===/, // typeof checks
      /\binstanceof\s+/,     // instanceof checks
      /\bArray\.isArray\s*\(/, // Array.isArray()
      /\w+\s*&&\s*typeof\s+\w+/, // x && typeof x
      /\w+\s*\?\s*\w+\./, // optional chaining with validation
    ];

    function containsTypeGuard(text) {
      return typeGuardPatterns.some(pattern => pattern.test(text));
    }

    function getNextStatements(node, count = 3) {
      const sourceCode = context.getSourceCode();
      const parent = context.getAncestors().find(ancestor => 
        ancestor.type === 'BlockStatement' || 
        ancestor.type === 'Program'
      );
      
      if (!parent || !parent.body) return '';
      
      const nodeIndex = parent.body.findIndex(stmt => {
        return sourceCode.getRange(stmt)[0] >= sourceCode.getRange(node)[0];
      });
      
      if (nodeIndex === -1) return '';
      
      const nextStatements = parent.body.slice(nodeIndex, nodeIndex + count);
      return nextStatements.map(stmt => sourceCode.getText(stmt)).join('\n');
    }

    return {
      // Check await expressions for external data
      AwaitExpression(node) {
        if (node.argument.type === 'CallExpression') {
          const sourceCode = context.getSourceCode();
          const callText = sourceCode.getText(node.argument);
          
          const isExternalData = externalDataSources.some(source => 
            callText.includes(source.replace('await ', ''))
          );
          
          if (isExternalData) {
            const nextCode = getNextStatements(node);
            
            if (!containsTypeGuard(nextCode)) {
              context.report({
                node,
                messageId: 'missingTypeGuard',
                data: { source: callText }
              });
            }
          }
        }
      },

      // Check variable declarations for external data assignment
      VariableDeclarator(node) {
        if (node.init && node.id.type === 'Identifier') {
          const sourceCode = context.getSourceCode();
          const initText = sourceCode.getText(node.init);
          
          const isExternalData = externalDataSources.some(source => 
            initText.includes(source)
          );
          
          if (isExternalData) {
            const nextCode = getNextStatements(node);
            
            if (!containsTypeGuard(nextCode)) {
              context.report({
                node,
                messageId: 'missingValidation',
                data: { variable: node.id.name }
              });
            }
          }
        }
      },

      // Check member expressions on potentially unvalidated objects
      MemberExpression(node) {
        if (node.object.type === 'Identifier') {
          const varName = node.object.name;
          
          // Look for the variable declaration
          const scope = context.getScope();
          const variable = scope.set.get(varName) || 
            scope.upper?.set.get(varName);
          
          if (variable && variable.defs.length > 0) {
            const def = variable.defs[0];
            if (def.node.type === 'VariableDeclarator' && def.node.init) {
              const sourceCode = context.getSourceCode();
              const initText = sourceCode.getText(def.node.init);
              
              const isFromExternalSource = externalDataSources.some(source => 
                initText.includes(source)
              );
              
              if (isFromExternalSource) {
                // Check if there's validation between declaration and usage
                const declarationEnd = def.node.range[1];
                const usageStart = node.range[0];
                const betweenText = sourceCode.getText().substring(declarationEnd, usageStart);
                
                if (!containsTypeGuard(betweenText)) {
                  context.report({
                    node,
                    messageId: 'missingValidation',
                    data: { variable: varName }
                  });
                }
              }
            }
          }
        }
      }
    };
  }
};
