import { supabase } from './supabase';
import { UserProfile } from '../types';

const RAW_DATA = `1,10.00.001,"Lubna Assagaf, S.Pd",3276045510590004,Mizan,,,Kantor - Direktorat,Kabid. Pendidikan,Full Time,Tetap,01-Jul-00
2,11.00.003,Toharoh S.Pd,3276045504740009,0001482886361,ita@Lazuardi.sch.id,,TK,Guru,Full Time,Tetap,01-Jul-00
3,10.00.013,Zulkarnaen,3276012904750001,0001479302561,zulkarnaen@lazuardi.sch.id,,Kantor - PT,Staf Khusus PT Sarana Lazuardi,Full Time,Tetap,01-Jul-00
4,10.00.017,"Zaronah, S.E",3276044302760004,0001440419275,izar@lazuardi.sch.id,,Kantor - HRD,Manajer HRD,Full Time,Tetap,01-Jul-00
158,10.25.818,"Maudy Larasati.,S.Psi.",3276105508020001,0002240707375,maudy@lazuardi.sch.id,3276105508020001,Lazuardi,Staf HRD,Full Time,K-II,06-Jan-25`;

export async function seedEmployees() {
  const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  
  if (count && count > 10) {
    console.log("Employees already seeded");
  } else {
    const lines = RAW_DATA.split('\n');
    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length < 5) continue;
      
      const name = parts[2].replace(/"/g, '');
      const email = parts[5] || `${parts[1]}@lazuardi.sch.id`;
      
      const profileData = {
        id: `mock_${parts[1]}`, // Synthetic ID for mock data
        niy: parts[1],
        name: name,
        email: email,
        role: 'employee',
        position: parts[8],
        unit: parts[7],
        contract_status: parts[9],
        entry_date: parts[11] || parts[10],
      };

      await supabase.from('profiles').upsert(profileData);
    }
    console.log("Employees seeding completed");
  }

  // Seed Regulations
  const { data: regs } = await supabase.from('regulations').select('id').limit(1);
  if (!regs || regs.length === 0) {
    const defaultRegs = [
      {
        id: 'attendance',
        title: 'Kehadiran & Kedisiplinan',
        order: 1,
        items: [
          { id: 'att-1', title: 'Jam Kerja', description: 'Jam kerja operasional dimulai pukul 07.15 WIB s/d 15.45 WIB.', iconType: 'check' },
          { id: 'att-2', title: 'Toleransi Keterlambatan', description: 'Keterlambatan maksimal 15 menit sebanyak 3x dalam sebulan.', iconType: 'alert' },
          { id: 'att-3', title: 'Izin Meninggalkan Sekolah', description: 'Wajib mengisi form izin di HCM dan disetujui Kepala Unit.', iconType: 'check' }
        ]
      },
      {
        id: 'leave',
        title: 'Cuti & Libur',
        order: 2,
        items: [
          { id: 'lv-1', title: 'Cuti Tahunan', description: 'Karyawan tetap berhak atas 12 hari cuti tahunan setelah 1 tahun bekerja.', iconType: 'check' },
          { id: 'lv-2', title: 'Cuti Besar', description: 'Diberikan setiap siklus 6 tahun masa kerja selama 1 bulan.', iconType: 'alert' }
        ]
      }
    ];
    for (const reg of defaultRegs) {
      await supabase.from('regulations').upsert(reg);
    }
    console.log("Regulations seeding completed");
  }

  // Seed FAQ
  const { data: faqs } = await supabase.from('help_center_categories').select('id').limit(1);
  if (!faqs || faqs.length === 0) {
    const defaultFaqs = [
      {
        id: 'general',
        title: 'Pertanyaan Umum',
        order: 1,
        items: [
          { id: 'faq-1', question: 'Bagaimana cara klaim absensi jika lupa absen?', answer: 'Gunakan tab "Klaim Absensi" di dashboard dan isi form yang disediakan beserta bukti pendukung.' },
          { id: 'faq-2', question: 'Kapan saya mendapatkan cuti besar?', answer: 'Cuti besar didapatkan setelah masa kerja mencapai kelipatan 6 tahun (siklus 6 tahunan).' }
        ]
      },
      {
        id: 'technical',
        title: 'Masalah Teknis',
        order: 2,
        items: [
          { id: 'faq-3', question: 'Lupa password email Lazuardi?', answer: 'Silakan hubungi IT Support di gedung direktorat untuk reset password.' }
        ]
      }
    ];
    for (const faq of defaultFaqs) {
      await supabase.from('help_center_categories').upsert(faq);
    }
    console.log("FAQ seeding completed");
  }
}
