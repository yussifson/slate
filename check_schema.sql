SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
    'univ_re_lease_renewals', 
    'univ_re_rent_payment_schedules', 
    'univ_re_contractors', 
    'univ_re_contractor_reviews', 
    'univ_re_document_templates', 
    'univ_re_e_signatures', 
    'univ_re_transactions'
);
