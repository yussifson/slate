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
5. THE FIRST PAGE MUST ALWAYS BE A DASHBOARD. Set \`page_name\` to "Dashboard" and \`component_id\` to "dashboard".

COMPONENT MAPPING:
For each page, select a conceptually matching \`component_id\` that reflects the UI needed (e.g., "inventory", "patient_records", "pos", "crm", "contacts"). Use descriptive string IDs.

CRITICAL: Do not use spaces in \`component_id\`. Use snake_case.

ALLOWED ICONS (YOU MUST CHOOSE A UNIQUE ICON FOR EACH PAGE FROM THIS EXACT LIST):
LayoutDashboard, Briefcase, Users, Calendar, Receipt, CheckSquare, FolderOpen, Settings,
Scale, UserCog, CreditCard, UserCircle, UserPlus, BookOpen, Shield, TrendingUp, Trophy,
Search, Mail, BarChart2, Download, MessageCircle, HeartHandshake, GraduationCap, BookMarked,
ClipboardList, Bus, FileText, Stethoscope, Bed, Pill, FlaskConical, Activity, Sparkles,
UtensilsCrossed, Star, ShoppingCart, Package, Truck, Tag, Layers, Bell, Award, Library,
Building2, AlertCircle, Clock, Network, Gift, Banknote, Map, Warehouse, Car, MapPin, Zap,
Store, ShieldAlert, HeartPulse, FilePlus, FileCheck, Gavel, Target, Calculator, Home, Wallet,
PieChart, Laptop, Smartphone, MessageSquare, LineChart

JSON OUTPUT FORMAT:
You must output EXACTLY a valid JSON object. DO NOT output any markdown tags like \`\`\`json. DO NOT output any conversational text.
ONLY the JSON object.

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
      "component_id": "contact_management",
      "icon": "HeartPulse",
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

    // Best-effort attempt to extract an industry name from the prompt
    // e.g., "Build a veterinary clinic management system..." -> "veterinary clinic"
    const extractIndustryFromPrompt = (text) => {
      const match = text.match(/(?:build|create|make) (?:a|an) (.*?) (?:management system|workspace|app|software)/i);
      return match ? match[1].trim().replace(/\b\w/g, l => l.toUpperCase()) : 'Custom Workspace';
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
