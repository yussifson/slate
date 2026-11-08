const fs = require('fs');

let s = fs.readFileSync('src/pages/real-estate-jcl/JCLEngagements.jsx', 'utf8');
s = s.replace(/\r\n/g, '\n');

// Replace the line 107 views with a clean, high-density, professional List View layout:
const oldViews = `{loading ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : tab === 'engagements' ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <button key={item.id} onClick={() => setSelected(item)} className="group rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary/50 hover:shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.engagement_number}</p><h2 className="mt-1 font-bold text-foreground">{item.title}</h2></div><ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" /></div><p className="mt-3 text-sm text-muted-foreground">{item.client?.primary_name || 'Client not linked'}</p><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">{typeLabel(item.engagement_type)}</span><span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{item.status.replaceAll('_', ' ')}</span></div>{item.site_address && <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{item.site_address}</p>}</button>)}{filtered.length === 0 && <EmptyState label="No engagements yet" />}</div> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{projects.filter((item) => \`\${item.name} \${item.project_code}\`.toLowerCase().includes(search.toLowerCase())).map((item) => <div key={item.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.project_code}</p><h2 className="mt-1 font-bold">{item.name}</h2></div><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div><p className="mt-3 text-sm text-muted-foreground">{item.client?.primary_name || 'Standalone service project'}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: \`\${item.progress_percentage || 0}%\` }} /></div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{item.status.replaceAll('_', ' ')}</span><span>{item.progress_percentage || 0}%</span></div></div>)}{projects.length === 0 && <EmptyState label="No projects created from engagements yet" />}</div>}`;

const newViews = `{loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : tab === 'engagements' ? (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3.5 px-4">Ref Code</th>
                  <th className="py-3.5 px-4">Engagement Title</th>
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Engagement Type</th>
                  <th className="py-3.5 px-4">Site Location</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className="group hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-primary">
                      {item.engagement_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {item.title}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {item.client?.primary_name || <span className="italic text-muted-foreground/60">Unlinked</span>}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-foreground">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-primary">
                        {typeLabel(item.engagement_type)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground truncate max-w-[200px]">
                      {item.site_address ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                          {item.site_address}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={\`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider \${
                        item.status === 'converted_to_project' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        item.status === 'under_review' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                        'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }\`}>
                        {item.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(item); }}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        Details <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No engagements found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3.5 px-4">Project Code</th>
                  <th className="py-3.5 px-4">Project Name</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Budget</th>
                  <th className="py-3.5 px-4">Progress</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {projects
                  .filter((item) => \`\${item.name} \${item.project_code}\`.toLowerCase().includes(search.toLowerCase()))
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-primary">
                        {item.project_code}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {item.client?.primary_name || <span className="italic text-muted-foreground/60">Standalone Delivery Project</span>}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-foreground">
                        {item.budget_amount ? \`$\${Number(item.budget_amount).toLocaleString()}\` : '—'}
                      </td>
                      <td className="py-3.5 px-4 min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-300"
                              style={{ width: \`\${item.progress_percentage || 0}%\` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-muted-foreground w-8 text-right">
                            {item.progress_percentage || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {item.status?.replaceAll('_', ' ') || 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" /> Ready
                        </span>
                      </td>
                    </tr>
                  ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No delivery projects created from engagements yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}`;

if (s.includes(oldViews)) {
  s = s.replace(oldViews, newViews);
  fs.writeFileSync('src/pages/real-estate-jcl/JCLEngagements.jsx', s, 'utf8');
  console.log('Successfully updated JCLEngagements.jsx to List View!');
} else {
  console.error('oldViews target not found!');
  process.exit(1);
}
