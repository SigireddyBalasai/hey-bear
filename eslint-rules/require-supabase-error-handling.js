/**
 * ESLint rule to require proper error handling for Supabase operations
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require proper error handling for Supabase database operations',
      category: 'Possible Errors',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      missingErrorCheck: 'Supabase operation missing error check. Always check the "error" property before using "data".',
      unsafeDataAccess: 'Accessing Supabase "data" without checking "error" first. Use destructuring with error check.',
      missingNullCheck: 'Supabase data might be null. Check for null before accessing properties.'
    }
  },

  create(context) {
    const supabaseOperations = [
      'select', 'insert', 'update', 'delete', 'upsert', 
      'from', 'single', 'maybeSingle'
    ];

    function isSupabaseOperation(node) {
      if (node.type !== 'CallExpression' || 
          node.callee.type !== 'MemberExpression') {
        return false;
      }

      const methodName = node.callee.property.name;
      return supabaseOperations.includes(methodName);
    }

    function hasErrorHandling(variableName, scope) {
      // Look for error checking in the current scope
      const sourceCode = context.getSourceCode();
      const scopeNode = scope.block;
      const scopeText = sourceCode.getText(scopeNode);
      
      // Check for various error handling patterns
      const errorPatterns = [
        new RegExp(`if\\s*\\(\\s*${variableName}\\.error`),
        new RegExp(`${variableName}\\.error\\s*&&`),
        new RegExp(`!\\s*${variableName}\\.error`),
        new RegExp(`${variableName}\\.error\\s*\\?`),
        new RegExp(`const\\s*{\\s*data\\s*,\\s*error\\s*}\\s*=\\s*${variableName}`),
        new RegExp(`const\\s*{\\s*error\\s*,\\s*data\\s*}\\s*=\\s*${variableName}`)
      ];
      
      return errorPatterns.some(pattern => pattern.test(scopeText));
    }

    return {
      // Check variable declarations with Supabase operations
      VariableDeclarator(node) {
        if (node.init && node.id.type === 'Identifier') {
          let hasSupabaseOp = false;
          
          // Check if the initializer contains Supabase operations
          function checkNode(n) {
            if (isSupabaseOperation(n)) {
              hasSupabaseOp = true;
              return;
            }
            
            // Traverse child nodes
            for (const key in n) {
              if (n[key] && typeof n[key] === 'object') {
                if (Array.isArray(n[key])) {
                  n[key].forEach(checkNode);
                } else if (n[key].type) {
                  checkNode(n[key]);
                }
              }
            }
          }
          
          checkNode(node.init);
          
          if (hasSupabaseOp) {
            const varName = node.id.name;
            const scope = context.getScope();
            
            if (!hasErrorHandling(varName, scope)) {
              context.report({
                node,
                messageId: 'missingErrorCheck'
              });
            }
          }
        }
      },

      // Check member access on Supabase results
      MemberExpression(node) {
        if (node.property.name === 'data' && 
            node.object.type === 'Identifier') {
          
          const varName = node.object.name;
          const scope = context.getScope();
          
          // Check if this variable might be from a Supabase operation
          const variable = scope.set.get(varName);
          if (variable && variable.defs.length > 0) {
            const def = variable.defs[0];
            if (def.node.type === 'VariableDeclarator' && def.node.init) {
              const sourceCode = context.getSourceCode();
              const initText = sourceCode.getText(def.node.init);
              
              // Check if it's a Supabase operation
              const hasSupabaseCall = supabaseOperations.some(op => 
                initText.includes(`.${op}(`)
              );
              
              if (hasSupabaseCall && !hasErrorHandling(varName, scope)) {
                context.report({
                  node,
                  messageId: 'unsafeDataAccess'
                });
              }
            }
          }
        }
      },

      // Check destructuring of Supabase results
      ObjectPattern(node) {
        const hasDataProperty = node.properties.some(prop => 
          prop.type === 'Property' && 
          prop.key.name === 'data'
        );
        
        const hasErrorProperty = node.properties.some(prop => 
          prop.type === 'Property' && 
          prop.key.name === 'error'
        );
        
        if (hasDataProperty && !hasErrorProperty) {
          // Check if the destructured object is from a Supabase operation
          const parent = node.parent;
          if (parent.type === 'VariableDeclarator' && parent.init) {
            const sourceCode = context.getSourceCode();
            const initText = sourceCode.getText(parent.init);
            
            const hasSupabaseCall = supabaseOperations.some(op => 
              initText.includes(`.${op}(`)
            );
            
            if (hasSupabaseCall) {
              context.report({
                node,
                messageId: 'missingErrorCheck'
              });
            }
          }
        }
      }
    };
  }
};
