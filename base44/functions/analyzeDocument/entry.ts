import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, document_name } = await req.json();
    if (!file_url) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert legal analyst. Carefully analyze the following legal document and extract structured information.

Document name: ${document_name || 'Unknown'}

Please analyze this document and return a structured analysis with:
1. A concise executive summary (2-4 sentences) of what this document is about
2. Key legal points - the most important legal obligations, rights, clauses, or findings
3. All deadlines - any time-sensitive actions required (filing deadlines, response deadlines, payment deadlines, statute of limitations, etc.)
4. Important dates - all specific dates mentioned in the document (hearing dates, contract dates, effective dates, expiry dates, signing dates, etc.)
5. Parties involved - names and roles of all parties
6. Risk flags - any clauses or terms that pose legal risk or require urgent attention

For dates, always format them as YYYY-MM-DD if possible. If only a month and year are given, use the first day of that month. If dates are relative (e.g. "within 30 days"), calculate from today's date (${new Date().toISOString().split('T')[0]}) if possible.`,
      file_urls: [file_url],
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          key_legal_points: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                point: { type: 'string' },
                category: { type: 'string', description: 'e.g. Obligation, Right, Clause, Finding' },
                importance: { type: 'string', enum: ['high', 'medium', 'low'] }
              }
            }
          },
          deadlines: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                date: { type: 'string', description: 'YYYY-MM-DD format' },
                party_responsible: { type: 'string' },
                urgency: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
              }
            }
          },
          important_dates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                date: { type: 'string', description: 'YYYY-MM-DD format' },
                type: { type: 'string', description: 'e.g. Hearing, Signing, Effective, Expiry, Filing, Payment' }
              }
            }
          },
          parties: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                role: { type: 'string' }
              }
            }
          },
          risk_flags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                flag: { type: 'string' },
                severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
              }
            }
          }
        }
      }
    });

    return Response.json({ analysis: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});