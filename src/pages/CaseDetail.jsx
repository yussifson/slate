import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { ArrowLeft, Clock, FolderOpen, Wallet, FileText, Receipt, PenTool, MessageSquare, Sparkles, CheckSquare } from "lucide-react";
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

export default function CaseDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const caseData = location.state?.caseData;

  const { data: clients = [] } = useQuery({
    queryKey: ["case-client", caseData?.client_id],
    queryFn: () => base44.entities.Client.filter({ id: caseData?.client_id }),
    enabled: !!caseData?.client_id,
  });
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
            <h1 className="text-xl font-bold text-foreground truncate">{caseData.title}</h1>
            <Badge className={`${CASE_STATUS_COLORS[caseData.status]} text-[10px]`}>{caseData.status?.replace("_", " ")}</Badge>
            <Badge className={`${PRIORITY_COLORS[caseData.priority]} text-[10px]`}>{caseData.priority}</Badge>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {caseData.case_number && <span>#{caseData.case_number}</span>}
            {caseData.client_name && <span>Client: {caseData.client_name}</span>}
            {caseData.assigned_lawyer_name && <span>Lawyer: {caseData.assigned_lawyer_name}</span>}
            {caseData.case_type && <span className="capitalize">{caseData.case_type}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="time">
        <TabsList>
          <TabsTrigger value="time" className="gap-1.5"><Clock className="w-3.5 h-3.5" />Billable Hours</TabsTrigger>
          <TabsTrigger value="retainer" className="gap-1.5"><Wallet className="w-3.5 h-3.5" />Retainer</TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5"><FolderOpen className="w-3.5 h-3.5" />Documents</TabsTrigger>
          <TabsTrigger value="messages" className="gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Team Chat</TabsTrigger>
          <TabsTrigger value="client-messages" className="gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Client Chat</TabsTrigger>
          <TabsTrigger value="expenses" className="gap-1.5"><Receipt className="w-3.5 h-3.5" />Expenses</TabsTrigger>
          <TabsTrigger value="esign" className="gap-1.5"><PenTool className="w-3.5 h-3.5" />E-Signatures</TabsTrigger>
          <TabsTrigger value="pdf" className="gap-1.5"><FileText className="w-3.5 h-3.5" />Generate PDF</TabsTrigger>
          <TabsTrigger value="ai-review" className="gap-1.5"><Sparkles className="w-3.5 h-3.5" />AI Review</TabsTrigger>
          <TabsTrigger value="checklist" className="gap-1.5"><CheckSquare className="w-3.5 h-3.5" />Client Checklist</TabsTrigger>
        </TabsList>
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
        <TabsContent value="checklist" className="mt-4">
          <ClientChecklistManager caseData={caseData} client={client} user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}