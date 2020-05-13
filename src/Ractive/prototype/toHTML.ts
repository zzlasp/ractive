/**
 * Returns a chunk of HTML representing the current state of the instance.
 * This is most useful when you're using Ractive in node.js, as it allows
 * you to serve fully-rendered pages (good for SEO and initial pageload performance) to the client.
 */
export default function Ractive$toHTML(): string {
  return this.fragment.toString(true);
}
