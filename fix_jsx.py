import os

with open('src/components/AiAssistant.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace opening div with Fragment
content = content.replace('<div className="flex-1 flex flex-col min-h-0 relative">', '<>')

# Replace the closing div with Fragment closing tag
# We look for the end of the file which currently has an extra </div>
old_end = '''          </div>
        </div>
      </div>
          </div>
        )}

    </div>
  );
}'''

new_end = '''          </div>
        </div>
      </div>
          </>
        )}

    </div>
  );
}'''

content = content.replace(old_end, new_end)

with open('src/components/AiAssistant.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
