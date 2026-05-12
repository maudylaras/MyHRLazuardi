export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  role: 'employee' | 'admin';
  photoUrl?: string;
  niy?: string;
  position?: string;
  unit?: string;
  nik?: string;
  bpjs?: string;
  gender?: string;
  birthPlace?: string;
  birthDate?: string;
  phone?: string;
  maritalStatus?: string;
  educationLevel?: string;
  education?: string;
  address?: string;
  contractStatus?: string;
  idpLink?: string;
  entryDate?: string;
  createdAt: string;
  updatedAt?: any;
  careerHistory?: CareerHistory[];
  longServiceLeave?: {
    id?: string;
    cycleNumber: number;
    dateObtained: string;
    status: string;
  }[];
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: string;
}

export interface LeaveEntitlement {
  id: string;
  type: string;
  balance: number;
  total: number;
}

export interface RegulationItem {
  id: string;
  title: string;
  description: string;
  iconType: 'check' | 'alert';
}

export interface RegulationCategory {
  id: string;
  title: string;
  order: number;
  items: RegulationItem[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqCategory {
  id: string;
  title: string;
  order: number;
  items: FaqItem[];
}

export interface PersonalData {
  id?: string;
  namaLengkap: string;
  niy: string;
  jabatan: string;
  unit: string;
  emailOfficial: string;
  telepon: string;
  nik: string;
  npwp: string;
  gender: string;
  statusKawin: string;
  tempatLahir: string;
  tanggalLahir: string;
  alamatLengkap: string;
  tingkatPendidikan: string;
  institusiJurusan: string;
  statusKontrak: string;
  tanggalMasuk: string;
  bpjsNomor: string;
  idpLink: string;
  aksesLevel: string;
  createdAt: any;
  updatedAt: any;
}

export interface ContactData {
  id?: string;
  namaKontak: string;
  hubungan: string;
  nomorHp: string;
  emergencyContact: boolean;
  updatedAt: any;
}

export interface CareerHistory {
  id?: string;
  period: string;
  position: string;
  unit: string;
  active?: boolean;
  createdAt?: any;
}

export interface AttendanceClaim {
  id?: string;
  reason: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  gformLink: string;
  createdAt: any;
}

export interface Certification {
  id?: string;
  certificationName: string;
  certificationDate: string;
  certificateFileName?: string;
  certificateFileUrl?: string;
  createdAt: any;
}
