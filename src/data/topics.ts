// The site's three topics, the three orange dots of the topic map, and which of them each article is about. Picking a
// topic on the home's map shows only the articles about it.
//
// An article belongs to a topic when that topic makes up 30% or more of it, so it can belong to more than one. An
// article's topics come from its `topics` frontmatter field in meaningfool-writing when it has one, for example
// `topics: ["product", "ai-agents"]`. Until every article has that field, the list below gives the topics of the 18
// articles the prototype read (docs/redesign/prototype/maps.js, the weights in each article's `w`), by article id.
import type { CollectionEntry } from 'astro:content';
import map from './topic-map.json';

/** The topics' ids, which the map's dots carry and the frontmatter's `topics` field takes. */
export const TOPICS = ['customer-success', 'product', 'ai-agents'] as const;
export type Topic = (typeof TOPICS)[number];

// The map's dots (topic-map.json) are these three topics, in this order.
if (map.topics.map(({ id }) => id).join() !== TOPICS.join()) {
	throw new Error(`src/data/topic-map.json's topics should be ${TOPICS.join(', ')}, as in src/data/topics.ts`);
}

/** The topics' names, as the map shows them: "Customer success", "Product", "AI agents". */
export const TOPIC_NAMES = Object.fromEntries(map.topics.map(({ id, name }) => [id, name])) as Record<Topic, string>;

// The prototype's weights are [customer success, product, AI agents]; each topic at 0.3 or more is listed.
const fromPrototype: Record<string, Topic[]> = {
	'edit-collections-generative-ai': ['ai-agents'], // 0.1, 0.15, 0.75
	'structured-extraction': ['ai-agents'], // 0.2, 0.1, 0.7
	'thoughts-on-human-ai-collaboration': ['customer-success', 'product', 'ai-agents'], // 0.3, 0.3, 0.4
	'detecting-bounding-boxes': ['ai-agents'], // 0.05, 0.1, 0.85
	'agent-frameworks-for-the-rest-of-us': ['ai-agents'], // 0.05, 0.15, 0.8
	'how-long-for-that-change': ['product'], // 0.15, 0.7, 0.15
	'january-in-review': ['ai-agents'], // 0.05, 0.25, 0.7
	'prolifics-and-frugals': ['product'], // 0.2, 0.7, 0.1
	'the-slicing-fallacy': ['product'], // 0.25, 0.7, 0.05
	'we-cant-stop-planning': ['product'], // 0.2, 0.75, 0.05
	cost_of_change_is_agile_ceiling: ['product'], // 0.15, 0.75, 0.1
	compounding_dev_process: ['product', 'ai-agents'], // 0.05, 0.5, 0.45
	antigravity_is_onto_something: ['ai-agents'], // 0.05, 0.25, 0.7
	'semi-async_valley_of_death': ['product', 'ai-agents'], // 0.1, 0.3, 0.6
	'spec-driven-development-has-it-backwards': ['product', 'ai-agents'], // 0.1, 0.5, 0.4
	'ai-engineer-paris-conference-notes': ['ai-agents'], // 0.05, 0.15, 0.8
	'voice-ai-maven-course-notes': ['ai-agents'], // 0.05, 0.1, 0.85
	'faster-answers-better-questions': ['customer-success', 'product'], // 0.3, 0.5, 0.2
};

/** An article's topics: its `topics` frontmatter field, or else the list above; undefined when it has neither. */
export function topicsOf(article: CollectionEntry<'writing'>): Topic[] | undefined {
	return article.data.topics ?? fromPrototype[article.id];
}
