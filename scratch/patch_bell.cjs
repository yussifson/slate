const fs = require('fs');

let s = fs.readFileSync('src/components/universal/UnivNotificationCenter.jsx', 'utf8');
s = s.replace(/\r\n/g, '\n');

const oldBtn = `      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-full transition-all duration-300",
          isOpen ? "bg-primary/10 text-primary" : "hover:bg-muted text-[#71717a] dark:text-gray-400 hover:text-foreground"
        )}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500/10 rounded-full border-2 border-background animate-pulse"></span>
        )}
      </button>`;

const newBtn = `      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-full transition-all duration-200 focus:outline-none",
          isOpen ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/95 hover:text-white"
        )}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 drop-shadow-sm text-white" strokeWidth={2.2} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 border border-white shadow-sm"></span>
          </span>
        )}
      </button>`;

if (s.includes(oldBtn)) {
  s = s.replace(oldBtn, newBtn);
  fs.writeFileSync('src/components/universal/UnivNotificationCenter.jsx', s, 'utf8');
  console.log('UnivNotificationCenter successfully updated!');
} else {
  console.error('oldBtn not found!');
  process.exit(1);
}
