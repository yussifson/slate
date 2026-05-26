import pkg from 'pg';
const { Client } = pkg;

async function seed() {
  const client = new Client({
    user: 'postgres',
    password: '1948@yajkUweb3.0',
    host: 'db.wmabgiafwamxkcgxyhee.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to Supabase DB!");

    // Let's get the active company_id to associate these records with
    console.log("Fetching existing companies...");
    const compRes = await client.query("SELECT id, industry_type FROM public.companies LIMIT 5;");
    if (compRes.rows.length === 0) {
      console.log("No companies found in database! Let's insert a default company first.");
      // If no companies exist, let's insert a sample company
      const insertComp = await client.query(`
        INSERT INTO public.companies (name, industry_type, email) 
        VALUES ('Global Academy & Partners', 'school', 'admin@globalacademy.com') 
        RETURNING id;
      `);
      compRes.rows = [{ id: insertComp.rows[0].id, industry_type: 'school' }];
    }

    const companyId = compRes.rows[0].id;
    console.log(`Using Company ID: ${companyId}`);

    // Clear existing records to ensure a fresh, clean start
    console.log("Cleaning up existing industry records...");
    await client.query("DELETE FROM public.industry_records;");

    // Sample data to seed
    const seedRecords = [
      // STUDENTS
      {
        company_id: companyId,
        industry: 'school',
        record_type: 'student',
        status: 'Active',
        search_text: 'Ama Owusu STU-1102',
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
        search_text: 'John Doe STU-4921',
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
      // EXAMS
      {
        company_id: companyId,
        industry: 'school',
        record_type: 'exam',
        status: 'Upcoming',
        search_text: 'Mathematics Algebra Grade 9',
        data: {
          subject: 'Mathematics (Algebra)',
          class: 'Grade 9',
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
        search_text: 'Physics Lab 1 Grade 10',
        data: {
          subject: 'Physics',
          class: 'Grade 10',
          date: '2026-06-16',
          time: '10:00 AM',
          duration: '1.5 Hours',
          venue: 'Lab 1',
          status: 'Ongoing'
        }
      },
      // PATIENTS (HOSPITAL)
      {
        company_id: companyId,
        industry: 'hospital',
        record_type: 'patient',
        status: 'Admitted',
        search_text: 'Kofi Mensah PAT-8821',
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
      // HOTEL ROOMS
      {
        company_id: companyId,
        industry: 'hotel',
        record_type: 'room',
        status: 'Available',
        search_text: 'Room 101 Deluxe Available',
        data: {
          roomNumber: '101',
          type: 'Deluxe Suite',
          rate: 150,
          status: 'Available',
          floor: '1st Floor'
        }
      }
    ];

    console.log("Seeding real records...");
    for (const record of seedRecords) {
      await client.query(`
        INSERT INTO public.industry_records (company_id, industry, record_type, data, status, search_text)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [
        record.company_id,
        record.industry,
        record.record_type,
        JSON.stringify(record.data),
        record.status,
        record.search_text
      ]);
    }

    console.log("Successfully seeded database with real live data records!");

  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    await client.end();
  }
}

seed();
