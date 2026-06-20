import { useTranslation } from "react-i18next";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { ArrowLeft, Clock, FolderOpen, Wallet, FileText, Receipt, PenTool, MessageSquare, Sparkles, CheckSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CASE_STATUS_COLORS, PRIORITY_COLORS } from "@/lib/constants";
import CaseTimeTracker from "@/components/cases/CaseTimeTracker";
import CaseDocumentRepo from "@/components/cases/CaseDocumentRepo";
import RetainerPanel from "@/components/cases/RetainerPanel";
import CasePDFGenerator from "@/components/cases/CasePDFGenerator";
import CaseExpenses from "@/components/cases/CaseExpenses";
import ESignaturePanel from "@/components/cases/ESignaturePanel";
import CaseMessaging from "@/components/cases/CaseMessaging";
import ClientMessaging from "@/components/portal/ClientMessaging";
import AIDocumentReview from "@/components/cases/AIDocumentReview";
import ClientChecklistManager from "@/components/cases/ClientChecklistManager";
import CaseCommunications from "@/components/cases/CaseCommunications";
import CaseTimeline from "@/components/cases/CaseTimeline";
import AILegalStrategy from "@/components/cases/AILegalStrategy";

export default function CaseDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const caseData = location.state?.caseData;

  const { data: clients = [] } = useQuery({
    queryKey: ["case-client", caseData?.client_id],
    queryFn: () => base44.entities.Client.filter({ id: caseData?.client_id }),
    enabled: !!caseData?.client_id});
  const client = clients[0];

  if (!caseData) {
    navigate("/cases");
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cases")} className="mt-0.5 shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold text-foreground truncate">{caseData.title}</h1>
            <Badge className={`${CASE_STATUS_COLORS[caseData.status]} text-[10px]`}>{caseData.status?.replace("_", " ")}</Badge>
            <Badge className={`${PRIORITY_COLORS[caseData.priority]} text-[10px]`}>{caseData.priority}</Badge>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">
            {caseData.case_number && <span>#{caseData.case_number}</span>}
            {caseData.client_name && <span>{t("client", "Client:")} {caseData.client_name}</span>}
            {caseData.assigned_lawyer_name && <span>{t("lawyer", "Lawyer:")} {caseData.assigned_lawyer_name}</span>}
            {caseData.case_type && <span className="capitalize">{caseData.case_type}</span>}
          </div>
        </div>
      </div>
      {/* Tabs */}
      <Tabs defaultValue="time" className="w-full">
        <div className="w-full overflow-x-auto scrollbar-hide pb-2">
          <TabsList className="w-max min-w-full justify-start">
            <TabsTrigger value="time" className="gap-2.5"><Clock className="w-3.5 h-3.5" />{t("billable_hours", "Billable Hours")}</TabsTrigger>
          <TabsTrigger value="retainer" className="gap-2.5"><Wallet className="w-3.5 h-3.5" />{t("retainer", "Retainer")}</TabsTrigger>
          <TabsTrigger value="documents" className="gap-2.5"><FolderOpen className="w-3.5 h-3.5" />{t("documents", "Documents")}</TabsTrigger>
          <TabsTrigger value="messages" className="gap-2.5"><MessageSquare className="w-3.5 h-3.5" />{t("team_chat", "Team Chat")}</TabsTrigger>
          <TabsTrigger value="client-messages" className="gap-2.5"><MessageSquare className="w-3.5 h-3.5" />{t("client_chat", "Client Chat")}</TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2.5"><Receipt className="w-3.5 h-3.5" />{t("expenses", "Expenses")}</TabsTrigger>
          <TabsTrigger value="esign" className="gap-2.5"><PenTool className="w-3.5 h-3.5" />{t("e_signatures", "E-Signatures")}</TabsTrigger>
          <TabsTrigger value="pdf" className="gap-2.5"><FileText className="w-3.5 h-3.5" />{t("generate_pdf", "Generate PDF")}</TabsTrigger>
          <TabsTrigger value="ai-review" className="gap-2.5"><Sparkles className="w-3.5 h-3.5" />{t("ai_review", "AI Review")}</TabsTrigger>
          <TabsTrigger value="ai-strategy" className="gap-2.5"><Sparkles className="w-3.5 h-3.5 text-primary" />{t("ai_strategy", "AI Strategy")}</TabsTrigger>
          <TabsTrigger value="checklist" className="gap-2.5"><CheckSquare className="w-3.5 h-3.5" />{t("client_checklist", "Client Checklist")}</TabsTrigger>
          <TabsTrigger value="comms" className="gap-2.5"><Send className="w-3.5 h-3.5" />{t("communications", "Communications")}</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2.5"><Clock className="w-3.5 h-3.5" />{t("diary_timeline", "Diary / Timeline")}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="time" className="mt-4">
          <CaseTimeTracker caseData={caseData} user={user} />
        </TabsContent>
        <TabsContent value="retainer" className="mt-4">
          <RetainerPanel caseData={caseData} user={user} />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <CaseDocumentRepo caseData={caseData} user={user} />
        </TabsContent>
        <TabsContent value="messages" className="mt-4">
          <CaseMessaging caseData={caseData} user={user} />
        </TabsContent>
        <TabsContent value="client-messages" className="mt-4">
          <ClientMessaging caseData={caseData} user={user} senderType="lawyer" />
        </TabsContent>
        <TabsContent value="expenses" className="mt-4">
          <CaseExpenses caseData={caseData} user={user} />
        </TabsContent>
        <TabsContent value="esign" className="mt-4">
          <ESignaturePanel caseData={caseData} user={user} />
        </TabsContent>
        <TabsContent value="pdf" className="mt-4">
          <CasePDFGenerator caseData={caseData} user={user} />
        </TabsContent>
        <TabsContent value="ai-review" className="mt-4">
          <AIDocumentReview caseData={caseData} user={user} />
        </TabsContent>
        <TabsContent value="ai-strategy" className="mt-4">
          <AILegalStrategy caseData={caseData} user={user} />
        </TabsContent>
        <TabsContent value="checklist" className="mt-4">
          <ClientChecklistManager caseData={caseData} client={client} user={user} />
        </TabsContent>
        <TabsContent value="comms" className="mt-4">
          <CaseCommunications caseData={caseData} client={client} user={user} />
        </TabsContent>
        <TabsContent value="timeline" className="mt-4">
          <CaseTimeline caseData={caseData} user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}