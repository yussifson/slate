import re

filepath = 'src/pages/OnboardingWizard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add the import
if 'import { generateOrbitBuildWorkspace }' not in content:
    content = content.replace("import { COUNTRIES_CURRENCIES } from '@/config/countries';", "import { COUNTRIES_CURRENCIES } from '@/config/countries';\nimport { generateOrbitBuildWorkspace } from '@/lib/orbitBuildGenerator';")

# Replace step 1, 2, 3 in the state
if 'const [orbitPrompt, setOrbitPrompt] = useState("");' not in content:
    content = content.replace("const [educationLevel, setEducationLevel] = useState('');", "const [educationLevel, setEducationLevel] = useState('');\n  const [orbitPrompt, setOrbitPrompt] = useState('');\n  const [orbitProgress, setOrbitProgress] = useState('');")

# Re-write the steps logic in handleCompleteOnboarding
# We'll just do it in the UI and trigger OrbitBuild during handleCompleteOnboarding

old_handleComplete = '''      // 5. Refresh user session and go to dashboard
      await refreshUser();'''

new_handleComplete = '''      // Handle OrbitBuild if selected
      if (setupMode === 'orbit' && orbitPrompt) {
         setOrbitProgress("Analyzing Industry & Assembling Workspace...");
         try {
             await generateOrbitBuildWorkspace(orbitPrompt, companyIdToUse);
         } catch (err) {
             console.error("OrbitBuild Error", err);
             toast({ title: "OrbitBuild Failed", description: err.message, variant: "destructive" });
         }
         setOrbitProgress("");
      }

      // 5. Refresh user session and go to dashboard
      await refreshUser();'''

content = content.replace(old_handleComplete, new_handleComplete)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched basic stuff")
