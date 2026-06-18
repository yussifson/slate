import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import crypto from 'crypto';

export const useDriverLicenses = (companyId) => {
  return useQuery({
    queryKey: ['driver_licenses', companyId],
    queryFn: async () => {
      const records = await base44.entities.driver_licenses.filter({
        company_id: companyId,
      });
      return records;
    },
    enabled: !!companyId,
  });
};

export const useMutateDriverLicense = () => {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  return useMutation({
    mutationFn: async ({ id, driverId, licenseNumber, licenseType, countryIssued, issueDate, expiryDate, restrictions, verificationStatus, companyId }) => {
      const payload = {
        driver_id: driverId,
        license_number: licenseNumber,
        license_type: licenseType,
        country_issued: countryIssued,
        issue_date: issueDate,
        expiry_date: expiryDate,
        restrictions: restrictions,
        verification_status: verificationStatus || 'pending',
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.driver_licenses.update(id, payload);
      } else {
        return await base44.entities.driver_licenses.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['driver_licenses'] });
    },
  });
};

export const useDriverCertifications = (companyId) => {
  return useQuery({
    queryKey: ['driver_certifications', companyId],
    queryFn: async () => {
      return await base44.entities.driver_certifications.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateDriverCertification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, driverId, certificationName, certificationType, issuingBody, issueDate, expiryDate, verificationDocumentUrl, status, companyId }) => {
      const payload = {
        driver_id: driverId,
        certification_name: certificationName,
        certification_type: certificationType,
        issuing_body: issuingBody,
        issue_date: issueDate,
        expiry_date: expiryDate,
        verification_document_url: verificationDocumentUrl,
        status: status || 'active',
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.driver_certifications.update(id, payload);
      } else {
        return await base44.entities.driver_certifications.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver_certifications'] });
    },
  });
};

export const useDriverTraining = (companyId) => {
  return useQuery({
    queryKey: ['driver_training_records', companyId],
    queryFn: async () => {
      return await base44.entities.driver_training_records.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateDriverTraining = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, driverId, trainingType, trainingProvider, trainingDate, completionDate, durationHours, score, certificateUrl, status, notes, companyId }) => {
      const payload = {
        driver_id: driverId,
        training_type: trainingType,
        training_provider: trainingProvider,
        training_date: trainingDate,
        completion_date: completionDate,
        duration_hours: durationHours,
        score: score,
        certificate_url: certificateUrl,
        status: status,
        notes: notes,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.driver_training_records.update(id, payload);
      } else {
        return await base44.entities.driver_training_records.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver_training_records'] });
    },
  });
};

export const useDriverAttendance = (companyId, startDate, endDate) => {
  return useQuery({
    queryKey: ['driver_attendance', companyId, startDate, endDate],
    queryFn: async () => {
      return await base44.entities.driver_attendance.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateDriverAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, driverId, attendanceDate, checkInTime, checkOutTime, status, workingHours, location, notes, companyId }) => {
      const payload = {
        driver_id: driverId,
        attendance_date: attendanceDate,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        status: status,
        working_hours: workingHours,
        location: location,
        notes: notes,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.driver_attendance.update(id, payload);
      } else {
        return await base44.entities.driver_attendance.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver_attendance'] });
    },
  });
};

export const useDriverSchedules = (companyId) => {
  return useQuery({
    queryKey: ['driver_schedules', companyId],
    queryFn: async () => {
      return await base44.entities.driver_schedules.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateDriverSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, driverId, scheduleDate, startTime, endTime, assignedRoute, vehicleId, status, notes, companyId }) => {
      const payload = {
        driver_id: driverId,
        schedule_date: scheduleDate,
        start_time: startTime,
        end_time: endTime,
        assigned_route: assignedRoute,
        vehicle_id: vehicleId,
        status: status,
        notes: notes,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.driver_schedules.update(id, payload);
      } else {
        return await base44.entities.driver_schedules.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver_schedules'] });
    },
  });
};

export const useDriverPayroll = (companyId) => {
  return useQuery({
    queryKey: ['driver_payroll', companyId],
    queryFn: async () => {
      return await base44.entities.driver_payroll.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateDriverPayroll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, driverId, payrollPeriodStart, payrollPeriodEnd, baseSalary, bonus, deductions, netPay, paymentStatus, paymentDate, paymentMethod, notes, companyId }) => {
      const payload = {
        driver_id: driverId,
        payroll_period_start: payrollPeriodStart,
        payroll_period_end: payrollPeriodEnd,
        base_salary: baseSalary,
        bonus: bonus,
        deductions: deductions,
        net_pay: netPay,
        payment_status: paymentStatus,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        notes: notes,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.driver_payroll.update(id, payload);
      } else {
        return await base44.entities.driver_payroll.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver_payroll'] });
    },
  });
};

export const useDriverPerformance = (companyId) => {
  return useQuery({
    queryKey: ['driver_performance', companyId],
    queryFn: async () => {
      return await base44.entities.driver_performance.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateDriverPerformance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, driverId, evaluationDate, safetyRating, deliveryEfficiency, customerFeedbackScore, vehicleConditionScore, punctualityScore, overallRating, evaluatorId, feedback, companyId }) => {
      const payload = {
        driver_id: driverId,
        evaluation_date: evaluationDate,
        safety_rating: safetyRating,
        delivery_efficiency: deliveryEfficiency,
        customer_feedback_score: customerFeedbackScore,
        vehicle_condition_score: vehicleConditionScore,
        punctuality_score: punctualityScore,
        overall_rating: overallRating,
        evaluator_id: evaluatorId,
        feedback: feedback,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.driver_performance.update(id, payload);
      } else {
        return await base44.entities.driver_performance.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver_performance'] });
    },
  });
};

export const useDriverSafetyIncidents = (companyId) => {
  return useQuery({
    queryKey: ['driver_safety_incidents', companyId],
    queryFn: async () => {
      return await base44.entities.driver_safety_incidents.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateDriverSafetyIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, driverId, incidentDate, incidentType, severity, location, description, witnessDetails, damageAssessment, correctiveAction, status, companyId }) => {
      const payload = {
        driver_id: driverId,
        incident_date: incidentDate,
        incident_type: incidentType,
        severity: severity,
        location: location,
        description: description,
        witness_details: witnessDetails,
        damage_assessment: damageAssessment,
        corrective_action: correctiveAction,
        status: status,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.driver_safety_incidents.update(id, payload);
      } else {
        return await base44.entities.driver_safety_incidents.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver_safety_incidents'] });
    },
  });
};

export const useDriverViolations = (companyId) => {
  return useQuery({
    queryKey: ['driver_violations', companyId],
    queryFn: async () => {
      return await base44.entities.driver_violations.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateDriverViolation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, driverId, violationDate, violationType, severityLevel, description, penaltyPoints, fineAmount, citationNumber, status, companyId }) => {
      const payload = {
        driver_id: driverId,
        violation_date: violationDate,
        violation_type: violationType,
        severity_level: severityLevel,
        description: description,
        penalty_points: penaltyPoints,
        fine_amount: fineAmount,
        citation_number: citationNumber,
        status: status,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.driver_violations.update(id, payload);
      } else {
        return await base44.entities.driver_violations.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver_violations'] });
    },
  });
};

export const useDriverRewards = (companyId) => {
  return useQuery({
    queryKey: ['driver_rewards', companyId],
    queryFn: async () => {
      return await base44.entities.driver_rewards.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateDriverReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, driverId, rewardDate, rewardType, rewardPoints, rewardAmount, reason, status, companyId }) => {
      const payload = {
        driver_id: driverId,
        reward_date: rewardDate,
        reward_type: rewardType,
        reward_points: rewardPoints,
        reward_amount: rewardAmount,
        reason: reason,
        status: status,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.driver_rewards.update(id, payload);
      } else {
        return await base44.entities.driver_rewards.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver_rewards'] });
    },
  });
};

export const useDriverDocuments = (companyId) => {
  return useQuery({
    queryKey: ['driver_documents', companyId],
    queryFn: async () => {
      return await base44.entities.driver_documents.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateDriverDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, driverId, documentType, documentName, documentUrl, expiryDate, verificationStatus, uploadDate, companyId }) => {
      const payload = {
        driver_id: driverId,
        document_type: documentType,
        document_name: documentName,
        document_url: documentUrl,
        expiry_date: expiryDate,
        verification_status: verificationStatus,
        upload_date: uploadDate,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.driver_documents.update(id, payload);
      } else {
        return await base44.entities.driver_documents.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver_documents'] });
    },
  });
};
