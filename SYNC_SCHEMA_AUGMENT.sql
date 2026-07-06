-- Augment missing columns based on AppSchema.js

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_customers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_inventory ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_loyalty ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_orders ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_pos ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_products ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_promotions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_purchase_orders ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_sales ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_shifts ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_suppliers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_returns ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_inventory_transfers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_rmas ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_branches ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_storefronts ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_web_orders ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_warehouse_locations ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_warehouse_bins ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_picking_waves ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_b2b_accounts ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retail_franchises ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pharmacy_drugs ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pharmacy_inventory ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pharmacy_inventory ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pharmacy_customers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pharmacy_sales ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pharmacy_sale_items ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pharmacy_prescriptions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pharmacy_suppliers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pharmacy_purchase_orders ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pharmacy_insurance_claims ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pharmacy_controlled_substances ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pharmacy_expiry_alerts ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pharmacy_shifts ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pharmacy_reconciliations ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pharmacy_analytics ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pharmacy_audit_log ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.industry_records ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.automation_queue ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.automation_dlq ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.automation_rule_versions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.case_messages ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.case_pipelines ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.case_pipeline_states ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.client_messages ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS subject TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS sender_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS recipient_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS received_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS body_preview TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS logged_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS direction TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS tags TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.case_messages ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_messages ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_messages ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_messages ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_messages ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_messages ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_messages ADD COLUMN IF NOT EXISTS sender_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_messages ADD COLUMN IF NOT EXISTS content TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_messages ADD COLUMN IF NOT EXISTS tagged_emails TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_messages ADD COLUMN IF NOT EXISTS document_links TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_messages ADD COLUMN IF NOT EXISTS read_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS case_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS assigned_lawyer TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS assigned_lawyer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS outcome TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS outcome_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS outcome_summary TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS settlement_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS currency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS duration_days TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS court_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_outcomes ADD COLUMN IF NOT EXISTS judge_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.case_pipelines ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipelines ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipelines ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipelines ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipelines ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipelines ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipelines ADD COLUMN IF NOT EXISTS case_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipelines ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipelines ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipelines ADD COLUMN IF NOT EXISTS stages TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipelines ADD COLUMN IF NOT EXISTS item_label TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipelines ADD COLUMN IF NOT EXISTS color TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipelines ADD COLUMN IF NOT EXISTS icon TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipelines ADD COLUMN IF NOT EXISTS is_active TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipelines ADD COLUMN IF NOT EXISTS is_default TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.case_pipeline_states ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipeline_states ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipeline_states ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipeline_states ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipeline_states ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipeline_states ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipeline_states ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipeline_states ADD COLUMN IF NOT EXISTS pipeline_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipeline_states ADD COLUMN IF NOT EXISTS pipeline_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipeline_states ADD COLUMN IF NOT EXISTS current_stage_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipeline_states ADD COLUMN IF NOT EXISTS current_stage_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipeline_states ADD COLUMN IF NOT EXISTS stage_entered_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.case_pipeline_states ADD COLUMN IF NOT EXISTS stage_history TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS city TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS country TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS id_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS total_cases TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS total_billed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS client_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS assigned_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS assigned_by_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS completed_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_checklists ADD COLUMN IF NOT EXISTS document_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.client_messages ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_messages ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_messages ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_messages ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_messages ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_messages ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_messages ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_messages ADD COLUMN IF NOT EXISTS sender_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_messages ADD COLUMN IF NOT EXISTS sender_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_messages ADD COLUMN IF NOT EXISTS content TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_messages ADD COLUMN IF NOT EXISTS read_by_lawyer TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_messages ADD COLUMN IF NOT EXISTS read_by_client TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS subdomain TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS custom_domain TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS country TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS city TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_light_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS favicon_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS tagline TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS primary_color TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS subscription_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS max_users TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS max_cases TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS max_storage_gb TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS receipt_template TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS receipt_header TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS receipt_footer TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS receipt_show_logo INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS currency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS admin_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS custom_email_domain TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS custom_email_verified TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS language TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS date_format TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS time_format TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS calendar_start TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS timezone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS industry_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.smart_folders ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.smart_folders ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.smart_folders ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.smart_folders ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.smart_folders ADD COLUMN IF NOT EXISTS parent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.smart_folders ADD COLUMN IF NOT EXISTS color TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.smart_doc_links ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.smart_doc_links ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.smart_doc_links ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.smart_doc_links ADD COLUMN IF NOT EXISTS document_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.smart_doc_links ADD COLUMN IF NOT EXISTS entity_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.smart_doc_links ADD COLUMN IF NOT EXISTS relationship TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.hr_jobs ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_jobs ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_jobs ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_jobs ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_jobs ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_jobs ADD COLUMN IF NOT EXISTS department TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_jobs ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_jobs ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_jobs ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_jobs ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_jobs ADD COLUMN IF NOT EXISTS requirements TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.hr_applicants ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_applicants ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_applicants ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_applicants ADD COLUMN IF NOT EXISTS job_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_applicants ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_applicants ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_applicants ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_applicants ADD COLUMN IF NOT EXISTS resume_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_applicants ADD COLUMN IF NOT EXISTS stage TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_applicants ADD COLUMN IF NOT EXISTS interview_score DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_applicants ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.hr_attendance ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_attendance ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_attendance ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_attendance ADD COLUMN IF NOT EXISTS staff_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_attendance ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_attendance ADD COLUMN IF NOT EXISTS clock_in TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_attendance ADD COLUMN IF NOT EXISTS clock_out TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_attendance ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_attendance ADD COLUMN IF NOT EXISTS location_lng DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.hr_performance_reviews ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_performance_reviews ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_performance_reviews ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_performance_reviews ADD COLUMN IF NOT EXISTS staff_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_performance_reviews ADD COLUMN IF NOT EXISTS reviewer_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_performance_reviews ADD COLUMN IF NOT EXISTS period TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_performance_reviews ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_performance_reviews ADD COLUMN IF NOT EXISTS strengths TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_performance_reviews ADD COLUMN IF NOT EXISTS weaknesses TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_performance_reviews ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.hr_training_courses ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_training_courses ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_training_courses ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_training_courses ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_training_courses ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_training_courses ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_training_courses ADD COLUMN IF NOT EXISTS is_mandatory INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.hr_training_records ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_training_records ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_training_records ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_training_records ADD COLUMN IF NOT EXISTS staff_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_training_records ADD COLUMN IF NOT EXISTS course_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_training_records ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_training_records ADD COLUMN IF NOT EXISTS completed_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_training_records ADD COLUMN IF NOT EXISTS expiry_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS currency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS expense_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS logged_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS logged_by_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS billable TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS billed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS invoice_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS vendor_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.firm_settings ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.firm_settings ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.firm_settings ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.firm_settings ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.firm_settings ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.firm_settings ADD COLUMN IF NOT EXISTS custom_case_types TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.firm_settings ADD COLUMN IF NOT EXISTS custom_case_statuses TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.firm_settings ADD COLUMN IF NOT EXISTS custom_task_types TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.firm_settings ADD COLUMN IF NOT EXISTS custom_document_categories TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.firm_settings ADD COLUMN IF NOT EXISTS custom_roles TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS case_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS court_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS judge_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS lawyer_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS lawyer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS outcome TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS staff_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS subject TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS against_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS against_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS resolved_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS resolved_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.h_r_complaints ADD COLUMN IF NOT EXISTS is_anonymous TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS items TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS subtotal TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax_rate TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS currency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS full_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS organization TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS case_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS case_description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS urgency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_to TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS preferred_contact TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_score DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email_sequence_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS meeting_link TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS staff_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS staff_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS leave_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS days_requested TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS reason TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS reviewed_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS review_notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS case_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS case_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS assigned_lawyer TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS assigned_lawyer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS court_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS judge_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS opposing_party TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS opposing_counsel TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS filing_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS next_hearing_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS tags TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS subject TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS from_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS from_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS to_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS body TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS email_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS logged_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS direction TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS tags TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.linked_emails ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recipient_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recipient_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS email_sent TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS rule_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS logs TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS user_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS action TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS module TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS slate TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS details TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.partner_applications ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.partner_applications ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.partner_applications ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.partner_applications ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.partner_applications ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.partner_applications ADD COLUMN IF NOT EXISTS company_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.partner_applications ADD COLUMN IF NOT EXISTS partner_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.partner_applications ADD COLUMN IF NOT EXISTS message TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.partner_applications ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS staff_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS staff_role TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS department TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS pay_period TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS basic_salary TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS allowances TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS deductions TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS gross_salary TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS total_deductions TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS net_salary TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS currency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS leave_days_taken TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS approved_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS approved_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS paid_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS staff_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS from_role TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS to_role TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS from_salary TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS to_salary TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS currency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS effective_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS reason TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS approved_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.retainers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retainers ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retainers ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retainers ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retainers ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retainers ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retainers ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retainers ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retainers ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retainers ADD COLUMN IF NOT EXISTS initial_deposit TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retainers ADD COLUMN IF NOT EXISTS current_balance TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retainers ADD COLUMN IF NOT EXISTS total_deducted TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retainers ADD COLUMN IF NOT EXISTS currency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retainers ADD COLUMN IF NOT EXISTS alert_threshold TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retainers ADD COLUMN IF NOT EXISTS alert_triggered TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retainers ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retainers ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS document_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS document_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS client_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS sent_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS sent_by_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS sent_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS opened_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS signed_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS signature_data TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS signature_ip TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS signature_token TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS message TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.signature_requests ADD COLUMN IF NOT EXISTS expires_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS staff_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS staff_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_view_cases TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_create_cases TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_edit_cases TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_delete_cases TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_view_clients TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_create_clients TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_edit_clients TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_delete_clients TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_view_invoices TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_create_invoices TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_view_documents TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_upload_documents TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_delete_documents TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_view_tasks TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_create_tasks TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_view_team TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_view_reports TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_permissions ADD COLUMN IF NOT EXISTS can_manage_leave TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.staff_records ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_records ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_records ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_records ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_records ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_records ADD COLUMN IF NOT EXISTS user_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_records ADD COLUMN IF NOT EXISTS full_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_records ADD COLUMN IF NOT EXISTS role TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_records ADD COLUMN IF NOT EXISTS department TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_records ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_records ADD COLUMN IF NOT EXISTS hire_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_records ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_records ADD COLUMN IF NOT EXISTS salary TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_records ADD COLUMN IF NOT EXISTS currency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_records ADD COLUMN IF NOT EXISTS leave_balance TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.staff_records ADD COLUMN IF NOT EXISTS bar_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.module_definitions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.module_definitions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.module_definitions ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.module_definitions ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.module_definitions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.module_definitions ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.module_definitions ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.module_definitions ADD COLUMN IF NOT EXISTS icon TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.module_definitions ADD COLUMN IF NOT EXISTS config TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.module_definitions ADD COLUMN IF NOT EXISTS industry_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.module_definitions ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.module_definitions ADD COLUMN IF NOT EXISTS is_active TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.module_definitions ADD COLUMN IF NOT EXISTS shared_with TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.field_definitions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.field_definitions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.field_definitions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.field_definitions ADD COLUMN IF NOT EXISTS module_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.field_definitions ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.field_definitions ADD COLUMN IF NOT EXISTS field_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.field_definitions ADD COLUMN IF NOT EXISTS options TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.field_definitions ADD COLUMN IF NOT EXISTS is_required TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.field_definitions ADD COLUMN IF NOT EXISTS order_index TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.dynamic_records ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.dynamic_records ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.dynamic_records ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.dynamic_records ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.dynamic_records ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.dynamic_records ADD COLUMN IF NOT EXISTS module_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.dynamic_records ADD COLUMN IF NOT EXISTS data TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.dynamic_records ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS company_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS admin_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS plan TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS plan_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS amount_usd TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS billing_period TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS paid_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS reminder_count TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS last_reminder_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS story_points INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS sprint TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS depends_on TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS custom_fields TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS case_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS lawyer_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS lawyer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS start_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS end_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS duration_minutes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS hourly_rate TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS billable_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS currency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS is_billable TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS billed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS invoice_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS approval_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.sync_errors ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.sync_errors ADD COLUMN IF NOT EXISTS table_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.sync_errors ADD COLUMN IF NOT EXISTS operation TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.sync_errors ADD COLUMN IF NOT EXISTS record_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.sync_errors ADD COLUMN IF NOT EXISTS error_code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.sync_errors ADD COLUMN IF NOT EXISTS error_message TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.sync_errors ADD COLUMN IF NOT EXISTS failed_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.sync_errors ADD COLUMN IF NOT EXISTS raw_payload TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.sync_errors ADD COLUMN IF NOT EXISTS acknowledged TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_opd_queues ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_opd_queues ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_opd_queues ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_opd_queues ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_opd_queues ADD COLUMN IF NOT EXISTS token_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_opd_queues ADD COLUMN IF NOT EXISTS doctor_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_opd_queues ADD COLUMN IF NOT EXISTS room_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_opd_queues ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bar_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS industry_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.hospital_patients ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_patients ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_patients ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_patients ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_patients ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_patients ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_patients ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_patients ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_patients ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_patients ADD COLUMN IF NOT EXISTS address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_patients ADD COLUMN IF NOT EXISTS city TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_patients ADD COLUMN IF NOT EXISTS country TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_patients ADD COLUMN IF NOT EXISTS id_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_patients ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_patients ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_patients ADD COLUMN IF NOT EXISTS total_cases TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_patients ADD COLUMN IF NOT EXISTS total_billed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS case_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS case_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS assigned_staff TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS assigned_staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_admissions ADD COLUMN IF NOT EXISTS tags TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.hospital_appointments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_appointments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_appointments ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_appointments ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_appointments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_appointments ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_appointments ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_appointments ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_appointments ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_appointments ADD COLUMN IF NOT EXISTS time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_appointments ADD COLUMN IF NOT EXISTS venue_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_appointments ADD COLUMN IF NOT EXISTS staff_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_appointments ADD COLUMN IF NOT EXISTS staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_appointments ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_appointments ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hospital_appointments ADD COLUMN IF NOT EXISTS outcome TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.hotel_guests ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_guests ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_guests ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_guests ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_guests ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_guests ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_guests ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_guests ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_guests ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_guests ADD COLUMN IF NOT EXISTS address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_guests ADD COLUMN IF NOT EXISTS city TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_guests ADD COLUMN IF NOT EXISTS country TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_guests ADD COLUMN IF NOT EXISTS id_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_guests ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_guests ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_guests ADD COLUMN IF NOT EXISTS total_cases TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_guests ADD COLUMN IF NOT EXISTS total_billed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS case_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS case_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS assigned_staff TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS assigned_staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS tags TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.hotel_reservations ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_reservations ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_reservations ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_reservations ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_reservations ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_reservations ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_reservations ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_reservations ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_reservations ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_reservations ADD COLUMN IF NOT EXISTS time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_reservations ADD COLUMN IF NOT EXISTS venue_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_reservations ADD COLUMN IF NOT EXISTS staff_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_reservations ADD COLUMN IF NOT EXISTS staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_reservations ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_reservations ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hotel_reservations ADD COLUMN IF NOT EXISTS outcome TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.religion_members ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_members ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_members ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_members ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_members ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_members ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_members ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_members ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_members ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_members ADD COLUMN IF NOT EXISTS address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_members ADD COLUMN IF NOT EXISTS city TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_members ADD COLUMN IF NOT EXISTS country TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_members ADD COLUMN IF NOT EXISTS id_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_members ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_members ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_members ADD COLUMN IF NOT EXISTS total_cases TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_members ADD COLUMN IF NOT EXISTS total_billed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS case_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS case_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS assigned_staff TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS assigned_staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_groups ADD COLUMN IF NOT EXISTS tags TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.religion_events ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_events ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_events ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_events ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_events ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_events ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_events ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_events ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_events ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_events ADD COLUMN IF NOT EXISTS time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_events ADD COLUMN IF NOT EXISTS venue_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_events ADD COLUMN IF NOT EXISTS staff_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_events ADD COLUMN IF NOT EXISTS staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_events ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_events ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.religion_events ADD COLUMN IF NOT EXISTS outcome TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS city TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS country TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS id_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS total_cases TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS total_billed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS risk_profile TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS date_onboarded TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS case_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS policy_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS case_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS assigned_staff TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS assigned_staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS incident_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS claim_amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS tags TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.insurance_underwriting ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_underwriting ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_underwriting ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_underwriting ADD COLUMN IF NOT EXISTS applicant_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_underwriting ADD COLUMN IF NOT EXISTS policy_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_underwriting ADD COLUMN IF NOT EXISTS risk_score TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_underwriting ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_underwriting ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_underwriting ADD COLUMN IF NOT EXISTS application_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_underwriting ADD COLUMN IF NOT EXISTS premium_quote DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_underwriting ADD COLUMN IF NOT EXISTS sum_insured_requested DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_underwriting ADD COLUMN IF NOT EXISTS submitted_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.insurance_reinsurance ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_reinsurance ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_reinsurance ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_reinsurance ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_reinsurance ADD COLUMN IF NOT EXISTS treaty_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_reinsurance ADD COLUMN IF NOT EXISTS reinsurer TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_reinsurance ADD COLUMN IF NOT EXISTS ceded_premium DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_reinsurance ADD COLUMN IF NOT EXISTS coverage_limit DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_reinsurance ADD COLUMN IF NOT EXISTS effective_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_reinsurance ADD COLUMN IF NOT EXISTS expiry_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_reinsurance ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS agent_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS license_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS region TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS agent_code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS policies_sold INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS premium_collected DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS claims_handled INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS commission_earned DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS rating INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.insurance_premiums ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_premiums ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_premiums ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_premiums ADD COLUMN IF NOT EXISTS policy_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_premiums ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_premiums ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_premiums ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_premiums ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_premiums ADD COLUMN IF NOT EXISTS payment_method TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_premiums ADD COLUMN IF NOT EXISTS receipt_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_premiums ADD COLUMN IF NOT EXISTS paid_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.insurance_meetings ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_meetings ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_meetings ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_meetings ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_meetings ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_meetings ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_meetings ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_meetings ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_meetings ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_meetings ADD COLUMN IF NOT EXISTS time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_meetings ADD COLUMN IF NOT EXISTS venue_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_meetings ADD COLUMN IF NOT EXISTS staff_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_meetings ADD COLUMN IF NOT EXISTS staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_meetings ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_meetings ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insurance_meetings ADD COLUMN IF NOT EXISTS outcome TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.retail_customers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_customers ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_customers ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_customers ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_customers ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_customers ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_customers ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_customers ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_customers ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_customers ADD COLUMN IF NOT EXISTS address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_customers ADD COLUMN IF NOT EXISTS city TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_customers ADD COLUMN IF NOT EXISTS country TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_customers ADD COLUMN IF NOT EXISTS id_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_customers ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_customers ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_customers ADD COLUMN IF NOT EXISTS total_cases TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_customers ADD COLUMN IF NOT EXISTS total_billed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS case_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS case_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS assigned_staff TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS assigned_staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS tags TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.retail_shifts ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_shifts ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_shifts ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_shifts ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_shifts ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_shifts ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_shifts ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_shifts ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_shifts ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_shifts ADD COLUMN IF NOT EXISTS time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_shifts ADD COLUMN IF NOT EXISTS venue_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_shifts ADD COLUMN IF NOT EXISTS staff_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_shifts ADD COLUMN IF NOT EXISTS staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_shifts ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_shifts ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_shifts ADD COLUMN IF NOT EXISTS outcome TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.retail_cash_drawers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_cash_drawers ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_cash_drawers ADD COLUMN IF NOT EXISTS shift_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_cash_drawers ADD COLUMN IF NOT EXISTS register_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_cash_drawers ADD COLUMN IF NOT EXISTS action TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_cash_drawers ADD COLUMN IF NOT EXISTS amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_cash_drawers ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_cash_drawers ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.retail_cash_drawers ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.logistics_shippers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shippers ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shippers ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shippers ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shippers ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shippers ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shippers ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shippers ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shippers ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shippers ADD COLUMN IF NOT EXISTS address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shippers ADD COLUMN IF NOT EXISTS city TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shippers ADD COLUMN IF NOT EXISTS country TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shippers ADD COLUMN IF NOT EXISTS id_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shippers ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shippers ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shippers ADD COLUMN IF NOT EXISTS total_cases TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shippers ADD COLUMN IF NOT EXISTS total_billed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS case_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS case_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS assigned_staff TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS assigned_staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_shipments ADD COLUMN IF NOT EXISTS tags TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.logistics_dispatches ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_dispatches ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_dispatches ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_dispatches ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_dispatches ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_dispatches ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_dispatches ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_dispatches ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_dispatches ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_dispatches ADD COLUMN IF NOT EXISTS time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_dispatches ADD COLUMN IF NOT EXISTS venue_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_dispatches ADD COLUMN IF NOT EXISTS staff_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_dispatches ADD COLUMN IF NOT EXISTS staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_dispatches ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_dispatches ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_dispatches ADD COLUMN IF NOT EXISTS outcome TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_imaging ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_imaging ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_imaging ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_imaging ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_imaging ADD COLUMN IF NOT EXISTS scan_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_imaging ADD COLUMN IF NOT EXISTS body_part TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_imaging ADD COLUMN IF NOT EXISTS scan_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_imaging ADD COLUMN IF NOT EXISTS radiologist_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_imaging ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_imaging ADD COLUMN IF NOT EXISTS report_summary TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.logistics_warehouse_inventory ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_warehouse_inventory ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_warehouse_inventory ADD COLUMN IF NOT EXISTS sku TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_warehouse_inventory ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_warehouse_inventory ADD COLUMN IF NOT EXISTS quantity INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_warehouse_inventory ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_warehouse_inventory ADD COLUMN IF NOT EXISTS barcode TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.logistics_warehouse_scans ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_warehouse_scans ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_warehouse_scans ADD COLUMN IF NOT EXISTS item_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_warehouse_scans ADD COLUMN IF NOT EXISTS scan_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_warehouse_scans ADD COLUMN IF NOT EXISTS quantity_change INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_warehouse_scans ADD COLUMN IF NOT EXISTS scanned_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.logistics_loads ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_loads ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_loads ADD COLUMN IF NOT EXISTS origin TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_loads ADD COLUMN IF NOT EXISTS destination TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_loads ADD COLUMN IF NOT EXISTS weight_lbs DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_loads ADD COLUMN IF NOT EXISTS equipment_required TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_loads ADD COLUMN IF NOT EXISTS price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_loads ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.logistics_load_matches ADD COLUMN IF NOT EXISTS load_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_load_matches ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_load_matches ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_load_matches ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_load_matches ADD COLUMN IF NOT EXISTS match_score INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_load_matches ADD COLUMN IF NOT EXISTS reasoning TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_load_matches ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.logistics_routes ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_routes ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_routes ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_routes ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_routes ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.logistics_route_stops ADD COLUMN IF NOT EXISTS route_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_route_stops ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_route_stops ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_route_stops ADD COLUMN IF NOT EXISTS address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_route_stops ADD COLUMN IF NOT EXISTS lat DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_route_stops ADD COLUMN IF NOT EXISTS lng DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_route_stops ADD COLUMN IF NOT EXISTS sequence_number INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_route_stops ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.logistics_smart_docs ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_smart_docs ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_smart_docs ADD COLUMN IF NOT EXISTS document_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_smart_docs ADD COLUMN IF NOT EXISTS file_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_smart_docs ADD COLUMN IF NOT EXISTS extracted_data TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_smart_docs ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.logistics_geofences ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_geofences ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_geofences ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_geofences ADD COLUMN IF NOT EXISTS latitude DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_geofences ADD COLUMN IF NOT EXISTS longitude DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_geofences ADD COLUMN IF NOT EXISTS radius_meters INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_geofences ADD COLUMN IF NOT EXISTS active INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_geofences ADD COLUMN IF NOT EXISTS alert_phone_numbers TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.logistics_geofence_logs ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_geofence_logs ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_geofence_logs ADD COLUMN IF NOT EXISTS geofence_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_geofence_logs ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_geofence_logs ADD COLUMN IF NOT EXISTS event TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.logistics_geofence_logs ADD COLUMN IF NOT EXISTS sent_to TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS city TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS country TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS id_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS total_cases TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS total_billed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS case_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS case_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS assigned_staff TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS assigned_staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_projects ADD COLUMN IF NOT EXISTS tags TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.hr_interviews ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_interviews ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_interviews ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_interviews ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_interviews ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_interviews ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_interviews ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_interviews ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_interviews ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_interviews ADD COLUMN IF NOT EXISTS time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_interviews ADD COLUMN IF NOT EXISTS venue_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_interviews ADD COLUMN IF NOT EXISTS staff_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_interviews ADD COLUMN IF NOT EXISTS staff_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_interviews ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_interviews ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.hr_interviews ADD COLUMN IF NOT EXISTS outcome TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS size TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS folder TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS instructor_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS instructor_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS price TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS currency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS level TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS duration_hours TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS rating TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS total_reviews TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS total_students TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS featured TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS tags TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS course_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS video_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS content TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS order_index TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS is_preview TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS duration_minutes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS resources TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS course_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS student_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS student_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS student_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS enrollment_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS progress_percent TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS last_accessed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS certificate_issued TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS certificate_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.online_assessments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessments ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessments ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessments ADD COLUMN IF NOT EXISTS course_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessments ADD COLUMN IF NOT EXISTS lesson_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessments ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessments ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessments ADD COLUMN IF NOT EXISTS questions TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessments ADD COLUMN IF NOT EXISTS passing_score TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessments ADD COLUMN IF NOT EXISTS time_limit_minutes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.online_assessment_results ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessment_results ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessment_results ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessment_results ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessment_results ADD COLUMN IF NOT EXISTS student_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessment_results ADD COLUMN IF NOT EXISTS assessment_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessment_results ADD COLUMN IF NOT EXISTS score INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessment_results ADD COLUMN IF NOT EXISTS total_questions INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_assessment_results ADD COLUMN IF NOT EXISTS passed INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.online_certificates ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_certificates ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_certificates ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_certificates ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_certificates ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_certificates ADD COLUMN IF NOT EXISTS enrollment_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_certificates ADD COLUMN IF NOT EXISTS student_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_certificates ADD COLUMN IF NOT EXISTS student_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_certificates ADD COLUMN IF NOT EXISTS course_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_certificates ADD COLUMN IF NOT EXISTS course_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_certificates ADD COLUMN IF NOT EXISTS issue_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_certificates ADD COLUMN IF NOT EXISTS credential_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_certificates ADD COLUMN IF NOT EXISTS pdf_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_certificates ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.online_notes ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_notes ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_notes ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_notes ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_notes ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_notes ADD COLUMN IF NOT EXISTS course_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_notes ADD COLUMN IF NOT EXISTS course_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_notes ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_notes ADD COLUMN IF NOT EXISTS content TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.connected_apps ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.connected_apps ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.connected_apps ADD COLUMN IF NOT EXISTS provider TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.connected_apps ADD COLUMN IF NOT EXISTS access_token TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.connected_apps ADD COLUMN IF NOT EXISTS refresh_token TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.connected_apps ADD COLUMN IF NOT EXISTS expires_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.connected_apps ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.connected_apps ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.connected_apps ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS room_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.chat_participants ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_participants ADD COLUMN IF NOT EXISTS room_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_participants ADD COLUMN IF NOT EXISTS user_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_participants ADD COLUMN IF NOT EXISTS role TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_participants ADD COLUMN IF NOT EXISTS joined_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_participants ADD COLUMN IF NOT EXISTS last_read_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reactions TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS room_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reply_to_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS content TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_edited TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS daily_room_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS daily_room_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS host_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS started_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS ended_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS meeting_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS privacy_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS scheduled_start_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS scheduled_end_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS participants TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS meeting_link TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.platform_roles ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.platform_roles ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.platform_roles ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.platform_roles ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.platform_roles ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.platform_role_permissions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.platform_role_permissions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.platform_role_permissions ADD COLUMN IF NOT EXISTS role_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.platform_role_permissions ADD COLUMN IF NOT EXISTS feature_path TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.platform_role_permissions ADD COLUMN IF NOT EXISTS can_view INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.platform_role_permissions ADD COLUMN IF NOT EXISTS can_edit INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.platform_role_permissions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.platform_departments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.platform_departments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.platform_departments ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.platform_departments ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.platform_departments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS market_tier TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS paystack_plan_code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS price_monthly TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS price_yearly TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS features TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS limits TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS is_active TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.company_subscriptions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.company_subscriptions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.company_subscriptions ADD COLUMN IF NOT EXISTS plan_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.company_subscriptions ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.company_subscriptions ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.company_subscriptions ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.company_subscriptions ADD COLUMN IF NOT EXISTS current_period_end TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.company_subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.company_subscriptions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.company_subscriptions ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.usage_metrics ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.usage_metrics ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.usage_metrics ADD COLUMN IF NOT EXISTS metric_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.usage_metrics ADD COLUMN IF NOT EXISTS used_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.usage_metrics ADD COLUMN IF NOT EXISTS period_start TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.usage_metrics ADD COLUMN IF NOT EXISTS period_end TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.usage_metrics ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.usage_metrics ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.billing_transactions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.billing_transactions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.billing_transactions ADD COLUMN IF NOT EXISTS paystack_reference TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.billing_transactions ADD COLUMN IF NOT EXISTS amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.billing_transactions ADD COLUMN IF NOT EXISTS currency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.billing_transactions ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.billing_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.billing_transactions ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.billing_transactions ADD COLUMN IF NOT EXISTS paid_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.billing_transactions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_roles ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_roles ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_roles ADD COLUMN IF NOT EXISTS role_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_roles ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_roles ADD COLUMN IF NOT EXISTS permissions TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_roles ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_accesscontrols ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_accesscontrols ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_accesscontrols ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_accesscontrols ADD COLUMN IF NOT EXISTS user_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_accesscontrols ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_accesscontrols ADD COLUMN IF NOT EXISTS role TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_accesscontrols ADD COLUMN IF NOT EXISTS resource TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_accesscontrols ADD COLUMN IF NOT EXISTS permission_level TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_accesscontrols ADD COLUMN IF NOT EXISTS granted_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_accesscontrols ADD COLUMN IF NOT EXISTS expiry_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_accesscontrols ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_adspend ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_adspend ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_adspend ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_advocacy ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_advocacy ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_advocacy ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_affiliateprogram ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_affiliateprogram ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_affiliateprogram ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_agentcommissions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_agentcommissions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_agentcommissions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_agentcommissions ADD COLUMN IF NOT EXISTS agent_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_agentcommissions ADD COLUMN IF NOT EXISTS sale_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_agentcommissions ADD COLUMN IF NOT EXISTS commission_rate TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_agentcommissions ADD COLUMN IF NOT EXISTS commission_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_agentcommissions ADD COLUMN IF NOT EXISTS sale_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_agentcommissions ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_agentcommissions ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_allergylist ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_allergylist ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_allergylist ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_alumnis ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_alumnis ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_alumnis ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_apiintegrations ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_apiintegrations ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_apiintegrations ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_apiintegrations ADD COLUMN IF NOT EXISTS integration_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_apiintegrations ADD COLUMN IF NOT EXISTS provider TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_apiintegrations ADD COLUMN IF NOT EXISTS api_endpoint TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_apiintegrations ADD COLUMN IF NOT EXISTS auth_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_apiintegrations ADD COLUMN IF NOT EXISTS environment TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_apiintegrations ADD COLUMN IF NOT EXISTS last_tested TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_apiintegrations ADD COLUMN IF NOT EXISTS rate_limit TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_apiintegrations ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_apiintegrations ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_appointments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_appointments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_appointments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_appointments ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_appointments ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_appointments ADD COLUMN IF NOT EXISTS client_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_appointments ADD COLUMN IF NOT EXISTS client_phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_appointments ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_appointments ADD COLUMN IF NOT EXISTS time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_appointments ADD COLUMN IF NOT EXISTS duration_minutes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_appointments ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_appointments ADD COLUMN IF NOT EXISTS doctor_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_appointments ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_appointments ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_appointments ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_appointments ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_arbitration ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_arbitration ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_arbitration ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_arbitration ADD COLUMN IF NOT EXISTS case_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_arbitration ADD COLUMN IF NOT EXISTS arbitrator TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_arbitration ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_arbitration ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_assemblylines ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_assemblylines ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_assemblylines ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_assets ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_assets ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_assets ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_assets ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_assets ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_assets ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_assets ADD COLUMN IF NOT EXISTS purchase_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_assets ADD COLUMN IF NOT EXISTS purchase_value TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_attendance ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_attendance ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_attendance ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_attendance ADD COLUMN IF NOT EXISTS employee_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_attendance ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_attendance ADD COLUMN IF NOT EXISTS check_in TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_attendance ADD COLUMN IF NOT EXISTS check_out TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_attendance ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_attendance ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_audittrails ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_audittrails ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_audittrails ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_audittrails ADD COLUMN IF NOT EXISTS action TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_audittrails ADD COLUMN IF NOT EXISTS user_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_audittrails ADD COLUMN IF NOT EXISTS module TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_audittrails ADD COLUMN IF NOT EXISTS record_affected TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_audittrails ADD COLUMN IF NOT EXISTS ip_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_audittrails ADD COLUMN IF NOT EXISTS timestamp TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_audittrails ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_audittrails ADD COLUMN IF NOT EXISTS severity TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_bankreconciliations ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_bankreconciliations ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_bankreconciliations ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_beneficiarylist ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_beneficiarylist ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_beneficiarylist ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_benefitelection ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_benefitelection ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_benefitelection ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_benefitelection ADD COLUMN IF NOT EXISTS employee_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_benefitelection ADD COLUMN IF NOT EXISTS benefit_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_benefitelection ADD COLUMN IF NOT EXISTS coverage_level TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_benefitelection ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_benefitelection ADD COLUMN IF NOT EXISTS cost TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_benefitelection ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_billofladings ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_billofladings ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_billofladings ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_blueprints ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blueprints ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blueprints ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_boms ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_boms ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_boms ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_boms ADD COLUMN IF NOT EXISTS product_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_boms ADD COLUMN IF NOT EXISTS material_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_boms ADD COLUMN IF NOT EXISTS quantity_required TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_boms ADD COLUMN IF NOT EXISTS unit TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_boms ADD COLUMN IF NOT EXISTS cost_per_unit TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_boms ADD COLUMN IF NOT EXISTS total_cost TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_boms ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_bookings ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_bookings ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_bookings ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_bookings ADD COLUMN IF NOT EXISTS booking_reference TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_bookings ADD COLUMN IF NOT EXISTS guest_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_bookings ADD COLUMN IF NOT EXISTS guest_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_bookings ADD COLUMN IF NOT EXISTS guest_phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_bookings ADD COLUMN IF NOT EXISTS check_in TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_bookings ADD COLUMN IF NOT EXISTS check_out TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_bookings ADD COLUMN IF NOT EXISTS room_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_bookings ADD COLUMN IF NOT EXISTS number_of_guests TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_bookings ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_bookings ADD COLUMN IF NOT EXISTS total_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS project_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS item_description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS unit TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS quantity TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS unit_rate TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_brandasset ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_brandasset ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_brandasset ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_briefs ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_briefs ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_briefs ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_briefs ADD COLUMN IF NOT EXISTS case_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_briefs ADD COLUMN IF NOT EXISTS brief_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_briefs ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_briefs ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_budgetforecasts ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_budgetforecasts ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_budgetforecasts ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_budgetforecasts ADD COLUMN IF NOT EXISTS department TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_budgetforecasts ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_budgetforecasts ADD COLUMN IF NOT EXISTS period TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_budgetforecasts ADD COLUMN IF NOT EXISTS budgeted_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_budgetforecasts ADD COLUMN IF NOT EXISTS actual_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_budgetforecasts ADD COLUMN IF NOT EXISTS variance TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_budgetforecasts ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_budgetforecasts ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_budgetplans ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_budgetplans ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_budgetplans ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_calllogs ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_calllogs ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_calllogs ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_calllogs ADD COLUMN IF NOT EXISTS caller_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_calllogs ADD COLUMN IF NOT EXISTS phone_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_calllogs ADD COLUMN IF NOT EXISTS agent_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_calllogs ADD COLUMN IF NOT EXISTS call_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_calllogs ADD COLUMN IF NOT EXISTS call_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_calllogs ADD COLUMN IF NOT EXISTS duration_seconds TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_calllogs ADD COLUMN IF NOT EXISTS summary TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_calllogs ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_campaignmetric ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_campaignmetric ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_campaignmetric ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_campaignschedule ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_campaignschedule ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_campaignschedule ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_carrental ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_carrental ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_carrental ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_carriercontracts ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_carriercontracts ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_carriercontracts ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_case_deadlines ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_case_deadlines ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_case_deadlines ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_case_deadlines ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_case_deadlines ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_case_deadlines ADD COLUMN IF NOT EXISTS deadline_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_case_deadlines ADD COLUMN IF NOT EXISTS is_critical TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_case_deadlines ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_cases ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_cases ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_cases ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_cases ADD COLUMN IF NOT EXISTS case_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_cashflows ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_cashflows ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_cashflows ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_changerequests ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_changerequests ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_changerequests ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_changerequests ADD COLUMN IF NOT EXISTS request_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_changerequests ADD COLUMN IF NOT EXISTS requested_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_changerequests ADD COLUMN IF NOT EXISTS change_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_changerequests ADD COLUMN IF NOT EXISTS impact_level TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_changerequests ADD COLUMN IF NOT EXISTS request_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_changerequests ADD COLUMN IF NOT EXISTS implementation_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_changerequests ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_changerequests ADD COLUMN IF NOT EXISTS rollback_plan TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_changerequests ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_chattranscripts ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_chattranscripts ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_chattranscripts ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_chattranscripts ADD COLUMN IF NOT EXISTS session_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_chattranscripts ADD COLUMN IF NOT EXISTS customer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_chattranscripts ADD COLUMN IF NOT EXISTS agent_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_chattranscripts ADD COLUMN IF NOT EXISTS channel TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_chattranscripts ADD COLUMN IF NOT EXISTS start_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_chattranscripts ADD COLUMN IF NOT EXISTS duration_minutes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_chattranscripts ADD COLUMN IF NOT EXISTS summary TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_chattranscripts ADD COLUMN IF NOT EXISTS satisfaction_score TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_chattranscripts ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_churnrisks ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_churnrisks ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_churnrisks ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_churnrisks ADD COLUMN IF NOT EXISTS customer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_churnrisks ADD COLUMN IF NOT EXISTS customer_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_churnrisks ADD COLUMN IF NOT EXISTS risk_score TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_churnrisks ADD COLUMN IF NOT EXISTS risk_level TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_churnrisks ADD COLUMN IF NOT EXISTS last_activity_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_churnrisks ADD COLUMN IF NOT EXISTS revenue_at_risk TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_churnrisks ADD COLUMN IF NOT EXISTS churn_indicators TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_churnrisks ADD COLUMN IF NOT EXISTS action_taken TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_churnrisks ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_class_attendance ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_class_attendance ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_class_attendance ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_class_attendance ADD COLUMN IF NOT EXISTS student_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_class_attendance ADD COLUMN IF NOT EXISTS course_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_class_attendance ADD COLUMN IF NOT EXISTS student_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_class_attendance ADD COLUMN IF NOT EXISTS course_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_class_attendance ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_class_attendance ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_trust_transactions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trust_transactions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trust_transactions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trust_transactions ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trust_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trust_transactions ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trust_transactions ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trust_transactions ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_clientledger ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_clientledger ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_clientledger ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_clientledger ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_clientledger ADD COLUMN IF NOT EXISTS account_balance TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_clientledger ADD COLUMN IF NOT EXISTS last_activity TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_clientledger ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_client_portal ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_client_portal ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_client_portal ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_coldchains ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_coldchains ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_coldchains ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_commissionstructure ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_commissionstructure ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_commissionstructure ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_competitorprices ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_competitorprices ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_competitorprices ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_competitorprices ADD COLUMN IF NOT EXISTS competitor_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_competitorprices ADD COLUMN IF NOT EXISTS product_service TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_competitorprices ADD COLUMN IF NOT EXISTS their_price TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_competitorprices ADD COLUMN IF NOT EXISTS our_price TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_competitorprices ADD COLUMN IF NOT EXISTS price_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_competitorprices ADD COLUMN IF NOT EXISTS source TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_competitorprices ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_competitorprices ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_concretetests ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_concretetests ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_concretetests ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_conflictcheck ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_conflictcheck ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_conflictcheck ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_conflictcheck ADD COLUMN IF NOT EXISTS entity_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_conflictcheck ADD COLUMN IF NOT EXISTS checked_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_conflictcheck ADD COLUMN IF NOT EXISTS date_checked TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_conflictcheck ADD COLUMN IF NOT EXISTS result TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_consultation ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_consultation ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_consultation ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_consultation ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_consultation ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_consultation ADD COLUMN IF NOT EXISTS topic TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_consultation ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_contacts ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contacts ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contacts ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contacts ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contacts ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contacts ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contacts ADD COLUMN IF NOT EXISTS company TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contacts ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contacts ADD COLUMN IF NOT EXISTS address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contacts ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_contractmanagements ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractmanagements ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractmanagements ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractmanagements ADD COLUMN IF NOT EXISTS contract_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractmanagements ADD COLUMN IF NOT EXISTS counterparty TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractmanagements ADD COLUMN IF NOT EXISTS contract_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractmanagements ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractmanagements ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractmanagements ADD COLUMN IF NOT EXISTS contract_value TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractmanagements ADD COLUMN IF NOT EXISTS renewal_reminder TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractmanagements ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractmanagements ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_contractors ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractors ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractors ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractors ADD COLUMN IF NOT EXISTS contractor_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractors ADD COLUMN IF NOT EXISTS trade_specialty TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractors ADD COLUMN IF NOT EXISTS contact_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractors ADD COLUMN IF NOT EXISTS contact_phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractors ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_contractors ADD COLUMN IF NOT EXISTS rating TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_courses ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_courses ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_courses ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_courses ADD COLUMN IF NOT EXISTS course_code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_court_calendar ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_court_calendar ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_court_calendar ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_court_calendar ADD COLUMN IF NOT EXISTS event_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_court_calendar ADD COLUMN IF NOT EXISTS event_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_court_calendar ADD COLUMN IF NOT EXISTS event_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_court_calendar ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_court_calendar ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_crm_leads ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_crm_leads ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_crm_leads ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_crm_leads ADD COLUMN IF NOT EXISTS first_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_crm_leads ADD COLUMN IF NOT EXISTS last_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_crm_leads ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_crm_leads ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_crm_leads ADD COLUMN IF NOT EXISTS source TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_crm_leads ADD COLUMN IF NOT EXISTS value TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_crm_leads ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_crm_leads ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_crossdockings ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_crossdockings ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_crossdockings ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_customerjourneys ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customerjourneys ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customerjourneys ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customerjourneys ADD COLUMN IF NOT EXISTS customer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customerjourneys ADD COLUMN IF NOT EXISTS journey_stage TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customerjourneys ADD COLUMN IF NOT EXISTS touchpoint TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customerjourneys ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customerjourneys ADD COLUMN IF NOT EXISTS sentiment TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customerjourneys ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customerjourneys ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_customerreviews ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customerreviews ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customerreviews ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customerreviews ADD COLUMN IF NOT EXISTS customer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customerreviews ADD COLUMN IF NOT EXISTS product_service TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customerreviews ADD COLUMN IF NOT EXISTS rating TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customerreviews ADD COLUMN IF NOT EXISTS review_text TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customerreviews ADD COLUMN IF NOT EXISTS review_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customerreviews ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_customersegments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customersegments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customersegments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customersegments ADD COLUMN IF NOT EXISTS segment_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customersegments ADD COLUMN IF NOT EXISTS criteria TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customersegments ADD COLUMN IF NOT EXISTS customer_count TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customersegments ADD COLUMN IF NOT EXISTS avg_order_value TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customersegments ADD COLUMN IF NOT EXISTS channel TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customersegments ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customersegments ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_customsdocs ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customsdocs ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_customsdocs ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_damagedgoodss ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_damagedgoodss ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_damagedgoodss ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_databackups ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_databackups ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_databackups ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_databackups ADD COLUMN IF NOT EXISTS backup_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_databackups ADD COLUMN IF NOT EXISTS system_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_databackups ADD COLUMN IF NOT EXISTS backup_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_databackups ADD COLUMN IF NOT EXISTS backup_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_databackups ADD COLUMN IF NOT EXISTS size_gb TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_databackups ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_databackups ADD COLUMN IF NOT EXISTS retention_days TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_databackups ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_databackups ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_deliveries ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_deliveries ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_deliveries ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_deliveries ADD COLUMN IF NOT EXISTS tracking_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_deliveries ADD COLUMN IF NOT EXISTS recipient_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_deliveries ADD COLUMN IF NOT EXISTS delivery_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_deliveries ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_digitalassets ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_digitalassets ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_digitalassets ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_digitalassets ADD COLUMN IF NOT EXISTS asset_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_digitalassets ADD COLUMN IF NOT EXISTS asset_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_digitalassets ADD COLUMN IF NOT EXISTS file_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_digitalassets ADD COLUMN IF NOT EXISTS file_size_mb TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_digitalassets ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_digitalassets ADD COLUMN IF NOT EXISTS upload_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_digitalassets ADD COLUMN IF NOT EXISTS tags TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_digitalassets ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_digitalassets ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_dining_orders ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_dining_orders ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_dining_orders ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_dining_orders ADD COLUMN IF NOT EXISTS order_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_dischargesummary ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_dischargesummary ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_dischargesummary ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_disciplinary ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_disciplinary ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_disciplinary ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_discounts ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_discounts ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_discounts ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_discounts ADD COLUMN IF NOT EXISTS discount_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_discounts ADD COLUMN IF NOT EXISTS code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_discounts ADD COLUMN IF NOT EXISTS discount_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_discounts ADD COLUMN IF NOT EXISTS value TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_discounts ADD COLUMN IF NOT EXISTS min_purchase TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_discounts ADD COLUMN IF NOT EXISTS expiry_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_discounts ADD COLUMN IF NOT EXISTS usage_limit TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_discounts ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_dispatch ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_dispatch ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_dispatch ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_dispatch ADD COLUMN IF NOT EXISTS driver_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_dispatch ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_dispatch ADD COLUMN IF NOT EXISTS current_location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_dispatch ADD COLUMN IF NOT EXISTS shipment_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_doctorschedules ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_doctorschedules ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_doctorschedules ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS employee_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS file_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS tags TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS assigned_to TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS assigned_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS assigned_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS signature_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS is_confidential INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS last_opened_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_documents ADD COLUMN IF NOT EXISTS file_size TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_donationlog ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_donationlog ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_donationlog ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_donorprofile ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_donorprofile ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_donorprofile ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_employeeperformances ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_employeeperformances ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_employeeperformances ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_employeeperformances ADD COLUMN IF NOT EXISTS employee_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_employeeperformances ADD COLUMN IF NOT EXISTS reviewer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_employeeperformances ADD COLUMN IF NOT EXISTS review_period TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_employeeperformances ADD COLUMN IF NOT EXISTS overall_rating TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_employeeperformances ADD COLUMN IF NOT EXISTS strengths TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_employeeperformances ADD COLUMN IF NOT EXISTS areas_for_improvement TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_employeeperformances ADD COLUMN IF NOT EXISTS goals TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_employeeperformances ADD COLUMN IF NOT EXISTS review_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_employeeperformances ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_emr ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_emr ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_emr ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_emr ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_emr ADD COLUMN IF NOT EXISTS doctor_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_emr ADD COLUMN IF NOT EXISTS visit_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_emr ADD COLUMN IF NOT EXISTS diagnosis TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_emr ADD COLUMN IF NOT EXISTS symptoms TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_emr ADD COLUMN IF NOT EXISTS treatment_plan TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_emr ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_enrollments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_enrollments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_enrollments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_equipmentrentals ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_equipmentrentals ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_equipmentrentals ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_escrow ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_escrow ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_escrow ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_escrow ADD COLUMN IF NOT EXISTS account_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_escrow ADD COLUMN IF NOT EXISTS balance TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_escrow ADD COLUMN IF NOT EXISTS last_transaction TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_escrow ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_eventplanner ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_eventplanner ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_eventplanner ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_examschedules ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_examschedules ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_examschedules ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_exitinterview ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_exitinterview ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_exitinterview ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_expenseclaim ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_expenseclaim ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_expenseclaim ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_expensereports ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_expensereports ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_expensereports ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_expensereports ADD COLUMN IF NOT EXISTS employee_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_expensereports ADD COLUMN IF NOT EXISTS expense_category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_expensereports ADD COLUMN IF NOT EXISTS amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_expensereports ADD COLUMN IF NOT EXISTS expense_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_expensereports ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_expensereports ADD COLUMN IF NOT EXISTS receipt_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_expensereports ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_expertwitness ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_expertwitness ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_expertwitness ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_expertwitness ADD COLUMN IF NOT EXISTS witness_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_expertwitness ADD COLUMN IF NOT EXISTS specialty TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_expertwitness ADD COLUMN IF NOT EXISTS hourly_rate TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_expertwitness ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_extracurriculars ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_extracurriculars ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_extracurriculars ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_faculty ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_faculty ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_faculty ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_faculty ADD COLUMN IF NOT EXISTS first_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_faculty ADD COLUMN IF NOT EXISTS last_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_faculty ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_faculty ADD COLUMN IF NOT EXISTS department TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_faculty ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_faculty ADD COLUMN IF NOT EXISTS hire_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_featurerequests ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_featurerequests ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_featurerequests ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_featurerequests ADD COLUMN IF NOT EXISTS feature_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_featurerequests ADD COLUMN IF NOT EXISTS requested_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_featurerequests ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_featurerequests ADD COLUMN IF NOT EXISTS votes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_featurerequests ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_featurerequests ADD COLUMN IF NOT EXISTS requested_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_featurerequests ADD COLUMN IF NOT EXISTS expected_release TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_featurerequests ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_feedbacksurvey ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feedbacksurvey ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feedbacksurvey ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_fixedassets ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_fixedassets ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_fixedassets ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_fleet ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_fleet ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_fleet ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_fleet ADD COLUMN IF NOT EXISTS vehicle_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_fleet ADD COLUMN IF NOT EXISTS license_plate TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_fleet ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_fleet ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_fleet ADD COLUMN IF NOT EXISTS mileage DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_fleet ADD COLUMN IF NOT EXISTS last_service_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_forkliftmaintenances ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_forkliftmaintenances ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_forkliftmaintenances ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_gdprrequests ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gdprrequests ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gdprrequests ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gdprrequests ADD COLUMN IF NOT EXISTS request_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gdprrequests ADD COLUMN IF NOT EXISTS subject_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gdprrequests ADD COLUMN IF NOT EXISTS subject_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gdprrequests ADD COLUMN IF NOT EXISTS request_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gdprrequests ADD COLUMN IF NOT EXISTS received_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gdprrequests ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gdprrequests ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gdprrequests ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_generalledgers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_generalledgers ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_generalledgers ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_generalledgers ADD COLUMN IF NOT EXISTS account_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_generalledgers ADD COLUMN IF NOT EXISTS account_code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_generalledgers ADD COLUMN IF NOT EXISTS account_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_generalledgers ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_generalledgers ADD COLUMN IF NOT EXISTS debit TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_generalledgers ADD COLUMN IF NOT EXISTS credit TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_generalledgers ADD COLUMN IF NOT EXISTS transaction_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_generalledgers ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_giftcards ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_giftcards ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_giftcards ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_giftcards ADD COLUMN IF NOT EXISTS card_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_giftcards ADD COLUMN IF NOT EXISTS recipient_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_giftcards ADD COLUMN IF NOT EXISTS initial_balance TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_giftcards ADD COLUMN IF NOT EXISTS current_balance TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_giftcards ADD COLUMN IF NOT EXISTS issued_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_giftcards ADD COLUMN IF NOT EXISTS expiry_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_giftcards ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_gradebook ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gradebook ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gradebook ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gradebook ADD COLUMN IF NOT EXISTS student_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gradebook ADD COLUMN IF NOT EXISTS course_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gradebook ADD COLUMN IF NOT EXISTS assessment_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gradebook ADD COLUMN IF NOT EXISTS score TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gradebook ADD COLUMN IF NOT EXISTS max_score TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gradebook ADD COLUMN IF NOT EXISTS grade TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gradebook ADD COLUMN IF NOT EXISTS date_recorded TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_gradebook ADD COLUMN IF NOT EXISTS remarks TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_healthsafetys ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_healthsafetys ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_healthsafetys ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_healthsafetys ADD COLUMN IF NOT EXISTS inspection_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_healthsafetys ADD COLUMN IF NOT EXISTS inspector_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_healthsafetys ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_healthsafetys ADD COLUMN IF NOT EXISTS inspection_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_healthsafetys ADD COLUMN IF NOT EXISTS hazards_found TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_healthsafetys ADD COLUMN IF NOT EXISTS corrective_actions TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_healthsafetys ADD COLUMN IF NOT EXISTS next_inspection TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_healthsafetys ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hoas ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hoas ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hoas ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hoas ADD COLUMN IF NOT EXISTS community_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hoas ADD COLUMN IF NOT EXISTS unit_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hoas ADD COLUMN IF NOT EXISTS owner_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hoas ADD COLUMN IF NOT EXISTS dues_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hoas ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hoas ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hoas ADD COLUMN IF NOT EXISTS violation_notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hotelreview ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotelreview ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotelreview ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_housekeeping ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_housekeeping ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_housekeeping ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_housekeeping ADD COLUMN IF NOT EXISTS room_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_housekeeping ADD COLUMN IF NOT EXISTS task_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_housekeeping ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_housekeeping ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_housekeeping ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hr_employees ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_employees ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_employees ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_employees ADD COLUMN IF NOT EXISTS employee_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_employees ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_employees ADD COLUMN IF NOT EXISTS first_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_employees ADD COLUMN IF NOT EXISTS last_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_employees ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_employees ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_employees ADD COLUMN IF NOT EXISTS role TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_employees ADD COLUMN IF NOT EXISTS department TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_employees ADD COLUMN IF NOT EXISTS reports_to TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_employees ADD COLUMN IF NOT EXISTS salary DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_employees ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_employees ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_employees ADD COLUMN IF NOT EXISTS user_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hr_departments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_departments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_departments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_departments ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_departments ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_departments ADD COLUMN IF NOT EXISTS manager_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_departments ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_departments ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hr_payroll ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_payroll ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_payroll ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_payroll ADD COLUMN IF NOT EXISTS employee_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_payroll ADD COLUMN IF NOT EXISTS period TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_payroll ADD COLUMN IF NOT EXISTS basic_salary DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_payroll ADD COLUMN IF NOT EXISTS bonus DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_payroll ADD COLUMN IF NOT EXISTS deductions DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_payroll ADD COLUMN IF NOT EXISTS net_salary DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_payroll ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hr_leave ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_leave ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_leave ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_leave ADD COLUMN IF NOT EXISTS employee_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_leave ADD COLUMN IF NOT EXISTS leave_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_leave ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_leave ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_leave ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_leave ADD COLUMN IF NOT EXISTS reason TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hr_recruitment ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_recruitment ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_recruitment ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_recruitment ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_recruitment ADD COLUMN IF NOT EXISTS department_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_recruitment ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_recruitment ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_recruitment ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_recruitment ADD COLUMN IF NOT EXISTS applicants INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hr_candidates ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_candidates ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_candidates ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_candidates ADD COLUMN IF NOT EXISTS recruitment_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_candidates ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_candidates ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_candidates ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_candidates ADD COLUMN IF NOT EXISTS stage TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_candidates ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_religion_members ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_members ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_members ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_members ADD COLUMN IF NOT EXISTS member_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_members ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_members ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_members ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_members ADD COLUMN IF NOT EXISTS group_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_members ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_religion_donations ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_donations ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_donations ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_donations ADD COLUMN IF NOT EXISTS member_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_donations ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_donations ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_donations ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_religion_events ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_events ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_events ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_events ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_events ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_events ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_events ADD COLUMN IF NOT EXISTS attendees INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_events ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_religion_groups ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_groups ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_groups ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_groups ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_groups ADD COLUMN IF NOT EXISTS leader TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_groups ADD COLUMN IF NOT EXISTS members INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_groups ADD COLUMN IF NOT EXISTS schedule TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_groups ADD COLUMN IF NOT EXISTS color TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_groups ADD COLUMN IF NOT EXISTS icon_type INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_groups ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_religion_small_groups ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_small_groups ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_small_groups ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_small_groups ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_small_groups ADD COLUMN IF NOT EXISTS leader TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_small_groups ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_small_groups ADD COLUMN IF NOT EXISTS members INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_small_groups ADD COLUMN IF NOT EXISTS time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_small_groups ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_religion_prayers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_prayers ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_prayers ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_prayers ADD COLUMN IF NOT EXISTS requestor TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_prayers ADD COLUMN IF NOT EXISTS prayer TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_prayers ADD COLUMN IF NOT EXISTS prayersCount INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_prayers ADD COLUMN IF NOT EXISTS sentiment TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_prayers ADD COLUMN IF NOT EXISTS aiAnalysis TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_prayers ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_religion_sermons ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_sermons ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_sermons ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_sermons ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_sermons ADD COLUMN IF NOT EXISTS speaker TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_sermons ADD COLUMN IF NOT EXISTS scripture TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_sermons ADD COLUMN IF NOT EXISTS duration TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_sermons ADD COLUMN IF NOT EXISTS sermon_kit TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_sermons ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_sermons ADD COLUMN IF NOT EXISTS series TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_sermons ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_religion_volunteers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_volunteers ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_volunteers ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_volunteers ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_volunteers ADD COLUMN IF NOT EXISTS role TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_volunteers ADD COLUMN IF NOT EXISTS group_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_volunteers ADD COLUMN IF NOT EXISTS availability TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_volunteers ADD COLUMN IF NOT EXISTS next_service TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_volunteers ADD COLUMN IF NOT EXISTS event TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_volunteers ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_religion_milestones ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_milestones ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_milestones ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_milestones ADD COLUMN IF NOT EXISTS member_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_milestones ADD COLUMN IF NOT EXISTS milestone_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_milestones ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_religion_milestones ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.trust_accounts ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.trust_accounts ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.trust_accounts ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.trust_accounts ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.trust_accounts ADD COLUMN IF NOT EXISTS account_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.trust_accounts ADD COLUMN IF NOT EXISTS balance DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.trust_accounts ADD COLUMN IF NOT EXISTS currency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.trust_accounts ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.trust_transactions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.trust_transactions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.trust_transactions ADD COLUMN IF NOT EXISTS trust_account_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.trust_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.trust_transactions ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.trust_transactions ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.trust_transactions ADD COLUMN IF NOT EXISTS reference TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.trust_transactions ADD COLUMN IF NOT EXISTS balance_after DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.trust_transactions ADD COLUMN IF NOT EXISTS transaction_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.trust_transactions ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.trust_transactions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.client_portal_access ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_access ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_access ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_access ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_access ADD COLUMN IF NOT EXISTS access_token TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_access ADD COLUMN IF NOT EXISTS is_active INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_access ADD COLUMN IF NOT EXISTS last_accessed_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_access ADD COLUMN IF NOT EXISTS expires_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_access ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.client_portal_uploads ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_uploads ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_uploads ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_uploads ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_uploads ADD COLUMN IF NOT EXISTS file_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_uploads ADD COLUMN IF NOT EXISTS file_path TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_uploads ADD COLUMN IF NOT EXISTS file_size INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_uploads ADD COLUMN IF NOT EXISTS mime_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_uploads ADD COLUMN IF NOT EXISTS uploaded_by_client INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_uploads ADD COLUMN IF NOT EXISTS reviewed INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_uploads ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.client_portal_uploads ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS content TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS variables TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS is_active INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS template_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS content TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS file_path TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS generated_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS case_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS fields TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS is_active INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.intake_submissions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intake_submissions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intake_submissions ADD COLUMN IF NOT EXISTS form_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intake_submissions ADD COLUMN IF NOT EXISTS submitted_by_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intake_submissions ADD COLUMN IF NOT EXISTS submitted_by_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intake_submissions ADD COLUMN IF NOT EXISTS responses TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intake_submissions ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intake_submissions ADD COLUMN IF NOT EXISTS converted_to_case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intake_submissions ADD COLUMN IF NOT EXISTS converted_to_client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intake_submissions ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intake_submissions ADD COLUMN IF NOT EXISTS reviewed_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intake_submissions ADD COLUMN IF NOT EXISTS submitted_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.conflict_check_results ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.conflict_check_results ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.conflict_check_results ADD COLUMN IF NOT EXISTS checked_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.conflict_check_results ADD COLUMN IF NOT EXISTS check_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.conflict_check_results ADD COLUMN IF NOT EXISTS matches_found TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.conflict_check_results ADD COLUMN IF NOT EXISTS conflict_detected INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.conflict_check_results ADD COLUMN IF NOT EXISTS checked_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.conflict_check_results ADD COLUMN IF NOT EXISTS checked_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.court_hearings ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.court_hearings ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.court_hearings ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.court_hearings ADD COLUMN IF NOT EXISTS hearing_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.court_hearings ADD COLUMN IF NOT EXISTS hearing_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.court_hearings ADD COLUMN IF NOT EXISTS court_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.court_hearings ADD COLUMN IF NOT EXISTS courtroom TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.court_hearings ADD COLUMN IF NOT EXISTS judge_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.court_hearings ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.court_hearings ADD COLUMN IF NOT EXISTS outcome TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.court_hearings ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.court_hearings ADD COLUMN IF NOT EXISTS reminder_sent INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.court_hearings ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hr_attendance ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_attendance ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_attendance ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_attendance ADD COLUMN IF NOT EXISTS employee_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_attendance ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_attendance ADD COLUMN IF NOT EXISTS clock_in TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_attendance ADD COLUMN IF NOT EXISTS clock_out TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hr_attendance ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_immunization ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_immunization ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_immunization ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_incidentreports ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_incidentreports ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_incidentreports ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_incidentreports ADD COLUMN IF NOT EXISTS incident_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_incidentreports ADD COLUMN IF NOT EXISTS reported_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_incidentreports ADD COLUMN IF NOT EXISTS severity TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_incidentreports ADD COLUMN IF NOT EXISTS incident_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_incidentreports ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_incidentreports ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_incidentreports ADD COLUMN IF NOT EXISTS root_cause TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_incidentreports ADD COLUMN IF NOT EXISTS resolution TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_incidentreports ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_inkinddonation ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_inkinddonation ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_inkinddonation ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_insurancepolicy ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_insurancepolicy ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_insurancepolicy ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_insurancepolicy ADD COLUMN IF NOT EXISTS policy_holder TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_insurancepolicy ADD COLUMN IF NOT EXISTS policy_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_insurancepolicy ADD COLUMN IF NOT EXISTS provider_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_insurancepolicy ADD COLUMN IF NOT EXISTS coverage_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_insurancepolicy ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_insurancepolicy ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_insurancepolicy ADD COLUMN IF NOT EXISTS premium_amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_insurancepolicy ADD COLUMN IF NOT EXISTS sum_insured DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_insurancepolicy ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_reinsurance ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_reinsurance ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_reinsurance ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_reinsurance ADD COLUMN IF NOT EXISTS treaty_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_reinsurance ADD COLUMN IF NOT EXISTS reinsurer TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_reinsurance ADD COLUMN IF NOT EXISTS ceded_premium DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_reinsurance ADD COLUMN IF NOT EXISTS coverage_limit DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_reinsurance ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_inventory ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_inventory ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_inventory ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_inventory ADD COLUMN IF NOT EXISTS item_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_inventory ADD COLUMN IF NOT EXISTS sku TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_inventory ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_inventory ADD COLUMN IF NOT EXISTS quantity TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_inventory ADD COLUMN IF NOT EXISTS unit_price TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_inventory ADD COLUMN IF NOT EXISTS reorder_level TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_inventory ADD COLUMN IF NOT EXISTS supplier TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_inventory ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_invoices ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_invoices ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_invoices ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_invoices ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_invoices ADD COLUMN IF NOT EXISTS client_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_invoices ADD COLUMN IF NOT EXISTS amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_invoices ADD COLUMN IF NOT EXISTS currency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_invoices ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_invoices ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_invoices ADD COLUMN IF NOT EXISTS issue_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_invoices ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_ipaddresses ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ipaddresses ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ipaddresses ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ipaddresses ADD COLUMN IF NOT EXISTS ip_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ipaddresses ADD COLUMN IF NOT EXISTS hostname TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ipaddresses ADD COLUMN IF NOT EXISTS assigned_to TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ipaddresses ADD COLUMN IF NOT EXISTS mac_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ipaddresses ADD COLUMN IF NOT EXISTS subnet TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ipaddresses ADD COLUMN IF NOT EXISTS vlan TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ipaddresses ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ipaddresses ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ipaddresses ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_kanban_tasks ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kanban_tasks ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kanban_tasks ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kanban_tasks ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kanban_tasks ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kanban_tasks ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kanban_tasks ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kanban_tasks ADD COLUMN IF NOT EXISTS assignee TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kanban_tasks ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kanban_tasks ADD COLUMN IF NOT EXISTS labels TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_kbarticles ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kbarticles ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kbarticles ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kbarticles ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kbarticles ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kbarticles ADD COLUMN IF NOT EXISTS author TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kbarticles ADD COLUMN IF NOT EXISTS tags TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kbarticles ADD COLUMN IF NOT EXISTS content TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kbarticles ADD COLUMN IF NOT EXISTS published_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kbarticles ADD COLUMN IF NOT EXISTS views TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kbarticles ADD COLUMN IF NOT EXISTS helpful_votes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kbarticles ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_kpitrackers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kpitrackers ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kpitrackers ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kpitrackers ADD COLUMN IF NOT EXISTS kpi_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kpitrackers ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kpitrackers ADD COLUMN IF NOT EXISTS target_value TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kpitrackers ADD COLUMN IF NOT EXISTS actual_value TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kpitrackers ADD COLUMN IF NOT EXISTS unit TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kpitrackers ADD COLUMN IF NOT EXISTS period TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kpitrackers ADD COLUMN IF NOT EXISTS owner TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kpitrackers ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kpitrackers ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_labs ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_labs ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_labs ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_labs ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_labs ADD COLUMN IF NOT EXISTS test_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_labs ADD COLUMN IF NOT EXISTS test_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_labs ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_labs ADD COLUMN IF NOT EXISTS result_value TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_labs ADD COLUMN IF NOT EXISTS reference_range TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_labs ADD COLUMN IF NOT EXISTS document_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_labs ADD COLUMN IF NOT EXISTS ai_clinical_summary TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_labs ADD COLUMN IF NOT EXISTS ai_patient_summary TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_leadmagnets ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leadmagnets ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leadmagnets ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leadmagnets ADD COLUMN IF NOT EXISTS magnet_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leadmagnets ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leadmagnets ADD COLUMN IF NOT EXISTS target_audience TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leadmagnets ADD COLUMN IF NOT EXISTS downloads TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leadmagnets ADD COLUMN IF NOT EXISTS leads_generated TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leadmagnets ADD COLUMN IF NOT EXISTS launch_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leadmagnets ADD COLUMN IF NOT EXISTS landing_page_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leadmagnets ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_lease ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_lease ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_lease ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_lease ADD COLUMN IF NOT EXISTS lease_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_lease ADD COLUMN IF NOT EXISTS tenant_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_lease ADD COLUMN IF NOT EXISTS monthly_rent TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_lease ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_leave_management ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leave_management ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leave_management ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leave_management ADD COLUMN IF NOT EXISTS employee_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leave_management ADD COLUMN IF NOT EXISTS employee_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leave_management ADD COLUMN IF NOT EXISTS leave_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leave_management ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leave_management ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leave_management ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_leave_management ADD COLUMN IF NOT EXISTS reason TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_legal_documents ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_legal_documents ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_legal_documents ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_legal_documents ADD COLUMN IF NOT EXISTS document_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_legal_documents ADD COLUMN IF NOT EXISTS document_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_legal_documents ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_librarybooks ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_librarybooks ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_librarybooks ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_listing ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_listing ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_listing ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_listing ADD COLUMN IF NOT EXISTS listing_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_listing ADD COLUMN IF NOT EXISTS price TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_listing ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_listing ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_lms_lessons ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_lms_lessons ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_lms_lessons ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_lms_lessons ADD COLUMN IF NOT EXISTS course_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_lms_lessons ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_loyaltypoints ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_loyaltypoints ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_loyaltypoints ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_loyaltypoints ADD COLUMN IF NOT EXISTS customer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_loyaltypoints ADD COLUMN IF NOT EXISTS customer_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_loyaltypoints ADD COLUMN IF NOT EXISTS points_earned TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_loyaltypoints ADD COLUMN IF NOT EXISTS points_redeemed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_loyaltypoints ADD COLUMN IF NOT EXISTS points_balance TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_loyaltypoints ADD COLUMN IF NOT EXISTS tier TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_loyaltypoints ADD COLUMN IF NOT EXISTS last_activity TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_loyaltypoints ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_luggageclaim ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_luggageclaim ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_luggageclaim ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_machines ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_machines ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_machines ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_machines ADD COLUMN IF NOT EXISTS machine_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_machines ADD COLUMN IF NOT EXISTS serial_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_machines ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_machines ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_machines ADD COLUMN IF NOT EXISTS last_maintenance TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_machines ADD COLUMN IF NOT EXISTS next_maintenance TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_maintenancerequest ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_maintenancerequest ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_maintenancerequest ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_maintenancerequest ADD COLUMN IF NOT EXISTS request_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_maintenancerequest ADD COLUMN IF NOT EXISTS property TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_maintenancerequest ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_maintenancerequest ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_medicalclaims ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalclaims ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalclaims ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalclaims ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalclaims ADD COLUMN IF NOT EXISTS claim_amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalclaims ADD COLUMN IF NOT EXISTS claim_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalclaims ADD COLUMN IF NOT EXISTS insurance_provider TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalclaims ADD COLUMN IF NOT EXISTS policy_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalclaims ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalclaims ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_medicalbillings ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalbillings ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalbillings ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalbillings ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalbillings ADD COLUMN IF NOT EXISTS service_provided TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalbillings ADD COLUMN IF NOT EXISTS total_cost DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalbillings ADD COLUMN IF NOT EXISTS insurance_covered DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalbillings ADD COLUMN IF NOT EXISTS amount_due DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalbillings ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalbillings ADD COLUMN IF NOT EXISTS issue_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medicalbillings ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_meetingminutess ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_meetingminutess ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_meetingminutess ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_meetingminutess ADD COLUMN IF NOT EXISTS meeting_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_meetingminutess ADD COLUMN IF NOT EXISTS meeting_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_meetingminutess ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_meetingminutess ADD COLUMN IF NOT EXISTS attendees TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_meetingminutess ADD COLUMN IF NOT EXISTS agenda TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_meetingminutess ADD COLUMN IF NOT EXISTS decisions TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_meetingminutess ADD COLUMN IF NOT EXISTS action_items TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_meetingminutess ADD COLUMN IF NOT EXISTS next_meeting TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_meetingminutess ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_menus ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_menus ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_menus ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_menus ADD COLUMN IF NOT EXISTS item_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_menus ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_menus ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_menus ADD COLUMN IF NOT EXISTS price TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_menus ADD COLUMN IF NOT EXISTS is_available TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_menus ADD COLUMN IF NOT EXISTS dietary_info TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_newsletter ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_newsletter ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_newsletter ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_notifications ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_notifications ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_notifications ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_notifications ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_notifications ADD COLUMN IF NOT EXISTS message TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_notifications ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_notifications ADD COLUMN IF NOT EXISTS read INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_onboardingtask ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_onboardingtask ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_onboardingtask ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_operationtheater ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_operationtheater ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_operationtheater ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_orderregistrys ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_orderregistrys ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_orderregistrys ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_orderregistrys ADD COLUMN IF NOT EXISTS customer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_orderregistrys ADD COLUMN IF NOT EXISTS order_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_orderregistrys ADD COLUMN IF NOT EXISTS total_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_orderregistrys ADD COLUMN IF NOT EXISTS order_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_orderregistrys ADD COLUMN IF NOT EXISTS delivery_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_orderregistrys ADD COLUMN IF NOT EXISTS items_summary TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_orderregistrys ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_orgchart ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_orgchart ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_orgchart ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pallettracker ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pallettracker ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pallettracker ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_parent_portal_access ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_parent_portal_access ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_parent_portal_access ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_parent_portal_access ADD COLUMN IF NOT EXISTS student_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_parent_portal_access ADD COLUMN IF NOT EXISTS parent_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_parent_portal_access ADD COLUMN IF NOT EXISTS parent_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_parent_portal_access ADD COLUMN IF NOT EXISTS access_code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_patient_allergies ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_allergies ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_allergies ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_allergies ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_allergies ADD COLUMN IF NOT EXISTS allergen TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_allergies ADD COLUMN IF NOT EXISTS reaction TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_allergies ADD COLUMN IF NOT EXISTS severity TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_allergies ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_patient_problems ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_problems ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_problems ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_problems ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_problems ADD COLUMN IF NOT EXISTS problem_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_problems ADD COLUMN IF NOT EXISTS diagnosis_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_problems ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_problems ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_patient_immunizations ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_immunizations ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_immunizations ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_immunizations ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_immunizations ADD COLUMN IF NOT EXISTS vaccine_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_immunizations ADD COLUMN IF NOT EXISTS administration_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_immunizations ADD COLUMN IF NOT EXISTS administered_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patient_immunizations ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hospital_referrals ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_referrals ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_referrals ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_referrals ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_referrals ADD COLUMN IF NOT EXISTS referring_provider_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_referrals ADD COLUMN IF NOT EXISTS receiving_department TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_referrals ADD COLUMN IF NOT EXISTS receiving_provider_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_referrals ADD COLUMN IF NOT EXISTS referral_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_referrals ADD COLUMN IF NOT EXISTS external_facility_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_referrals ADD COLUMN IF NOT EXISTS reason TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_referrals ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_referrals ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_referrals ADD COLUMN IF NOT EXISTS outcome_notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hospital_consents ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_consents ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_consents ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_consents ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_consents ADD COLUMN IF NOT EXISTS procedure_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_consents ADD COLUMN IF NOT EXISTS consent_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_consents ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_consents ADD COLUMN IF NOT EXISTS signature_data TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_consents ADD COLUMN IF NOT EXISTS signed_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_consents ADD COLUMN IF NOT EXISTS signed_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_consents ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hospital_queues ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_queues ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_queues ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_queues ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_queues ADD COLUMN IF NOT EXISTS department TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_queues ADD COLUMN IF NOT EXISTS provider_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_queues ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_queues ADD COLUMN IF NOT EXISTS priority_score TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_queues ADD COLUMN IF NOT EXISTS called_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_queues ADD COLUMN IF NOT EXISTS completed_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hospital_queues ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_blood_bank ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_bank ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_bank ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_bank ADD COLUMN IF NOT EXISTS blood_group TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_bank ADD COLUMN IF NOT EXISTS unit_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_bank ADD COLUMN IF NOT EXISTS component_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_bank ADD COLUMN IF NOT EXISTS collection_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_bank ADD COLUMN IF NOT EXISTS expiry_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_bank ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_bank ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_blood_crossmatch ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_crossmatch ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_crossmatch ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_crossmatch ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_crossmatch ADD COLUMN IF NOT EXISTS blood_unit_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_crossmatch ADD COLUMN IF NOT EXISTS requested_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_crossmatch ADD COLUMN IF NOT EXISTS request_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_crossmatch ADD COLUMN IF NOT EXISTS crossmatch_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_crossmatch ADD COLUMN IF NOT EXISTS issue_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_crossmatch ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_duty_rosters ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_duty_rosters ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_duty_rosters ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_duty_rosters ADD COLUMN IF NOT EXISTS staff_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_duty_rosters ADD COLUMN IF NOT EXISTS department TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_duty_rosters ADD COLUMN IF NOT EXISTS shift_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_duty_rosters ADD COLUMN IF NOT EXISTS shift_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_duty_rosters ADD COLUMN IF NOT EXISTS start_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_duty_rosters ADD COLUMN IF NOT EXISTS end_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_duty_rosters ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_duty_rosters ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_infection_logs ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_infection_logs ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_infection_logs ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_infection_logs ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_infection_logs ADD COLUMN IF NOT EXISTS ward_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_infection_logs ADD COLUMN IF NOT EXISTS infection_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_infection_logs ADD COLUMN IF NOT EXISTS organism TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_infection_logs ADD COLUMN IF NOT EXISTS source TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_infection_logs ADD COLUMN IF NOT EXISTS detection_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_infection_logs ADD COLUMN IF NOT EXISTS control_measures TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_infection_logs ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_infection_logs ADD COLUMN IF NOT EXISTS reported_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_patients ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patients ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patients ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patients ADD COLUMN IF NOT EXISTS patient_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patients ADD COLUMN IF NOT EXISTS first_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patients ADD COLUMN IF NOT EXISTS last_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patients ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patients ADD COLUMN IF NOT EXISTS gender TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patients ADD COLUMN IF NOT EXISTS blood_group TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patients ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patients ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patients ADD COLUMN IF NOT EXISTS address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_patients ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_payments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payments ADD COLUMN IF NOT EXISTS customer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payments ADD COLUMN IF NOT EXISTS amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payments ADD COLUMN IF NOT EXISTS method TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payments ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payments ADD COLUMN IF NOT EXISTS reference_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_payroll ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payroll ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payroll ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payroll ADD COLUMN IF NOT EXISTS employee_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payroll ADD COLUMN IF NOT EXISTS employee_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payroll ADD COLUMN IF NOT EXISTS period_start TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payroll ADD COLUMN IF NOT EXISTS period_end TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payroll ADD COLUMN IF NOT EXISTS basic_salary DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payroll ADD COLUMN IF NOT EXISTS allowances DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payroll ADD COLUMN IF NOT EXISTS deductions DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payroll ADD COLUMN IF NOT EXISTS net_pay DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payroll ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_payroll ADD COLUMN IF NOT EXISTS payment_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_permittrackers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_permittrackers ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_permittrackers ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pledge ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pledge ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pledge ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pos ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pos ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pos ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pos ADD COLUMN IF NOT EXISTS receipt_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_prescriptions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_prescriptions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_prescriptions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_prescriptions ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_prescriptions ADD COLUMN IF NOT EXISTS doctor_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_prescriptions ADD COLUMN IF NOT EXISTS medication TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_prescriptions ADD COLUMN IF NOT EXISTS dosage TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_prescriptions ADD COLUMN IF NOT EXISTS frequency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_prescriptions ADD COLUMN IF NOT EXISTS duration TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_prescriptions ADD COLUMN IF NOT EXISTS prescription_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_prescriptions ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_prescriptions ADD COLUMN IF NOT EXISTS dispensed_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pressrelease ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pressrelease ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pressrelease ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_procurement ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_procurement ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_procurement ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_procurement ADD COLUMN IF NOT EXISTS po_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_procurement ADD COLUMN IF NOT EXISTS supplier TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_procurement ADD COLUMN IF NOT EXISTS total_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_procurement ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_procurement ADD COLUMN IF NOT EXISTS order_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_procurement ADD COLUMN IF NOT EXISTS expected_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_productcatalogs ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productcatalogs ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productcatalogs ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productcatalogs ADD COLUMN IF NOT EXISTS product_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productcatalogs ADD COLUMN IF NOT EXISTS sku TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productcatalogs ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productcatalogs ADD COLUMN IF NOT EXISTS price TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productcatalogs ADD COLUMN IF NOT EXISTS cost TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productcatalogs ADD COLUMN IF NOT EXISTS stock_qty TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productcatalogs ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productcatalogs ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_production ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_production ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_production ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_production ADD COLUMN IF NOT EXISTS batch_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_production ADD COLUMN IF NOT EXISTS product_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_production ADD COLUMN IF NOT EXISTS quantity TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_production ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_production ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_production ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_productionschedules ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productionschedules ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productionschedules ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productionschedules ADD COLUMN IF NOT EXISTS job_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productionschedules ADD COLUMN IF NOT EXISTS product_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productionschedules ADD COLUMN IF NOT EXISTS machine_line TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productionschedules ADD COLUMN IF NOT EXISTS planned_start TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productionschedules ADD COLUMN IF NOT EXISTS planned_end TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productionschedules ADD COLUMN IF NOT EXISTS quantity_ordered TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productionschedules ADD COLUMN IF NOT EXISTS quantity_produced TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productionschedules ADD COLUMN IF NOT EXISTS operator TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_productionschedules ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_projects ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projects ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projects ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projects ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projects ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projects ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projects ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projects ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projects ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projects ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projects ADD COLUMN IF NOT EXISTS budget TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projects ADD COLUMN IF NOT EXISTS assigned_to TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projects ADD COLUMN IF NOT EXISTS project_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projects ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projects ADD COLUMN IF NOT EXISTS completion_percentage TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_projectmilestones ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projectmilestones ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projectmilestones ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projectmilestones ADD COLUMN IF NOT EXISTS milestone_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projectmilestones ADD COLUMN IF NOT EXISTS project_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projectmilestones ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projectmilestones ADD COLUMN IF NOT EXISTS completion_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projectmilestones ADD COLUMN IF NOT EXISTS progress_percent TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projectmilestones ADD COLUMN IF NOT EXISTS owner TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projectmilestones ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_projectmilestones ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_property ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_property ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_property ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_property ADD COLUMN IF NOT EXISTS property_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_property ADD COLUMN IF NOT EXISTS address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_property ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_property ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_propertyinspection ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_propertyinspection ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_propertyinspection ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_propertyinspection ADD COLUMN IF NOT EXISTS property_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_propertyinspection ADD COLUMN IF NOT EXISTS inspector TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_propertyinspection ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_propertyinspection ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_purchaseorders ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_purchaseorders ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_purchaseorders ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_quality_control ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_quality_control ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_quality_control ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_quality_control ADD COLUMN IF NOT EXISTS batch_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_quality_control ADD COLUMN IF NOT EXISTS inspector_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_quality_control ADD COLUMN IF NOT EXISTS inspection_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_quality_control ADD COLUMN IF NOT EXISTS result TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_quality_control ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_rawmaterials ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_rawmaterials ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_rawmaterials ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_recruitment ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_recruitment ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_recruitment ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_recruitment ADD COLUMN IF NOT EXISTS candidate_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_recruitment ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_recruitment ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_recruitment ADD COLUMN IF NOT EXISTS position TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_recruitment ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_recruitment ADD COLUMN IF NOT EXISTS source TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_recruitment ADD COLUMN IF NOT EXISTS experience_years TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_recruitment ADD COLUMN IF NOT EXISTS rating TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_recruitment ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_referrals ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_referrals ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_referrals ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_retainer ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_retainer ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_retainer ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_retainer ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_retainer ADD COLUMN IF NOT EXISTS amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_retainer ADD COLUMN IF NOT EXISTS date_paid TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_retainer ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_returnrefunds ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_returnrefunds ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_returnrefunds ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_returnrefunds ADD COLUMN IF NOT EXISTS order_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_returnrefunds ADD COLUMN IF NOT EXISTS customer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_returnrefunds ADD COLUMN IF NOT EXISTS return_reason TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_returnrefunds ADD COLUMN IF NOT EXISTS refund_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_returnrefunds ADD COLUMN IF NOT EXISTS request_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_returnrefunds ADD COLUMN IF NOT EXISTS resolution_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_returnrefunds ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_riskregisters ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_riskregisters ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_riskregisters ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_riskregisters ADD COLUMN IF NOT EXISTS risk_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_riskregisters ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_riskregisters ADD COLUMN IF NOT EXISTS likelihood TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_riskregisters ADD COLUMN IF NOT EXISTS impact TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_riskregisters ADD COLUMN IF NOT EXISTS risk_score TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_riskregisters ADD COLUMN IF NOT EXISTS owner TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_riskregisters ADD COLUMN IF NOT EXISTS mitigation_plan TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_riskregisters ADD COLUMN IF NOT EXISTS review_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_riskregisters ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_rooms ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_rooms ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_rooms ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_rooms ADD COLUMN IF NOT EXISTS room_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_rooms ADD COLUMN IF NOT EXISTS room_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_rooms ADD COLUMN IF NOT EXISTS floor TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_rooms ADD COLUMN IF NOT EXISTS price_per_night TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_rooms ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_rooms ADD COLUMN IF NOT EXISTS amenities TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_routes ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_routes ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_routes ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_routes ADD COLUMN IF NOT EXISTS route_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_safety ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_safety ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_safety ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_safety ADD COLUMN IF NOT EXISTS incident_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_safety ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_safety ADD COLUMN IF NOT EXISTS reported_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_safety ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_safety ADD COLUMN IF NOT EXISTS severity TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_salestargets ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_salestargets ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_salestargets ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_salestargets ADD COLUMN IF NOT EXISTS sales_rep TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_salestargets ADD COLUMN IF NOT EXISTS team TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_salestargets ADD COLUMN IF NOT EXISTS period TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_salestargets ADD COLUMN IF NOT EXISTS target_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_salestargets ADD COLUMN IF NOT EXISTS achieved_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_salestargets ADD COLUMN IF NOT EXISTS deals_closed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_salestargets ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_salestargets ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_scholarships ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_scholarships ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_scholarships ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_scraprates ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_scraprates ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_scraprates ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_seokeyword ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_seokeyword ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_seokeyword ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_servermetrics ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_servermetrics ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_servermetrics ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_servermetrics ADD COLUMN IF NOT EXISTS server_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_servermetrics ADD COLUMN IF NOT EXISTS ip_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_servermetrics ADD COLUMN IF NOT EXISTS cpu_usage TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_servermetrics ADD COLUMN IF NOT EXISTS memory_usage TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_servermetrics ADD COLUMN IF NOT EXISTS disk_usage TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_servermetrics ADD COLUMN IF NOT EXISTS uptime_hours TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_servermetrics ADD COLUMN IF NOT EXISTS recorded_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_servermetrics ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_servermetrics ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_site_inspections ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_site_inspections ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_site_inspections ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_site_inspections ADD COLUMN IF NOT EXISTS project_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_site_inspections ADD COLUMN IF NOT EXISTS inspector_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_site_inspections ADD COLUMN IF NOT EXISTS inspection_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_site_inspections ADD COLUMN IF NOT EXISTS findings TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_site_inspections ADD COLUMN IF NOT EXISTS snag_list TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_site_inspections ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_slaagreements ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_slaagreements ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_slaagreements ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_slaagreements ADD COLUMN IF NOT EXISTS agreement_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_slaagreements ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_slaagreements ADD COLUMN IF NOT EXISTS response_time_hours TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_slaagreements ADD COLUMN IF NOT EXISTS resolution_time_hours TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_slaagreements ADD COLUMN IF NOT EXISTS uptime_guarantee TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_slaagreements ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_slaagreements ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_slaagreements ADD COLUMN IF NOT EXISTS penalty_clause TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_slaagreements ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_snaglists ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_snaglists ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_snaglists ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_softwarelicenses ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_softwarelicenses ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_softwarelicenses ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_softwarelicenses ADD COLUMN IF NOT EXISTS software_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_softwarelicenses ADD COLUMN IF NOT EXISTS vendor TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_softwarelicenses ADD COLUMN IF NOT EXISTS license_key TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_softwarelicenses ADD COLUMN IF NOT EXISTS seats TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_softwarelicenses ADD COLUMN IF NOT EXISTS purchase_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_softwarelicenses ADD COLUMN IF NOT EXISTS expiry_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_softwarelicenses ADD COLUMN IF NOT EXISTS cost_per_year TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_softwarelicenses ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_softwarelicenses ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_sponsorship ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_sponsorship ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_sponsorship ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_sslcertificates ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_sslcertificates ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_sslcertificates ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_sslcertificates ADD COLUMN IF NOT EXISTS domain TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_sslcertificates ADD COLUMN IF NOT EXISTS issuer TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_sslcertificates ADD COLUMN IF NOT EXISTS cert_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_sslcertificates ADD COLUMN IF NOT EXISTS issue_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_sslcertificates ADD COLUMN IF NOT EXISTS expiry_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_sslcertificates ADD COLUMN IF NOT EXISTS auto_renew TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_sslcertificates ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_sslcertificates ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_stockoptions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_stockoptions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_stockoptions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_students ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_students ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_students ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_students ADD COLUMN IF NOT EXISTS student_id_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_subscriptions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_subscriptions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_subscriptions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_subscriptions ADD COLUMN IF NOT EXISTS plan_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_subscriptions ADD COLUMN IF NOT EXISTS customer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_subscriptions ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_subscriptions ADD COLUMN IF NOT EXISTS billing_cycle TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_subscriptions ADD COLUMN IF NOT EXISTS amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_subscriptions ADD COLUMN IF NOT EXISTS next_billing_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_supplierdirectorys ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supplierdirectorys ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supplierdirectorys ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supplierdirectorys ADD COLUMN IF NOT EXISTS supplier_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supplierdirectorys ADD COLUMN IF NOT EXISTS contact_person TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supplierdirectorys ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supplierdirectorys ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supplierdirectorys ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supplierdirectorys ADD COLUMN IF NOT EXISTS lead_time_days TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supplierdirectorys ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supplierdirectorys ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_supporttickets ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supporttickets ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supporttickets ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supporttickets ADD COLUMN IF NOT EXISTS ticket_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supporttickets ADD COLUMN IF NOT EXISTS subject TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supporttickets ADD COLUMN IF NOT EXISTS customer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supporttickets ADD COLUMN IF NOT EXISTS customer_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supporttickets ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supporttickets ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supporttickets ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supporttickets ADD COLUMN IF NOT EXISTS assigned_to TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_supporttickets ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_tablereservation ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_tablereservation ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_tablereservation ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_taxfilings ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_taxfilings ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_taxfilings ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_taxfilings ADD COLUMN IF NOT EXISTS filing_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_taxfilings ADD COLUMN IF NOT EXISTS tax_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_taxfilings ADD COLUMN IF NOT EXISTS period TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_taxfilings ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_taxfilings ADD COLUMN IF NOT EXISTS filed_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_taxfilings ADD COLUMN IF NOT EXISTS tax_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_taxfilings ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_taxfilings ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_telemedicine ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_telemedicine ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_telemedicine ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_telemedicine ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_telemedicine ADD COLUMN IF NOT EXISTS doctor_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_telemedicine ADD COLUMN IF NOT EXISTS scheduled_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_telemedicine ADD COLUMN IF NOT EXISTS meeting_link TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_telemedicine ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_telemedicine ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_surgeries ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_surgeries ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_surgeries ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_surgeries ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_surgeries ADD COLUMN IF NOT EXISTS surgery_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_surgeries ADD COLUMN IF NOT EXISTS surgeon_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_surgeries ADD COLUMN IF NOT EXISTS scheduled_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_surgeries ADD COLUMN IF NOT EXISTS ot_room TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_surgeries ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_surgeries ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_ambulance_dispatch ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ambulance_dispatch ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ambulance_dispatch ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ambulance_dispatch ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ambulance_dispatch ADD COLUMN IF NOT EXISTS driver_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ambulance_dispatch ADD COLUMN IF NOT EXISTS paramedic_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ambulance_dispatch ADD COLUMN IF NOT EXISTS dispatch_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ambulance_dispatch ADD COLUMN IF NOT EXISTS destination TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ambulance_dispatch ADD COLUMN IF NOT EXISTS emergency_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ambulance_dispatch ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ambulance_dispatch ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_tenant ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_tenant ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_tenant ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_tenant ADD COLUMN IF NOT EXISTS tenant_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_tenant ADD COLUMN IF NOT EXISTS property_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_tenant ADD COLUMN IF NOT EXISTS lease_end TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_tenant ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_ticketsales ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ticketsales ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ticketsales ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ticketsales ADD COLUMN IF NOT EXISTS event_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ticketsales ADD COLUMN IF NOT EXISTS ticket_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ticketsales ADD COLUMN IF NOT EXISTS price TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ticketsales ADD COLUMN IF NOT EXISTS quantity_available TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ticketsales ADD COLUMN IF NOT EXISTS quantity_sold TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ticketsales ADD COLUMN IF NOT EXISTS sale_start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_ticketsales ADD COLUMN IF NOT EXISTS sale_end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_timebilling ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_timebilling ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_timebilling ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_timebilling ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_timebilling ADD COLUMN IF NOT EXISTS hours TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_timebilling ADD COLUMN IF NOT EXISTS rate TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_timebilling ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_timesheet ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_timesheet ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_timesheet ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_tourpackage ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_tourpackage ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_tourpackage ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_trademark ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trademark ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trademark ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trademark ADD COLUMN IF NOT EXISTS trademark_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trademark ADD COLUMN IF NOT EXISTS registration_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trademark ADD COLUMN IF NOT EXISTS owner TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trademark ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_trainingrecords ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trainingrecords ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trainingrecords ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trainingrecords ADD COLUMN IF NOT EXISTS employee_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trainingrecords ADD COLUMN IF NOT EXISTS training_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trainingrecords ADD COLUMN IF NOT EXISTS provider TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trainingrecords ADD COLUMN IF NOT EXISTS training_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trainingrecords ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trainingrecords ADD COLUMN IF NOT EXISTS completion_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trainingrecords ADD COLUMN IF NOT EXISTS score TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trainingrecords ADD COLUMN IF NOT EXISTS certificate_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_trainingrecords ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_triage ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_triage ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_triage ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_tuitions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_tuitions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_tuitions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_utilitybills ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_utilitybills ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_utilitybills ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_utilitybills ADD COLUMN IF NOT EXISTS unit_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_utilitybills ADD COLUMN IF NOT EXISTS tenant_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_utilitybills ADD COLUMN IF NOT EXISTS utility_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_utilitybills ADD COLUMN IF NOT EXISTS amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_utilitybills ADD COLUMN IF NOT EXISTS bill_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_utilitybills ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_utilitybills ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_utilitybills ADD COLUMN IF NOT EXISTS meter_reading TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_vitalsigns ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_vitalsigns ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_vitalsigns ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_volunteerroster ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_volunteerroster ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_volunteerroster ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_vulnerabilities ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_vulnerabilities ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_vulnerabilities ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_vulnerabilities ADD COLUMN IF NOT EXISTS vulnerability_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_vulnerabilities ADD COLUMN IF NOT EXISTS cve_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_vulnerabilities ADD COLUMN IF NOT EXISTS severity TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_vulnerabilities ADD COLUMN IF NOT EXISTS affected_system TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_vulnerabilities ADD COLUMN IF NOT EXISTS discovered_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_vulnerabilities ADD COLUMN IF NOT EXISTS remediation_steps TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_vulnerabilities ADD COLUMN IF NOT EXISTS assigned_to TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_vulnerabilities ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_wards ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wards ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wards ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wards ADD COLUMN IF NOT EXISTS ward_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wards ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wards ADD COLUMN IF NOT EXISTS capacity TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wards ADD COLUMN IF NOT EXISTS bed_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wards ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wards ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wards ADD COLUMN IF NOT EXISTS admission_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_warehouses ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_warehouses ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_warehouses ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_warehouses ADD COLUMN IF NOT EXISTS zone_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_warehouses ADD COLUMN IF NOT EXISTS bay_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_warehouses ADD COLUMN IF NOT EXISTS capacity TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_warehouses ADD COLUMN IF NOT EXISTS current_occupancy TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_warehouses ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_wishlists ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wishlists ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wishlists ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wishlists ADD COLUMN IF NOT EXISTS customer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wishlists ADD COLUMN IF NOT EXISTS item_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wishlists ADD COLUMN IF NOT EXISTS product_sku TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wishlists ADD COLUMN IF NOT EXISTS price TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wishlists ADD COLUMN IF NOT EXISTS added_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wishlists ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_wishlists ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_workorders ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_workorders ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_workorders ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS driver_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS driver_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS shipment_ids TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS optimized_route TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS estimated_distance TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS estimated_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS actual_distance TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS actual_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS start_location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS end_location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS waypoints TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.pod_records ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.pod_records ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.pod_records ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.pod_records ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.pod_records ADD COLUMN IF NOT EXISTS shipment_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.pod_records ADD COLUMN IF NOT EXISTS delivery_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.pod_records ADD COLUMN IF NOT EXISTS recipient_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.pod_records ADD COLUMN IF NOT EXISTS signature_data TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.pod_records ADD COLUMN IF NOT EXISTS photo_urls TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.pod_records ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.pod_records ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.return_orders ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.return_orders ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.return_orders ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.return_orders ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.return_orders ADD COLUMN IF NOT EXISTS original_shipment_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.return_orders ADD COLUMN IF NOT EXISTS return_reason TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.return_orders ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.return_orders ADD COLUMN IF NOT EXISTS initiation_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.return_orders ADD COLUMN IF NOT EXISTS expected_return_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.return_orders ADD COLUMN IF NOT EXISTS actual_return_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.return_orders ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.incident_reports ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.incident_reports ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.incident_reports ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.incident_reports ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.incident_reports ADD COLUMN IF NOT EXISTS shipment_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.incident_reports ADD COLUMN IF NOT EXISTS incident_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.incident_reports ADD COLUMN IF NOT EXISTS severity TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.incident_reports ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.incident_reports ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.incident_reports ADD COLUMN IF NOT EXISTS reported_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.incident_reports ADD COLUMN IF NOT EXISTS evidence_urls TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.incident_reports ADD COLUMN IF NOT EXISTS resolution TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.incident_reports ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.gps_tracking ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.gps_tracking ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.gps_tracking ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.gps_tracking ADD COLUMN IF NOT EXISTS shipment_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.gps_tracking ADD COLUMN IF NOT EXISTS driver_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.gps_tracking ADD COLUMN IF NOT EXISTS latitude TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.gps_tracking ADD COLUMN IF NOT EXISTS longitude TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.gps_tracking ADD COLUMN IF NOT EXISTS accuracy TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.gps_tracking ADD COLUMN IF NOT EXISTS speed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.gps_tracking ADD COLUMN IF NOT EXISTS heading TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.gps_tracking ADD COLUMN IF NOT EXISTS timestamp TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.vehicle_registrations ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_registrations ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_registrations ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_registrations ADD COLUMN IF NOT EXISTS registration_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_registrations ADD COLUMN IF NOT EXISTS registration_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_registrations ADD COLUMN IF NOT EXISTS expiry_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_registrations ADD COLUMN IF NOT EXISTS issuing_authority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_registrations ADD COLUMN IF NOT EXISTS registration_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_registrations ADD COLUMN IF NOT EXISTS tax_paid TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_registrations ADD COLUMN IF NOT EXISTS tax_expiry_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_registrations ADD COLUMN IF NOT EXISTS permit_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_registrations ADD COLUMN IF NOT EXISTS permit_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_registrations ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_registrations ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_registrations ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.vehicle_insurance ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_insurance ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_insurance ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_insurance ADD COLUMN IF NOT EXISTS provider_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_insurance ADD COLUMN IF NOT EXISTS policy_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_insurance ADD COLUMN IF NOT EXISTS policy_start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_insurance ADD COLUMN IF NOT EXISTS policy_expiry_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_insurance ADD COLUMN IF NOT EXISTS coverage_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_insurance ADD COLUMN IF NOT EXISTS coverage_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_insurance ADD COLUMN IF NOT EXISTS premium_amount TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_insurance ADD COLUMN IF NOT EXISTS last_payment_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_insurance ADD COLUMN IF NOT EXISTS insurance_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_insurance ADD COLUMN IF NOT EXISTS claim_history TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_insurance ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_insurance ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_insurance ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.vehicle_licenses ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_licenses ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_licenses ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_licenses ADD COLUMN IF NOT EXISTS license_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_licenses ADD COLUMN IF NOT EXISTS license_issue_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_licenses ADD COLUMN IF NOT EXISTS license_expiry_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_licenses ADD COLUMN IF NOT EXISTS issuing_country TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_licenses ADD COLUMN IF NOT EXISTS vehicle_class TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_licenses ADD COLUMN IF NOT EXISTS weight_category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_licenses ADD COLUMN IF NOT EXISTS dimensions TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_licenses ADD COLUMN IF NOT EXISTS max_passengers TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_licenses ADD COLUMN IF NOT EXISTS fuel_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_licenses ADD COLUMN IF NOT EXISTS emission_standard TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_licenses ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_licenses ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_licenses ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.vehicle_service_records ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_service_records ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_service_records ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_service_records ADD COLUMN IF NOT EXISTS service_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_service_records ADD COLUMN IF NOT EXISTS service_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_service_records ADD COLUMN IF NOT EXISTS service_provider TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_service_records ADD COLUMN IF NOT EXISTS mileage_at_service TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_service_records ADD COLUMN IF NOT EXISTS parts_replaced TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_service_records ADD COLUMN IF NOT EXISTS cost TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_service_records ADD COLUMN IF NOT EXISTS next_service_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_service_records ADD COLUMN IF NOT EXISTS service_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_service_records ADD COLUMN IF NOT EXISTS service_notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_service_records ADD COLUMN IF NOT EXISTS attachments_urls TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_service_records ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_service_records ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS maintenance_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS scheduled_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS scheduled_mileage TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS priority_level TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS assigned_to TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS estimated_duration TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS estimated_cost TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS completed_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS actual_cost TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.preventive_maintenance_plans ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.preventive_maintenance_plans ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.preventive_maintenance_plans ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.preventive_maintenance_plans ADD COLUMN IF NOT EXISTS plan_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.preventive_maintenance_plans ADD COLUMN IF NOT EXISTS frequency_months TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.preventive_maintenance_plans ADD COLUMN IF NOT EXISTS last_performed_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.preventive_maintenance_plans ADD COLUMN IF NOT EXISTS next_due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.preventive_maintenance_plans ADD COLUMN IF NOT EXISTS maintenance_items TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.preventive_maintenance_plans ADD COLUMN IF NOT EXISTS estimated_cost TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.preventive_maintenance_plans ADD COLUMN IF NOT EXISTS contractor_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.preventive_maintenance_plans ADD COLUMN IF NOT EXISTS plan_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.preventive_maintenance_plans ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.preventive_maintenance_plans ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.preventive_maintenance_plans ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS breakdown_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS location_gps TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS breakdown_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS severity TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS breakdown_description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS assigned_mechanic TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS parts_needed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS estimated_repair_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS actual_repair_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS repair_cost TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS downtime_hours TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS resolved_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_breakdowns ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.tire_management ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tire_management ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tire_management ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tire_management ADD COLUMN IF NOT EXISTS tire_position TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tire_management ADD COLUMN IF NOT EXISTS tire_brand TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tire_management ADD COLUMN IF NOT EXISTS tire_model TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tire_management ADD COLUMN IF NOT EXISTS tire_size TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tire_management ADD COLUMN IF NOT EXISTS installation_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tire_management ADD COLUMN IF NOT EXISTS tread_depth_mm TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tire_management ADD COLUMN IF NOT EXISTS last_rotated_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tire_management ADD COLUMN IF NOT EXISTS next_rotation_due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tire_management ADD COLUMN IF NOT EXISTS condition_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tire_management ADD COLUMN IF NOT EXISTS estimated_replacement_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tire_management ADD COLUMN IF NOT EXISTS replacement_cost TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tire_management ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tire_management ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.tire_management ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.fuel_management ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.fuel_management ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.fuel_management ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.fuel_management ADD COLUMN IF NOT EXISTS fuel_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.fuel_management ADD COLUMN IF NOT EXISTS fuel_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.fuel_management ADD COLUMN IF NOT EXISTS quantity_liters TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.fuel_management ADD COLUMN IF NOT EXISTS cost_per_liter TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.fuel_management ADD COLUMN IF NOT EXISTS total_cost TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.fuel_management ADD COLUMN IF NOT EXISTS fuel_station TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.fuel_management ADD COLUMN IF NOT EXISTS odometer_reading TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.fuel_management ADD COLUMN IF NOT EXISTS fuel_efficiency_kmpl TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.fuel_management ADD COLUMN IF NOT EXISTS payment_method TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.fuel_management ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.fuel_management ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.fuel_management ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS part_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS part_code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS part_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS vehicle_make TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS vehicle_model TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS quantity_on_hand TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS reorder_level TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS unit_cost TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS supplier_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS supplier_contact TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS warehouse_location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS last_restock_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS expiry_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.spare_parts_inventory ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.asset_tracking ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.asset_tracking ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.asset_tracking ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.asset_tracking ADD COLUMN IF NOT EXISTS asset_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.asset_tracking ADD COLUMN IF NOT EXISTS asset_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.asset_tracking ADD COLUMN IF NOT EXISTS serial_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.asset_tracking ADD COLUMN IF NOT EXISTS asset_value TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.asset_tracking ADD COLUMN IF NOT EXISTS installation_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.asset_tracking ADD COLUMN IF NOT EXISTS maintenance_interval_months TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.asset_tracking ADD COLUMN IF NOT EXISTS last_maintained_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.asset_tracking ADD COLUMN IF NOT EXISTS depreciation_rate TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.asset_tracking ADD COLUMN IF NOT EXISTS current_condition TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.asset_tracking ADD COLUMN IF NOT EXISTS location_on_vehicle TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.asset_tracking ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.asset_tracking ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.asset_tracking ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.vehicle_utilization ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_utilization ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_utilization ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_utilization ADD COLUMN IF NOT EXISTS date_period TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_utilization ADD COLUMN IF NOT EXISTS total_kilometers TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_utilization ADD COLUMN IF NOT EXISTS trips_completed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_utilization ADD COLUMN IF NOT EXISTS hours_in_use TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_utilization ADD COLUMN IF NOT EXISTS idle_time_hours TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_utilization ADD COLUMN IF NOT EXISTS utilization_percentage TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_utilization ADD COLUMN IF NOT EXISTS revenue_generated TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_utilization ADD COLUMN IF NOT EXISTS operating_cost TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_utilization ADD COLUMN IF NOT EXISTS profit_loss TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_utilization ADD COLUMN IF NOT EXISTS fuel_consumed_liters TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_utilization ADD COLUMN IF NOT EXISTS avg_speed_kmh TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_utilization ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_utilization ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_utilization ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.vehicle_downtime ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_downtime ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_downtime ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_downtime ADD COLUMN IF NOT EXISTS downtime_start TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_downtime ADD COLUMN IF NOT EXISTS downtime_end TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_downtime ADD COLUMN IF NOT EXISTS downtime_reason TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_downtime ADD COLUMN IF NOT EXISTS downtime_category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_downtime ADD COLUMN IF NOT EXISTS duration_hours TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_downtime ADD COLUMN IF NOT EXISTS cost_of_downtime TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_downtime ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_downtime ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_downtime ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_downtime ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS inspection_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS inspection_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS inspector_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS inspection_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS overall_condition TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS body_condition TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS engine_condition TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS transmission_condition TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS electrical_condition TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS safety_equipment_check TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS tire_condition TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS brake_system_check TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS suspension_check TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS lights_check TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS issues_found TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS repair_recommendations TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS follow_up_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS inspection_notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.vehicle_inspections ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_pharmacy ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pharmacy ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pharmacy ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pharmacy ADD COLUMN IF NOT EXISTS drug_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pharmacy ADD COLUMN IF NOT EXISTS sku TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pharmacy ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pharmacy ADD COLUMN IF NOT EXISTS stock_level INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pharmacy ADD COLUMN IF NOT EXISTS reorder_level INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pharmacy ADD COLUMN IF NOT EXISTS unit_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pharmacy ADD COLUMN IF NOT EXISTS expiry_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_pharmacy ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_admissions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_admissions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_admissions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_admissions ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_admissions ADD COLUMN IF NOT EXISTS ward_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_admissions ADD COLUMN IF NOT EXISTS admission_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_admissions ADD COLUMN IF NOT EXISTS discharge_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_admissions ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_admissions ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_medical_history ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medical_history ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medical_history ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medical_history ADD COLUMN IF NOT EXISTS patient_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medical_history ADD COLUMN IF NOT EXISTS doctor_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medical_history ADD COLUMN IF NOT EXISTS record_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medical_history ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medical_history ADD COLUMN IF NOT EXISTS vitals_bp TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medical_history ADD COLUMN IF NOT EXISTS vitals_hr TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medical_history ADD COLUMN IF NOT EXISTS vitals_temp TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medical_history ADD COLUMN IF NOT EXISTS vitals_weight TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medical_history ADD COLUMN IF NOT EXISTS soap_subjective TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medical_history ADD COLUMN IF NOT EXISTS soap_objective TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medical_history ADD COLUMN IF NOT EXISTS soap_assessment TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medical_history ADD COLUMN IF NOT EXISTS soap_plan TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_medical_history ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hotel_reservations ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_reservations ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_reservations ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_reservations ADD COLUMN IF NOT EXISTS reservation_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_reservations ADD COLUMN IF NOT EXISTS guest_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_reservations ADD COLUMN IF NOT EXISTS guest_phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_reservations ADD COLUMN IF NOT EXISTS guest_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_reservations ADD COLUMN IF NOT EXISTS room_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_reservations ADD COLUMN IF NOT EXISTS room_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_reservations ADD COLUMN IF NOT EXISTS check_in TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_reservations ADD COLUMN IF NOT EXISTS check_out TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_reservations ADD COLUMN IF NOT EXISTS nights INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_reservations ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_reservations ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_reservations ADD COLUMN IF NOT EXISTS channel_source TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_reservations ADD COLUMN IF NOT EXISTS ota_reservation_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_reservations ADD COLUMN IF NOT EXISTS channel_commission DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hotel_rooms ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_rooms ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_rooms ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_rooms ADD COLUMN IF NOT EXISTS room_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_rooms ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_rooms ADD COLUMN IF NOT EXISTS rate DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_rooms ADD COLUMN IF NOT EXISTS floor TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_rooms ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_rooms ADD COLUMN IF NOT EXISTS amenities TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_rooms ADD COLUMN IF NOT EXISTS ota_room_code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hotel_requests ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_requests ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_requests ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_requests ADD COLUMN IF NOT EXISTS room TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_requests ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_requests ADD COLUMN IF NOT EXISTS detail TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_requests ADD COLUMN IF NOT EXISTS time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_requests ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hotel_menu ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_menu ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_menu ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_menu ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_menu ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_menu ADD COLUMN IF NOT EXISTS price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_menu ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hotel_restaurant_orders ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_restaurant_orders ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_restaurant_orders ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_restaurant_orders ADD COLUMN IF NOT EXISTS order_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_restaurant_orders ADD COLUMN IF NOT EXISTS items TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_restaurant_orders ADD COLUMN IF NOT EXISTS total DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_restaurant_orders ADD COLUMN IF NOT EXISTS room_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_restaurant_orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_restaurant_orders ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hotel_settings ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_settings ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_settings ADD COLUMN IF NOT EXISTS booking_hotel_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_settings ADD COLUMN IF NOT EXISTS expedia_hotel_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_settings ADD COLUMN IF NOT EXISTS airbnb_host_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_settings ADD COLUMN IF NOT EXISTS channex_property_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_settings ADD COLUMN IF NOT EXISTS mock_mode INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_settings ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hotel_feedback ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_feedback ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_feedback ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_feedback ADD COLUMN IF NOT EXISTS reservation_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_feedback ADD COLUMN IF NOT EXISTS guest_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_feedback ADD COLUMN IF NOT EXISTS rating INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_feedback ADD COLUMN IF NOT EXISTS comment TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_feedback ADD COLUMN IF NOT EXISTS sentiment TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_feedback ADD COLUMN IF NOT EXISTS themes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_feedback ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hotel_inventory ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_inventory ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_inventory ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_inventory ADD COLUMN IF NOT EXISTS item_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_inventory ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_inventory ADD COLUMN IF NOT EXISTS quantity INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_inventory ADD COLUMN IF NOT EXISTS unit TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_inventory ADD COLUMN IF NOT EXISTS expiry_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_inventory ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_inventory ADD COLUMN IF NOT EXISTS supplier TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hotel_maintenance ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_maintenance ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_maintenance ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_maintenance ADD COLUMN IF NOT EXISTS room_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_maintenance ADD COLUMN IF NOT EXISTS issue_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_maintenance ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_maintenance ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_maintenance ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_maintenance ADD COLUMN IF NOT EXISTS reported_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_maintenance ADD COLUMN IF NOT EXISTS assigned_to TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hotel_events ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_events ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_events ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_events ADD COLUMN IF NOT EXISTS event_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_events ADD COLUMN IF NOT EXISTS hall_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_events ADD COLUMN IF NOT EXISTS event_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_events ADD COLUMN IF NOT EXISTS attendees INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_events ADD COLUMN IF NOT EXISTS total_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_events ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_events ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_hotel_lost_found ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_lost_found ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_lost_found ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_lost_found ADD COLUMN IF NOT EXISTS item_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_lost_found ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_lost_found ADD COLUMN IF NOT EXISTS location_found TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_lost_found ADD COLUMN IF NOT EXISTS date_found TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_lost_found ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_hotel_lost_found ADD COLUMN IF NOT EXISTS claimant_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS vertical TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS insight_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS insight_key TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS entity_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS entity_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS body TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS severity TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS confidence DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS data_snapshot TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS action_label TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS action_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS is_dismissed INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS dismissed_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS dismissed_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS computed_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS expires_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_insights ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.intelligence_runs ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intelligence_runs ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intelligence_runs ADD COLUMN IF NOT EXISTS vertical TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intelligence_runs ADD COLUMN IF NOT EXISTS engine_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intelligence_runs ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intelligence_runs ADD COLUMN IF NOT EXISTS insights_created INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intelligence_runs ADD COLUMN IF NOT EXISTS insights_updated INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intelligence_runs ADD COLUMN IF NOT EXISTS error_message TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intelligence_runs ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intelligence_runs ADD COLUMN IF NOT EXISTS started_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.intelligence_runs ADD COLUMN IF NOT EXISTS completed_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.entity_intelligence ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_intelligence ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_intelligence ADD COLUMN IF NOT EXISTS entity_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_intelligence ADD COLUMN IF NOT EXISTS entity_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_intelligence ADD COLUMN IF NOT EXISTS summary TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_intelligence ADD COLUMN IF NOT EXISTS risk_score DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_intelligence ADD COLUMN IF NOT EXISTS risk_factors TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_intelligence ADD COLUMN IF NOT EXISTS next_actions TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_intelligence ADD COLUMN IF NOT EXISTS key_signals TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_intelligence ADD COLUMN IF NOT EXISTS computed_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.insight_feedback ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insight_feedback ADD COLUMN IF NOT EXISTS insight_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insight_feedback ADD COLUMN IF NOT EXISTS workspace_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insight_feedback ADD COLUMN IF NOT EXISTS feedback_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insight_feedback ADD COLUMN IF NOT EXISTS outcome TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insight_feedback ADD COLUMN IF NOT EXISTS user_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.insight_feedback ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.engine_accuracy ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.engine_accuracy ADD COLUMN IF NOT EXISTS workspace_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.engine_accuracy ADD COLUMN IF NOT EXISTS engine_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.engine_accuracy ADD COLUMN IF NOT EXISTS insight_key TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.engine_accuracy ADD COLUMN IF NOT EXISTS total_produced INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.engine_accuracy ADD COLUMN IF NOT EXISTS acted_on INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.engine_accuracy ADD COLUMN IF NOT EXISTS dismissed INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.engine_accuracy ADD COLUMN IF NOT EXISTS marked_incorrect INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.engine_accuracy ADD COLUMN IF NOT EXISTS accuracy_score DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.engine_accuracy ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.component_registry ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.component_registry ADD COLUMN IF NOT EXISTS module_key TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.component_registry ADD COLUMN IF NOT EXISTS display_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.component_registry ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.component_registry ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.component_registry ADD COLUMN IF NOT EXISTS applicable_industries TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.component_registry ADD COLUMN IF NOT EXISTS config_schema TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.component_registry ADD COLUMN IF NOT EXISTS required_tables TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.component_registry ADD COLUMN IF NOT EXISTS optional_tables TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.component_registry ADD COLUMN IF NOT EXISTS is_active INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.component_registry ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.industry_templates ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.industry_templates ADD COLUMN IF NOT EXISTS industry_key TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.industry_templates ADD COLUMN IF NOT EXISTS display_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.industry_templates ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.industry_templates ADD COLUMN IF NOT EXISTS icon TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.industry_templates ADD COLUMN IF NOT EXISTS module_keys TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.industry_templates ADD COLUMN IF NOT EXISTS is_built_in INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.industry_templates ADD COLUMN IF NOT EXISTS created_by_workspace TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.industry_templates ADD COLUMN IF NOT EXISTS is_public INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.industry_templates ADD COLUMN IF NOT EXISTS usage_count INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.industry_templates ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.workspace_modules ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_modules ADD COLUMN IF NOT EXISTS workspace_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_modules ADD COLUMN IF NOT EXISTS module_key TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_modules ADD COLUMN IF NOT EXISTS display_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_modules ADD COLUMN IF NOT EXISTS config TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_modules ADD COLUMN IF NOT EXISTS position INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_modules ADD COLUMN IF NOT EXISTS is_active INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_modules ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.workspace_modules ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.marketplace_review_requests ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.marketplace_review_requests ADD COLUMN IF NOT EXISTS item_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.marketplace_review_requests ADD COLUMN IF NOT EXISTS item_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.marketplace_review_requests ADD COLUMN IF NOT EXISTS submitted_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.marketplace_review_requests ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.marketplace_review_requests ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.uni_departments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_departments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_departments ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_departments ADD COLUMN IF NOT EXISTS code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_departments ADD COLUMN IF NOT EXISTS head_of_department_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_departments ADD COLUMN IF NOT EXISTS established_year INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_departments ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_departments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.uni_programs ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_programs ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_programs ADD COLUMN IF NOT EXISTS department_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_programs ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_programs ADD COLUMN IF NOT EXISTS code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_programs ADD COLUMN IF NOT EXISTS degree_level TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_programs ADD COLUMN IF NOT EXISTS duration_years INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_programs ADD COLUMN IF NOT EXISTS total_credits INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_programs ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_programs ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.uni_staff ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_staff ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_staff ADD COLUMN IF NOT EXISTS first_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_staff ADD COLUMN IF NOT EXISTS last_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_staff ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_staff ADD COLUMN IF NOT EXISTS role TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_staff ADD COLUMN IF NOT EXISTS department_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_staff ADD COLUMN IF NOT EXISTS hire_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_staff ADD COLUMN IF NOT EXISTS salary DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_staff ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_staff ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.uni_students ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_students ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_students ADD COLUMN IF NOT EXISTS first_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_students ADD COLUMN IF NOT EXISTS last_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_students ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_students ADD COLUMN IF NOT EXISTS student_id_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_students ADD COLUMN IF NOT EXISTS program_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_students ADD COLUMN IF NOT EXISTS enrollment_year INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_students ADD COLUMN IF NOT EXISTS current_semester INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_students ADD COLUMN IF NOT EXISTS gpa DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_students ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_students ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.uni_courses ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_courses ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_courses ADD COLUMN IF NOT EXISTS department_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_courses ADD COLUMN IF NOT EXISTS program_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_courses ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_courses ADD COLUMN IF NOT EXISTS code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_courses ADD COLUMN IF NOT EXISTS credits INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_courses ADD COLUMN IF NOT EXISTS instructor_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_courses ADD COLUMN IF NOT EXISTS semester TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_courses ADD COLUMN IF NOT EXISTS capacity INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_courses ADD COLUMN IF NOT EXISTS enrolled_count INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_courses ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.uni_enrollments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_enrollments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_enrollments ADD COLUMN IF NOT EXISTS student_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_enrollments ADD COLUMN IF NOT EXISTS course_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_enrollments ADD COLUMN IF NOT EXISTS semester TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_enrollments ADD COLUMN IF NOT EXISTS academic_year TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_enrollments ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_enrollments ADD COLUMN IF NOT EXISTS final_grade DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_enrollments ADD COLUMN IF NOT EXISTS grade_letter TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_enrollments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.uni_lms_materials ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_materials ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_materials ADD COLUMN IF NOT EXISTS course_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_materials ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_materials ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_materials ADD COLUMN IF NOT EXISTS file_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_materials ADD COLUMN IF NOT EXISTS material_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_materials ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_materials ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.uni_lms_assignments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_assignments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_assignments ADD COLUMN IF NOT EXISTS course_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_assignments ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_assignments ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_assignments ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_assignments ADD COLUMN IF NOT EXISTS total_points INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_assignments ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_assignments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.uni_lms_submissions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_submissions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_submissions ADD COLUMN IF NOT EXISTS assignment_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_submissions ADD COLUMN IF NOT EXISTS student_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_submissions ADD COLUMN IF NOT EXISTS submission_text TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_submissions ADD COLUMN IF NOT EXISTS file_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_submissions ADD COLUMN IF NOT EXISTS submitted_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_submissions ADD COLUMN IF NOT EXISTS score DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_submissions ADD COLUMN IF NOT EXISTS feedback TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_submissions ADD COLUMN IF NOT EXISTS graded_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_lms_submissions ADD COLUMN IF NOT EXISTS graded_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.uni_exams ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_exams ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_exams ADD COLUMN IF NOT EXISTS course_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_exams ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_exams ADD COLUMN IF NOT EXISTS exam_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_exams ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_exams ADD COLUMN IF NOT EXISTS location TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_exams ADD COLUMN IF NOT EXISTS total_marks INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_exams ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.uni_grades ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_grades ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_grades ADD COLUMN IF NOT EXISTS exam_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_grades ADD COLUMN IF NOT EXISTS student_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_grades ADD COLUMN IF NOT EXISTS marks_obtained DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_grades ADD COLUMN IF NOT EXISTS remarks TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_grades ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.uni_applicants ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_applicants ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_applicants ADD COLUMN IF NOT EXISTS first_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_applicants ADD COLUMN IF NOT EXISTS last_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_applicants ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_applicants ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_applicants ADD COLUMN IF NOT EXISTS applied_program_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_applicants ADD COLUMN IF NOT EXISTS application_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_applicants ADD COLUMN IF NOT EXISTS previous_school TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_applicants ADD COLUMN IF NOT EXISTS previous_gpa DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_applicants ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_applicants ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.portal_invitations ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.portal_invitations ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.portal_invitations ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.portal_invitations ADD COLUMN IF NOT EXISTS full_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.portal_invitations ADD COLUMN IF NOT EXISTS role TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.portal_invitations ADD COLUMN IF NOT EXISTS token TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.portal_invitations ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.portal_invitations ADD COLUMN IF NOT EXISTS expires_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.portal_invitations ADD COLUMN IF NOT EXISTS invited_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.portal_invitations ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.portal_invitations ADD COLUMN IF NOT EXISTS default_password TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.portal_users ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.portal_users ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.portal_users ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.portal_users ADD COLUMN IF NOT EXISTS full_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.portal_users ADD COLUMN IF NOT EXISTS role TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.portal_users ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.portal_users ADD COLUMN IF NOT EXISTS last_login TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.portal_users ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.uni_fees ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_fees ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_fees ADD COLUMN IF NOT EXISTS student_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_fees ADD COLUMN IF NOT EXISTS fee_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_fees ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_fees ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_fees ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_fees ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_fees ADD COLUMN IF NOT EXISTS academic_term TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_fees ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.uni_hostel_rooms ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_hostel_rooms ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_hostel_rooms ADD COLUMN IF NOT EXISTS building_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_hostel_rooms ADD COLUMN IF NOT EXISTS room_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_hostel_rooms ADD COLUMN IF NOT EXISTS capacity INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_hostel_rooms ADD COLUMN IF NOT EXISTS occupants INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_hostel_rooms ADD COLUMN IF NOT EXISTS rent_amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_hostel_rooms ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_hostel_rooms ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.uni_library_books ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_library_books ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_library_books ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_library_books ADD COLUMN IF NOT EXISTS author TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_library_books ADD COLUMN IF NOT EXISTS isbn TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_library_books ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_library_books ADD COLUMN IF NOT EXISTS total_copies INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_library_books ADD COLUMN IF NOT EXISTS available_copies INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_library_books ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.uni_research_grants ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_research_grants ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_research_grants ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_research_grants ADD COLUMN IF NOT EXISTS lead_researcher_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_research_grants ADD COLUMN IF NOT EXISTS funding_agency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_research_grants ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_research_grants ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_research_grants ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_research_grants ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_research_grants ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.uni_alumni ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_alumni ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_alumni ADD COLUMN IF NOT EXISTS student_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_alumni ADD COLUMN IF NOT EXISTS graduation_year INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_alumni ADD COLUMN IF NOT EXISTS current_employer TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_alumni ADD COLUMN IF NOT EXISTS job_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_alumni ADD COLUMN IF NOT EXISTS industry TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_alumni ADD COLUMN IF NOT EXISTS contact_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.uni_alumni ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.revenue_forecasts ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.revenue_forecasts ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.revenue_forecasts ADD COLUMN IF NOT EXISTS forecast_period TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.revenue_forecasts ADD COLUMN IF NOT EXISTS forecast_amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.revenue_forecasts ADD COLUMN IF NOT EXISTS lower_bound DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.revenue_forecasts ADD COLUMN IF NOT EXISTS upper_bound DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.revenue_forecasts ADD COLUMN IF NOT EXISTS confidence DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.revenue_forecasts ADD COLUMN IF NOT EXISTS basis TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.revenue_forecasts ADD COLUMN IF NOT EXISTS methodology TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.revenue_forecasts ADD COLUMN IF NOT EXISTS computed_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS entity_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS entity_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS avg_payment_days DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS payment_reliability TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS attendance_rate DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS peak_engagement_day TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS engagement_trend TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS avg_session_value DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS preferred_service_types TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS response_rate DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS preferred_contact_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS churn_risk TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS churn_risk_score DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS churn_risk_factors TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS satisfaction_trend TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS last_complaint_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS data_points_count INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS profile_confidence DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.entity_behaviour_profiles ADD COLUMN IF NOT EXISTS computed_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS city TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS state TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS country TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS zip_code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS property_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS bathrooms DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS square_feet DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS lot_size DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS agent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS agent_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS features TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS year_built INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS listing_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_properties ADD COLUMN IF NOT EXISTS last_updated TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS city TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS state TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS country TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS preferences TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS assigned_agent TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_viewings ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_viewings ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_viewings ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_viewings ADD COLUMN IF NOT EXISTS property_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_viewings ADD COLUMN IF NOT EXISTS property_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_viewings ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_viewings ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_viewings ADD COLUMN IF NOT EXISTS agent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_viewings ADD COLUMN IF NOT EXISTS agent_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_viewings ADD COLUMN IF NOT EXISTS viewing_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_viewings ADD COLUMN IF NOT EXISTS viewing_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_viewings ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_viewings ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_viewings ADD COLUMN IF NOT EXISTS feedback TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_viewings ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS property_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS property_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS buyer_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS buyer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS offer_amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS earnest_money DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS contingencies TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS offer_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS expiration_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS agent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS agent_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_transactions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_transactions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_transactions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_transactions ADD COLUMN IF NOT EXISTS property_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_transactions ADD COLUMN IF NOT EXISTS property_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_transactions ADD COLUMN IF NOT EXISTS seller_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_transactions ADD COLUMN IF NOT EXISTS seller_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_transactions ADD COLUMN IF NOT EXISTS buyer_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_transactions ADD COLUMN IF NOT EXISTS buyer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_transactions ADD COLUMN IF NOT EXISTS sale_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_transactions ADD COLUMN IF NOT EXISTS closing_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_transactions ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_transactions ADD COLUMN IF NOT EXISTS agent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_transactions ADD COLUMN IF NOT EXISTS agent_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_transactions ADD COLUMN IF NOT EXISTS documents TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_transactions ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS transaction_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS agent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS agent_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS payment_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_documents ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_documents ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_documents ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_documents ADD COLUMN IF NOT EXISTS property_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_documents ADD COLUMN IF NOT EXISTS transaction_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_documents ADD COLUMN IF NOT EXISTS document_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_documents ADD COLUMN IF NOT EXISTS file_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_documents ADD COLUMN IF NOT EXISTS file_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_documents ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_documents ADD COLUMN IF NOT EXISTS uploaded_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_documents ADD COLUMN IF NOT EXISTS shared_with TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_documents ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS property_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS property_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS tenant_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS tenant_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS landlord_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS landlord_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS monthly_rent DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS security_deposit DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS terms TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS agent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS agent_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_rent_payments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payments ADD COLUMN IF NOT EXISTS lease_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payments ADD COLUMN IF NOT EXISTS property_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payments ADD COLUMN IF NOT EXISTS tenant_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payments ADD COLUMN IF NOT EXISTS tenant_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payments ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payments ADD COLUMN IF NOT EXISTS due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payments ADD COLUMN IF NOT EXISTS payment_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payments ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payments ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_maintenance_requests ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_maintenance_requests ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_maintenance_requests ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_maintenance_requests ADD COLUMN IF NOT EXISTS property_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_maintenance_requests ADD COLUMN IF NOT EXISTS property_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_maintenance_requests ADD COLUMN IF NOT EXISTS reported_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_maintenance_requests ADD COLUMN IF NOT EXISTS reported_by_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_maintenance_requests ADD COLUMN IF NOT EXISTS issue_description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_maintenance_requests ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_maintenance_requests ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_maintenance_requests ADD COLUMN IF NOT EXISTS assigned_to TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_maintenance_requests ADD COLUMN IF NOT EXISTS completion_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_maintenance_requests ADD COLUMN IF NOT EXISTS cost DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_maintenance_requests ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS account_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS account_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS bank_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS account_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS routing_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS account_holder_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS account_holder_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS balance DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS currency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS reconciliation_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS last_reconciliation_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS is_active INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS metadata TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS trust_account_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS transaction_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS related_entity_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS related_entity_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS transaction_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS cleared_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS reference_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS metadata TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS transaction_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS buyer_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS seller_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS agent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS property_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS escrow_amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS escrow_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS escrow_agent_company TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS escrow_agent_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS escrow_agent_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS escrow_agent_phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS conditions_for_release TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS release_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS release_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_document_templates ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_document_templates ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_document_templates ADD COLUMN IF NOT EXISTS template_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_document_templates ADD COLUMN IF NOT EXISTS document_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_document_templates ADD COLUMN IF NOT EXISTS document_category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_document_templates ADD COLUMN IF NOT EXISTS template_content TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_document_templates ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_document_templates ADD COLUMN IF NOT EXISTS template_variables TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_document_templates ADD COLUMN IF NOT EXISTS required_signatures INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_document_templates ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_document_templates ADD COLUMN IF NOT EXISTS is_active INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_document_templates ADD COLUMN IF NOT EXISTS version INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_document_templates ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_document_templates ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_e_signatures ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_e_signatures ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_e_signatures ADD COLUMN IF NOT EXISTS document_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_e_signatures ADD COLUMN IF NOT EXISTS document_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_e_signatures ADD COLUMN IF NOT EXISTS signer_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_e_signatures ADD COLUMN IF NOT EXISTS signer_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_e_signatures ADD COLUMN IF NOT EXISTS signer_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_e_signatures ADD COLUMN IF NOT EXISTS signer_phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_e_signatures ADD COLUMN IF NOT EXISTS signature_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_e_signatures ADD COLUMN IF NOT EXISTS signature_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_e_signatures ADD COLUMN IF NOT EXISTS signature_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_e_signatures ADD COLUMN IF NOT EXISTS signing_order INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_e_signatures ADD COLUMN IF NOT EXISTS signing_ip_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_e_signatures ADD COLUMN IF NOT EXISTS signing_timestamp TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_e_signatures ADD COLUMN IF NOT EXISTS expiration_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_e_signatures ADD COLUMN IF NOT EXISTS require_initials INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_e_signatures ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS original_offer_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS counter_offer_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS counter_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS closing_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS contingencies TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS inspection_period_days INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS appraisal_contingency INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS financing_contingency INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS earnest_money_change DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS additional_terms TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS counter_offer_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS responded_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_commission_rules ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_rules ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_rules ADD COLUMN IF NOT EXISTS rule_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_rules ADD COLUMN IF NOT EXISTS rule_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_rules ADD COLUMN IF NOT EXISTS property_types TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_rules ADD COLUMN IF NOT EXISTS price_range_min DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_rules ADD COLUMN IF NOT EXISTS price_range_max DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_rules ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_rules ADD COLUMN IF NOT EXISTS flat_fee DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_rules ADD COLUMN IF NOT EXISTS tier_config TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_rules ADD COLUMN IF NOT EXISTS applies_to_buyer_side INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_rules ADD COLUMN IF NOT EXISTS applies_to_seller_side INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_rules ADD COLUMN IF NOT EXISTS is_active INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_rules ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_rules ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_rules ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS transaction_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS commission_rule_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS buyer_agent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS seller_agent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS sale_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS buyer_commission_percentage DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS seller_commission_percentage DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS buyer_commission_amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS seller_commission_amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS total_commission_amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS broker_commission DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS agent_commission DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS adjustments TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS payout_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS payout_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS trust_account_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_commission_details ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS contractor_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS license_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS contractor_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS service_categories TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS business_license_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS business_license_expiration TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS insurance_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS insurance_expiration TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS is_licensed INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS is_insured INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS website TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS city TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS state TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS zip_code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS average_rating DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS total_reviews INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS total_jobs_completed INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS is_verified INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS verification_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS verified_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS is_active INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS contractor_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS reviewer_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS maintenance_request_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS rating INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS review_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS review_text TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS punctuality_rating INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS quality_rating INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS professionalism_rating INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS would_rehire INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS lease_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS tenant_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS renewal_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS renewal_offer_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS response_deadline TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS new_rent_amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS rent_increase_percentage DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS renewal_term_months INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS renewal_lease_document_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS tenant_response_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS renewal_lease_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS lease_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS payment_due_date INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS late_fee_amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS late_fee_percentage DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS late_fee_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS grace_period_days INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS is_recurring INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS payment_method TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS auto_debit_enabled INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS recurring_start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS recurring_end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_history ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_history ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_history ADD COLUMN IF NOT EXISTS lease_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_history ADD COLUMN IF NOT EXISTS scheduled_payment_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_history ADD COLUMN IF NOT EXISTS payment_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_history ADD COLUMN IF NOT EXISTS payment_due_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_history ADD COLUMN IF NOT EXISTS amount_due DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_history ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_history ADD COLUMN IF NOT EXISTS payment_method TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_history ADD COLUMN IF NOT EXISTS payment_status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_history ADD COLUMN IF NOT EXISTS transaction_reference TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_history ADD COLUMN IF NOT EXISTS late_fee_charged DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_history ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_rent_payment_history ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS market_region TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS market_level TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS data_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS average_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS median_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS price_per_sqft DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS days_on_market_average INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS sold_listings_count INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS active_listings_count INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS price_change_month_percentage DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS price_change_year_percentage DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS market_trend TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS market_absorption_rate DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS inventory_level TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS data_source TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_data ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS subject_property_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS comparable_property_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS comparable_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS price_per_sqft DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS square_footage DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS bathrooms DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS lot_size DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS year_built INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS days_on_market INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS sale_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS similarity_score DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS price_adjustment_reason TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS adjustments TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_properties ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS agent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS metric_period TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS metric_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS listings_taken_count INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS listings_sold_count INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS sales_volume DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS average_sale_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS average_days_on_market DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS commission_earned DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS client_count INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS return_client_rate DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS average_client_rating DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS response_time_hours DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS score INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS score_category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS score_breakdown TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS purchase_propensity DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS engagement_level TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS transaction_history_count INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS last_interaction_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS days_since_last_contact INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS recommended_agent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS recommendation_reason TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS recommended_agent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS recommendation_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS recommendation_reason TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS recommendation_score DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS property_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS recommendation_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS client_action TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS action_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS user_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS action TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS resource_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS resource_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS changes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS ip_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS user_agent TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS user_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS role TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS bio TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS license_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS license_expiry TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS join_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS mls_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS property_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS city TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS state TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS zip_code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS list_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS sold_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS days_on_market INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS bathrooms DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS square_feet DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS lot_size DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS property_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS agent_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS brokerage TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS source TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS last_updated TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS property_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS analysis_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS subject_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS subject_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_1_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_1_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_1_adjustment DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_2_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_2_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_2_adjustment DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_3_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_3_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_3_adjustment DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS confidence_level INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS city TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS state TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS metric_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS avg_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS median_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS avg_days_on_market INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS total_listings INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS sold_listings INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS absorption_rate DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS price_per_sqft DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS yoy_price_change DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS first_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS last_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS source TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS property_interest TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS budget_min DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS budget_max DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS lead_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS stage TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS assigned_agent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS lead_score INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS next_followup TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS lead_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS activity_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS subject TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS outcome TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS next_action TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS days_on_market INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS sale_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS similarity_score DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS price_adjustment_reason TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS adjustments TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS agent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS metric_period TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS metric_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS listings_taken_count INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS listings_sold_count INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS sales_volume DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS average_sale_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS average_days_on_market DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS commission_earned DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS client_count INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS return_client_rate DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS average_client_rating DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS response_time_hours DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_metrics ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS score INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS score_category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS score_breakdown TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS purchase_propensity DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS engagement_level TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS transaction_history_count INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS last_interaction_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS days_since_last_contact INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS recommended_agent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS recommendation_reason TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_client_scoring ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS recommended_agent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS recommendation_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS recommendation_reason TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS recommendation_score DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS property_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS recommendation_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS client_action TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS action_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS user_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS action TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS resource_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS resource_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS changes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS ip_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS user_agent TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_audit_log ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS user_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS role TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS bio TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS license_number TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS license_expiry TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS join_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_team_members ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS mls_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS property_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS city TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS state TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS zip_code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS list_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS sold_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS days_on_market INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS bathrooms DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS square_feet DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS lot_size DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS property_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS agent_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS brokerage TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS source TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS last_updated TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_mls_listings ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS property_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS analysis_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS subject_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS subject_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_1_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_1_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_1_adjustment DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_2_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_2_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_2_adjustment DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_3_address TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_3_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS comparable_3_adjustment DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS confidence_level INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS city TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS state TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS metric_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS avg_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS median_price DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS avg_days_on_market INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS total_listings INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS sold_listings INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS absorption_rate DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS price_per_sqft DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS yoy_price_change DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_market_trends ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS first_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS last_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS source TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS property_interest TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS budget_min DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS budget_max DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS lead_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS stage TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS assigned_agent_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS lead_score INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS next_followup TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS lead_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS activity_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS subject TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS outcome TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS next_action TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS next_action_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_re_agentic_conversations ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agentic_conversations ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agentic_conversations ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agentic_conversations ADD COLUMN IF NOT EXISTS messages TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agentic_conversations ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agentic_conversations ADD COLUMN IF NOT EXISTS context TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agentic_conversations ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agentic_conversations ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_re_agentic_conversations ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS price TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS level TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS total_students INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS rating DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS total_reviews INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_courses ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS course_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS order_index INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS video_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_lessons ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS course_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS student_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS student_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS student_email TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS enrollment_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS progress_percent DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS last_accessed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_enrollments ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS size TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS folder TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_media ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_feature_requests ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feature_requests ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feature_requests ADD COLUMN IF NOT EXISTS user_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feature_requests ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feature_requests ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feature_requests ADD COLUMN IF NOT EXISTS request_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feature_requests ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feature_requests ADD COLUMN IF NOT EXISTS progress INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feature_requests ADD COLUMN IF NOT EXISTS admin_feedback TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feature_requests ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feature_requests ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_feature_announcements ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feature_announcements ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feature_announcements ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feature_announcements ADD COLUMN IF NOT EXISTS announcement_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feature_announcements ADD COLUMN IF NOT EXISTS target_company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feature_announcements ADD COLUMN IF NOT EXISTS module_identifier TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_feature_announcements ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_company_feature_decisions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_company_feature_decisions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_company_feature_decisions ADD COLUMN IF NOT EXISTS announcement_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_company_feature_decisions ADD COLUMN IF NOT EXISTS decision TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_company_feature_decisions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_deal_rooms ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_deal_rooms ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_deal_rooms ADD COLUMN IF NOT EXISTS lead_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_deal_rooms ADD COLUMN IF NOT EXISTS value DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_deal_rooms ADD COLUMN IF NOT EXISTS stage TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_deal_rooms ADD COLUMN IF NOT EXISTS probability INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_deal_rooms ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_deal_rooms ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_okrs ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_okrs ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_okrs ADD COLUMN IF NOT EXISTS objective TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_okrs ADD COLUMN IF NOT EXISTS key_result TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_okrs ADD COLUMN IF NOT EXISTS progress DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_okrs ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_okrs ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_okrs ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_decisions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_decisions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_decisions ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_decisions ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_decisions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_decisions ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_commissions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_commissions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_commissions ADD COLUMN IF NOT EXISTS partner_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_commissions ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_commissions ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_commissions ADD COLUMN IF NOT EXISTS month TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_commissions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_commissions ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_cap_table ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_cap_table ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_cap_table ADD COLUMN IF NOT EXISTS user_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_cap_table ADD COLUMN IF NOT EXISTS equity_percentage DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_cap_table ADD COLUMN IF NOT EXISTS shares INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_cap_table ADD COLUMN IF NOT EXISTS vesting_schedule TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_cap_table ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_cap_table ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_campaigns ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_campaigns ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_campaigns ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_campaigns ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_campaigns ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_campaigns ADD COLUMN IF NOT EXISTS spent DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_campaigns ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_campaigns ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_marketing_reports ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_marketing_reports ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_marketing_reports ADD COLUMN IF NOT EXISTS campaign_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_marketing_reports ADD COLUMN IF NOT EXISTS file_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_marketing_reports ADD COLUMN IF NOT EXISTS file_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_marketing_reports ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_marketing_reports ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_marketing_reports ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_seo_tracking ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_seo_tracking ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_seo_tracking ADD COLUMN IF NOT EXISTS keyword TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_seo_tracking ADD COLUMN IF NOT EXISTS rank INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_seo_tracking ADD COLUMN IF NOT EXISTS search_volume INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_seo_tracking ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_seo_tracking ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_summit_registrations ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_summit_registrations ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_summit_registrations ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_summit_registrations ADD COLUMN IF NOT EXISTS company TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_summit_registrations ADD COLUMN IF NOT EXISTS ticket_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_summit_registrations ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_summit_registrations ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_bugs ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_bugs ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_bugs ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_bugs ADD COLUMN IF NOT EXISTS severity TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_bugs ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_bugs ADD COLUMN IF NOT EXISTS product TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_bugs ADD COLUMN IF NOT EXISTS reporter_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_bugs ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_bugs ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_sprints ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_sprints ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_sprints ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_sprints ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_sprints ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_sprints ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_sprints ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_sprints ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_tasks ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_tasks ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_tasks ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_tasks ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_tasks ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_tasks ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_tasks ADD COLUMN IF NOT EXISTS assignee_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_tasks ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_task_comments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_comments ADD COLUMN IF NOT EXISTS task_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_comments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_comments ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_comments ADD COLUMN IF NOT EXISTS comment_text TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_comments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_comments ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_comments ADD COLUMN IF NOT EXISTS created_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_task_checklists ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_checklists ADD COLUMN IF NOT EXISTS task_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_checklists ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_checklists ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_checklists ADD COLUMN IF NOT EXISTS is_completed TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_checklists ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_checklists ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_checklists ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_checklists ADD COLUMN IF NOT EXISTS created_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_task_attachments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_attachments ADD COLUMN IF NOT EXISTS task_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_attachments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_attachments ADD COLUMN IF NOT EXISTS file_url TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_attachments ADD COLUMN IF NOT EXISTS file_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_attachments ADD COLUMN IF NOT EXISTS file_size TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_attachments ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_attachments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_attachments ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_task_attachments ADD COLUMN IF NOT EXISTS created_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_transactions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_transactions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_transactions ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_transactions ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_transactions ADD COLUMN IF NOT EXISTS category TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_transactions ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_transactions ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_transactions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_deal_activities ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_deal_activities ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_deal_activities ADD COLUMN IF NOT EXISTS deal_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_deal_activities ADD COLUMN IF NOT EXISTS activity_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_deal_activities ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_deal_activities ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_deal_activities ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_employees ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_employees ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_employees ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_employees ADD COLUMN IF NOT EXISTS role TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_employees ADD COLUMN IF NOT EXISTS department TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_employees ADD COLUMN IF NOT EXISTS onboarding_progress INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_employees ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_employees ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_employees ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_leave_requests ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_leave_requests ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_leave_requests ADD COLUMN IF NOT EXISTS employee_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_leave_requests ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_leave_requests ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_leave_requests ADD COLUMN IF NOT EXISTS start_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_leave_requests ADD COLUMN IF NOT EXISTS end_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_leave_requests ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_support_tickets ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_support_tickets ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_support_tickets ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_support_tickets ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_support_tickets ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_support_tickets ADD COLUMN IF NOT EXISTS severity TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_support_tickets ADD COLUMN IF NOT EXISTS customer_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_support_tickets ADD COLUMN IF NOT EXISTS reporter_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_support_tickets ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_support_tickets ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_nps_responses ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_nps_responses ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_nps_responses ADD COLUMN IF NOT EXISTS customer_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_nps_responses ADD COLUMN IF NOT EXISTS score INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_nps_responses ADD COLUMN IF NOT EXISTS feedback TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_nps_responses ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.optavel_partners ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_partners ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_partners ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_partners ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_partners ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_partners ADD COLUMN IF NOT EXISTS revenue_share DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.optavel_partners ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS user_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS user_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS project_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS task_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS start_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS end_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS is_billable INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS currency TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS ai_summary TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS ai_tags TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.active_timers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.active_timers ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.active_timers ADD COLUMN IF NOT EXISTS case_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.active_timers ADD COLUMN IF NOT EXISTS case_title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.active_timers ADD COLUMN IF NOT EXISTS client_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.active_timers ADD COLUMN IF NOT EXISTS client_name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.active_timers ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.active_timers ADD COLUMN IF NOT EXISTS start_time TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.active_timers ADD COLUMN IF NOT EXISTS accumulated_seconds INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.active_timers ADD COLUMN IF NOT EXISTS is_billable INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.active_timers ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.active_timers ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.active_timers ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.email_sequences ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.email_sequences ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.email_sequences ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.email_sequences ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.email_sequences ADD COLUMN IF NOT EXISTS steps TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.email_sequences ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.email_sequences ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS code TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS name TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS account_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2);
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS reference_type TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS reference_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS run_date TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS period_start TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS period_end TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS created_by TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_time_reminders ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_reminders ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_reminders ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_reminders ADD COLUMN IF NOT EXISTS user_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_reminders ADD COLUMN IF NOT EXISTS title TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_reminders ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_reminders ADD COLUMN IF NOT EXISTS remind_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_reminders ADD COLUMN IF NOT EXISTS is_recurring INTEGER;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_reminders ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_reminders ADD COLUMN IF NOT EXISTS priority TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_reminders ADD COLUMN IF NOT EXISTS status TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_time_reminders ADD COLUMN IF NOT EXISTS sound TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_kanban_boards ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kanban_boards ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kanban_boards ADD COLUMN IF NOT EXISTS board_key TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kanban_boards ADD COLUMN IF NOT EXISTS stages TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kanban_boards ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_kanban_boards ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_support_tickets ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_support_tickets ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_support_tickets ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_support_tickets ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.delivery_windows ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.delivery_windows ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.delivery_windows ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.delivery_windows ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.sla_tracking ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.sla_tracking ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.sla_tracking ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.sla_tracking ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.driver_metrics ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.driver_metrics ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.driver_metrics ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.driver_metrics ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.fleet_metrics ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.fleet_metrics ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.fleet_metrics ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.fleet_metrics ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.online_orders ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_orders ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_orders ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_orders ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.online_settings ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_settings ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_settings ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.online_settings ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.school_assignments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_assignments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_assignments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_assignments ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.school_attendance ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_attendance ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_attendance ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_attendance ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.school_canteen ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_canteen ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_canteen ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_canteen ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.school_classes ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_classes ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_classes ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_classes ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.school_complaints ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_complaints ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_complaints ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_complaints ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.school_exams ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_exams ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_exams ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_exams ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.school_fees ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_fees ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_fees ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_fees ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.school_gamification ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_gamification ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_gamification ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_gamification ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.school_grades ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_grades ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_grades ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_grades ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.school_hostel ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_hostel ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_hostel ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_hostel ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.school_library ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_library ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_library ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_library ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.school_notices ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_notices ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_notices ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_notices ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.school_parents ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_parents ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_parents ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_parents ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.school_students ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_students ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_students ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_students ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.school_teachers ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_teachers ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_teachers ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_teachers ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.school_transport ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_transport ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_transport ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.school_transport ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_allergies ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_allergies ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_allergies ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_allergies ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_beds ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_beds ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_beds ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_beds ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_blood_requests ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_requests ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_requests ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_blood_requests ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_consents ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_consents ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_consents ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_consents ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_discharges ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_discharges ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_discharges ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_discharges ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_immunisations ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_immunisations ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_immunisations ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_immunisations ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_lab_results ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_lab_results ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_lab_results ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_lab_results ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_school_assignment_submissions ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_assignment_submissions ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_assignment_submissions ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_assignment_submissions ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_school_assignments ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_assignments ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_assignments ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_assignments ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_school_attendance ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_attendance ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_attendance ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_attendance ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_school_course_registrations ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_course_registrations ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_course_registrations ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_course_registrations ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_school_discipline ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_discipline ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_discipline ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_discipline ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_school_exams ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_exams ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_exams ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_exams ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_school_grades ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_grades ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_grades ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_grades ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_school_hostel ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_hostel ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_hostel ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_hostel ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_school_library_books ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_library_books ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_library_books ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_library_books ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_school_library_categories ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_library_categories ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_library_categories ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_library_categories ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_school_notices ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_notices ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_notices ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_notices ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_school_timetable ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_timetable ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_timetable ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_timetable ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_school_transport ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_transport ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_transport ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_school_transport ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_staff_shifts ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_staff_shifts ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_staff_shifts ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_staff_shifts ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.univ_vitals ADD COLUMN IF NOT EXISTS id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_vitals ADD COLUMN IF NOT EXISTS company_id TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_vitals ADD COLUMN IF NOT EXISTS created_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
    BEGIN
        ALTER TABLE public.univ_vitals ADD COLUMN IF NOT EXISTS updated_at TEXT;
    EXCEPTION WHEN undefined_table THEN
        -- Ignore if table does not exist
    END;
END $$;

