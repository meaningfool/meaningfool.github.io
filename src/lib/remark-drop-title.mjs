/** Drop a post's leading `# Title` heading: the article template already renders the title. */
export default function remarkDropTitle() {
  return (tree) => {
    const first = tree.children[0];
    if (first?.type === 'heading' && first.depth === 1) tree.children.shift();
  };
}
