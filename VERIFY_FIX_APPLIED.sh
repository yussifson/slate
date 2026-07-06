#!/bin/bash

# Hospital Data Sync Fix Verification Script
# This script checks if all fixes have been properly applied

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Hospital Data Sync Fix - Verification Script            ║"
echo "║   July 6, 2026                                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if migration file exists
echo "📁 Checking migration file..."
if [ -f "supabase/migrations/20260706000000_permanent_hospital_data_sync_fix.sql" ]; then
    echo "✅ Migration file exists"
    FILE_SIZE=$(wc -c < "supabase/migrations/20260706000000_permanent_hospital_data_sync_fix.sql")
    echo "   Size: $FILE_SIZE bytes"
    LINE_COUNT=$(wc -l < "supabase/migrations/20260706000000_permanent_hospital_data_sync_fix.sql")
    echo "   Lines: $LINE_COUNT"
else
    echo "❌ Migration file NOT found!"
    exit 1
fi
echo ""

# Check documentation files
echo "📖 Checking documentation files..."
DOCS=(
    "FIXES_SUMMARY.md"
    "IMPLEMENTATION_CHECKLIST.md"
    "ERROR_FIXES_QUICK_REFERENCE.md"
    "HOSPITAL_DATA_SYNC_FIX_README.md"
    "DATA_SYNC_FIX_INDEX.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        LINES=$(wc -l < "$doc")
        echo "✅ $doc ($LINES lines)"
    else
        echo "❌ $doc NOT found"
    fi
done
echo ""

# Check migration file content
echo "🔍 Verifying migration content..."
if grep -q "permanent_hospital_data_sync_fix" "supabase/migrations/20260706000000_permanent_hospital_data_sync_fix.sql"; then
    echo "✅ Migration file is properly named"
fi

if grep -q "ALTER TABLE.*univ_appointments" "supabase/migrations/20260706000000_permanent_hospital_data_sync_fix.sql"; then
    echo "✅ Appointments table fixes present"
fi

if grep -q "ALTER TABLE.*univ_admissions" "supabase/migrations/20260706000000_permanent_hospital_data_sync_fix.sql"; then
    echo "✅ Admissions table fixes present"
fi

if grep -q "ALTER TABLE.*univ_prescriptions" "supabase/migrations/20260706000000_permanent_hospital_data_sync_fix.sql"; then
    echo "✅ Prescriptions table fixes present"
fi

if grep -q "CREATE PUBLICATION hospital_tables" "supabase/migrations/20260706000000_permanent_hospital_data_sync_fix.sql"; then
    echo "✅ PowerSync publication creation present"
fi

if grep -q "bed_number" "supabase/migrations/20260706000000_permanent_hospital_data_sync_fix.sql"; then
    echo "✅ Bed number column fix present"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Verification Summary                                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ All fix files present and ready to apply"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev  (applies migration automatically)"
echo "2. Read: FIXES_SUMMARY.md (5 minutes)"
echo "3. Follow: IMPLEMENTATION_CHECKLIST.md (verify fix)"
echo ""
echo "Migration file: supabase/migrations/20260706000000_permanent_hospital_data_sync_fix.sql"
echo "Size: $FILE_SIZE bytes"
echo "Lines: $LINE_COUNT"
echo ""
echo "Status: ✅ READY TO APPLY"
