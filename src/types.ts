export interface UserProfile {
  userId: string;
  niy?: string;
  name: string;
  nik?: string;
  bpjs?: string;
  email: string;
  npwp?: string;
  unit?: string;
  position?: string;
  contractStatus?: string;
  entryDate?: string;
  gender?: string;
  birthPlace?: string;
  birthDate?: string;
  educationLevel?: string;
  education?: string;
  address?: string;
  phone?: string;
  maritalStatus?: string;
  role: 'employee' | 'admin';
  photoUrl?: string;
  idpLink?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  careerHistory?: CareerHistory[];
  cutiData?: { tahunan: number; besar: number };
  longServiceLeave?: LongServiceCycle[];
  createdAt: string;
}

export interface RegulationItem {
  id: string;
  title: string;
  description: string;
  iconType: 'alert' | 'check';
}

export interface RegulationCategory {
  id: string;
  title: string;
  description?: string;
  items: RegulationItem[];
  order: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqCategory {
  id: string;
  title: string;
  items: FaqItem[];
  order: number;
}

export interface LongServiceCycle {
  id: string;
  cycleNumber: number;
  dateObtained: string;
  status: 'obtained' | 'upcoming' | 'available' | 'claimed' | 'expired';
}

export interface CareerHistory {
  id?: string;
  userId?: string;
  period: string;
  position: string;
  unit: string;
  active?: boolean;
  description?: string;
}

export interface LeaveEntitlement {
  userId: string;
  type: 'Annual' | 'Big Leave';
  totalDays: number;
  usedDays: number;
  availableDays: number;
  lastGrantDate: string;
  nextGrantDate: string;
}

export interface AttendanceClaim {
  id: string;
  userId: string;
  userName: string;
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface AttendanceRecord {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkIn?: {
    time: string; // ISO String
    location: {
      lat: number;
      lng: number;
    };
    address?: string;
  };
  checkOut?: {
    time: string; // ISO String
    location: {
      lat: number;
      lng: number;
    };
    address?: string;
  };
  status: 'present' | 'late' | 'absent';
  notes?: string;
}
