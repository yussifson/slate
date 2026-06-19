import { useTranslation } from "react-i18next";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar } from "lucide-react";
import { format, differenceInHours, isAfter } from "date-fns";

export default function HearingReminders({ hearings, userEmail, isAdmin }) {
  const { t } = useTranslation();
  const now = new Date();

  // Filter hearings within next 24 hours for this lawyer (or all if admin)
  const urgent = hearings.filter(h => {
    if (h.status !== "scheduled" || !h.date) return false;
    if (!isAdmin && h.lawyer_email && h.lawyer_email !== userEmail) return false;
    const hearingDate = new Date(h.date);
    const hoursUntil = differenceInHours(hearingDate, now);
    return hoursUntil >= 0 && hoursUntil <= 24;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  if (urgent.length === 0) return null;

  return (
    <div className="bg-amber-50 border-[0.5px] border-black/9 dark:border-white/8 border-amber-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-amber-100/70 border-b border-amber-200 flex items-center gap-2">
        <Bell className="w-4 h-4 text-amber-600 animate-pulse" />
        <span className="text-sm font-semibold text-amber-800">
          {urgent.length} {t("hearing", "Hearing")}{urgent.length > 1 ? "s" : ""} {t("within_24_hours", "Within 24 Hours")}
        </span>
      </div>
      <div className="divide-y divide-amber-100">
        {urgent.map(h => {
          const hoursUntil = differenceInHours(new Date(h.date), now);
          return (
            <div key={h.id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex flex-col items-center justify-center flex-shrink-0 border-[0.5px] border-black/9 dark:border-white/8 border-amber-200">
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-900 truncate">{h.title}</p>
                <p className="text-xs text-amber-700 truncate tracking-[0.04em]">
                  {h.court_name || h.case_title} · {h.time || "TBD"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <Badge className="bg-amber-500 text-white text-[10px] border-0">
                  {hoursUntil === 0 ? "< 1h" : `${hoursUntil}h`}
                </Badge>
                <p className="text-[10px] text-amber-600 mt-0.5">{format(new Date(h.date), "MMM d")}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}