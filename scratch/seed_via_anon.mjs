import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmabgiafwamxkcgxyhee.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtYWJnaWFmd2FteGtjZ3h5aGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NTk0MjIsImV4cCI6MjA5NTMzNTQyMn0.cXS4DjYP_KEMDJ5n1QXOfOu0TGxUOQktf_j88Y9FHpk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  try {
    console.log("Signing in with user yussifabduljalil601@gmail.com...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'yussifabduljalil601@gmail.com',
      password: 'AdminPassword123!'
    });

    if (authError) {
      console.error("Auth sign-in failed:", authError.message);
      return;
    }

    const userId = authData.user?.id;
    console.log(`Signed in successfully! User ID: ${userId}`);

    // Query profiles to find company_id
    console.log("Fetching profile info...");
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', userId)
      .single();

    if (profError || !profile) {
      console.error("Failed to fetch profile:", profError?.message || "No profile found");
      return;
    }

    const companyId = profile.company_id;
    console.log(`Fetched profile! Company ID: ${companyId}, Role: ${profile.role}`);

    if (!companyId) {
      console.error("This user profile does not have a company_id associated with it.");
      return;
    }

    // Fetch the company to verify its industry type
    console.log("Fetching company details...");
    const { data: company, error: compErr } = await supabase
      .from('companies')
      .select('id, name, industry_type')
      .eq('id', companyId)
      .single();

    if (compErr || !company) {
      console.error("Failed to fetch company details:", compErr?.message || "No company found");
      return;
    }

    const industry = company.industry_type || 'school';
    console.log(`Company Name: ${company.name}, Industry Type: ${industry}`);

    // Clear any existing records for this company to start fresh
    console.log("Cleaning up existing records...");
    await supabase.from('industry_records').delete().eq('company_id', companyId);

    // Seed list
    const seedRecords = [
      // STUDENTS (SCHOOL SUITE)
      {
        company_id: companyId,
        industry: 'school',
        record_type: 'student',
        status: 'Active',
        search_text: 'Ama Owusu Grade 9A Active',
        data: {
          name: 'Ama Owusu',
          studentId: 'STU-1102',
          class: 'Grade 9A',
          age: 14,
          gender: 'Female',
          parent: 'Kwame Owusu',
          phone: '+233 24 123 4567',
          feeStatus: 'Paid',
          avatar: 'AO'
        }
      },
      {
        company_id: companyId,
        industry: 'school',
        record_type: 'student',
        status: 'Active',
        search_text: 'John Doe Grade 10B Owing',
        data: {
          name: 'John Doe',
          studentId: 'STU-4921',
          class: 'Grade 10B',
          age: 15,
          gender: 'Male',
          parent: 'Robert Doe',
          phone: '+233 20 987 6543',
          feeStatus: 'Owing',
          avatar: 'JD'
        }
      },
      // CLASSES (SCHOOL SUITE)
      {
        company_id: companyId,
        industry: 'school',
        record_type: 'class',
        status: 'Active',
        search_text: 'Grade 9A Mathematics Mr. Doe',
        data: {
          name: 'Grade 9A',
          teacher: 'Mr. Doe',
          studentsCount: 28,
          subject: 'Mathematics',
          schedule: 'Mon, Wed, Fri (8am)'
        }
      },
      // EXAMS (SCHOOL SUITE)
      {
        company_id: companyId,
        industry: 'school',
        record_type: 'exam',
        status: 'Upcoming',
        search_text: 'Mathematics Algebra Grade 9 Upcoming',
        data: {
          subject: 'Mathematics (Algebra)',
          class: 'Grade 9A',
          date: '2026-06-15',
          time: '09:00 AM',
          duration: '2 Hours',
          venue: 'Main Hall',
          status: 'Upcoming'
        }
      },
      {
        company_id: companyId,
        industry: 'school',
        record_type: 'exam',
        status: 'Ongoing',
        search_text: 'Physics Grade 10 Ongoing',
        data: {
          subject: 'Physics',
          class: 'Grade 10B',
          date: '2026-06-16',
          time: '10:00 AM',
          duration: '1.5 Hours',
          venue: 'Lab 1',
          status: 'Ongoing'
        }
      },
      // PATIENTS (HOSPITAL SUITE)
      {
        company_id: companyId,
        industry: 'hospital',
        record_type: 'patient',
        status: 'Admitted',
        search_text: 'Kofi Mensah PAT-8821 Admitted',
        data: {
          name: 'Kofi Mensah',
          patientId: 'PAT-8821',
          age: 42,
          gender: 'Male',
          bloodType: 'O+',
          phone: '+233 27 222 1111',
          status: 'Admitted',
          ward: 'Male Ward A',
          bed: 'Bed 4'
        }
      },
      // HOTEL ROOMS (HOTEL SUITE)
      {
        company_id: companyId,
        industry: 'hotel',
        record_type: 'room',
        status: 'Available',
        search_text: 'Room 101 Deluxe Suite Available',
        data: {
          roomNumber: '101',
          type: 'Deluxe Suite',
          rate: 150,
          status: 'Available',
          floor: '1st Floor'
        }
      }
    ];

    console.log(`Inserting ${seedRecords.length} real seed rows...`);
    for (const r of seedRecords) {
      const { data, error } = await supabase.from('industry_records').insert({
        company_id: r.company_id,
        industry: r.industry,
        record_type: r.record_type,
        status: r.status,
        search_text: r.search_text,
        data: r.data
      }).select();

      if (error) {
        console.error(`Failed to insert record:`, error.message);
      } else {
        console.log(`[SUCCESS] Seeded ${r.record_type} record:`, data[0]?.id);
      }
    }

    console.log("Database seeded successfully with real live records associated with your active logged-in account!");

  } catch (err) {
    console.error("Error during seeding process:", err);
  }
}

seed();
