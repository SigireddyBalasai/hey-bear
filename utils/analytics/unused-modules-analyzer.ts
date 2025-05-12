import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Configuration
const rootDir = path.resolve('.');
const entrypoints = [
  './app/page.tsx',
  './app/layout.tsx',
  './app/admin/page.tsx',
  './app/Concierge/page.tsx',
  './app/dashboard/page.tsx',
];
const includeDirs = ['components', 'lib', 'utils', 'app'];
const excludeDirs = ['node_modules', '.next', 'public', 'coverage'];

// Collection of files to analyze
const allFiles: string[] = [];
const importedFiles = new Set<string>();
const analyzedFiles = new Set<string>();

// Get all source files that should be checked for usage
async function getAllFiles() {
  for (const dir of includeDirs) {
    const dirPath = path.join(rootDir, dir);
    if (!fs.existsSync(dirPath)) continue;
    
    const files = await glob(`${dir}/**/*.{ts,tsx,js,jsx}`, { ignore: excludeDirs.map(d => `${d}/**`) });
    allFiles.push(...files);
  }
  
  console.log(`Found ${allFiles.length} total files to analyze`);
}

// Check if a file is an API route (which doesn't need to be imported directly)
function isApiRoute(filePath: string): boolean {
  // Check if the file path contains '/api/' and ends with 'route.ts' or 'route.js'
  return (filePath.includes('/api/') && (filePath.endsWith('route.ts') || filePath.endsWith('route.js'))) ||
         // Also check for app router special files that are automatically used by Next.js
         filePath.includes('/app/') && (
           filePath.endsWith('/page.tsx') || 
           filePath.endsWith('/layout.tsx') ||
           filePath.endsWith('/error.tsx') ||
           filePath.endsWith('/loading.tsx') ||
           filePath.endsWith('/not-found.tsx') ||
           filePath.endsWith('/template.tsx')
         );
}

// Parse imports from a file
function parseImports(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports: string[] = [];
    
    // Regular expression to match different import statements
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+[^,\s]+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
    
    let match;
    
    // Process standard imports
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // Process dynamic imports
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error);
    return [];
  }
}

// Parse fetch/HTTP requests for API routes in the code
function parseApiUsages(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const apiUsages: string[] = [];
    
    // Match fetch calls with URL paths
    // This is a simplistic approach that might need refinement
    const fetchRegex = /(?:fetch|axios\.(?:get|post|put|delete|patch))[\s\n]*\(['"]([^'"]*\/api\/[^'"]*)['"]/g;
    
    let match;
    while ((match = fetchRegex.exec(content)) !== null) {
      const apiPath = match[1].trim();
      if (apiPath.startsWith('/')) {
        // Convert route to file path format
        const normalizedPath = apiPath
          .replace(/\/api\//, 'app/api/')
          .replace(/\/$/, '')
          + '/route.ts';
        apiUsages.push(normalizedPath);
      }
    }
    
    return apiUsages;
  } catch (error) {
    console.error(`Error parsing API usages in file ${filePath}:`, error);
    return [];
  }
}

// Resolve relative imports to absolute file paths
function resolveImport(importPath: string, filePath: string): string | null {
  if (importPath.startsWith('.')) {
    // Relative import
    const dirPath = path.dirname(filePath);
    const resolvedPath = path.resolve(dirPath, importPath);
    
    // Check extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    for (const ext of extensions) {
      const fullPath = resolvedPath + ext;
      if (fs.existsSync(fullPath)) {
        return path.relative(rootDir, fullPath);
      }
    }
    
    // Check for index files
    for (const ext of extensions) {
      const indexPath = path.join(resolvedPath, `index${ext}`);
      if (fs.existsSync(indexPath)) {
        return path.relative(rootDir, indexPath);
      }
    }
  } else if (importPath.startsWith('@/')) {
    // Alias import (@/...)
    const aliasPath = importPath.replace('@/', '');
    const resolvedPath = path.join(rootDir, aliasPath);
    
    // Check extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    for (const ext of extensions) {
      const fullPath = resolvedPath + ext;
      if (fs.existsSync(fullPath)) {
        return path.relative(rootDir, fullPath);
      }
    }
    
    // Check for index files
    for (const ext of extensions) {
      const indexPath = path.join(resolvedPath, `index${ext}`);
      if (fs.existsSync(indexPath)) {
        return path.relative(rootDir, indexPath);
      }
    }
  }
  
  // External package or couldn't resolve
  return null;
}

// Analyze a file for imports and recursively analyze those imports
async function analyzeFile(filePath: string) {
  if (analyzedFiles.has(filePath)) return;
  analyzedFiles.add(filePath);
  importedFiles.add(filePath);
  
  const imports = parseImports(filePath);
  
  // Also look for API route usages (fetch calls, etc.)
  const apiUsages = parseApiUsages(filePath);
  
  // Process API usages - mark the API routes as used
  for (const apiPath of apiUsages) {
    const matchedApiFile = allFiles.find(file => file.endsWith(apiPath));
    if (matchedApiFile) {
      importedFiles.add(matchedApiFile);
    }
  }
  
  // Process regular imports
  for (const importPath of imports) {
    const resolvedPath = resolveImport(importPath, filePath);
    if (resolvedPath && !analyzedFiles.has(resolvedPath)) {
      importedFiles.add(resolvedPath);
      await analyzeFile(resolvedPath);
    }
  }
}

// Main analysis function
async function analyzeUnusedFiles() {
  // Get all files in the project
  await getAllFiles();
  
  // Start analysis from entry points
  for (const entrypoint of entrypoints) {
    await analyzeFile(entrypoint);
  }
  
  // Find unused files, excluding API routes and Next.js special files
  const genuinelyUnusedFiles = allFiles.filter(file => {
    // If the file is already marked as used, it's not unused
    if (importedFiles.has(file)) return false;
    
    // API routes and Next.js special files are considered used by default
    if (isApiRoute(file)) return false;
    
    return true;
  });
  
  // Count API routes that would be considered "used by default"
  const apiRoutes = allFiles.filter(file => isApiRoute(file));
  
  // Output results
  console.log('\n=== ANALYSIS RESULTS ===');
  console.log(`Total files: ${allFiles.length}`);
  console.log(`Used files directly: ${importedFiles.size}`);
  console.log(`API routes (assumed used): ${apiRoutes.length}`);
  console.log(`Potentially unused files: ${genuinelyUnusedFiles.length}`);
  
  if (genuinelyUnusedFiles.length > 0) {
    console.log('\n=== POTENTIALLY UNUSED FILES ===');
    genuinelyUnusedFiles.forEach(file => {
      console.log(file);
    });
  } else {
    console.log('\nAll files appear to be used in the project!');
  }
}

// Run the analysis
analyzeUnusedFiles().catch(console.error);