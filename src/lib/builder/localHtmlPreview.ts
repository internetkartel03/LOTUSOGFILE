// Local preview: the model returns ONE complete HTML document,
// which is sanitized and injected into a sandboxed iframe (WebView-style)
// inside the phone frame. No Expo/EAS/Vercel/remote build services.

export const LOCAL_HTML_SYSTEM_PROMPT = [
  'You are LOTUS, a mobile UI generator for a live phone preview.',
  'Return ONLY one complete HTML document in exactly this format, with no markdown fences, no explanations, and no prose:',
  '<!doctype html>',
  '<html>',
  '<head>',
  '<style>',
  '/* CSS here */',
  '</style>',
  '</head>',
  '<body>',
  '<!-- UI here -->',
  '<script>',
  '/* optional JS here */',
  '</scr' + 'ipt>',
  '</body>',
  '</html>',
  'Rules:',
  '- Design for a 390x844 mobile screen. Use html,body{margin:0;height:100%} and fill the full screen.',
  '- All CSS must be inline in the single <style> tag. All JS must be inline in the single <script> tag.',
  '- Never reference external files, fonts, CDNs, or network requests.',
  '- Images are allowed only as inline SVG, inline canvas output, emoji, or data URLs generated directly in the document.',
  '- Use at least one meaningful visual asset when the prompt calls for artwork, product visuals, hero media, or logos.',
  '- Make it polished and production-looking: real copy, clear hierarchy, touch-sized buttons, strong visual design.',
  '- Prefer deep, complete UI states over placeholders. Avoid writing placeholder copy like lorem ipsum, coming soon, or TODO.',
].join('\n');

const HTML_SHELL_PREFIX = '<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<style>html,body{margin:0;padding:0;height:100%;font-family:-apple-system,system-ui,sans-serif;}</style>\n</head>\n<body>\n';
const HTML_SHELL_SUFFIX = '\n</body>\n</html>';

function stripCodeFences(raw: string): string {
  const fenced = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
  const unwrapped = fenced ? fenced[1] : raw;
  return unwrapped.replace(/```(?:html)?/gi, '').replace(/```/g, '').trim();
}

function removeExternalReferences(html: string): string {
  return html
    // External scripts (keep inline ones)
    .replace(/<script[^>]*\ssrc\s*=[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*\ssrc\s*=[^>]*\/>/gi, '')
    // Remote stylesheets, imports, iframes
    .replace(/<link[^>]*>/gi, '')
    .replace(/@import\s+url\([^)]*\)\s*;?/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<iframe[^>]*\/>/gi, '');
}

/**
 * Turns raw model output into a complete, self-contained HTML document.
 * Never returns an empty document: incomplete output is wrapped in a valid
 * HTML shell so the preview is never blank when generation succeeds.
 */
export function sanitizeHtmlDocument(raw: string): string {
  const stripped = stripCodeFences(raw);
  if (!stripped) return '';

  const docMatch = stripped.match(/<!doctype[\s\S]*<\/html\s*>/i) ?? stripped.match(/<html[\s\S]*<\/html\s*>/i);
  if (docMatch) {
    const doc = removeExternalReferences(docMatch[0]);
    return /^<!doctype/i.test(doc) ? doc : `<!doctype html>\n${doc}`;
  }

  // Fragment (missing shell) — wrap it so the preview still renders.
  const fragment = removeExternalReferences(stripped);
  if (!/[<>]/.test(fragment)) return '';
  return `${HTML_SHELL_PREFIX}${fragment}${HTML_SHELL_SUFFIX}`;
}

export type PreviewStatus = 'empty' | 'generating' | 'success' | 'error';
