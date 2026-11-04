// The site's three topics, the three orange dots of the topic map. Picking a topic on the home's map shows only the
// articles about it.
//
// An article belongs to a topic when that topic makes up 30% or more of it, so it can belong to more than one. An
// article's topics are its `topics` frontmatter field in meaningfool-writing, for example
// `topics: ["product", "ai-agents"]`, which takes the ids below.
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
