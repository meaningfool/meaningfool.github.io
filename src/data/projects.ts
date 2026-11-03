// The projects shown on the site, newest first: the "Part of the project" panel and the project in the meta line of
// an article (#32), the Projects tiles of the home (#31) and the project count of the share images (#34).
//
// Which articles belong to which project is kept here, by article id (the file name without its date), because the
// articles' frontmatter in meaningfool-writing has no field for it.
import type { ImageMetadata } from 'astro';
import voiceTodos from '../assets/projects/voice-todos.jpg';
import agentSdks from '../assets/projects/agent-sdks.jpg';
import dataLineage from '../assets/projects/data-lineage.jpg';

export interface Project {
	slug: string;
	name: string;
	/** A shorter name, for narrow columns such as the home's Writing list. */
	shortName: string;
	type: 'App' | 'Report';
	/** The month it came out, as YYYY-MM. */
	date: string;
	/** One line that says what it is. */
	description: string;
	link: string;
	/** The text of the link, without the ↗. */
	linkText: string;
	/** A 16:10 screenshot. */
	screenshot: ImageMetadata;
	/** The ids of the articles written about it. */
	articles: string[];
}

export const projects: Project[] = [
	{
		slug: 'voice-todos',
		name: 'Voice Todos',
		shortName: 'Voice Todos',
		type: 'App',
		date: '2026-05',
		description: 'Talk, and your todo list builds itself as you speak.',
		link: 'https://voice-todos.meaningfool.net/',
		linkText: 'Try Voice Todos',
		screenshot: voiceTodos,
		articles: ['edit-collections-generative-ai', 'structured-extraction', 'thoughts-on-human-ai-collaboration'],
	},
	{
		slug: 'agent-sdks',
		name: 'Agent SDKs for the Rest of Us',
		shortName: 'Agent SDKs',
		type: 'Report',
		date: '2026-02',
		description: 'A visual guide to agent frameworks for people who build products.',
		link: 'https://agent-frameworks-report.meaningfool.net/',
		linkText: 'Read the report',
		screenshot: agentSdks,
		articles: ['agent-frameworks-for-the-rest-of-us'],
	},
	{
		slug: 'data-lineage',
		name: 'Data Lineage',
		shortName: 'Data Lineage',
		type: 'App',
		date: '2025-12',
		description: 'CSV files in, an interactive lineage graph out.',
		link: 'https://lineage.meaningfool.net/',
		linkText: 'Try Data Lineage',
		screenshot: dataLineage,
		articles: ['antigravity_is_onto_something'],
	},
];

/** The project an article belongs to, if any. */
export function projectOf(articleId: string): Project | undefined {
	return projects.find((project) => project.articles.includes(articleId));
}
