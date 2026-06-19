import { generateText } from './cloudflareAI';
import { powerSync } from "@/api/PowerSyncConnector";

const ORBIT_BUILD_PROMPT = `You are OrbitBuild, an elite Workspace Assembly Engine for Airflake.
Your purpose is to understand a business or industry described by the user and assemble a complete workspace.

CRITICAL INSTRUCTIONS:
1. Analyze the industry/business requested and identify the required business capabilities.
2. Assemble a list of pages for the workspace (generate between 6 and 12 pages depending on the complexity).
3. THE FIRST PAGE MUST ALWAYS BE A DASHBOARD. Set \`page_name\` to "Dashboard" and \`component_id\` to "dashboard".
4. The \`industry_name\` must be a short, smart title (1-2 words max) naming the system.
5. For standard data management (like CRM, Inventory, Invoices), select a \`component_id\` from the ALLOWED UNIVERSAL COMPONENTS list.
6. For CUSTOM requirements that don't fit perfectly into a Universal Component, you MUST generate a custom schema dynamically. To do this, set \`component_id\` to "custom_slate" and provide a \`slate_schema\` object.

ALLOWED UNIVERSAL COMPONENTS:
- \`dashboard\` : Main system dashboard
- \`crm\` : Customer relationship management
- \`invoice\` : Invoices, billing
- \`appointment\` : Appointment scheduling
- \`inventory\` : Stock management
- \`hremployee\` : HR directory
- \`analytics\` : Reports, analytics
- \`documentmanager\` : Documents repository
- \`messaging\` : Chat, messages
- \`notification\` : Alerts history

ALLOWED ICONS:
LayoutDashboard, Briefcase, Users, Calendar, Receipt, CheckSquare, FolderOpen, Settings, Search, Mail, BarChart2

JSON OUTPUT FORMAT:
You must output EXACTLY a valid JSON object. DO NOT output markdown tags or conversational text.

{
  "industry_name": "Veterinary Clinic",
  "pages": [
    {
      "page_name": "Dashboard",
      "component_id": "dashboard",
      "icon": "LayoutDashboard",
      "description": "Clinic performance and overview."
    },
    {
      "page_name": "Pet Records",
      "component_id": "custom_slate",
      "icon": "Users",
      "description": "Manage pet profiles and clinical histories.",
      "slate_schema": {
        "module": {
          "name": "Pet Records",
          "description": "Database of all pets",
          "icon": "Users",
          "layout": "table",
          "theme": "primary",
          "module_type": "data_module"
        },
        "fields": [
          { "name": "Pet Name", "field_type": "text", "is_required": true },
          { "name": "Species", "field_type": "select", "options": ["Dog", "Cat", "Bird"], "is_required": true },
          { "name": "Weight (kg)", "field_type": "number", "is_required": false }
        ]
      }
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

    let responseText = await generateText(aiMessages);
    
    // Safety check in case the AI provider returns an object instead of a string
    if (typeof responseText !== 'string') {
      if (responseText && typeof responseText.response === 'string') {
        responseText = responseText.response;
      } else if (responseText && typeof responseText.text === 'string') {
        responseText = responseText.text;
      } else {
        responseText = JSON.stringify(responseText || "");
      }
    }
    
    // Parse the JSON array. Handle potential markdown formatting.
    let jsonStr = (responseText || "").trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (jsonStr.startsWith('\`\`\`')) {
      jsonStr = jsonStr.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }

    let parsedData = null;
    let assembledPages = [];
    let industryName = 'Custom Workslate';

    // Best-effort attempt to extract an industry name from the prompt
    // e.g., "Build a veterinary clinic management system..." -> "veterinary clinic"
    const extractIndustryFromPrompt = (text) => {
      const match = text.match(/(?:build|create|make) (?:a|an) (.*?) (?:management system|workspace|app|software)/i);
      return match ? match[1].trim().replace(/\b\w/g, l => l.toUpperCase()) : 'Custom Workslate';
    };

    try {
      parsedData = JSON.parse(jsonStr);
      
      // Handle fallback for older generated arrays vs the new object structure
      if (Array.isArray(parsedData)) {
        assembledPages = parsedData;
        industryName = extractIndustryFromPrompt(prompt);
      } else if (parsedData && Array.isArray(parsedData.pages)) {
        assembledPages = parsedData.pages;
        if (parsedData.industry_name) {
          industryName = parsedData.industry_name;
        } else {
          industryName = extractIndustryFromPrompt(prompt);
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
    const configError = await (async () => {
      const _payload = {
        id: configId,
        company_id: companyId,
        industry: 'orbit_build',
        record_type: 'workspace_config',
        data: { pages: assembledPages, industry_name: industryName, prompt: prompt },
        search_text: 'orbit build assembly configuration',
        created_at: new Date().toISOString()
      };
      const _keys = Object.keys(_payload);
      const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
      try {
        await powerSync.execute(`INSERT INTO industry_records (${_keys.join(', ')}) VALUES (${_keys.map(()=>'?').join(', ')})`, _vals);
        return null;
      } catch(e) { return e; }
    })();

    if (configError) {
      console.error("Failed to save OrbitBuild config:", configError);
      throw new Error("Failed to save the workspace configuration.");
    }

    // Update the company's industry_type
    const { error: compError } = await (async () => {
      try {
        const _payload = {industry_type: 'orbit_build'};
        const _keys = Object.keys(_payload);
        const _vals = Object.values(_payload).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
        await powerSync.execute(`UPDATE companies SET ${_keys.map(k => k+' = ?').join(', ')} WHERE id = ?`, [..._vals, companyId]);
        return { error: null };
      } catch (e) {
        return { error: e };
      }
    })();

    if (compError) {
      console.error("Failed to update company industry_type:", compError);
    }

    return assembledPages;
  } catch (err) {
    console.error("OrbitBuild generation error:", err);
    throw err;
  }
}
