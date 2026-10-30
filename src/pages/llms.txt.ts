import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { newestFirst } from "../lib/sort-posts";
import { isDailyLog } from "../lib/posts.mjs";

export const prerender = true; // Static generation at build time

export const GET: APIRoute = async () => {
  const allContent = await getCollection("writing");
  const buildTime = new Date().toISOString();

  const dailyLogs = allContent.filter(isDailyLog).sort(newestFirst);
  const articles = allContent.filter((entry) => !isDailyLog(entry)).sort(newestFirst);

  const content = `# meaningfool
> Personal website of Josselin Perrus, product manager in Paris. Generated: ${buildTime}

## Scope
All public content including articles and daily logs. Professional insights and work-in-progress thoughts.

## Content

### Articles
${articles.map(article =>
  `- [${article.data.title}](https://meaningfool.net/articles/${article.id}/)`
).join('\n') || 'No articles yet'}

### Daily Logs
${dailyLogs.map(log =>
  `- [${log.data.title}](https://meaningfool.net/articles/${log.id}/)`
).join('\n') || 'No daily logs yet'}

## Pages
- [About](https://meaningfool.net/about/)
- [Home](https://meaningfool.net/)
- [RSS Feed](https://meaningfool.net/rss.xml)

## Full Content
For complete markdown content, see [llms-full.txt](https://meaningfool.net/llms-full.txt)

## License
© ${new Date().getFullYear()} Josselin Perrus. Short quotations with attribution welcome.

Generated: ${buildTime}`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
};