const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Chat.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add missing imports
if (!content.includes('import EmojiPicker')) {
    content = content.replace(
        'import { Search, Plus, MessageSquare, MoreVertical, Send, Sparkles, Hash, Users, UserCircle, Phone, Video, Loader2, CheckCheck, Check } from "lucide-react";',
        `import { Search, Plus, MessageSquare, MoreVertical, Send, Sparkles, Hash, Users, UserCircle, Phone, Video, Loader2, CheckCheck, Check, Smile, Paperclip, ImageIcon, FileText, File } from "lucide-react";\nimport EmojiPicker from "emoji-picker-react";\nimport { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";`
    );
}

// 2. Add state for UI
if (!content.includes('const [showEmojiPicker')) {
    content = content.replace(
        'const [isUploading, setIsUploading] = useState(false);',
        `const [isUploading, setIsUploading] = useState(false);\n  const [showEmojiPicker, setShowEmojiPicker] = useState(false);\n  const [showAttachMenu, setShowAttachMenu] = useState(false);`
    );
}

// 3. Fix the subscription to prevent duplicate messages
content = content.replace(
    /setMessages\(prev => \[\.\.\.prev, payload\.new\]\);/g,
    `setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);`
);

// 4. Fix rendering of attachment messages
const msgRenderOld = `<div className="whitespace-pre-wrap pr-12">{msg.content}</div>`;
const msgRenderNew = `{msg.content.startsWith('[Attachment|') ? (
                          <div className="pr-12 pt-1 pb-1">
                            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                              {msg.content.split('|')[2].startsWith('data:image') ? (
                                <img src={msg.content.split('|')[2].slice(0, -1)} alt="attachment" className="max-w-[200px] rounded object-cover" />
                              ) : (
                                <>
                                  <FileText className="w-8 h-8 text-blue-500" />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold truncate max-w-[150px]">{msg.content.split('|')[1]}</span>
                                    <span className="text-xs text-muted-foreground">Document</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap pr-12">{msg.content}</div>
                        )}`;
if (content.includes(msgRenderOld)) {
    content = content.replace(msgRenderOld, msgRenderNew);
}

// 5. Replace the Input Area
const inputAreaStart = content.indexOf('{/* Input Area */}');
const inputAreaEnd = content.indexOf('</>', inputAreaStart);

if (inputAreaStart !== -1 && inputAreaEnd !== -1) {
    const inputAreaNew = `{/* Input Area */}
            <div className="px-4 py-3 bg-[#f0f2f5] dark:bg-[#202c33] z-10 flex items-center gap-2 border-t border-border">
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
              <input type="file" accept="image/*" id="chat-image-upload" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
              <input type="file" accept=".pdf,.doc,.docx,.txt" id="chat-doc-upload" className="hidden" onChange={(e) => handleFileUpload(e, 'doc')} />
              
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 shrink-0">
                    <Smile className="w-6 h-6" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-auto p-0 border-none bg-transparent shadow-none mb-2">
                  <EmojiPicker onEmojiClick={(e) => setInputValue(prev => prev + e.emoji)} />
                </PopoverContent>
              </Popover>

              <Popover open={showAttachMenu} onOpenChange={setShowAttachMenu}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 shrink-0">
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-6 h-6" />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-48 p-2 mb-2 rounded-2xl flex flex-col gap-1 shadow-xl">
                   <Button variant="ghost" className="justify-start gap-3 w-full rounded-xl hover:bg-blue-50 hover:text-blue-600" onClick={() => document.getElementById('chat-doc-upload')?.click()}>
                     <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><FileText className="w-4 h-4"/></div>
                     Document
                   </Button>
                   <Button variant="ghost" className="justify-start gap-3 w-full rounded-xl hover:bg-rose-50 hover:text-rose-600" onClick={() => document.getElementById('chat-image-upload')?.click()}>
                     <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600"><ImageIcon className="w-4 h-4"/></div>
                     Photos & Videos
                   </Button>
                   <Button variant="ghost" className="justify-start gap-3 w-full rounded-xl hover:bg-violet-50 hover:text-violet-600" onClick={() => fileInputRef.current?.click()}>
                     <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600"><File className="w-4 h-4"/></div>
                     File
                   </Button>
                </PopoverContent>
              </Popover>
              
              <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg relative flex items-center shadow-sm">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message"
                  className="w-full bg-transparent border-none px-4 py-2.5 text-sm focus:ring-0 focus:outline-none"
                />
                <button onClick={handleAiAssist} className="absolute right-3 p-1 text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors" title="AI Magic Rewrite">
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
              
              <Button 
                onClick={handleSend}
                disabled={!inputValue.trim()}
                size="icon" 
                className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 shadow-sm shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          `;
    content = content.substring(0, inputAreaStart) + inputAreaNew + content.substring(inputAreaEnd);
}

// 6. Fix handleFileUpload signature
content = content.replace(
    /const handleFileUpload = async \(e\) => {/g,
    `const handleFileUpload = async (e, type = 'file') => {`
);
content = content.replace(
    /const mockUrl = \`\[File: \$\{file\.name\}\]\`;/g,
    `
      let mockUrl = \`[Attachment|\${file.name}|url]\`;
      if (type === 'image') {
        mockUrl = \`[Attachment|\${file.name}|data:image/png;base64,mock]\`;
      }
    `
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Chat page successfully updated.");
