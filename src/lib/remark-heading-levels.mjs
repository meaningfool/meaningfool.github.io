/**
 * Give a post's headings a hierarchy under the page title, the page's only h1: the highest level the text uses becomes
 * h2 and the others keep their distance to it. A post with `#` sections gets h2 sections and h3 subsections; one that
 * starts at `###` gets them moved up. Runs after remark-drop-title, which removes the `# Title` line.
 */
export default function remarkHeadingLevels() {
  return (tree) => {
    const headings = [];
    (function collect(node) {
      if (node.type === 'heading') headings.push(node);
      node.children?.forEach(collect);
    })(tree);
    if (!headings.length) return;
    const shift = 2 - Math.min(...headings.map((heading) => heading.depth));
    for (const heading of headings) heading.depth = Math.min(6, heading.depth + shift);
  };
}
