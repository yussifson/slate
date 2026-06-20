import os
import re

def fix_imports():
    for root, dirs, files in os.walk("src"):
        for file in files:
            if file.endswith(".jsx"):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # We look for lines starting with `, { ` and replace `, ` with `import `
                # Specifically matching after our injected import
                pattern = r"(import \{ RevenueForecastCard, BehaviourProfilePanel, BenchmarkingPanel \} from '@/components/intelligence/IntelligenceUI';\n), "
                new_content = re.sub(pattern, r"\1import ", content)
                
                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed {file_path}")

if __name__ == "__main__":
    fix_imports()
