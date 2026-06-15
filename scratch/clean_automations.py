import re

with open('src/pages/Automations.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the duplicate AnimatePresence / mode === 'logs' issues at the bottom
content = content.replace("""                    {mode === 'logs' && (
              <motion.div
                key="logs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ExecutionLogs companyId={companyId} />
              </motion.div>
            )}
          </AnimatePresence>""", "</AnimatePresence>")

content = content.replace("""          {mode === 'logs' && (
              <motion.div
                key="logs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ExecutionLogs companyId={companyId} />
              </motion.div>
            )}
          </AnimatePresence>""", "</AnimatePresence>")

content = content.replace("""</AnimatePresence>
      </div>
    </div>
  );
}""", """          {mode === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ExecutionLogs companyId={companyId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}""")

with open('src/pages/Automations.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
