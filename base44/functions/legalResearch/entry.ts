import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { question, jurisdiction, case_type } = await req.json();
    if (!question) return Response.json({ error: 'question is required' }, { status: 400 });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert African legal research assistant specializing in ${jurisdiction || 'West African'} law (Ghana, Nigeria, Sierra Leone).

A lawyer is asking: "${question}"

${case_type ? `Case type context: ${case_type}` : ''}
${jurisdiction ? `Jurisdiction: ${jurisdiction}` : ''}

Provide a comprehensive legal research response including:
1. Direct answer to the question
2. Relevant legislation and statutes
3. Key case law precedents (if applicable)
4. Practical legal considerations
5. Recommended next steps or actions
6. Any important caveats or warnings

Be specific, cite actual laws where possible, and be helpful to a practising lawyer.`,
      add_context_from_internet: true,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          legislation: {
            type: 'array',
            items: { type: 'object', properties: { name: { type: 'string' }, section: { type: 'string' }, relevance: { type: 'string' } } }
          },
          case_law: {
            type: 'array',
            items: { type: 'object', properties: { case_name: { type: 'string' }, year: { type: 'string' }, principle: { type: 'string' } } }
          },
          practical_notes: { type: 'string' },
          next_steps: { type: 'array', items: { type: 'string' } },
          caveats: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
        }
      }
    });

    return Response.json({ research: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});