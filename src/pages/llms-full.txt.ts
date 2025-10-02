import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = true;

export const GET: APIRoute = async () => {
  const allContent = await getCollection("writing");
  const buildTime = new Date().toISOString();

  // Reuse separation logic from llms.txt (title-based filtering)
  const dailyLogs = allContent.filter(item => item.data.title.startsWith('Activity Log'))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const articles = allContent.filter(item => !item.data.title.startsWith('Activity Log'))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  // Build full content with markdown
  let fullContent = `# meaningfool - Full Content
> Complete markdown content of all public articles and daily logs. Generated: ${buildTime}

## Site Information
Personal website of Josselin Perrus, product manager in Paris.

---

## Articles

`;

  // Add each article's full content
  for (const article of articles) {
    // Try to find the file - articles may have date prefixes
    const articlesDir = path.join(process.cwd(), 'src/content/writing/articles');
    let filePath: string | null = null;

    try {
      const files = await fs.readdir(articlesDir);
      const matchingFile = files.find(file =>
        file.endsWith(`-${article.id}.md`) || file === `${article.id}.md`
      );

      if (matchingFile) {
        filePath = path.join(articlesDir, matchingFile);
      }
    } catch (error) {
      console.warn(`Could not list articles directory`);
    }

    if (filePath) {
      try {
        const rawContent = await fs.readFile(filePath, 'utf-8');
        // Remove frontmatter
        let content = rawContent.replace(/^---[\s\S]*?---\n*/m, '');

        // Bump all headers down by 2 levels to maintain hierarchy
        // # becomes ###, ## becomes ####, etc.
        content = content.replace(/^(#{1,4})\s/gm, (match, hashes) => {
          return '#'.repeat(hashes.length + 2) + ' ';
        });

        fullContent += `### ${article.data.title}
**URL**: https://meaningfool.net/articles/${article.id}
**Date**: ${article.data.date.toISOString().split('T')[0]}
**Type**: Article

${content}

---

`;
      } catch (error) {
        console.warn(`Could not read article: ${article.id}`);
      }
    } else {
      console.warn(`Could not find article file for: ${article.id}`);
    }
  }

  fullContent += `## Daily Logs

`;

  // Add each daily log's full content
  for (const log of dailyLogs) {
    // Daily logs are in the daily-logs folder
    const dailyLogsDir = path.join(process.cwd(), 'src/content/writing/daily-logs');
    const filePath = path.join(dailyLogsDir, `${log.id}.md`);

    try {
      const rawContent = await fs.readFile(filePath, 'utf-8');
      // Remove frontmatter
      let content = rawContent.replace(/^---[\s\S]*?---\n*/m, '');

      // Bump all headers down by 2 levels to maintain hierarchy
      // # becomes ###, ## becomes ####, etc.
      content = content.replace(/^(#{1,4})\s/gm, (match, hashes) => {
        return '#'.repeat(hashes.length + 2) + ' ';
      });

      fullContent += `### ${log.data.title}
**URL**: https://meaningfool.net/articles/${log.id}
**Date**: ${log.data.date.toISOString().split('T')[0]}
**Type**: Daily Log

${content}

---

`;
    } catch (error) {
      console.warn(`Could not read daily log: ${log.id}`);
    }
  }

  fullContent += `## Footer
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