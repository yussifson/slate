import os
import re

def process_file(file_path, logic):
    if not os.path.exists(file_path):
        return False
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = logic(content)
    if new_content and new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched {file_path}")
        return True
    return False

def add_imports(content):
    if "import { RevenueForecastCard, BehaviourProfilePanel, BenchmarkingPanel }" not in content:
        content = content.replace("import React", "import React from 'react';\nimport { RevenueForecastCard, BehaviourProfilePanel, BenchmarkingPanel } from '@/components/intelligence/IntelligenceUI';\n//import React")
        content = content.replace("//import React from 'react';\n", "")
        content = content.replace("//import React", "")
    return content

def patch_dashboards():
    dashboards = [
        "src/components/dashboard/LawDashboard.jsx",
        "src/components/dashboard/SchoolDashboard.jsx",
        "src/components/dashboard/HospitalDashboard.jsx",
        "src/components/dashboard/GenericDashboard.jsx"
    ]
    for d in dashboards:
        def logic(content):
            c = add_imports(content)
            # Find the top metrics row and insert the forecast card after it
            # Usually ends with a grid of cards
            if '<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">' in c:
                # Add Forecast Card below the main metrics
                c = re.sub(
                    r'(<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">.*?</Card>\s*</div>)',
                    r'\1\n        <div className="mt-4"><RevenueForecastCard vertical={industry || "generic"} /></div>',
                    c,
                    flags=re.DOTALL
                )
            return c
        process_file(d, logic)

def patch_billing():
    billing = [
        "src/pages/BillingDashboard.jsx",
        "src/pages/hospital/HospitalBilling.jsx",
        "src/pages/Invoices.jsx"
    ]
    for b in billing:
        def logic(content):
            c = add_imports(content)
            if '<TabsContent value="overview"' in c:
                c = re.sub(
                    r'(<TabsContent value="overview".*?>\s*<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">.*?</Card>\s*</div>)',
                    r'\1\n          <div className="mt-4"><RevenueForecastCard vertical={"universal"} /></div>',
                    c,
                    flags=re.DOTALL
                )
            elif '<div className="grid gap-4 md:grid-cols-3">' in c:
                c = re.sub(
                    r'(<div className="grid gap-4 md:grid-cols-3">.*?</Card>\s*</div>)',
                    r'\1\n        <div className="mt-4"><RevenueForecastCard vertical={"universal"} /></div>',
                    c,
                    flags=re.DOTALL
                )
            return c
        process_file(b, logic)

def patch_analytics():
    analytics = [
        "src/pages/ReportsDashboard.jsx",
        "src/pages/PerformanceDashboard.jsx"
    ]
    for a in analytics:
        def logic(content):
            c = add_imports(content)
            # Insert benchmarking panel
            c = re.sub(
                r'(<TabsContent value="overview".*?>)',
                r'\1\n          <div className="mb-4"><BenchmarkingPanel vertical={"universal"} /></div>',
                c,
                flags=re.DOTALL
            )
            return c
        process_file(a, logic)

def patch_entities():
    # We will search for all files that might have a detail sheet/modal
    entity_files = []
    for root, dirs, files in os.walk("src/pages"):
        for file in files:
            if file in ["Patients.jsx", "Clients.jsx", "Employees.jsx", "Students.jsx", "Guests.jsx", "Team.jsx", "Leads.jsx"]:
                entity_files.append(os.path.join(root, file))
    
    for e in entity_files:
        def logic(content):
            c = add_imports(content)
            # Look for SheetContent or DialogContent
            if 'viewPatient' in c:
                c = re.sub(
                    r'(<SheetDescription>.*?)</SheetHeader>',
                    r'\1\n              <BehaviourProfilePanel profile={{churn_risk: "low", payment_reliability: "reliable", engagement_trend: "stable", profile_confidence: 85}} entityType="patient" />\n            </SheetHeader>',
                    c,
                    flags=re.DOTALL
                )
            if 'viewClient' in c or 'viewStudent' in c or 'viewEmployee' in c:
                c = re.sub(
                    r'(<SheetDescription>.*?)</SheetHeader>',
                    r'\1\n              <BehaviourProfilePanel profile={{churn_risk: "low", payment_reliability: "reliable", engagement_trend: "stable", profile_confidence: 85}} entityType="entity" />\n            </SheetHeader>',
                    c,
                    flags=re.DOTALL
                )
            return c
        process_file(e, logic)

if __name__ == "__main__":
    patch_dashboards()
    patch_billing()
    patch_analytics()
    patch_entities()
