/** Collapse whitespace, unify quotes/dashes, lowercase: used for tolerant quote matching. */
export function normalize(s: string): string {
  return s
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Split text into chunks of at most maxChars, breaking on paragraph, then sentence boundaries. */
export function chunkText(text: string, maxChars = 12000): string[] {
  const paragraphs = text.split(/\n{1,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  const push = () => { if (current) { chunks.push(current); current = ""; } };
  for (const p of paragraphs) {
    const pieces = p.length > maxChars ? p.match(new RegExp(`[\\s\\S]{1,${maxChars}}`, "g"))! : [p];
    for (const piece of pieces) {
      if (current && current.length + piece.length + 1 > maxChars) push();
      current += (current ? "\n" : "") + piece;
    }
  }
  push();
  return chunks;
}

/** Extract readable text from an HTML document string. Needs a DOM (browser/popup). */
export function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,noscript,svg,iframe").forEach((n) => n.remove());
  doc.querySelectorAll("br").forEach((n) => n.replaceWith("\n"));
  doc.querySelectorAll("p,li,h1,h2,h3,h4,h5,h6,div,tr,section").forEach((n) => n.append("\n"));
  return (doc.body?.textContent ?? "").replace(/[ \t\f\v ]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}

const POLICY_RE =
  /privacy\s*(policy|notice|statement)|개인\s*정보\s*(처리\s*방침|보호\s*정책)|datenschutz|politique\s+de\s+confidentialit|pol[ií]tica\s+de\s+privacidad|privacidade|プライバシー|隐私|個人情報/i;

/** Pick the most likely privacy-policy link from anchors on a page. */
export function findPolicyLink(links: { href: string; text: string }[]): string | null {
  const scored = links
    .filter((l) => /^https?:/i.test(l.href))
    .map((l) => {
      let score = 0;
      if (POLICY_RE.test(l.text)) score += 2;
      if (POLICY_RE.test(l.href) || /privacy|privacidad|datenschutz/i.test(l.href)) score += 1;
      return { href: l.href, score };
    })
    .filter((l) => l.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.href ?? null;
}
