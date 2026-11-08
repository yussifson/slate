with open('src/pages/real-estate-jcl/JCLOffers.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

target1 = ') : (\n        {/* Mobile Native Card View (< md) */}'
replacement1 = ') : (\n        <div className="space-y-3">\n          {/* Mobile Native Card View (< md) */}'

target2 = '</table>\n          </div>\n        </div>\n      )}'
replacement2 = '</table>\n          </div>\n        </div>\n        </div>\n      )}'

c = c.replace(target1, replacement1)
c = c.replace(target2, replacement2)

with open('src/pages/real-estate-jcl/JCLOffers.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Fixed JCLOffers tags via python')
