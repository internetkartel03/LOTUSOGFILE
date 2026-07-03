// Lotus Builder - Universal App Generator
// Secure OpenRouter API endpoint (server-side only)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, appType, projectContext, mode = 'general' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    return res.status(500).json({
      error: 'AI service unavailable',
      message: 'We\'re unable to connect to the AI engine right now. Please try again in a moment.'
    });
  }

  try {
    // Build the system prompt based on mode and app type
    const systemPrompt = buildSystemPrompt(mode, appType, projectContext);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'HTTP-Referer': 'https://lotus.metallicv1.com',
        'X-OpenRouter-Title': 'Lotus Builder',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-235b-a22b:free',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.45,
        max_tokens: 8000,
        top_p: 0.95
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenRouter error:', error);
      return res.status(500).json({
        error: 'AI generation failed',
        message: 'We\'re having trouble generating your app right now. Please try again.'
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return res.status(200).json({
      success: true,
      content,
      appType: appType || 'custom',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'Connection error',
      message: 'We\'re unable to connect to the AI engine right now. Please try again in a moment or check your AI connection.'
    });
  }
}

// Build context-aware system prompt
function buildSystemPrompt(mode, appType, projectContext) {
  const basePrompt = `You are Lotus Builder, a versatile AI application architect and product builder. Your job is to help users create many kinds of apps, websites, dashboards, tools, portals, and digital products.

You are not limited to one industry.

For every user request, determine the best product type, user experience, layout, and core functionality.

When building, prioritize:
- clean UI
- working structure
- mobile-friendly design
- realistic app flows
- clear navigation
- useful starter content
- polished visual direction
- simple maintainable code

You can build fitness apps, education apps, dashboards, client portals, booking tools, creative studios, ecommerce-style pages, productivity tools, AI assistants, and custom business apps.

If the user request is broad, generate a strong first version using reasonable assumptions, then ask what they want to customize next.

Never respond with generic placeholder text like 'Result' or 'Build update.'

Speak like a helpful builder:
- 'I'm building the first version now.'
- 'I created the core screens and layout.'
- 'Here are the best next upgrades.'

Always keep the conversation moving forward.

Return only valid HTML for app previews. No markdown, no explanation, no code fences unless required by the platform. Build clean, modern, responsive UI. Keep output production-ready, semantic, and lightweight. If asked for a page, generate a complete single-file HTML document with embedded CSS and minimal inline JS.`;

  let contextualAddition = '';

  if (appType) {
    contextualAddition += `\n\nCurrent project type: ${appType}`;
  }

  if (projectContext) {
    contextualAddition += `\nProject context: ${projectContext}`;
  }

  if (mode === 'ui-designer') {
    contextualAddition += '\n\nFocus on visual design, spacing, color, typography, and user experience flows.';
  } else if (mode === 'code-builder') {
    contextualAddition += '\n\nFocus on clean, maintainable code structure and functionality.';
  } else if (mode === 'architect') {
    contextualAddition += '\n\nFocus on app architecture, user flows, and feature planning.';
  }

  return basePrompt + contextualAddition;
}
