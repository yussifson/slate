import re

filepath = 'src/pages/OnboardingWizard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

step1_start = content.find('{step === 1 && (')
step2_start = content.find('{step === 2 && (')
step3_start = content.find('{step === 3 && (')

step1_block = content[step1_start:step2_start]
step2_block = content[step2_start:step3_start]

step1_block = step1_block.replace('{step === 1 && (', '{step === 2 && (')
step2_block = step2_block.replace('{step === 2 && (', '{step === 1 && (')

orbit_prompt_ui = '''
                  {setupMode === 'orbit' && (
                    <div className="space-y-3 mt-6 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/20">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Describe Your Workspace</h3>
                        <p className="text-sm text-slate-500 mt-1">OrbitBuild will assemble the perfect workspace for you.</p>
                      </div>
                      <textarea
                        value={orbitPrompt}
                        onChange={(e) => setOrbitPrompt(e.target.value)}
                        placeholder="E.g., Build a veterinary clinic management system with pet records, appointments, and billing..."
                        className="w-full h-32 p-4 rounded-xl border border-primary/20 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                      />
                    </div>
                  )}
'''

label_replace = orbit_prompt_ui + '\n                    {setupMode !== "orbit" && <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t("industry", "Workspace Selection")}</label>}'
step1_block = step1_block.replace('                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t("industry", "Workspace Selection")}</label>', label_replace)

step1_block = step1_block.replace('<Select value={industry} onValueChange={setIndustry}>', '{setupMode !== "orbit" && <Select value={industry} onValueChange={setIndustry}>')
step1_block = step1_block.replace('</Select>\n                  </div>', '</Select>}\n                  </div>')

new_content = content[:step1_start] + step2_block + step1_block + content[step3_start:]

new_content = new_content.replace("if (step === 1 && industry === 'school' && !educationLevel)", "if (step === 2 && setupMode !== 'orbit' && industry === 'school' && !educationLevel)")
new_content = new_content.replace("if (step === 1 && isMissingMetadata && (!workspaceName || !subdomain))", "if (step === 2 && isMissingMetadata && (!workspaceName || !subdomain))")

new_content = new_content.replace("(step === 2 && setupMode === 'custom' && selectedModules.length === 0)", "(step === 1 && !setupMode) || (step === 2 && setupMode === 'custom' && selectedModules.length === 0) || (step === 2 && setupMode === 'orbit' && !orbitPrompt)")

new_content = new_content.replace("disabled={loading}", "disabled={loading || !!orbitProgress}")
new_content = new_content.replace("{loading ? (", "{loading || orbitProgress ? (")
new_content = new_content.replace('<span>{t("finalizing_workspace", "Finalizing Workspace...")}</span>', '<span>{orbitProgress || t("finalizing_workspace", "Finalizing Workspace...")}</span>')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("OnboardingWizard fully patched for OrbitBuild UI!")
