/**
 * Real Estate Notifications Service
 * Supabase Edge Function for Novu integration
 * Handles all notification events for real estate vertical
 */

import { Novu } from "@novu/node";

const novu = new Novu(Deno.env.get("NOVU_API_KEY") || "");

type NotificationEvent =
  | "offer_created"
  | "offer_accepted"
  | "counter_offer_created"
  | "document_ready_for_signature"
  | "signature_completed"
  | "commission_payment_processed"
  | "rent_payment_due"
  | "rent_payment_overdue"
  | "maintenance_assigned"
  | "maintenance_completed"
  | "lease_renewal_offered"
  | "lease_expiring_soon"
  | "client_score_updated"
  | "agent_recommendation";

async function sendNotification(
  event: NotificationEvent,
  recipientId: string,
  data: Record<string, any>
) {
  try {
    await novu.trigger(event, {
      to: {
        subscriberId: recipientId,
      },
      payload: data,
    });
  } catch (error) {
    console.error(`[Notifications] Failed to send ${event}:`, error);
    throw error;
  }
}

async function sendOfferNotification(
  recipientId: string,
  eventType: "created" | "accepted" | "counter_offered",
  offerData: any
) {
  const eventMap = {
    created: "offer_created" as const,
    accepted: "offer_accepted" as const,
    counter_offered: "counter_offer_created" as const,
  };

  await sendNotification(eventMap[eventType], recipientId, {
    propertyAddress: offerData.propertyAddress,
    offerAmount: offerData.offerAmount,
    buyerName: offerData.buyerName,
    counterOfferPrice: offerData.counterOfferPrice,
    actionUrl: `/offers/${offerData.offerId}`,
  });
}

async function sendDocumentNotification(
  recipientId: string,
  documentData: any
) {
  await sendNotification("document_ready_for_signature", recipientId, {
    documentTitle: documentData.documentTitle,
    documentType: documentData.documentType,
    signaturesRequired: documentData.signaturesRequired,
    expirationDate: documentData.expirationDate,
    signatureLink: documentData.signatureLink,
  });
}

async function sendCommissionNotification(
  recipientId: string,
  commissionData: any
) {
  await sendNotification("commission_payment_processed", recipientId, {
    transactionId: commissionData.transactionId,
    commissionAmount: commissionData.commissionAmount,
    agentName: commissionData.agentName,
    paymentDate: commissionData.paymentDate,
    paymentReference: commissionData.paymentReference,
  });
}

async function sendRentPaymentNotification(
  recipientId: string,
  type: "due" | "overdue",
  paymentData: any
) {
  const eventMap = {
    due: "rent_payment_due" as const,
    overdue: "rent_payment_overdue" as const,
  };

  await sendNotification(eventMap[type], recipientId, {
    propertyAddress: paymentData.propertyAddress,
    amount: paymentData.amount,
    dueDate: paymentData.dueDate,
    tenantName: paymentData.tenantName,
    paymentUrl: `/payments/${paymentData.leaseId}`,
    daysOverdue: paymentData.daysOverdue,
  });
}

async function sendMaintenanceNotification(
  recipientId: string,
  type: "assigned" | "completed",
  maintenanceData: any
) {
  const eventMap = {
    assigned: "maintenance_assigned" as const,
    completed: "maintenance_completed" as const,
  };

  await sendNotification(eventMap[type], recipientId, {
    propertyAddress: maintenanceData.propertyAddress,
    serviceCategory: maintenanceData.serviceCategory,
    contractorName: maintenanceData.contractorName,
    scheduledDate: maintenanceData.scheduledDate,
    completionNotes: maintenanceData.completionNotes,
    maintenanceId: maintenanceData.maintenanceId,
  });
}

async function sendLeaseNotification(
  recipientId: string,
  type: "renewal_offered" | "expiring_soon",
  leaseData: any
) {
  const eventMap = {
    renewal_offered: "lease_renewal_offered" as const,
    expiring_soon: "lease_expiring_soon" as const,
  };

  await sendNotification(eventMap[type], recipientId, {
    propertyAddress: leaseData.propertyAddress,
    currentRent: leaseData.currentRent,
    proposedRent: leaseData.proposedRent,
    responseDeadline: leaseData.responseDeadline,
    expirationDate: leaseData.expirationDate,
    leaseId: leaseData.leaseId,
  });
}

async function sendClientScoringNotification(
  recipientId: string,
  scoringData: any
) {
  await sendNotification("client_score_updated", recipientId, {
    clientName: scoringData.clientName,
    newScore: scoringData.newScore,
    scoreCategory: scoringData.scoreCategory,
    recommendations: scoringData.recommendations,
  });
}

async function sendAgentRecommendationNotification(
  recipientId: string,
  recommendationData: any
) {
  await sendNotification("agent_recommendation", recipientId, {
    clientName: recommendationData.clientName,
    propertyAddress: recommendationData.propertyAddress,
    reason: recommendationData.reason,
    recommendedAgentName: recommendationData.recommendedAgentName,
    viewUrl: `/recommendations/${recommendationData.recommendationId}`,
  });
}

// Edge Function handler
Deno.serve(async (req) => {
  try {
    // Only allow POST
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { event, recipientId, data } = await req.json();

    switch (event) {
      case "offer_notification":
        await sendOfferNotification(
          recipientId,
          data.type,
          data.offerData
        );
        break;
      case "document_notification":
        await sendDocumentNotification(recipientId, data.documentData);
        break;
      case "commission_notification":
        await sendCommissionNotification(recipientId, data.commissionData);
        break;
      case "rent_payment_notification":
        await sendRentPaymentNotification(
          recipientId,
          data.type,
          data.paymentData
        );
        break;
      case "maintenance_notification":
        await sendMaintenanceNotification(
          recipientId,
          data.type,
          data.maintenanceData
        );
        break;
      case "lease_notification":
        await sendLeaseNotification(recipientId, data.type, data.leaseData);
        break;
      case "client_scoring_notification":
        await sendClientScoringNotification(recipientId, data.scoringData);
        break;
      case "agent_recommendation_notification":
        await sendAgentRecommendationNotification(
          recipientId,
          data.recommendationData
        );
        break;
      default:
        return new Response("Unknown event type", { status: 400 });
    }

    return new Response(
      JSON.stringify({ success: true, event }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Notifications] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
