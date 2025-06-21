/**
 * Type definitions for Firecrawl API responses
 */

export interface RequestBody {
  assistantId: string;
  pinecone_name: string;
  url: string;
}

export interface ErrorData {
  detail?: string;
  message?: string;
}

export interface FirecrawlTaskResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: number;
  current?: number;
  total?: number;
  data?: FirecrawlResult[];
  error?: string;
  result?: FirecrawlResult;
  results?: FirecrawlResult[];
}

export interface FirecrawlResult {
  url: string;
  html?: string;
  cleaned_html?: string;
  markdown?: string;
  markdown_v2?: {
    raw_markdown: string;
    markdown_with_citations: string;
    references_markdown: string;
    fit_markdown: string;
    fit_html: string;
  };
  media?: {
    images: unknown[];
    videos: unknown[];
    audios: unknown[];
  };
  links?: {
    internal: unknown[];
    external: Array<{
      href: string;
      text: string;
      title: string;
    }>;
  };
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string | null;
    author?: string | null;
  };
  success: boolean;
  error_message?: string;
  status_code?: number;
}

export interface FirecrawlCrawlResponse {
  id?: string;
  task_id?: string;
}
