import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

interface RouteInfo {
  path: string;
  apiPath: string;
  filename: string;
  isDirectlyReferenced: boolean;
  references: string[];
}

/**
 * Analyzes the codebase to find potentially unused API routes
 */
export async function findUnusedApiRoutes() {
  console.log('🔍 Analyzing API routes for usage...');
  
  // Get all API route files
  const apiRoutesDir = path.join(process.cwd(), 'app', 'api');
  const apiRouteFiles = globSync('**/route.ts', { 
    cwd: apiRoutesDir,
    absolute: true 
  });
  
  console.log(`Found ${apiRouteFiles.length} API route files`);
  
  // Get all frontend files that might reference API routes
  const frontendFiles = globSync(['app/**/*.{tsx,ts}', 'components/**/*.{tsx,ts}', 'utils/**/*.{ts,tsx}'], {
    cwd: process.cwd(),
    absolute: true,
    ignore: ['app/api/**', '**/node_modules/**', '**/.next/**']
  });
  
  console.log(`Scanning ${frontendFiles.length} frontend files for API references`);
  
  // Process all API routes
  const routeInfos: RouteInfo[] = apiRouteFiles.map(routeFile => {
    // Convert the file path to an API path
    const relativePath = path.relative(apiRoutesDir, routeFile);
    const dirPath = path.dirname(relativePath);
    const apiPath = `/api/${dirPath === '.' ? '' : dirPath}`;
    
    return {
      path: routeFile,
      apiPath,
      filename: path.basename(routeFile),
      isDirectlyReferenced: false,
      references: []
    };
  });
  
  // Check each frontend file for references to API routes
  for (const file of frontendFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    for (const route of routeInfos) {
      // Look for fetch or axios calls to this API
      if (
        content.includes(`fetch('${route.apiPath}`) || 
        content.includes(`fetch("${route.apiPath}`) ||
        content.includes(`fetch(\`${route.apiPath}`) ||
        content.includes(`axios.get('${route.apiPath}`) ||
        content.includes(`axios.post('${route.apiPath}`) ||
        content.includes(`axios.put('${route.apiPath}`) ||
        content.includes(`axios.delete('${route.apiPath}`)
      ) {
        route.isDirectlyReferenced = true;
        route.references.push(path.relative(process.cwd(), file));
      }
    }
  }
  
  // Count results
  const referencedRoutes = routeInfos.filter(r => r.isDirectlyReferenced);
  const unreferencedRoutes = routeInfos.filter(r => !r.isDirectlyReferenced);
  
  console.log('\n📊 Results:');
  console.log(`Total API Routes: ${routeInfos.length}`);
  console.log(`Referenced Routes: ${referencedRoutes.length}`);
  console.log(`Potentially Unused Routes: ${unreferencedRoutes.length}`);
  
  console.log('\n🟢 Referenced API Routes:');
  referencedRoutes.forEach(route => {
    console.log(`- ${route.apiPath} (${route.references.length} references)`);
  });
  
  console.log('\n🟠 Potentially Unused API Routes:');
  unreferencedRoutes.forEach(route => {
    console.log(`- ${route.apiPath} (${path.relative(process.cwd(), route.path)})`);
  });

  console.log('\n⚠️  Note: This analysis only detects direct string references to API routes.');
  console.log('Some routes might be referenced dynamically or used in ways this tool cannot detect.');
  console.log('Review each potential unused route carefully before removing.');
}

// Check if this file is being executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  findUnusedApiRoutes().catch(console.error);
}