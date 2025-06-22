import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';

import { v4 as uuidv4 } from 'uuid';

import type { FirecrawlResult } from './firecrawl-types';

/**
 * Processes crawled web content and prepares it for storage
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class WebContentProcessor {
  /**
   * Extracts and enriches content from Firecrawl results
   */
  static extractContent(resultData: FirecrawlResult, url: string): string {
    // Choose the best content format in priority order
    let markdownContent = '';

    if (resultData.markdown_v2?.raw_markdown) {
      // Prefer markdown_v2 which has better formatting and citation support
      markdownContent = resultData.markdown_v2.raw_markdown;

      // If references are available, append them to provide context
      if (resultData.markdown_v2.references_markdown) {
        markdownContent += `\n\n${resultData.markdown_v2.references_markdown}`;
      }
    } else if (resultData.markdown) {
      // Fall back to standard markdown
      markdownContent = resultData.markdown;
    } else if (resultData.cleaned_html) {
      // Fall back to cleaned HTML if markdown is unavailable
      markdownContent = `# ${resultData.metadata?.title ?? 'Web Page Content'}\n\n${resultData.cleaned_html}`;
    } else {
      throw new Error('No usable content found in result data');
    }

    // Enrich the content with metadata
    markdownContent = this.enrichWithMetadata(markdownContent, resultData, url);

    // Add link information if available
    markdownContent = this.addExternalLinks(markdownContent, resultData);

    return markdownContent;
  }

  /**
   * Enriches content with metadata section
   */
  private static enrichWithMetadata(
    content: string,
    resultData: FirecrawlResult,
    url: string
  ): string {
    if (!resultData.metadata) {
      return content;
    }

    const { metadata } = resultData;
    const metadataSection = [
      '---',
      `Title: ${metadata.title ?? 'Untitled'}`,
      `URL: ${url}`,
      metadata.description ? `Description: ${metadata.description}` : null,
      metadata.author ? `Author: ${metadata.author}` : null,
      `Date Crawled: ${new Date().toISOString()}`,
      '---\n\n',
    ]
      .filter(Boolean)
      .join('\n');

    return metadataSection + content;
  }

  /**
   * Adds external links section to content
   */
  private static addExternalLinks(content: string, resultData: FirecrawlResult): string {
    if (!resultData.links?.external?.length) {
      return content;
    }

    const externalLinks = resultData.links.external;
    const linkSection = [
      '\n\n## External Links\n',
      ...externalLinks.map(
        link => `- [${link.text ?? link.href}](${link.href})${link.title ? ` - ${link.title}` : ''}`
      ),
    ].join('\n');

    return content + linkSection;
  }

  /**
   * Creates a temporary file with the processed content
   */
  static createTempFile(content: string): string {
    const fileName = `url-${uuidv4()}.md`;
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, fileName);

    try {
      fs.writeFileSync(tempFilePath, content);

      return tempFilePath;
    } catch {
      throw new Error('Failed to create temporary file for content');
    }
  }

  /**
   * Removes a temporary file safely
   */
  static cleanupTempFile(tempFilePath: string): void {
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch {
      // Silently handle cleanup errors
    }
  }
}
