
-- 1. Patients
CREATE TABLE IF NOT EXISTS public.univ_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    date_of_birth TEXT,
    gender TEXT,
    blood_type TEXT,
    address TEXT,
    emergency_contact TEXT,
    status TEXT,
    notes TEXT,
    avatar TEXT
);
CREATE INDEX IF NOT EXISTS idx_univ_patients_company_id ON public.univ_patients(company_id);
ALTER PUBLICATION powersync ADD TABLE public.univ_patients;

-- 2. Wards
CREATE TABLE IF NOT EXISTS public.univ_wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL,
    ward_name TEXT,
    ward_type TEXT,
    capacity INTEGER,
    current_occupancy INTEGER,
    nurse_in_charge TEXT,
    status TEXT,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_univ_wards_company_id ON public.univ_wards(company_id);
ALTER PUBLICATION powersync ADD TABLE public.univ_wards;

-- 3. Appointments
CREATE TABLE IF NOT EXISTS public.univ_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL,
    client_name TEXT,
    doctor_id TEXT,
    date TEXT,
    time TEXT,
    type TEXT,
    status TEXT,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_univ_appointments_company_id ON public.univ_appointments(company_id);
ALTER PUBLICATION powersync ADD TABLE public.univ_appointments;

-- 4. Lab Results
CREATE TABLE IF NOT EXISTS public.univ_lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL,
    patient_id TEXT,
    test_name TEXT,
    test_date TEXT,
    result_value TEXT,
    status TEXT,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_univ_lab_results_company_id ON public.univ_lab_results(company_id);
ALTER PUBLICATION powersync ADD TABLE public.univ_lab_results;

-- 5. Imaging (Radiology)
CREATE TABLE IF NOT EXISTS public.univ_imaging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL,
    patient_id TEXT,
    scan_type TEXT,
    body_part TEXT,
    scan_date TEXT,
    radiologist_name TEXT,
    status TEXT,
    report_summary TEXT
);
CREATE INDEX IF NOT EXISTS idx_univ_imaging_company_id ON public.univ_imaging(company_id);
ALTER PUBLICATION powersync ADD TABLE public.univ_imaging;

-- 6. Prescriptions
CREATE TABLE IF NOT EXISTS public.univ_prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL,
    patient_id TEXT,
    medication TEXT,
    dosage TEXT,
    frequency TEXT,
    prescribed_date TEXT,
    duration TEXT,
    status TEXT,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_univ_prescriptions_company_id ON public.univ_prescriptions(company_id);
ALTER PUBLICATION powersync ADD TABLE public.univ_prescriptions;

-- 7. Pharmacy
CREATE TABLE IF NOT EXISTS public.univ_pharmacy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL,
    item_name TEXT,
    category TEXT,
    stock_level INTEGER,
    reorder_level INTEGER,
    unit_price REAL,
    supplier TEXT,
    expiry_date TEXT,
    status TEXT,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_univ_pharmacy_company_id ON public.univ_pharmacy(company_id);
ALTER PUBLICATION powersync ADD TABLE public.univ_pharmacy;

-- 8. Surgeries
CREATE TABLE IF NOT EXISTS public.univ_surgeries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL,
    patient_id TEXT,
    surgery_name TEXT,
    surgeon_name TEXT,
    scheduled_date TEXT,
    ot_room TEXT,
    status TEXT,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_univ_surgeries_company_id ON public.univ_surgeries(company_id);
ALTER PUBLICATION powersync ADD TABLE public.univ_surgeries;

-- 9. Ambulance Dispatch
CREATE TABLE IF NOT EXISTS public.univ_ambulance_dispatch (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL,
    vehicle_id TEXT,
    driver_name TEXT,
    paramedic_name TEXT,
    dispatch_time TEXT,
    destination TEXT,
    emergency_type TEXT,
    status TEXT,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_univ_ambulance_dispatch_company_id ON public.univ_ambulance_dispatch(company_id);
ALTER PUBLICATION powersync ADD TABLE public.univ_ambulance_dispatch;

-- 10. Telemedicine
CREATE TABLE IF NOT EXISTS public.univ_telemedicine (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL,
    patient_id TEXT,
    scheduled_time TEXT,
    meeting_link TEXT,
    status TEXT,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_univ_telemedicine_company_id ON public.univ_telemedicine(company_id);
ALTER PUBLICATION powersync ADD TABLE public.univ_telemedicine;

-- 11. Medical Billings
CREATE TABLE IF NOT EXISTS public.univ_medicalbillings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL,
    patient_id TEXT,
    service_provided TEXT,
    total_cost REAL,
    insurance_covered REAL,
    amount_due REAL,
    status TEXT,
    issue_date TEXT,
    due_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_univ_medicalbillings_company_id ON public.univ_medicalbillings(company_id);
ALTER PUBLICATION powersync ADD TABLE public.univ_medicalbillings;

-- 12. Medical Claims
CREATE TABLE IF NOT EXISTS public.univ_medicalclaims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL,
    patient_id TEXT,
    claim_amount REAL,
    claim_date TEXT,
    insurance_provider TEXT,
    policy_number TEXT,
    status TEXT,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_univ_medicalclaims_company_id ON public.univ_medicalclaims(company_id);
ALTER PUBLICATION powersync ADD TABLE public.univ_medicalclaims;
