import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import crypto from 'crypto';

export const useDispatchCenters = (companyId) => {
  return useQuery({
    queryKey: ['dispatch_centers', companyId],
    queryFn: async () => {
      return await base44.entities.dispatch_centers.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateDispatchCenter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, centerName, centerCode, location, latitude, longitude, capacityDaily, operatingHoursStart, operatingHoursEnd, contactPerson, contactPhone, email, status, notes, companyId }) => {
      const payload = {
        center_name: centerName,
        center_code: centerCode,
        location: location,
        latitude: latitude,
        longitude: longitude,
        capacity_daily: capacityDaily,
        operating_hours_start: operatingHoursStart,
        operating_hours_end: operatingHoursEnd,
        contact_person: contactPerson,
        contact_phone: contactPhone,
        email: email,
        status: status,
        notes: notes,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.dispatch_centers.update(id, payload);
      } else {
        return await base44.entities.dispatch_centers.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch_centers'] });
    },
  });
};

export const useTripPlanning = (companyId) => {
  return useQuery({
    queryKey: ['trip_planning', companyId],
    queryFn: async () => {
      return await base44.entities.trip_planning.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tripId, originLocation, destinationLocation, originLat, originLon, destLat, destLon, plannedDistance, plannedDuration, plannedStartTime, plannedEndTime, tripStatus, plannedBy, notes, companyId }) => {
      const payload = {
        trip_id: tripId,
        origin_location: originLocation,
        destination_location: destinationLocation,
        origin_lat: originLat,
        origin_lon: originLon,
        dest_lat: destLat,
        dest_lon: destLon,
        planned_distance: plannedDistance,
        planned_duration: plannedDuration,
        planned_start_time: plannedStartTime,
        planned_end_time: plannedEndTime,
        trip_status: tripStatus,
        planned_by: plannedBy,
        notes: notes,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.trip_planning.update(id, payload);
      } else {
        return await base44.entities.trip_planning.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip_planning'] });
    },
  });
};

export const useTripAssignments = (companyId) => {
  return useQuery({
    queryKey: ['trip_assignments', companyId],
    queryFn: async () => {
      return await base44.entities.trip_assignments.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateTripAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tripId, driverId, vehicleId, assignmentDate, dispatchCenterId, assignmentStatus, assignedBy, notes, companyId }) => {
      const payload = {
        trip_id: typeof tripId === 'string' ? tripId : tripId?.id,
        driver_id: typeof driverId === 'string' ? driverId : driverId?.id,
        vehicle_id: typeof vehicleId === 'string' ? vehicleId : vehicleId?.id,
        assignment_date: assignmentDate,
        dispatch_center_id: dispatchCenterId,
        assignment_status: assignmentStatus,
        assigned_by: assignedBy,
        notes: notes,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.trip_assignments.update(id, payload);
      } else {
        return await base44.entities.trip_assignments.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip_assignments'] });
    },
  });
};

export const useLoadManagement = (companyId) => {
  return useQuery({
    queryKey: ['load_management', companyId],
    queryFn: async () => {
      return await base44.entities.load_management.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateLoad = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tripId, loadItemNumber, shipmentId, originAddress, destinationAddress, weightKg, volumeM3, commodityType, handlingInstructions, loadStatus, companyId }) => {
      const payload = {
        trip_id: tripId,
        load_item_number: loadItemNumber,
        shipment_id: shipmentId,
        origin_address: originAddress,
        destination_address: destinationAddress,
        weight_kg: weightKg,
        volume_m3: volumeM3,
        commodity_type: commodityType,
        handling_instructions: handlingInstructions,
        load_status: loadStatus,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.load_management.update(id, payload);
      } else {
        return await base44.entities.load_management.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load_management'] });
    },
  });
};

export const useRoutePlanning = (companyId) => {
  return useQuery({
    queryKey: ['route_planning', companyId],
    queryFn: async () => {
      return await base44.entities.route_planning.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, routeId, routeName, tripId, waypointSequence, waypointLatitude, waypointLongitude, waypointAddress, waypointType, estimatedArrivalTime, estimatedDepartureTime, routeStatus, notes, companyId }) => {
      const payload = {
        route_id: routeId,
        route_name: routeName,
        trip_id: tripId,
        waypoint_sequence: waypointSequence,
        waypoint_latitude: waypointLatitude,
        waypoint_longitude: waypointLongitude,
        waypoint_address: waypointAddress,
        waypoint_type: waypointType,
        estimated_arrival_time: estimatedArrivalTime,
        estimated_departure_time: estimatedDepartureTime,
        route_status: routeStatus,
        notes: notes,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.route_planning.update(id, payload);
      } else {
        return await base44.entities.route_planning.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route_planning'] });
    },
  });
};

export const useDispatchCalendar = (companyId, date) => {
  return useQuery({
    queryKey: ['dispatch_calendar', companyId, date],
    queryFn: async () => {
      return await base44.entities.dispatch_calendar.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateDispatchCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, calendarDate, tripId, driverId, vehicleId, dispatchCenterId, eventType, eventTime, eventDescription, status, notes, companyId }) => {
      const payload = {
        calendar_date: calendarDate,
        trip_id: tripId,
        driver_id: driverId,
        vehicle_id: vehicleId,
        dispatch_center_id: dispatchCenterId,
        event_type: eventType,
        event_time: eventTime,
        event_description: eventDescription,
        status: status,
        notes: notes,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.dispatch_calendar.update(id, payload);
      } else {
        return await base44.entities.dispatch_calendar.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch_calendar'] });
    },
  });
};

export const useDispatchBoard = (companyId) => {
  return useQuery({
    queryKey: ['dispatch_board', companyId],
    queryFn: async () => {
      return await base44.entities.dispatch_board.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateDispatchBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, boardDate, totalTripsPlanned, totalTripsAssigned, totalTripsCompleted, totalTripsDelayed, fleetUtilizationPercentage, onTimeDeliveryRate, resourceAvailability, statusSummary, companyId }) => {
      const payload = {
        board_date: boardDate,
        total_trips_planned: totalTripsPlanned,
        total_trips_assigned: totalTripsAssigned,
        total_trips_completed: totalTripsCompleted,
        total_trips_delayed: totalTripsDelayed,
        fleet_utilization_percentage: fleetUtilizationPercentage,
        on_time_delivery_rate: onTimeDeliveryRate,
        resource_availability: resourceAvailability,
        status_summary: statusSummary,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.dispatch_board.update(id, payload);
      } else {
        return await base44.entities.dispatch_board.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch_board'] });
    },
  });
};

export const useRealTimeMonitoring = (companyId) => {
  return useQuery({
    queryKey: ['real_time_monitoring', companyId],
    queryFn: async () => {
      return await base44.entities.real_time_monitoring.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateRealTimeMonitoring = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tripId, driverId, vehicleId, currentLatitude, currentLongitude, currentSpeed, heading, totalDistanceTraveled, remainingDistance, estimatedTimeArrival, lastUpdateTime, status, companyId }) => {
      const payload = {
        trip_id: tripId,
        driver_id: driverId,
        vehicle_id: vehicleId,
        current_latitude: currentLatitude,
        current_longitude: currentLongitude,
        current_speed: currentSpeed,
        heading: heading,
        total_distance_traveled: totalDistanceTraveled,
        remaining_distance: remainingDistance,
        estimated_time_arrival: estimatedTimeArrival,
        last_update_time: lastUpdateTime,
        status: status,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.real_time_monitoring.update(id, payload);
      } else {
        return await base44.entities.real_time_monitoring.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real_time_monitoring'] });
    },
  });
};

export const useMultiStopOptimization = (companyId) => {
  return useQuery({
    queryKey: ['multi_stop_optimization', companyId],
    queryFn: async () => {
      return await base44.entities.multi_stop_optimization.filter({
        company_id: companyId,
      });
    },
    enabled: !!companyId,
  });
};

export const useMutateMultiStopOptimization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, optimizationId, tripId, totalStops, optimizationAlgorithm, totalDistanceKm, totalDurationHours, fuelConsumptionLiters, costSavingPercentage, stopSequence, optimizationStatus, optimizedBy, notes, companyId }) => {
      const payload = {
        optimization_id: optimizationId,
        trip_id: tripId,
        total_stops: totalStops,
        optimization_algorithm: optimizationAlgorithm,
        total_distance_km: totalDistanceKm,
        total_duration_hours: totalDurationHours,
        fuel_consumption_liters: fuelConsumptionLiters,
        cost_saving_percentage: costSavingPercentage,
        stop_sequence: typeof stopSequence === 'string' ? stopSequence : JSON.stringify(stopSequence),
        optimization_status: optimizationStatus,
        optimized_by: optimizedBy,
        notes: notes,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        return await base44.entities.multi_stop_optimization.update(id, payload);
      } else {
        return await base44.entities.multi_stop_optimization.create({
          id: crypto.randomUUID(),
          company_id: companyId,
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multi_stop_optimization'] });
    },
  });
};
