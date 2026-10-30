import { getCollection, type CollectionEntry } from "astro:content";
import type { APIRoute } from "astro";
import { newestFirst } from "../lib/sort-posts";
import { isDailyLog } from "../lib/posts.mjs";

export const prerender = true;

/** Move Markdown headings two levels down (# becomes ###), leaving fenced code blocks untouched. */
function demoteHeadings(markdown: string): string {
  let fence: string | null = null;
  return markdown.split('\n').map((line) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1];
    if (marker && (!fence || (marker[0] === fence[0] && marker.length >= fence.length))) {
      fence = fence ? null : marker;
      return line;
    }
    if (fence) return line;
    return line.replace(/^(#{1,4})\s/, (_, hashes: string) => '#'.repeat(hashes.length + 2) + ' ');
  }).join('\n');
}

function section(entry: CollectionEntry<'writing'>, type: string): string {
  const content = demoteHeadings((entry.body ?? '').replace(/^\n+/, ''));
  return `### ${entry.data.title}
**URL**: https://meaningfool.net/articles/${entry.id}/
**Date**: ${entry.data.date.toISOString().split('T')[0]}
**Type**: ${type}

${content}

---

`;
}

export const GET: APIRoute = async () => {
  const allContent = await getCollection("writing");
  const buildTime = new Date().toISOString();

  const dailyLogs = allContent.filter(isDailyLog).sort(newestFirst);
  const articles = allContent.filter((entry) => !isDailyLog(entry)).sort(newestFirst);

  const fullContent = `# meaningfool - Full Content
> Complete markdown content of all public articles and daily logs. Generated: ${buildTime}

## Site Information
Personal website of Josselin Perrus, product manager in Paris.

---

## Articles

${articles.map((article) => section(article, 'Article')).join('')}## Daily Logs

${dailyLogs.map((log) => section(log, 'Daily Log')).join('')}## Footer
Generated: ${buildTime}
Total Articles: ${articles.length}
Total Daily Logs: ${dailyLogs.length}`;

  // Monitor file size
  const sizeInKB = Buffer.byteLength(fullContent, 'utf-8') / 1024;
  if (sizeInKB > 1024) {
    console.warn(`llms-full.txt is ${sizeInKB.toFixed(2)}KB - consider splitting`);
  }

  return new Response(fullContent, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
};
