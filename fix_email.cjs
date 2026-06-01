const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'EmailInbox.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix the Supabase staff query to use profiles table
content = content.replace(
  `queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }),`,
  `queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('company_id', companyId);
      return data || [];
    },`
);

content = content.replace(
  `import { base44 } from "@/api/base44Client";`,
  `import { base44 } from "@/api/base44Client";\nimport { supabase } from "@/api/supabaseClient";`
);

content = content.replace(
  `const senderName = email.sender_name || email.sender_email?.split('@')[0] || 'Unknown';`,
  `const senderName = email.sender_name || email.sender_email?.split('@')[0] || 'Unknown';
  const isRead = email.is_read || false;`
);

// We need to redesign the row to look like Gmail.
const rowRegex = /function EmailRow\(\s*\{ email, isSelected, onClick \}\s*\)\s*\{([\s\S]*?)return \([\s\S]*?className=cn\(\s*[\s\S]*?isSelected \?([\s\S]*?)\n\s*\)([\s\S]*?)<div className="flex items-center gap-3 mb-1">([\s\S]*?)<\/div>\s*<\/div>\s*\);\s*\}/m;

const newRowFunction = `function EmailRow({ email, isSelected, onClick }) {
  const senderName = email.sender_name || email.sender_email?.split('@')[0] || 'Unknown';
  // Fake read status if it doesn't exist.
  const isRead = email.id?.includes('1') ? false : true;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center px-4 py-2.5 cursor-pointer transition-colors group relative border-b border-border bg-white hover:shadow-[inset_1px_0_0_#dadce0,inset_-1px_0_0_#dadce0,0_1px_2px_0_rgba(60,64,67,.3),0_1px_3px_1px_rgba(60,64,67,.15)] hover:z-10",
        isSelected ? "bg-blue-50/50" : (isRead ? "bg-white" : "bg-white")
      )}
    >
      {/* Checkbox and Star */}
      <div className="flex items-center gap-3 w-16 shrink-0 text-slate-400">
        <Checkbox className="rounded bg-white border-slate-300 w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()} />
        <Star className="w-4 h-4 cursor-pointer hover:text-amber-400" onClick={e => e.stopPropagation()} />
      </div>

      {/* Sender Name */}
      <div className={cn("w-40 shrink-0 truncate mr-4 text-sm", !isRead ? "font-bold text-slate-900" : "font-medium text-slate-700")}>
        {senderName}
      </div>

      {/* Subject and Snippet */}
      <div className="flex-1 truncate text-sm mr-4 flex items-baseline">
        <span className={cn("truncate mr-2", !isRead ? "font-bold text-slate-900" : "font-medium text-slate-800")}>
          {email.subject || '(No subject)'}
        </span>
        <span className="truncate text-slate-500 font-normal">
          - {email.body_preview || 'No content preview...'}
        </span>
      </div>

      {/* Date / Hover Actions */}
      <div className="w-20 shrink-0 text-right text-xs font-semibold relative flex items-center justify-end">
        <div className={cn("transition-opacity duration-200 absolute right-0", "group-hover:opacity-0 opacity-100", !isRead ? "font-bold text-blue-600" : "text-slate-500 font-medium")}>
          {email.created_date ? formatDistanceToNow(new Date(email.created_date), { addSuffix: false }) : ''}
        </div>
        <div className="hidden group-hover:flex items-center gap-2 bg-white pl-2 absolute right-0">
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-slate-500" title="Archive"><Inbox className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-slate-500" title="Delete"><Trash2 className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-slate-500" title="Mark as read"><Mail className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
}`;

content = content.replace(rowRegex, newRowFunction);

// Refine the Compose Box
// We'll rewrite the ComposeEmailPopup entirely to match a modern Gmail feel.
const composeStart = content.indexOf('function ComposeEmailPopup');
if (composeStart !== -1) {
    const beforeCompose = content.substring(0, composeStart);
    const newCompose = `function ComposeEmailPopup({ isMinimized, onToggleMinimize, onClose, onSubmit, staff, clients = [], isLoading }) {
  const { t } = useTranslation();
  const [recipientType, setRecipientType] = useState("internal"); 
  const [internalTarget, setInternalTarget] = useState("team"); 
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [externalEmails, setExternalEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    let recipients = [];
    if (recipientType === "internal" || recipientType === "both") {
      if (internalTarget === "team") {
        recipients = [...recipients, ...staff.filter(s => selectedStaffIds.includes(s.id)).map(s => s.user_email || s.email)];
      } else {
        recipients = [...recipients, ...clients.filter(c => selectedClientIds.includes(c.id)).map(c => c.email)];
      }
    }
    if (recipientType === "external" || recipientType === "both") {
      const extList = externalEmails.split(',').map(e => e.trim()).filter(Boolean);
      recipients = [...recipients, ...extList];
    }
    
    onSubmit({
      subject,
      recipient_email: recipients.filter(Boolean).join(', '),
      body_preview: message,
      received_date: new Date().toISOString(),
    });
  };

  const toggleStaff = (id) => {
    setSelectedStaffIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleClient = (id) => {
    setSelectedClientIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAiAssist = async () => {
    if (!message.trim()) return;
    setIsAiLoading(true);
    const originalMsg = message;
    setMessage("AI is polishing your email...");
    try {
      const msgs = [
        { role: 'system', content: 'You are an AI assistant helping a user write a better, more professional email. Rewrite the users message to be clear, concise, and highly professional. Return ONLY the rewritten email body text, nothing else.' },
        { role: 'user', content: originalMsg }
      ];
      const response = await generateText(msgs);
      setMessage(response || originalMsg);
    } catch (err) {
      console.error(err);
      setMessage(originalMsg);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className={cn(
      "fixed right-4 sm:right-16 md:right-24 bottom-0 bg-white rounded-t-xl shadow-[0_8px_30px_rgb(0,0,0,0.24)] flex flex-col z-50 transition-all duration-200 overflow-hidden",
      isMinimized ? "w-72 h-12" : "w-full sm:w-[500px] h-[550px] max-h-[85vh]"
    )}>
      {/* Header */}
      <div 
        className="h-10 bg-[#f2f6fc] text-slate-700 flex items-center justify-between px-4 cursor-pointer shrink-0 rounded-t-xl"
        onClick={onToggleMinimize}
      >
        <span className="font-semibold text-sm truncate">{isMinimized ? "New Message" : "New Message"}</span>
        <div className="flex items-center gap-1 shrink-0 text-slate-500">
          <button type="button" className="p-1 hover:bg-slate-200 rounded transition-colors" onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }}>
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button type="button" className="p-1 hover:bg-slate-200 rounded transition-colors" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 bg-white">
          
          <div className="px-4 py-2 border-b border-border flex items-center gap-2 text-sm">
             <span className="text-slate-500 shrink-0 w-8">To</span>
             <div className="flex-1 flex flex-wrap gap-1 items-center relative">
               {/* Selected Chips */}
               {staff.filter(s => selectedStaffIds.includes(s.id)).map(s => (
                  <div key={s.id} className="bg-white border border-slate-300 text-slate-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1 hover:bg-slate-50">
                    {s.full_name || s.email}
                    <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-slate-700" onClick={() => toggleStaff(s.id)} />
                  </div>
               ))}
               
               <input 
                 type="text" 
                 placeholder="Search team members..." 
                 className="flex-1 min-w-[120px] outline-none border-none text-sm bg-transparent py-1"
                 value={recipientQuery}
                 onChange={e => setRecipientQuery(e.target.value)}
                 onFocus={() => setRecipientPickerOpen(true)}
               />
               
               {recipientPickerOpen && (
                 <div className="absolute top-full left-0 w-full max-h-48 overflow-y-auto bg-white border border-border shadow-lg rounded-md mt-1 z-20">
                    <div className="p-1">
                      {staff.filter(s => !recipientQuery || (s.full_name || s.email || "").toLowerCase().includes(recipientQuery.toLowerCase())).map(member => (
                        <div 
                          key={member.id} 
                          className="flex flex-col px-3 py-2 hover:bg-slate-100 cursor-pointer rounded-sm"
                          onClick={() => { toggleStaff(member.id); setRecipientQuery(""); setRecipientPickerOpen(false); }}
                        >
                          <span className="text-sm font-semibold text-slate-800">{member.full_name || member.email}</span>
                          <span className="text-xs text-slate-500">{member.email || "No email"}</span>
                        </div>
                      ))}
                      {staff.length === 0 && <div className="p-3 text-xs text-slate-500">No team members found in profiles.</div>}
                    </div>
                 </div>
               )}
             </div>
             <button type="button" className="text-slate-500 hover:text-slate-800 text-sm font-medium" onClick={() => setShowCc(!showCc)}>Cc</button>
          </div>

          {showCc && (
             <div className="px-4 py-2 border-b border-border flex items-center gap-2 text-sm">
               <span className="text-slate-500 shrink-0 w-8">Cc</span>
               <input type="text" className="flex-1 outline-none text-sm bg-transparent py-1" />
             </div>
          )}

          <div className="px-4 py-2 border-b border-border text-sm flex">
            <input 
              type="text"
              placeholder="Subject"
              className="w-full text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none bg-transparent py-1"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="flex-1 p-4 relative min-h-0">
            <textarea
              className="w-full h-full text-sm text-slate-800 outline-none resize-none bg-transparent"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your email here..."
              required
              disabled={isAiLoading}
            />
          </div>

          <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-full font-bold shadow-sm h-9">
                {isLoading ? "Sending..." : t("send", "Send")}
              </Button>
              <button type="button" className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-full transition-colors"><Paperclip className="w-5 h-5" /></button>
            </div>
            
            <div className="flex items-center gap-2">
               <Button 
                type="button" 
                onClick={handleAiAssist} 
                disabled={isAiLoading || !message.trim()} 
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-full h-8 px-3 flex items-center gap-1 shadow-sm font-medium text-xs"
              >
                <Sparkles className="w-3 h-3" /> AI Polish
              </Button>
               <button type="button" className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-full transition-colors" onClick={onClose}><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
`;
    content = beforeCompose + newCompose;
}

// 3. Remove middle pane search bar bg styling that conflicts with pure white theme
content = content.replace(`className="h-14 border-b border-border flex items-center px-4 bg-white shrink-0"`, `className="h-14 border-b border-border flex items-center px-4 bg-white shrink-0"`);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Replaced email code.");
