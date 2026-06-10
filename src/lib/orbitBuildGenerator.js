import { generateText } from './cloudflareAI';
import { supabase } from '@/api/supabaseClient';

const ORBIT_BUILD_PROMPT = `You are OrbitBuild, an elite Workspace Assembly Engine for Slate.
Your purpose is to understand a business or industry described by the user and assemble a complete workspace.
You MUST NOT generate database schemas. You MUST ONLY select from the predefined library of Universal Components.

CRITICAL INSTRUCTIONS:
1. Analyze the industry and identify the required business capabilities.
2. Select the most appropriate Universal Components to fulfill those capabilities.
3. Assemble a list of pages for the workspace. For a standard industry, generate between 6 and 12 pages.
4. Provide a domain-specific \`page_name\` (e.g., "Pet Records", "Invoicing", "Student Attendance") but map it to exactly one \`component_id\` from the allowed list.

ALLOWED UNIVERSAL COMPONENT IDs:
Core Components:
- data_table
- kanban
- calendar
- timeline
- dashboard_widgets
- analytics
- document_manager
- form_wizard

Business Components:
- crm
- contact_management
- invoice
- payment
- inventory
- pos
- booking
- scheduling
- attendance
- gradebook
- appointment
- asset_management
- hr_employee
- recruitment
- approval

JSON OUTPUT FORMAT:
You must output EXACTLY a valid JSON object. DO NOT output any markdown tags like \`\`\`json. DO NOT output any conversational text.
ONLY the JSON object.

{
  "industry_name": "Veterinary Clinic",
  "pages": [
    {
      "page_name": "Pet Records",
      "component_id": "contact_management",
      "icon": "PawPrint",
      "description": "Manage pet and owner profiles."
    },
    {
      "page_name": "Appointments",
      "component_id": "appointment",
      "icon": "Calendar",
      "description": "Schedule clinic visits."
    },
    {
      "page_name": "Billing",
      "component_id": "invoice",
      "icon": "Receipt",
      "description": "Generate invoices and track payments."
    }
  ]
}
`;

/**
 * Assembles a full workspace configuration via LLM and saves it to industry_records.
 * @param {string} prompt - User's description of their business/needs
 * @param {string} companyId - The newly created company ID
 * @returns {Promise<Array>} - The assembled workspace configuration
 */
export async function generateOrbitBuildWorkspace(prompt, companyId) {
  try {
    const aiMessages = [
      { role: 'system', content: ORBIT_BUILD_PROMPT },
      { role: 'user', content: prompt }
    ];

    const responseText = await generateText(aiMessages);
    
    // Parse the JSON array. Handle potential markdown formatting.
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (jsonStr.startsWith('\`\`\`')) {
      jsonStr = jsonStr.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }

    let parsedData = null;
    let assembledPages = [];
    let industryName = 'Custom Workspace';

    try {
      parsedData = JSON.parse(jsonStr);
      
      // Handle fallback for older generated arrays vs the new object structure
      if (Array.isArray(parsedData)) {
        assembledPages = parsedData;
      } else if (parsedData && Array.isArray(parsedData.pages)) {
        assembledPages = parsedData.pages;
        if (parsedData.industry_name) {
          industryName = parsedData.industry_name;
        }
      } else {
        throw new Error("OrbitBuild returned invalid format (expected array of pages or object with pages array).");
      }
    } catch (parseErr) {
      console.error("Failed to parse OrbitBuild JSON:", parseErr, "\nRaw text:", jsonStr);
      throw new Error("OrbitBuild failed to assemble the workspace correctly. Please try again.");
    }

    if (!assembledPages || assembledPages.length === 0) {
      throw new Error("OrbitBuild returned no pages.");
    }

    // Save the assembly configuration to industry_records
    const configId = crypto.randomUUID();
    const { error: configError } = await supabase.from('industry_records').insert({
      id: configId,
      company_id: companyId,
      industry: 'orbit_build',
      record_type: 'workspace_config',
      data: { pages: assembledPages, industry_name: industryName, prompt: prompt },
      search_text: 'orbit build assembly configuration',
      created_at: new Date().toISOString()
    });

    if (configError) {
      console.error("Failed to save OrbitBuild config:", configError);
      throw new Error("Failed to save the workspace configuration.");
    }

    // Update the company's industry_type
    const { error: compError } = await supabase.from('companies').update({
      industry_type: 'orbit_build'
    }).eq('id', companyId);

    if (compError) {
      console.error("Failed to update company industry_type:", compError);
    }

    return assembledPages;
  } catch (err) {
    console.error("OrbitBuild generation error:", err);
    throw err;
  }
}
