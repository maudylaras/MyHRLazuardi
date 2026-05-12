import React, { useState, useEffect, ReactNode, useMemo } from 'react';
import { User } from 'firebase/auth';
import { 
  UserProfile, 
  AttendanceRecord, 
  CareerHistory, 
  LeaveEntitlement, 
  AttendanceClaim,
  RegulationCategory,
  FaqCategory,
  RegulationItem,
  FaqItem,
  Certification
} from '../types';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { ALL_EMPLOYEES } from '../data/employees';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  getDoc,
  doc, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  MapPin, 
  Plus,
  LogOut, 
  LogIn,
  User as UserIcon, 
  Calendar,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Fingerprint,
  History,
  Info,
  CreditCard,
  Briefcase,
  GraduationCap,
  Home,
  Phone,
  FileText,
  LayoutDashboard,
  Search,
  UserPlus,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  BookOpen,
  PieChart,
  Award,
  Sparkles,
  Trophy,
  Activity,
  RotateCw,
  Trash2,
  CheckCircle2,
  Star,
  Edit3,
  Plane,
  ChevronUp
} from 'lucide-react';
import { cn, formatDate, formatTime } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';

interface DashboardProps {
  user: User;
  profile: UserProfile;
}

type Tab = 'dashboard' | 'data-diri' | 'karir' | 'cuti' | 'klaim' | 'regulasi' | 'faq' | 'certification';

const BAR_DATA = [
  { name: 'TA 20/21', TK: 16, SD: 47, SMP: 18, SUPPORT: 66 },
  { name: 'TA 21/22', TK: 16, SD: 44, SMP: 20, SUPPORT: 74 },
  { name: 'TA 22/23', TK: 20, SD: 40, SMP: 21, SUPPORT: 78 },
  { name: 'TA 23/24', TK: 22, SD: 48, SMP: 22, SUPPORT: 79 },
  { name: 'TA 24/25', TK: 27, SD: 60, SMP: 22, SUPPORT: 65 },
  { name: 'TA 25/26', TK: 27, SD: 63, SMP: 22, SUPPORT: 65 },
];

const AREA_DATA = [
  { name: 'TA 20/21', value: 12 },
  { name: 'TA 21/22', value: 14 },
  { name: 'TA 22/23', value: 8 },
  { name: 'TA 23/24', value: 12 },
  { name: 'TA 24/25', value: 15 },
  { name: 'TA 25/26', value: 6 },
];

export default function Dashboard({ user, profile }: DashboardProps) {
  const isAdmin = profile.role === 'admin';
  const [now, setNow] = useState(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [barData, setBarData] = useState(BAR_DATA);
  const [areaData, setAreaData] = useState(AREA_DATA);
  const [isEditingBar, setIsEditingBar] = useState(false);
  const [isEditingArea, setIsEditingArea] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingCareer, setIsEditingCareer] = useState(false);
  const [isEditingCuti, setIsEditingCuti] = useState(false);
  const [viewedProfile, setViewedProfile] = useState<UserProfile>(profile);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isAdminHub, setIsAdminHub] = useState(isAdmin);
  const [searchQuery, setSearchQuery] = useState('');
  const [allEmployees, setAllEmployees] = useState<UserProfile[]>(ALL_EMPLOYEES);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<UserProfile | null>(null);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  
  const [profileForm, setProfileForm] = useState(profile);
  const [careerHistory, setCareerHistory] = useState<CareerHistory[]>([
    { period: "2025 - Sekarang", position: profile.position || "Staf HRD", unit: profile.unit || "Lazuardi", active: true },
    { period: "2024 - 2025", position: "Probation", unit: profile.unit || "Lazuardi", active: false }
  ]);
  const [cutiData, setCutiData] = useState({ tahunan: 12, besar: 0 });
  const [leaveEntitlements, setLeaveEntitlements] = useState<LeaveEntitlement[]>([]);
  const [attendanceClaims, setAttendanceClaims] = useState<AttendanceClaim[]>([]);
  const [showAllClaims, setShowAllClaims] = useState(isAdmin);
  const [careerSort, setCareerSort] = useState<'newest' | 'oldest' | 'manual'>('newest');
  
  const pendingClaimsCount = useMemo(() => {
    return attendanceClaims.filter(c => c.status === 'pending').length;
  }, [attendanceClaims]);

  const [regulationCategories, setRegulationCategories] = useState<RegulationCategory[]>([]);
  const [faqCategories, setFaqCategories] = useState<FaqCategory[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isEditingRegCategory, setIsEditingRegCategory] = useState(false);
  const [isEditingRegItem, setIsEditingRegItem] = useState(false);
  const [isEditingFaqCategory, setIsEditingFaqCategory] = useState(false);
  const [isEditingFaqItem, setIsEditingFaqItem] = useState(false);
  const [isEditingCertification, setIsEditingCertification] = useState(false);
  
  const [selectedRegCategory, setSelectedRegCategory] = useState<RegulationCategory | null>(null);
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<FaqCategory | null>(null);
  const [selectedRegItem, setSelectedRegItem] = useState<{ categoryId: string, item?: RegulationItem } | null>(null);
  const [selectedFaqItem, setSelectedFaqItem] = useState<{ categoryId: string, item?: FaqItem } | null>(null);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [isEmployeePickerOpen, setIsEmployeePickerOpen] = useState(false);
  const [empSearch, setEmpSearch] = useState('');

  const [activeFaqTab, setActiveFaqTab] = useState<string>('ALL');

  useEffect(() => {
    const unsubReg = onSnapshot(collection(db, 'regulations'), (snap) => {
      const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegulationCategory));
      setRegulationCategories(cats.sort((a, b) => a.order - b.order));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'regulations');
    });
    
    const unsubFaq = onSnapshot(collection(db, 'helpCenter'), (snap) => {
      const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FaqCategory));
      setFaqCategories(cats.sort((a, b) => a.order - b.order));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'helpCenter');
    });

    const unsubCert = onSnapshot(query(collection(db, 'certifications'), where('userId', '==', profile.userId)), (snap) => {
      const certs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Certification));
      setCertifications(certs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'certifications');
    });

    return () => {
      unsubReg();
      unsubFaq();
      unsubCert();
    };
  }, []);

  const handleSaveRegCategory = async (cat: Partial<RegulationCategory>) => {
    try {
      const id = cat.id || `reg_cat_${Date.now()}`;
      await setDoc(doc(db, 'regulations', id), {
        ...cat,
        id,
        items: cat.items || [],
        order: cat.order || regulationCategories.length,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setIsEditingRegCategory(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'regulations');
    }
  };

  const handleDeleteRegCategory = async (id: string) => {
    if (!confirm('Hapus kategori regulasi?')) return;
    try {
      await deleteDoc(doc(db, 'regulations', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'regulations');
    }
  };

  const handleSaveRegItem = async (categoryId: string, item: Partial<RegulationItem>) => {
    try {
      const cat = regulationCategories.find(c => c.id === categoryId);
      if (!cat) return;
      
      let newItems = [...(cat.items || [])];
      const itemId = item.id || `item_${Date.now()}`;
      const itemIndex = newItems.findIndex(i => i.id === itemId);
      
      const newItem = { ...item, id: itemId } as RegulationItem;
      
      if (itemIndex >= 0) {
        newItems[itemIndex] = newItem;
      } else {
        newItems.push(newItem);
      }
      
      await updateDoc(doc(db, 'regulations', categoryId), {
        items: newItems,
        updatedAt: serverTimestamp()
      });
      setIsEditingRegItem(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'regulations');
    }
  };

  const handleDeleteRegItem = async (categoryId: string, itemId: string) => {
    if (!confirm('Hapus item regulasi?')) return;
    try {
      const cat = regulationCategories.find(c => c.id === categoryId);
      if (!cat) return;
      const newItems = cat.items.filter(i => i.id !== itemId);
      await updateDoc(doc(db, 'regulations', categoryId), { items: newItems });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'regulations');
    }
  };

  const handleSaveFaqCategory = async (cat: Partial<FaqCategory>) => {
    try {
      const id = cat.id || `faq_cat_${Date.now()}`;
      await setDoc(doc(db, 'helpCenter', id), {
        ...cat,
        id,
        items: cat.items || [],
        order: cat.order || faqCategories.length,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setIsEditingFaqCategory(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'helpCenter');
    }
  };

  const handleDeleteFaqCategory = async (id: string) => {
    if (!confirm('Hapus kategori FAQ?')) return;
    try {
      await deleteDoc(doc(db, 'helpCenter', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'helpCenter');
    }
  };

  const handleSaveFaqItem = async (categoryId: string, item: Partial<FaqItem>) => {
    try {
      const cat = faqCategories.find(c => c.id === categoryId);
      if (!cat) return;
      
      let newItems = [...(cat.items || [])];
      const itemId = item.id || `faq_item_${Date.now()}`;
      const itemIndex = newItems.findIndex(i => i.id === itemId);
      
      const newItem = { ...item, id: itemId } as FaqItem;
      
      if (itemIndex >= 0) {
        newItems[itemIndex] = newItem;
      } else {
        newItems.push(newItem);
      }
      
      await updateDoc(doc(db, 'helpCenter', categoryId), {
        items: newItems,
        updatedAt: serverTimestamp()
      });
      setIsEditingFaqItem(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'helpCenter');
    }
  };

  const handleDeleteFaqItem = async (categoryId: string, itemId: string) => {
    if (!confirm('Hapus item FAQ?')) return;
    try {
      const cat = faqCategories.find(c => c.id === categoryId);
      if (!cat) return;
      const newItems = cat.items.filter(i => i.id !== itemId);
      await updateDoc(doc(db, 'helpCenter', categoryId), { items: newItems });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'helpCenter');
    }
  };

  const handleSaveCertification = async (cert: Partial<Certification>) => {
    try {
      const id = cert.id || `cert_${Date.now()}`;
      await setDoc(doc(db, 'certifications', id), {
        ...cert,
        id,
        userId: profile.userId,
        createdAt: cert.createdAt || new Date().toISOString()
      }, { merge: true });
      setIsEditingCertification(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'certifications');
    }
  };

  const handleDeleteCertification = async (id: string) => {
    if (!confirm('Hapus sertifikasi ini?')) return;
    try {
      await deleteDoc(doc(db, 'certifications', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'certifications');
    }
  };

  const sortedCareerHistory = useMemo(() => {
    const history = viewedProfile.careerHistory || careerHistory;
    if (careerSort === 'manual') return history;
    
    return [...history].sort((a, b) => {
      const yearA = parseInt(a.period.substring(0, 4)) || 0;
      const yearB = parseInt(b.period.substring(0, 4)) || 0;
      return careerSort === 'newest' ? yearB - yearA : yearA - yearB;
    });
  }, [viewedProfile.careerHistory, careerHistory, careerSort]);

  const tenureYears = useMemo(() => {
    if (!viewedProfile.entryDate) return 0;
    const entryDate = new Date(viewedProfile.entryDate);
    const now = new Date();
    let years = now.getFullYear() - entryDate.getFullYear();
    const m = now.getMonth() - entryDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < entryDate.getDate())) {
      years--;
    }
    return years;
  }, [viewedProfile.entryDate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userRef = doc(db, 'users', profile.userId || user.uid);
      await updateDoc(userRef, { 
        name: profileForm.name,
        position: profileForm.position,
        unit: profileForm.unit,
        niy: profileForm.niy,
        contractStatus: profileForm.contractStatus,
        email: profileForm.email,
        updatedAt: serverTimestamp()
      });
      setIsEditingProfile(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  const handleSaveCareer = async (newHistory: CareerHistory[]) => {
    try {
      const updatedProfile = { ...viewedProfile, careerHistory: newHistory };
      await handleSaveEmployee(updatedProfile);
      setCareerHistory(newHistory);
      setIsEditingCareer(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  const handleSaveCuti = async (newData: any) => {
    try {
      const { longServiceLeave, ...restCutiData } = newData;
      const updatedProfile = { 
        ...viewedProfile, 
        cutiData: restCutiData,
        longServiceLeave: longServiceLeave 
      };
      await handleSaveEmployee(updatedProfile);
      setCutiData(restCutiData);
      setIsEditingCuti(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  const handleUpdateClaimStatus = async (claimId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'attendanceClaims', claimId), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'attendanceClaims');
    }
  };

  const handleSeedData = async () => {
    try {
      alert("Seeding data check.");
    } catch (err) {
      console.error("Error seeding data:", err);
    }
  };

  const handleUpdateBarData = (newData: typeof barData) => {
    setBarData(newData);
    setIsEditingBar(false);
  };

  const handleUpdateAreaData = (newData: typeof areaData) => {
    setAreaData(newData);
    setIsEditingArea(false);
  };

  const handleSaveEmployee = async (emp: UserProfile) => {
    try {
      const userId = emp.userId || Date.now().toString();
      const updatedEmp = { ...emp, userId, updatedAt: serverTimestamp() };
      
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, updatedEmp, { merge: true });
      
      setAllEmployees(prev => {
        const index = prev.findIndex(e => e.userId === userId);
        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], ...updatedEmp } as UserProfile;
          return next;
        }
        return [updatedEmp as UserProfile, ...prev];
      });

      if (viewedProfile.userId === userId) {
        setViewedProfile(updatedEmp as UserProfile);
      }
      
      if (profile.userId === userId) {
        setProfileForm(updatedEmp as UserProfile);
      }

      setIsEditingEmployee(false);
      setSelectedEmployee(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  useEffect(() => {
    if (viewedProfile?.userId) {
      const fetchProfile = async () => {
        try {
          const docRef = doc(db, 'users', viewedProfile.userId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setViewedProfile(data);
            if (data.careerHistory) setCareerHistory(data.careerHistory);
            if (data.cutiData) setCutiData(data.cutiData);
            // Also sync in allEmployees list
            setAllEmployees(prev => prev.map(e => e.userId === data.userId ? data : e));
          }
        } catch (err) {
          console.error("Error fetching viewed profile:", err);
        }
      };
      
      fetchProfile();

      // Listen for leave entitlements
      const q = query(
        collection(db, 'leaveEntitlements'),
        where('userId', '==', viewedProfile.userId)
      );
      
      const unsubLeave = onSnapshot(q, (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setLeaveEntitlements(data);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'leaveEntitlements');
      });

      // Listen for attendance claims
      const claimsPath = 'attendanceClaims';
      let claimsQuery;
      
      if (isAdmin && showAllClaims) {
        claimsQuery = query(collection(db, claimsPath), orderBy('createdAt', 'desc'));
      } else {
        claimsQuery = query(
          collection(db, claimsPath),
          where('userId', '==', viewedProfile.userId),
          orderBy('createdAt', 'desc')
        );
      }

      const unsubClaims = onSnapshot(claimsQuery, (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceClaim));
        setAttendanceClaims(data);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'attendanceClaims');
      });

      return () => {
        unsubLeave();
        unsubClaims();
      };
    }
  }, [viewedProfile?.userId, isAdmin, showAllClaims]);

  const handleDeleteEmployee = (userId: string) => {
    setAllEmployees(prev => prev.filter(e => e.userId !== userId));
  };
  
  // Search logic for Admin
  useEffect(() => {
    if (!isAdmin || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        // Search current state list
        const results = allEmployees.filter(e => 
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.niy?.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 6);

        setSearchResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, isAdmin, allEmployees]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const SidebarItem = ({ id, icon, label }: { id: Tab, icon: ReactNode, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex w-full items-center gap-4 px-6 py-4 transition-all duration-300 relative group",
        activeTab === id 
          ? "bg-blue-600 text-white scale-[1.02] shadow-lg shadow-blue-500/30 rounded-2xl mx-2 w-[calc(100%-16px)]" 
          : "text-slate-400 hover:text-slate-200"
      )}
    >
      <div className={cn("transition-transform duration-300", activeTab === id && "scale-110")}>
        {icon}
      </div>
      <span className="font-semibold text-sm tracking-tight">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-72 flex-col bg-slate-900 text-white shadow-2xl lg:flex">
        <div className="p-8 pb-12 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/40">
            <Sparkles className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter">MyHR<span className="text-blue-600">.</span></h1>
        </div>

        <nav className="flex-1 space-y-1 px-4 text-left">
          <SidebarItem id="dashboard" icon={<LayoutDashboard size={22} />} label="Dashboard" />
          <SidebarItem id="data-diri" icon={<UserIcon size={22} />} label="Data Diri" />
          <SidebarItem id="karir" icon={<Trophy size={22} />} label="Progress Karir" />
          <SidebarItem id="cuti" icon={<Calendar size={22} />} label="Cuti Besar" />
          <SidebarItem id="klaim" icon={<Fingerprint size={22} />} label="Klaim Absensi" />
          <SidebarItem id="certification" icon={<Award size={22} />} label="Sertifikasi" />
          <SidebarItem id="regulasi" icon={<BookOpen size={22} />} label="Regulasi" />
          <SidebarItem id="faq" icon={<HelpCircle size={22} />} label="Pusat Bantuan" />
        </nav>

        <div className="p-6">
          <button 
            onClick={() => auth.signOut()}
            className="flex w-full items-center gap-4 rounded-2xl px-6 py-4 text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400 group"
          >
            <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm">Keluar Aplikasi</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between bg-white/80 p-6 backdrop-blur-xl">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">HR CONNECT PRO</p>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'data-diri' ? 'Karyawan Profile' : 
               activeTab === 'cuti' ? 'Cuti Besar' : 
               activeTab === 'regulasi' ? 'Regulasi & Kebijakan' : 
               activeTab === 'faq' ? 'Pusat Bantuan' : 
               activeTab === 'certification' ? 'Sertifikasi Saya' : 'Dashboard Hub'}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden text-right sm:block">
              <p className="font-bold text-slate-900 leading-none">{profile.name}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">{profile.role === 'admin' ? 'ADMIN' : (profile.position || 'STAF HRD')}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center border-2 border-white shadow-md ring-1 ring-slate-100 overflow-hidden">
               <img src={profile.photoUrl || `https://ui-avatars.com/api/?name=${profile.name}&background=2563eb&color=fff`} className="h-full w-full object-cover" />
            </div>
          </div>
        </header>

        {/* Impersonation Banner */}
        {viewedProfile.userId !== profile.userId && (
          <div className="mx-8 mt-6 overflow-hidden rounded-3xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                <UserIcon size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-amber-600 uppercase tracking-widest">Mode Tinjauan Aktif</p>
                <p className="text-sm font-bold text-amber-900">Anda sedang melihat data milik <span className="font-black underline">{viewedProfile.name}</span></p>
              </div>
            </div>
            <button 
              onClick={() => {
                setViewedProfile(profile);
                setActiveTab('dashboard');
              }}
              className="px-6 py-2.5 bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/10 hover:bg-amber-600 transition-all"
            >
              Kembali Ke Profil Saya
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="p-8 lg:p-10">
          {/* Universal Modals */}
          <EditEmployeeModal 
            isOpen={isEditingEmployee} 
            onClose={() => { setIsEditingEmployee(false); setSelectedEmployee(null); }} 
            employee={selectedEmployee}
            onSave={handleSaveEmployee}
          />
          <EditCareerModal
            isOpen={isEditingCareer}
            onClose={() => setIsEditingCareer(false)}
            data={viewedProfile.careerHistory || careerHistory}
            onSave={handleSaveCareer}
          />
          <EditCutiModal
            isOpen={isEditingCuti}
            onClose={() => setIsEditingCuti(false)}
            data={viewedProfile}
            onSave={handleSaveCuti}
          />

          <EditRegCategoryModal 
            isOpen={isEditingRegCategory}
            onClose={() => setIsEditingRegCategory(false)}
            data={selectedRegCategory}
            onSave={handleSaveRegCategory}
          />
          <EditRegItemModal 
            isOpen={isEditingRegItem}
            onClose={() => setIsEditingRegItem(false)}
            categoryId={selectedRegItem?.categoryId}
            data={selectedRegItem?.item}
            onSave={handleSaveRegItem}
          />

          <EditFaqCategoryModal 
            isOpen={isEditingFaqCategory}
            onClose={() => setIsEditingFaqCategory(false)}
            data={selectedFaqCategory}
            onSave={handleSaveFaqCategory}
          />
          <EditFaqItemModal 
            isOpen={isEditingFaqItem}
            onClose={() => setIsEditingFaqItem(false)}
            categoryId={selectedFaqItem?.categoryId}
            data={selectedFaqItem?.item}
            onSave={handleSaveFaqItem}
          />

          <EditCertificationModal
            isOpen={isEditingCertification}
            onClose={() => setIsEditingCertification(false)}
            data={selectedCertification}
            onSave={handleSaveCertification}
          />

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                {/* Modals for Editing Charts (Admin Only) */}
                <EditBarDataModal isOpen={isEditingBar} onClose={() => setIsEditingBar(false)} data={barData} onSave={handleUpdateBarData} />
                <EditAreaDataModal isOpen={isEditingArea} onClose={() => setIsEditingArea(false)} data={areaData} onSave={handleUpdateAreaData} />
                <EditProfileModal 
                  isOpen={isEditingProfile} 
                  onClose={() => setIsEditingProfile(false)} 
                  formData={profileForm} 
                  setFormData={setProfileForm}
                  onSave={handleUpdateProfile}
                />
                {/* Analytics Snapshot (Now at top) */}
                <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                  <div className="rounded-[40px] bg-white p-10 shadow-sm border border-slate-100">
                    <div className="mb-8 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 leading-tight">Total Karyawan Per Unit</h3>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mt-2">Data Pertumbuhan Lazuardi</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setIsEditingBar(true)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                        >
                          <Edit3 size={14} />
                        </button>
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <PieChart size={20} />
                        </div>
                      </div>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#00b5ad', fontSize: 10, fontWeight: 800}} dy={10} interval={0} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                          <Tooltip 
                            cursor={{fill: '#f8fafc'}} 
                            contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: '20px'}} />
                          <Bar dataKey="TK" stackId="a" fill="#bfdbfe" name="PRA TK/TK" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="SD" stackId="a" fill="#60a5fa" name="SD" />
                          <Bar dataKey="SMP" stackId="a" fill="#2563eb" name="SMP" />
                          <Bar dataKey="SUPPORT" stackId="a" fill="#1e3a8a" name="SUPPORT" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="rounded-[40px] bg-white p-10 shadow-sm border border-slate-100">
                    <div className="mb-8 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 leading-tight">Total Resign Lazuardi</h3>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mt-2">Status Tidak Lanjut per TA</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setIsEditingArea(true)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 transition-all"
                        >
                          <Edit3 size={14} />
                        </button>
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                          <Activity size={20} />
                        </div>
                      </div>
                    </div>
                    <div className="h-72">
                       <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={areaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#00b5ad', fontSize: 10, fontWeight: 800}} dy={10} interval={0} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                          <Tooltip 
                            contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#10b981" 
                            strokeWidth={4} 
                            fill="url(#colorValue)" 
                            name="Total Resign"
                          />
                        </AreaChart>
                       </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* ADMIN HUB (Conditional) */}
                {isAdmin && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                      {/* Search Explorer Card */}
                      <div className="lg:col-span-8 rounded-[40px] bg-white p-10 shadow-sm border border-slate-100 flex items-center gap-8 group">
                        <div className="h-20 w-20 flex items-center justify-center rounded-3xl bg-indigo-600 shadow-xl shadow-indigo-100 text-white shrink-0">
                          <Search size={32} />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">Eksplorasi Data Karyawan</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Pilih nama dari dropdown untuk melihat profil lengkap</p>
                          </div>
                          <div className="relative">
                            <div className="relative group">
                               <div 
                                 onClick={() => setIsEmployeePickerOpen(!isEmployeePickerOpen)}
                                 className="w-full bg-slate-50 border border-slate-100 rounded-[28px] py-6 px-8 text-sm font-black text-slate-700 transition-all cursor-pointer hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 flex items-center justify-between group/picker pr-14 shadow-sm"
                               >
                                 <div className="space-y-1">
                                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Daftar Karyawan</p>
                                   <p className="text-slate-600">--- Pilih Nama Karyawan ---</p>
                                 </div>
                                 <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover/picker:text-indigo-500 transition-colors">
                                   <ChevronRight className={cn("transition-transform duration-300", isEmployeePickerOpen ? "rotate-90" : "rotate-0")} size={22} />
                                 </div>
                               </div>

                               <AnimatePresence>
                                 {isEmployeePickerOpen && (
                                   <>
                                     <div 
                                       className="fixed inset-0 z-40 bg-transparent" 
                                       onClick={() => setIsEmployeePickerOpen(false)} 
                                     />
                                     <motion.div 
                                       initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                       animate={{ opacity: 1, y: 0, scale: 1 }}
                                       exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                       className="absolute top-full left-0 right-0 mt-3 z-50 bg-white border border-slate-100 rounded-[32px] shadow-2xl shadow-indigo-500/10 overflow-hidden max-h-[400px] flex flex-col p-2"
                                     >
                                        <div className="p-4 border-b border-slate-50">
                                          <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                            <input 
                                              autoFocus
                                              placeholder="Cari nama karyawan..."
                                              className="w-full bg-slate-50 border-none rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-slate-600 focus:ring-0"
                                              value={empSearch}
                                              onChange={(e) => setEmpSearch(e.target.value)}
                                            />
                                          </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                          {allEmployees
                                            .filter(emp => emp.name.toLowerCase().includes(empSearch.toLowerCase()))
                                            .sort((a,b) => a.name.localeCompare(b.name))
                                            .map(emp => (
                                              <div 
                                                key={emp.userId}
                                                onClick={() => {
                                                  setViewedProfile(emp);
                                                  setActiveTab('data-diri');
                                                  setIsEmployeePickerOpen(false);
                                                }}
                                                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-indigo-50 cursor-pointer group/item transition-colors"
                                              >
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover/item:bg-white group-hover/item:text-indigo-600 transition-colors overflow-hidden">
                                                  <img 
                                                    src={emp.photoUrl || `https://ui-avatars.com/api/?name=${emp.name}&background=6366f1&color=fff`} 
                                                    className="h-full w-full object-cover"
                                                  />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                   <p className="text-sm font-bold text-slate-700 truncate">{emp.name}</p>
                                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{emp.position}</p>
                                                </div>
                                                <ArrowRight size={14} className="text-slate-200 opacity-0 group-hover/item:opacity-100 transform -translate-x-2 group-hover/item:translate-x-0 transition-all text-indigo-500" />
                                              </div>
                                            ))
                                          }
                                        </div>
                                     </motion.div>
                                   </>
                                 )}
                               </AnimatePresence>
                             </div>
                            
                            <div className="mt-4">
                              <input 
                                type="text" 
                                placeholder="Atau ketik nama di sini..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 shadow-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Side Action Buttons */}
                      <div className="lg:col-span-4 flex flex-col gap-4">
                        <button 
                          onClick={() => { setSelectedEmployee(null); setIsEditingEmployee(true); }}
                          className="flex items-center justify-center gap-4 w-full bg-slate-900 text-white font-black uppercase text-sm tracking-widest py-7 rounded-[36px] shadow-2xl shadow-indigo-100 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          <UserPlus size={22} />
                          Tambah Karyawan
                        </button>
                        <button className="flex items-center justify-center gap-4 w-full bg-white border border-slate-100 text-slate-400 font-black uppercase text-xs tracking-widest py-7 rounded-[36px] shadow-sm hover:text-indigo-600 hover:bg-indigo-50 hover:scale-[1.02] active:scale-95 transition-all">
                          <RotateCw size={20} />
                          Sinkronasi Database
                        </button>
                      </div>
                    </div>

                    {/* Quick Management Section */}
                    <div className="rounded-[50px] bg-white p-12 shadow-md border border-slate-100/50">
                      <div className="mb-12 flex items-center justify-between px-4">
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black uppercase tracking-[0.05em] text-slate-900">Manajemen Cepat</h3>
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 italic">Daftar karyawan aktif</p>
                        </div>
                        <div className="bg-indigo-50 text-indigo-600 px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                          Total: {allEmployees.length}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(searchResults.length > 0 ? searchResults : allEmployees.slice(0, 12)).map((emp, i) => (
                          <div 
                            key={i} 
                            onClick={() => { 
                              setViewedProfile(emp as any); 
                              setActiveTab('data-diri');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex items-center gap-6 bg-slate-50/50 p-6 rounded-[36px] border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-2xl transition-all group relative cursor-pointer"
                          >
                            <div className="h-16 w-16 rounded-[24px] bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden shrink-0">
                               <img 
                                 src={emp.photoUrl || `https://ui-avatars.com/api/?name=${emp.name}&background=6366f1&color=fff`} 
                                 className="h-full w-full object-cover transition-transform group-hover:scale-110" 
                               />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight truncate text-base">{emp.name}</h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{emp.unit || 'NO UNIT'} • {emp.position}</p>
                            </div>
                            {isAdmin && emp.email !== profile.email && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.userId!); }}
                                className="h-9 w-9 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                              >
                                 <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-14 pt-8 border-t border-slate-50 text-center">
                        <p className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.4em]">Gunakan pencarian di atas untuk melihat lebih banyak karyawan</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* EMPLOYEE HUB (Standard) */}
                <div className="space-y-10">
                  {/* Welcome Banner */}
                  <div className="relative overflow-hidden rounded-[50px] bg-gradient-to-br from-indigo-600 to-violet-600 p-12 lg:p-16 text-white shadow-2xl shadow-indigo-200">
                    <div className="relative z-10 space-y-6">
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/10">
                         <Sparkles size={14} className="animate-pulse" />
                         <span className="text-[10px] font-bold uppercase tracking-[0.2em] italic">Selamat datang kembali</span>
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-6xl font-black tracking-tighter">Halo, {viewedProfile.name.split(' ')[0]}!</h2>
                        <p className="max-w-xl text-lg font-medium text-indigo-100/90 leading-relaxed">
                          Status karir Anda saat ini: <span className="text-amber-300 font-black">{viewedProfile.position || 'STAF HRD'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Decorative Watermark */}
                    <div className="absolute top-1/2 -right-20 -translate-y-1/2 opacity-10 pointer-events-none">
                       <CheckCircle2 size={400} />
                    </div>
                  </div>

                  {/* Quick Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <HubCard 
                      icon={<Fingerprint className="text-cyan-600" />} 
                      bg="bg-cyan-50"
                      label="Klaim Absen" 
                      value={`${pendingClaimsCount} Pending`} 
                      onClick={() => setActiveTab('klaim')}
                      footer="Lihat Detail"
                    />
                    <HubCard 
                      icon={<Trophy className="text-amber-600" />} 
                      bg="bg-amber-50"
                      label="Status Kontrak" 
                      value={viewedProfile.contractStatus || 'PKWT'} 
                    />
                    <HubCard 
                      icon={<ExternalLink className="text-indigo-600" />} 
                      bg="bg-indigo-50"
                      label="IDP Plan" 
                      value="Individual Development Plan"
                      footer="Buka Link"
                      onClick={() => viewedProfile.idpLink && window.open(viewedProfile.idpLink, '_blank')}
                    />
                  </div>
                </div>

              </motion.div>
            )}
            
            {activeTab === 'data-diri' && (
              <motion.div
                key="data-diri"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-10 max-w-5xl mx-auto"
              >
                {/* Profile Header Card */}
                <div className="rounded-[40px] bg-white p-10 shadow-sm border border-slate-100 flex flex-col items-center md:flex-row md:items-center gap-10">
                  <div className="h-36 w-36 rounded-[48px] bg-slate-50 flex items-center justify-center border-4 border-white shadow-xl ring-1 ring-slate-100 overflow-hidden shrink-0">
                    <UserIcon size={64} className="text-slate-200" />
                  </div>
                  <div className="space-y-4 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-4">
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{viewedProfile.name}</h3>
                      <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-400 flex items-center justify-center">
                        <Briefcase size={18} />
                      </div>
                      <div className="flex items-center gap-2">
                        {viewedProfile.userId !== profile.userId && (
                          <button 
                            onClick={() => setViewedProfile(profile)}
                            className="px-3 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase rounded-lg hover:bg-amber-100 transition-all"
                          >
                            Kembali Ke Profil Saya
                          </button>
                        )}
                        {(isAdmin || viewedProfile.userId === profile.userId) && (
                          <button 
                            onClick={() => {
                              setSelectedEmployee(viewedProfile);
                              setIsEditingEmployee(true);
                            }}
                            className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-lg hover:bg-indigo-100 transition-all"
                          >
                            Edit Data
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em]">{viewedProfile.position || 'STAF HRD'}</p>
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <div className="px-4 py-1.5 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        NIY: {viewedProfile.niy || '-'}
                      </div>
                      <div className="px-4 py-1.5 bg-indigo-50 rounded-xl text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                        {viewedProfile.unit || 'UNIT BELUM SET'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Personal Info Column */}
                  <div className="rounded-[40px] bg-white p-10 shadow-sm border border-slate-100 space-y-8 text-left">
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] border-b border-slate-100 pb-4">Informasi Personal</h5>
                    <div className="space-y-5">
                      <ProfileRow label="Email Official" value={viewedProfile.email} />
                      <ProfileRow label="Telepon" value={viewedProfile.phone} />
                      <ProfileRow label="NIK (KTP)" value={viewedProfile.nik} />
                      <ProfileRow label="Pendidikan" value={viewedProfile.educationLevel ? `${viewedProfile.educationLevel} - ${viewedProfile.education || ''}` : viewedProfile.education} />
                      <ProfileRow label="Tempat, Tgl Lahir" value={viewedProfile.birthPlace && viewedProfile.birthDate ? `${viewedProfile.birthPlace}, ${viewedProfile.birthDate}` : '-'} />
                    </div>
                  </div>

                  {/* Employment Info Column */}
                  <div className="rounded-[40px] bg-white p-10 shadow-sm border border-slate-100 space-y-8 text-left">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <h5 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Kepegawaian</h5>
                    </div>
                    <div className="space-y-5">
                      <ProfileRow label="Unit" value={viewedProfile.unit} />
                      <ProfileRow label="Status Kontrak" value={viewedProfile.contractStatus || 'PKWT'} />
                      <ProfileRow label="Masa Kerja" value={viewedProfile.entryDate} />
                      <ProfileRow label="Status Kawin" value={viewedProfile.maritalStatus || 'TK'} />
                      <ProfileRow label="BPJS" value={viewedProfile.bpjs || '-'} />
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IDP Plan</p>
                        <a 
                          href={viewedProfile.idpLink || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
                            viewedProfile.idpLink ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100" : "bg-slate-50 text-slate-300 cursor-not-allowed"
                          )}
                        >
                          Lihat Plan <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact Section */}
                <div className="rounded-[48px] bg-white p-12 shadow-sm border border-slate-100 space-y-10 text-left">
                  <div className="flex items-center justify-between">
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">Kontak Darurat</h4>
                    {(isAdmin || viewedProfile.userId === profile.userId) && (
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={async () => {
                            if (window.confirm("Hapus kontak darurat ini?")) {
                              const updatedProfile = { ...viewedProfile, emergencyContact: { name: '', relationship: '', phone: '' } };
                              await handleSaveEmployee(updatedProfile);
                            }
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                        >
                          <Trash2 size={12} /> Hapus
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedEmployee(viewedProfile);
                            setIsEditingEmployee(true);
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                        >
                          Edit Kontak
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <EmergencyCard label="Nama" value={viewedProfile.emergencyContact?.name || '-'} />
                    <EmergencyCard label="Hubungan" value={viewedProfile.emergencyContact?.relationship || '-'} />
                    <EmergencyCard label="Nomor HP" value={viewedProfile.emergencyContact?.phone || '-'} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'karir' && (
              <motion.div
                key="karir"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl mx-auto space-y-8"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm">
                    <Trophy size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900">Progress Karir</h3>
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Riwayat Jabatan & Pencapaian</p>
                  </div>
                  <div className="flex items-center gap-4">
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button 
                          onClick={() => setCareerSort('newest')}
                          className={cn(
                            "px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all",
                            careerSort === 'newest' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          Newest
                        </button>
                        <button 
                          onClick={() => setCareerSort('oldest')}
                          className={cn(
                            "px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all",
                            careerSort === 'oldest' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          Oldest
                        </button>
                        <button 
                          onClick={() => setCareerSort('manual')}
                          className={cn(
                            "px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all",
                            careerSort === 'manual' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          Manual
                        </button>
                      </div>
                    {(isAdmin || viewedProfile.userId === profile.userId) && (
                      <button 
                        onClick={() => setIsEditingCareer(true)}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-bold"
                      >
                        <Edit3 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-[40px] bg-white p-10 shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="absolute left-[59px] top-20 bottom-20 w-0.5 bg-slate-100" />
                  <div className="space-y-12 text-left">
                    {sortedCareerHistory.map((item, index) => (
                      <CareerItem 
                        key={index}
                        period={item.period} 
                        position={item.position} 
                        unit={item.unit} 
                        active={item.active} 
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'cuti' && (
                <motion.div
                key="cuti"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto space-y-12"
              >
                {/* Header Section */}
                <div className="rounded-[48px] bg-slate-900 p-10 lg:p-14 shadow-2xl text-white flex flex-col md:flex-row items-center gap-10 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
                  <div className="h-24 w-24 rounded-[32px] bg-white/10 text-white flex items-center justify-center border border-white/20 backdrop-blur-md shadow-2xl shrink-0">
                    <Award size={48} />
                  </div>
                  <div className="space-y-3 flex-1 text-center md:text-left relative z-10">
                    <h3 className="text-3xl font-black tracking-tighter leading-none uppercase">Status Penghargaan Masa Bakti</h3>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-300 italic">LONG SERVICE LEAVE CYCLE STATUS</p>
                    <div className="flex items-center gap-6 justify-center md:justify-start pt-4">
                       <div className="space-y-2">
                          <div className="h-2 w-48 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-400 rounded-full shadow-sm transition-all duration-1000" 
                                style={{ width: `${Math.min((tenureYears / 30) * 100, 100)}%` }}
                              />
                          </div>
                          <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Progress: {Math.round((tenureYears / 30) * 100)}% Menuju 30 Tahun</p>
                       </div>
                       <div className="h-12 w-px bg-white/10" />
                       <div className="text-left">
                          <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest leading-none">Masa Kerja</p>
                          <p className="text-xl font-black text-white mt-1">{tenureYears} Tahun</p>
                       </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => setIsEditingCuti(true)}
                      className="px-10 py-5 bg-white text-slate-900 font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-2xl hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all relative z-10 group/btn"
                    >
                      Kelola Hak Cuti <ChevronRight size={14} className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>

                {/* Cycle Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(viewedProfile.longServiceLeave || 
                    (viewedProfile.entryDate ? Array.from({ length: 6 }).map((_, i) => ({
                      cycleNumber: i + 1,
                      dateObtained: new Date(new Date(viewedProfile.entryDate!).setFullYear(new Date(viewedProfile.entryDate!).getFullYear() + (i + 1) * 6)).toISOString().split('T')[0],
                      status: 'upcoming'
                    })) : [])
                  ).map((cycle, i) => {
                    const targetDate = new Date(cycle.dateObtained);
                    const now = new Date();
                    const diffTime = targetDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isPassed = diffDays < 0;
                    
                    return (
                      <div 
                        key={i}
                        className={cn(
                          "rounded-[40px] bg-white p-8 shadow-sm border border-slate-100 group relative transition-all hover:shadow-2xl hover:shadow-slate-200/50",
                          isPassed ? "border-blue-100 bg-blue-50/10" : ""
                        )}
                      >
                        <div className="flex items-center justify-between mb-8">
                          <span className={cn(
                            "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em]",
                            isPassed ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                          )}>
                            {isPassed ? 'DIPEROLEH' : 'MENDATANG'}
                          </span>
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                            isPassed ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-300"
                          )}>
                            <Clock size={18} />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-2xl font-black text-slate-900 tracking-tight">Cuti Besar Ke-{cycle.cycleNumber}</h4>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              Diperoleh: {formatDate(cycle.dateObtained)}
                            </p>
                          </div>

                          <div className="space-y-3 pt-6">
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: isPassed ? "100%" : "30%" }}
                                className={cn("h-full rounded-full", isPassed ? "bg-blue-500" : "bg-slate-200")}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                                {isPassed ? 'HAK TERSEDIA' : `${diffDays} HARI LAGI`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-[48px] bg-white p-12 lg:p-16 shadow-sm border border-slate-100 space-y-8 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                     <div className="space-y-4 max-w-xl">
                        <h4 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Cuti Besar (Long Service Leave)</h4>
                        <p className="text-slate-500 font-medium leading-relaxed italic">
                          Hak cuti besar adalah penghargaan masa bakti yang diberikan kepada karyawan sebagai bentuk dedikasi selama bekerja di Lazuardi Global Islamic School. Nikmati waktu istirahat yang bermakna bersama keluarga.
                        </p>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}


            {activeTab === 'klaim' && (
               <motion.div
                key="klaim"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-10"
               >
                 <div className="rounded-[48px] bg-white p-12 shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                      <div className="space-y-2 text-center md:text-left">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Data Klaim Absensi</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 italic">
                          {isAdmin && showAllClaims ? 'SEMUA PENGAJUAN KARYAWAN' : `STATUS REAL-TIME PENGAJUAN: ${viewedProfile.email}`}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        {isAdmin && (
                          <button
                            onClick={() => setShowAllClaims(!showAllClaims)}
                            className={cn(
                              "px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                              showAllClaims 
                                ? "bg-slate-900 text-white shadow-xl" 
                                : "bg-white text-slate-600 border border-slate-100"
                            )}
                          >
                            {showAllClaims ? 'Lihat Klaim Saya' : 'Lihat Semua Klaim'}
                          </button>
                        )}
                        <a 
                          href="https://forms.gle/BCQrSBzraHaw1tmJ6" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all"
                        >
                          <Plus size={20} className="stroke-white stroke-[3]" /> Klaim Sekarang
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center py-16 bg-slate-50/50 rounded-[48px] border-2 border-dashed border-slate-200 group hover:border-indigo-200 transition-colors">
                       <div className="h-16 w-16 flex items-center justify-center rounded-3xl bg-white text-slate-300 shadow-sm mb-4 group-hover:scale-110 group-hover:text-blue-400 transition-all">
                        <History size={32} className="text-blue-500" />
                       </div>
                       
                       <div className="space-y-6 w-full max-w-4xl px-6 md:px-12">
                          <h4 className="text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">
                            {attendanceClaims.length > 0 ? 'Daftar Pengajuan' : 'Belum Ada Pengajuan'}
                          </h4>
                          
                          <div className="grid grid-cols-1 gap-4">
                            {attendanceClaims.length > 0 ? (
                              attendanceClaims.map((claim) => (
                                <div key={claim.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white rounded-3xl shadow-sm border border-slate-50 group/item hover:shadow-lg transition-all gap-4">
                                  <div className="flex items-center gap-5">
                                    <div className={cn(
                                      "h-3 w-3 rounded-full animate-pulse",
                                      claim.status === 'pending' ? "bg-amber-500" : 
                                      claim.status === 'approved' ? "bg-emerald-500" : "bg-rose-500"
                                    )} />
                                    <div>
                                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                        {isAdmin && showAllClaims ? `${claim.userName} - ` : ''}{claim.reason}
                                      </p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        Tanggal Absensi: {formatDate(claim.date)} | Diajukan: {formatDate(claim.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between md:justify-end gap-4">
                                    <div className={cn(
                                      "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg",
                                      claim.status === 'pending' ? "bg-amber-500" : 
                                      claim.status === 'approved' ? "bg-emerald-500" : "bg-rose-500"
                                    )}>
                                      {claim.status.toUpperCase()}
                                    </div>
                                    {isAdmin && claim.status === 'pending' && (
                                      <div className="flex items-center gap-2">
                                        <button 
                                          onClick={() => handleUpdateClaimStatus(claim.id, 'approved')}
                                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                          title="Setujui"
                                        >
                                          <ShieldCheck size={18} />
                                        </button>
                                        <button 
                                          onClick={() => handleUpdateClaimStatus(claim.id, 'rejected')}
                                          className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                                          title="Tolak"
                                        >
                                          <ShieldAlert size={18} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-10">
                                <p className="text-slate-400 text-sm font-medium italic">Tidak ada data klaim yang ditemukan.</p>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-10">
                            Data ditarik otomatis berdasarkan {isAdmin && showAllClaims ? 'Sistem' : `Email: ${viewedProfile.email}`}
                          </p>
                       </div>
                       
                       {isAdmin && (
                        <a 
                          href="https://docs.google.com/spreadsheets/d/1yjKBEsNaHdRPslq5Ml_QZ2e2LQOMgxURXtJhJt-RD98/edit?gid=52916422#gid=52916422" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-12 flex items-center gap-3 px-8 py-4 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:shadow-lg transition-all"
                        >
                          Kelola Entry Spreadsheet (ADMIN) <ExternalLink size={16} />
                        </a>
                       )}
                    </div>
                 </div>

                 <div className="rounded-[48px] bg-slate-900 p-12 lg:p-16 text-white shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-48 -mt-48" />
                    <div className="relative space-y-8">
                      <div className="space-y-4">
                        <h4 className="text-3xl font-black tracking-tighter uppercase leading-none">Prosedur Klaim Absensi</h4>
                        <p className="text-indigo-100/60 font-medium max-w-2xl leading-relaxed italic">Semua klaim ditarik langsung dari sistem Form Responses Lazuardi. Pastikan berkas pendukung telah disetujui Kepala Unit.</p>
                      </div>
                    </div>
                 </div>
               </motion.div>
            )}

            {activeTab === 'regulasi' && (
              <motion.div
                key="regulasi"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-12"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Kebijakan & Regulasi</h3>
                    <p className="text-sm font-medium text-slate-400 italic">Pedoman resmi dan tata tertib Lazuardi HR.</p>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => { setSelectedRegCategory(null); setIsEditingRegCategory(true); }}
                      className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-sm hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"
                    >
                      + Tambah Kategori
                    </button>
                  )}
                </div>

                <div className="rounded-[48px] bg-indigo-600 p-12 lg:p-16 text-white shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                      <BookOpen size={400} className="translate-x-1/2 -translate-y-1/4" />
                   </div>
                   <div className="relative space-y-8 max-w-2xl">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                         <ShieldCheck size={16} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Portal Utama</span>
                      </div>
                      <h4 className="text-5xl font-black tracking-tighter leading-[1.1]">Pedoman Lengkap Peraturan Karyawan</h4>
                      <p className="text-indigo-100 text-lg font-medium leading-relaxed opacity-80">
                        Akses portal resmi untuk meninjau seluruh peraturan, kebijakan, tata tertib, dan regulasi ketenagakerjaan di lingkungan Lazuardi.
                      </p>
                      <a 
                        href="https://sites.google.com/lazuardi.sch.id/tugas-hrd-peraturan/unser-1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-white text-indigo-600 font-black text-sm uppercase tracking-widest rounded-2xl shadow-2xl shadow-indigo-900/20 hover:scale-105 transition-all"
                      >
                         Buka Portal Peraturan <ExternalLink size={20} />
                      </a>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {regulationCategories.map((cat) => (
                     <div key={cat.id} className="space-y-6">
                        <div className="flex items-center justify-between px-4">
                          <div className="flex items-center gap-3">
                            <h5 className="text-sm font-black text-slate-900 uppercase tracking-widest">{cat.title}</h5>
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={() => { setSelectedRegCategory(cat); setIsEditingRegCategory(true); }}
                                className="text-[10px] font-black text-slate-400 uppercase underline hover:text-indigo-600"
                              >
                                Edit Cat
                              </button>
                              <button 
                                onClick={() => { setSelectedRegItem({ categoryId: cat.id }); setIsEditingRegItem(true); }}
                                className="text-[10px] font-black text-indigo-600 uppercase underline"
                              >
                                + Tambah Item
                              </button>
                            </div>
                          )}
                        </div>
                        {cat.items?.map((item) => (
                          <div key={item.id} className="rounded-[40px] bg-white p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all relative group/reg">
                             <div className="flex items-center gap-4 mb-4">
                                <div className={cn(
                                  "h-12 w-12 rounded-2xl flex items-center justify-center",
                                  item.iconType === 'alert' ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"
                                )}>
                                   {item.iconType === 'alert' ? <ShieldAlert size={24} /> : <ShieldCheck size={24} />}
                                </div>
                                <p className="text-xl font-bold text-slate-900 pr-12">{item.title}</p>
                             </div>
                             <p className="text-slate-400 text-sm font-medium leading-relaxed">{item.description}</p>
                             {isAdmin && (
                               <div className="absolute top-8 right-8 flex items-center gap-2 opacity-0 group-hover/reg:opacity-100 transition-all">
                                 <button 
                                   onClick={() => { setSelectedRegItem({ categoryId: cat.id, item }); setIsEditingRegItem(true); }}
                                   className="text-slate-300 hover:text-indigo-600"
                                 >
                                   <Edit3 size={16} />
                                 </button>
                                 <button 
                                   onClick={() => handleDeleteRegItem(cat.id, item.id)}
                                   className="text-slate-300 hover:text-red-500"
                                 >
                                   <Trash2 size={16} />
                                 </button>
                               </div>
                             )}
                          </div>
                        ))}
                     </div>
                   ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'certification' && (
              <motion.div
                key="certification"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2 text-left">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Sertifikasi & Lisensi</h3>
                    <p className="text-sm font-medium text-slate-400 italic">Daftar sertifikasi profesional yang Anda miliki.</p>
                  </div>
                  <button 
                    onClick={() => { setSelectedCertification(null); setIsEditingCertification(true); }}
                    className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus size={18} /> Tambah Sertifikasi
                  </button>
                </div>

                {certifications.length === 0 ? (
                  <div className="rounded-[48px] bg-white border-2 border-dashed border-slate-100 p-20 text-center flex flex-col items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                      <Award size={48} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xl font-bold text-slate-900">Belum ada sertifikasi</p>
                      <p className="text-sm text-slate-400 max-w-sm">Anda belum menambahkan sertifikasi apapun. Klik tombol di atas untuk memulai.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="group relative bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-100/50 transition-all">
                        <div className="aspect-[4/3] bg-slate-50 overflow-hidden relative">
                          {cert.photoUrl ? (
                            <img src={cert.photoUrl} alt={cert.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                              <FileText size={64} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="p-8 space-y-4 text-left">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none pt-0.5">{formatDate(cert.date)}</p>
                            <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight uppercase line-clamp-2">{cert.name}</h4>
                          </div>
                          <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                            <button 
                              onClick={() => { setSelectedCertification(cert); setIsEditingCertification(true); }}
                              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
                            >
                              Edit Data
                            </button>
                            <button 
                              onClick={() => handleDeleteCertification(cert.id)}
                              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'faq' && (
              <motion.div
                key="faq"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-6xl mx-auto text-center space-y-16 py-10"
              >
                <div className="space-y-6 max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 mb-4 animate-bounce">
                       <HelpCircle size={16} />
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none pt-0.5">Knowledge Center</span>
                    </div>
                    <h3 className="text-6xl font-black text-slate-900 tracking-tighter">Apa yang bisa kami bantu?</h3>
                    <p className="text-slate-400 font-medium text-lg leading-relaxed italic">Temukan jawaban atas pertanyaan umum seputar kebijakan, sistem, dan operasional MyHR Connect di satu tempat.</p>
                    
                    <div className="relative mt-12 flex flex-col items-center gap-4">
                       <div className="relative w-full">
                         <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                         <input 
                          type="text" 
                          placeholder="Cari topik atau pertanyaan..." 
                          className="w-full bg-white border-2 border-slate-100 py-8 pl-20 pr-10 rounded-[32px] text-xl font-bold shadow-2xl shadow-indigo-100/20 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                         />
                       </div>
                       
                       <button 
                         className="mt-4 flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all"
                         onClick={() => window.open('mailto:hr@lazuardi.sch.id?subject=Bantuan HR')}
                       >
                         <Phone size={18} /> Tanyakan ke tim HR
                       </button>
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                  <div className="flex flex-wrap items-center justify-center gap-4">
                     {['ALL', ...faqCategories.map(c => c.title.toUpperCase())].map((cat, i) => {
                       const actualCat = cat === 'ALL' ? 'ALL' : faqCategories.find(c => c.title.toUpperCase() === cat)?.id || cat;
                       return (
                         <button 
                          key={i} 
                          onClick={() => setActiveFaqTab(actualCat)}
                          className={cn(
                            "px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all",
                            activeFaqTab === actualCat ? "bg-slate-900 text-white shadow-xl" : "bg-white text-slate-400 border-2 border-slate-50 hover:bg-slate-50"
                          )}
                         >
                           {cat}
                         </button>
                       );
                     })}
                     {isAdmin && (
                       <button 
                         onClick={() => { setSelectedFaqCategory(null); setIsEditingFaqCategory(true); }}
                         className="px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-white border-2 border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                       >
                         + Tambah Kategori
                       </button>
                     )}
                  </div>

                  <div className="max-w-4xl mx-auto w-full space-y-12">
                     {faqCategories
                      .filter(cat => activeFaqTab === 'ALL' || cat.id === activeFaqTab)
                      .map((cat) => (
                        <div key={cat.id} className="space-y-6">
                           <div className="flex items-center justify-between px-4">
                             <div className="flex items-center gap-3">
                               <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em]">{cat.title}</p>
                             </div>
                             {isAdmin && (
                               <div className="flex items-center gap-4">
                                  <button onClick={() => { setSelectedFaqCategory(cat); setIsEditingFaqCategory(true); }} className="text-[9px] font-black text-slate-400 uppercase underline">Edit Cat</button>
                                  <button onClick={() => { setSelectedFaqItem({ categoryId: cat.id }); setIsEditingFaqItem(true); }} className="text-[9px] font-black text-indigo-600 uppercase underline">+ Tambah Item</button>
                               </div>
                             )}
                           </div>
                           <div className="space-y-4">
                              {cat.items?.map((item) => (
                                <FaqAccordion 
                                  key={item.id}
                                  question={item.question}
                                  answer={item.answer}
                                  isAdmin={isAdmin}
                                  onEdit={() => { setSelectedFaqItem({ categoryId: cat.id, item }); setIsEditingFaqItem(true); }}
                                  onDelete={() => handleDeleteFaqItem(cat.id, item.id)}
                                />
                              ))}
                           </div>
                        </div>
                     ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-10 right-10 z-50 h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-2xl shadow-indigo-400 hover:scale-110 active:scale-95 transition-all hidden lg:flex">
        <Sparkles size={28} className="fill-white/20" />
      </button>
    </div>
  );
}

function HubCard({ icon, bg, label, value, footer, onClick }: { icon: ReactNode, bg: string, label: string, value: string, footer?: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-[40px] bg-white p-10 shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:shadow-slate-100 transition-all group",
        onClick && "cursor-pointer"
      )}
    >
      <div className={cn("h-16 w-16 flex items-center justify-center rounded-2xl shadow-sm", bg)}>
        {icon}
      </div>
      <div className="mt-2 space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
        <h4 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors uppercase">{value}</h4>
      </div>
      {footer && (
        <button className="mt-4 flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:gap-3 transition-all">
          {footer} <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function DataCard({ label, value, icon, onClick }: { label: string, value?: string, icon: ReactNode, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-3xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group",
        onClick && "cursor-pointer hover:border-indigo-100"
      )}
    >
      <div className="flex items-center gap-4 text-left">
        <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{value || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

// Editable Modals Components
function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-white rounded-[40px] p-10 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-2xl font-black italic tracking-tighter uppercase">{title}</h3>
           <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
             ✕
           </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto pr-4 scrollbar-hide">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function EditProfileModal({ isOpen, onClose, formData, setFormData, onSave }: any) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profil">
      <form onSubmit={onSave} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nama Lengkap" value={formData.name} onChange={(v) => setFormData({...formData, name: v})} />
          <Input label="NIY / Pegawai ID" value={formData.niy} onChange={(v) => setFormData({...formData, niy: v})} />
          <Input label="Unit" value={formData.unit} onChange={(v) => setFormData({...formData, unit: v})} />
          <Input label="Jabatan" value={formData.position} onChange={(v) => setFormData({...formData, position: v})} />
          <Input label="Email Official" value={formData.email} onChange={(v) => setFormData({...formData, email: v})} />
          <Input label="Status Kerja" value={formData.contractStatus} onChange={(v) => setFormData({...formData, contractStatus: v})} />
          <div className="col-span-2">
            <Input label="IDP Link (Google Sheets / Drive)" value={formData.idpLink || ''} onChange={(v) => setFormData({...formData, idpLink: v})} />
          </div>
        </div>
        <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all">
           SIMPAN PERUBAHAN
        </button>
      </form>
    </Modal>
  );
}

function EditBarDataModal({ isOpen, onClose, data, onSave }: any) {
  const [newRecord, setNewRecord] = useState({ name: 'TA 26/27', TK: 0, SD: 0, SMP: 0, SUPPORT: 0 });
  const [currentData, setCurrentData] = useState(data);

  useEffect(() => {
    setCurrentData(data);
  }, [data]);

  const handleAdd = () => {
    onSave([newRecord, ...currentData]);
    // Optionally increment TA for next one
    setNewRecord({ name: 'TA 27/28', TK: 0, SD: 0, SMP: 0, SUPPORT: 0 });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kelola Data Record Karyawan">
      <div className="space-y-10">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] -mt-6 mb-8 text-left">
            Tambahkan atau hapus data tahunan karyawan per unit
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Tahun Ajaran</label>
              <input 
                value={newRecord.name} 
                onChange={e => setNewRecord({...newRecord, name: e.target.value})}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-4 text-xs font-black text-slate-900 text-center focus:ring-2 focus:ring-indigo-500/10 transition-all"
              />
            </div>
            {[
              { key: 'TK', label: 'PRA TK/TK' },
              { key: 'SD', label: 'SD' },
              { key: 'SMP', label: 'SMP' },
              { key: 'SUPPORT', label: 'SUPPORT' }
            ].map((field) => (
              <div key={field.key} className="space-y-2 text-left">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">{field.label}</label>
                <input 
                  type="number"
                  value={(newRecord as any)[field.key]} 
                  onChange={e => setNewRecord({...newRecord, [field.key]: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-4 text-xs font-black text-slate-900 text-center focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <button 
              onClick={handleAdd}
              className="flex-1 py-5 bg-indigo-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-3xl shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Simpan / Tambah Data Baru
            </button>
            <button 
              onClick={() => setNewRecord({ name: 'TA 26/27', TK: 0, SD: 0, SMP: 0, SUPPORT: 0 })}
              className="px-8 py-5 bg-slate-50 text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] rounded-3xl hover:bg-slate-100 transition-all"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 pt-4 pb-4">
          {currentData.map((item: any, i: number) => (
            <div key={i} className="relative group rounded-[32px] bg-slate-50/40 p-6 border border-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2">{item.name}</p>
              <p className="text-base font-black text-slate-900">Total: {item.TK + item.SD + item.SMP + item.SUPPORT}</p>
              
              <button 
                onClick={() => onSave(currentData.filter((_, idx) => idx !== i))}
                className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-75 group-hover:scale-100 z-10"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function EditAreaDataModal({ isOpen, onClose, data, onSave }: any) {
  const [newRecord, setNewRecord] = useState({ name: 'TA 26/27', value: 0 });
  const [currentData, setCurrentData] = useState(data);

  useEffect(() => {
    setCurrentData(data);
  }, [data]);

  const handleAdd = () => {
    onSave([newRecord, ...currentData]);
    setNewRecord({ name: 'TA 27/28', value: 0 });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kelola Data Resign Lazuardi">
      <div className="space-y-10 text-left">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] -mt-6 mb-8">
            Tambahkan atau hapus data tahunan status tidak lanjut
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Tahun Ajaran</label>
              <input 
                value={newRecord.name} 
                onChange={e => setNewRecord({...newRecord, name: e.target.value})}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl py-5 px-6 text-sm font-black text-slate-900 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                placeholder="Contoh: TA 26/27"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Total Resign</label>
              <input 
                type="number"
                value={newRecord.value} 
                onChange={e => setNewRecord({...newRecord, value: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl py-5 px-6 text-sm font-black text-slate-900 focus:ring-2 focus:ring-emerald-500/10 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <button 
              onClick={handleAdd}
              className="flex-1 py-5 bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-3xl shadow-xl shadow-emerald-100 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Simpan / Tambah Data Baru
            </button>
            <button 
              onClick={() => setNewRecord({ name: 'TA 26/27', value: 0 })}
              className="px-8 py-5 bg-slate-50 text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] rounded-3xl hover:bg-slate-100 transition-all"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 pt-4 pb-4">
          {currentData.map((item: any, i: number) => (
            <div key={i} className="relative group rounded-[32px] bg-slate-50/40 p-6 border border-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2">{item.name}</p>
              <p className="text-base font-black text-slate-900">Total: {item.value}</p>
              
              <button 
                onClick={() => onSave(currentData.filter((_: any, idx: number) => idx !== i))}
                className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-75 group-hover:scale-100 z-10"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function EditCareerModal({ isOpen, onClose, data, onSave }: any) {
  const [currentData, setCurrentData] = useState(data || []);

  useEffect(() => {
    setCurrentData(data || []);
  }, [data, isOpen]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const next = [...currentData];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentData.length) return;
    
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    setCurrentData(next);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Riwayat Karir">
      <div className="space-y-6">
        {currentData.map((item: any, i: number) => (
          <div key={i} className="p-6 bg-slate-50 rounded-[32px] space-y-4 relative group">
             <div className="absolute top-4 right-4 flex gap-2">
                <div className="flex flex-col gap-1">
                  <button 
                    disabled={i === 0}
                    onClick={() => moveItem(i, 'up')}
                    className="p-1 text-slate-300 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-300 transition-colors"
                    title="Pindahkan ke atas"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button 
                    disabled={i === currentData.length - 1}
                    onClick={() => moveItem(i, 'down')}
                    className="p-1 text-slate-300 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-300 transition-colors"
                    title="Pindahkan ke bawah"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                <button 
                  onClick={() => setCurrentData(currentData.filter((_: any, idx: number) => idx !== i))}
                  className="p-1 text-red-300 hover:text-red-500 transition-colors"
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Input label="Periode" value={item.period} onChange={(v) => {
                  const next = [...currentData];
                  next[i] = {...item, period: v};
                  setCurrentData(next);
                }} />
                <Input label="Jabatan" value={item.position} onChange={(v) => {
                  const next = [...currentData];
                  next[i] = {...item, position: v};
                  setCurrentData(next);
                }} />
             </div>
             <Input label="Unit" value={item.unit} onChange={(v) => {
               const next = [...currentData];
               next[i] = {...item, unit: v};
               setCurrentData(next);
             }} />
          </div>
        ))}
        <button 
          onClick={() => setCurrentData([{ period: "20XX - 20XX", position: "New Position", unit: "Lazuardi", active: false }, ...currentData])}
          className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 font-bold rounded-3xl hover:bg-slate-50 transition-all"
        >
          + Tambah Riwayat
        </button>
        <button onClick={() => { onSave(currentData); onClose(); }} className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all">
           SIMPAN RIWAYAT
        </button>
      </div>
    </Modal>
  );
}

function EditCutiModal({ isOpen, onClose, data, onSave }: any) {
  const [lsCycles, setLsCycles] = useState<any[]>(data.longServiceLeave || []);

  useEffect(() => {
    setLsCycles(data.longServiceLeave || []);
  }, [data, isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kelola Masa Milestone Cuti Besar">
      <div className="space-y-10 text-left">
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <h5 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em]">Siklus Pengabdian (6 Tahunan)</h5>
              <button 
                onClick={() => setLsCycles([...lsCycles, { id: Date.now().toString(), cycleNumber: lsCycles.length + 1, dateObtained: '20XX-01-01', status: 'upcoming' }])}
                className="text-[10px] font-black text-indigo-600 uppercase underline"
              >
                + Tambah Siklus
              </button>
           </div>
           
           <div className="space-y-4">
              {lsCycles.map((cycle, idx) => (
                <div key={idx} className="flex gap-4 items-center bg-slate-50 p-5 rounded-3xl border border-slate-100 relative group">
                   <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white text-blue-600 font-bold border border-blue-50">
                      {idx + 1}
                   </div>
                   <div className="flex-1 grid grid-cols-2 gap-4">
                      <Input 
                        label={`Tanggal Cuti ke ${idx + 1}`} 
                        value={cycle.dateObtained} 
                        onChange={(v) => {
                          const next = [...lsCycles];
                          next[idx] = { ...cycle, dateObtained: v };
                          setLsCycles(next);
                        }} 
                      />
                      <div className="space-y-1.5 text-left">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                        <select
                          value={cycle.status || 'upcoming'}
                          onChange={(e) => {
                            const next = [...lsCycles];
                            next[idx] = { ...cycle, status: e.target.value };
                            setLsCycles(next);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="available">Available</option>
                          <option value="claimed">Claimed</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>
                   </div>
                   <button 
                    onClick={() => setLsCycles(lsCycles.filter((_, i) => i !== idx))}
                    className="h-10 w-10 flex items-center justify-center text-red-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
           </div>
        </div>

        <button 
          onClick={() => { 
            onSave({ 
              longServiceLeave: lsCycles
            }); 
            onClose(); 
          }} 
          className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-slate-800 transition-all uppercase tracking-widest text-sm"
        >
           Update Masa Cuti Milestone
        </button>
      </div>
    </Modal>
  );
}

function EditEmployeeModal({ isOpen, onClose, employee, onSave }: any) {
  const [form, setForm] = useState(employee || {});

  useEffect(() => { 
    if(employee) {
      setForm(employee);
    } else {
      setForm({});
    }
  }, [employee]);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee ? "Edit Profil" : "Tambah Karyawan"}>
      <div className="space-y-10 max-h-[80vh] overflow-y-auto px-4 pb-10 scrollbar-hide text-left">
        {/* Basic Header Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-slate-50 rounded-[40px] border border-slate-100">
          <Input label="Nama Lengkap" value={form.name} onChange={(v) => setForm({...form, name: v})} />
          <Input label="NIY / Pegawai ID" value={form.niy || ''} onChange={(v) => setForm({...form, niy: v})} />
          <Input label="Jabatan" value={form.position} onChange={(v) => setForm({...form, position: v})} />
          <Input label="Unit" value={form.unit} onChange={(v) => setForm({...form, unit: v})} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Personal Info */}
          <div className="space-y-6">
            <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-100 pb-3">Informasi Personal</h5>
            <div className="grid grid-cols-1 gap-4">
              <Input label="Email Official" value={form.email} onChange={(v) => setForm({...form, email: v})} />
              <Input label="Telepon" value={form.phone} onChange={(v) => setForm({...form, phone: v})} />
              <Input label="NIK (KTP)" value={form.nik} onChange={(v) => setForm({...form, nik: v})} />
              <Input label="NPWP" value={form.npwp} onChange={(v) => setForm({...form, npwp: v})} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Gender" value={form.gender} onChange={(v) => setForm({...form, gender: v})} />
                <Input label="Status Kawin" value={form.maritalStatus} onChange={(v) => setForm({...form, maritalStatus: v})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Tempat Lahir" value={form.birthPlace} onChange={(v) => setForm({...form, birthPlace: v})} />
                <Input label="Tanggal Lahir" value={form.birthDate} onChange={(v) => setForm({...form, birthDate: v})} />
              </div>
              <Input label="Alamat Lengkap" value={form.address} onChange={(v) => setForm({...form, address: v})} />
            </div>
          </div>

          {/* Education & Employment */}
          <div className="space-y-6">
            <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-100 pb-3">Pendidikan & Kepegawaian</h5>
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Tingkat Pendidikan" value={form.educationLevel} onChange={(v) => setForm({...form, educationLevel: v})} />
                <Input label="Institusi/Jurusan" value={form.education} onChange={(v) => setForm({...form, education: v})} />
              </div>
              <Input label="Status Kontrak" value={form.contractStatus} onChange={(v) => setForm({...form, contractStatus: v})} />
              <Input label="Tanggal Masuk" value={form.entryDate} onChange={(v) => setForm({...form, entryDate: v})} />
              <Input label="BPJS Nomor" value={form.bpjs} onChange={(v) => setForm({...form, bpjs: v})} />
              <Input label="IDP Link" value={form.idpLink} onChange={(v) => setForm({...form, idpLink: v})} />
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Akses Level</label>
                <select 
                  value={form.role || 'employee'} 
                  onChange={(e) => setForm({...form, role: (e.target.value as any)})}
                  className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="space-y-6">
          <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-100 pb-3">Kontak Darurat</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Nama Kontak" value={form.emergencyContact?.name} onChange={(v) => setForm({...form, emergencyContact: { ...form.emergencyContact, name: v }})} />
            <Input label="Hubungan" value={form.emergencyContact?.relationship} onChange={(v) => setForm({...form, emergencyContact: { ...form.emergencyContact, relationship: v }})} />
            <Input label="Nomor HP" value={form.emergencyContact?.phone} onChange={(v) => setForm({...form, emergencyContact: { ...form.emergencyContact, phone: v }})} />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-4 sticky bottom-0 bg-white pt-4 border-t border-slate-100">
          <button onClick={() => onSave(form)} className="flex-1 py-6 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-slate-800 transition-all">
            SIMPAN PERUBAHAN
          </button>
          <button onClick={onClose} className="px-10 py-6 bg-slate-100 text-slate-400 font-black rounded-3xl hover:bg-slate-200 transition-all">
            BATAL
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string, value?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">{label}</p>
      <p className="text-xs font-bold text-slate-900 text-right">{value || '-'}</p>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <input 
        type="text" 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all"
      />
    </div>
  );
}

function CareerItem({ period, position, unit, active = false }: { period: string, position: string, unit: string, active?: boolean, key?: any }) {
  return (
    <div className="flex items-start gap-8 relative z-10">
      <div className={cn(
        "h-10 w-10 rounded-2xl ring-4 ring-white shadow-md flex-shrink-0 flex items-center justify-center transition-all",
        active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
      )}>
        {active ? <Star size={20} className="fill-current" /> : <Briefcase size={18} />}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-[10px] font-black text-indigo-600/50 uppercase tracking-[0.2em]">{period}</p>
        <h5 className={cn("text-xl font-bold text-slate-900", active && "text-indigo-600")}>{position}</h5>
        <p className="text-sm font-semibold text-slate-400">{unit}</p>
      </div>
      {active && (
         <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
           Current
         </div>
      )}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string, value?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">{label}</p>
      <p className="text-[13px] font-bold text-slate-900 text-right">{value || '-'}</p>
    </div>
  );
}

function EmergencyCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-slate-50/50 p-7 rounded-[32px] border border-slate-100/50 shadow-sm">
      <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">{label}</p>
      <p className="text-lg font-black text-slate-900 tracking-tight truncate">{value}</p>
    </div>
  );
}

function FaqAccordion({ question, answer, isAdmin, onEdit, onDelete }: { question: string, answer: string, isAdmin?: boolean, onEdit?: () => void, onDelete?: () => void, key?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="rounded-[32px] bg-white p-8 border border-slate-100 shadow-sm text-left group hover:shadow-xl transition-all cursor-pointer relative" onClick={() => setIsOpen(!isOpen)}>
       <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-xl font-bold text-slate-800">{question}</p>
            <AnimatePresence>
              {isOpen && (
                <motion.p 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="text-slate-400 text-sm font-medium leading-relaxed italic pr-12"
                >
                  {answer}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className={cn(
            "h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shrink-0",
            isOpen && "rotate-180 bg-indigo-50 text-indigo-600"
          )}>
             <ChevronDown size={20} />
          </div>
       </div>
       {isAdmin && (
         <div className="absolute top-8 right-16 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
           <button 
             onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
             className="text-slate-300 hover:text-indigo-600"
           >
             <Edit3 size={16} />
           </button>
           <button 
             onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
             className="text-slate-300 hover:text-red-500"
           >
             <Trash2 size={16} />
           </button>
         </div>
       )}
    </div>
  );
}

function EditRegCategoryModal({ isOpen, onClose, data, onSave }: any) {
  const [form, setForm] = useState<Partial<RegulationCategory>>(data || { title: '', order: 0 });
  useEffect(() => { setForm(data || { title: '', order: 0 }); }, [data, isOpen]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={data ? "Edit Kategori" : "Tambah Kategori Regulasi"}>
      <div className="space-y-6 text-left">
        <Input label="Judul Kategori" value={form.title || ''} onChange={(v) => setForm({...form, title: v})} />
        <Input label="Order (Urutan)" value={form.order?.toString() || '0'} onChange={(v) => setForm({...form, order: parseInt(v) || 0})} />
        <button onClick={() => onSave(form)} className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl">
           SIMPAN KATEGORI
        </button>
      </div>
    </Modal>
  );
}

function EditRegItemModal({ isOpen, onClose, categoryId, data, onSave }: any) {
  const [form, setForm] = useState<Partial<RegulationItem>>(data || { title: '', description: '', iconType: 'check' });
  useEffect(() => { setForm(data || { title: '', description: '', iconType: 'check' }); }, [data, isOpen]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={data ? "Edit Item Regulasi" : "Tambah Item Regulasi"}>
      <div className="space-y-6 text-left">
        <Input label="Judul Item" value={form.title || ''} onChange={(v) => setForm({...form, title: v})} />
        <Input label="Deskripsi Singkat" value={form.description || ''} onChange={(v) => setForm({...form, description: v})} />
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe Icon</label>
          <select 
            value={form.iconType} 
            onChange={(e) => setForm({...form, iconType: e.target.value as any})}
            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700"
          >
            <option value="check">Check (Info)</option>
            <option value="alert">Alert (Peringatan)</option>
          </select>
        </div>
        <button onClick={() => onSave(categoryId, form)} className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl">
           SIMPAN ITEM
        </button>
      </div>
    </Modal>
  );
}

function EditFaqCategoryModal({ isOpen, onClose, data, onSave }: any) {
  const [form, setForm] = useState<Partial<FaqCategory>>(data || { title: '', order: 0 });
  useEffect(() => { setForm(data || { title: '', order: 0 }); }, [data, isOpen]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={data ? "Edit Kategori FAQ" : "Tambah Kategori FAQ"}>
      <div className="space-y-6 text-left">
        <Input label="Judul Kategori" value={form.title || ''} onChange={(v) => setForm({...form, title: v})} />
        <Input label="Order (Urutan)" value={form.order?.toString() || '0'} onChange={(v) => setForm({...form, order: parseInt(v) || 0})} />
        <button onClick={() => onSave(form)} className="w-full py-5 bg-emerald-600 text-white font-black rounded-3xl shadow-xl">
           SIMPAN KATEGORI
        </button>
      </div>
    </Modal>
  );
}

function EditFaqItemModal({ isOpen, onClose, categoryId, data, onSave }: any) {
  const [form, setForm] = useState<Partial<FaqItem>>(data || { question: '', answer: '' });
  useEffect(() => { setForm(data || { question: '', answer: '' }); }, [data, isOpen]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={data ? "Edit Item FAQ" : "Tambah Item FAQ"}>
      <div className="space-y-6 text-left">
        <Input label="Pertanyaan" value={form.question || ''} onChange={(v) => setForm({...form, question: v})} />
        <div className="space-y-1.5 text-left">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Jawaban</label>
          <textarea 
            value={form.answer || ''} 
            onChange={(e) => setForm({...form, answer: e.target.value})}
            rows={4}
            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all"
          />
        </div>
        <button onClick={() => onSave(categoryId, form)} className="w-full py-5 bg-emerald-600 text-white font-black rounded-3xl shadow-xl">
           SIMPAN ITEM
        </button>
      </div>
    </Modal>
  );
}

function EditCertificationModal({ isOpen, onClose, data, onSave }: any) {
  const [form, setForm] = useState<Partial<Certification>>(data || { name: '', date: '', photoUrl: '' });
  
  useEffect(() => { 
    setForm(data || { name: '', date: '', photoUrl: '' }); 
  }, [data, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) { // Limit to ~800KB for Base64 storage
        alert('File terlalu besar. Maksimum 800KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={data ? "Edit Sertifikasi" : "Tambah Sertifikasi"}>
      <div className="space-y-6 text-left">
        <Input label="Nama Sertifikasi" value={form.name || ''} onChange={(v) => setForm({...form, name: v})} />
        <div className="space-y-1.5 flex-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Sertifikasi</label>
          <input 
            type="date" 
            value={form.date || ''} 
            onChange={(e) => setForm({...form, date: e.target.value})}
            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all"
          />
        </div>
        
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Foto Sertifikat</label>
          {form.photoUrl && (
            <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-100 mb-4 bg-slate-50">
              <img src={form.photoUrl} alt="Preview" className="w-full h-full object-contain" />
              <button 
                onClick={() => setForm({...form, photoUrl: ''})}
                className="absolute top-4 right-4 h-8 w-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                ✕
              </button>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-xs text-slate-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-all"
          />
        </div>

        <button 
          onClick={() => {
            if (!form.name || !form.date) {
              alert('Nama dan tanggal wajib diisi');
              return;
            }
            onSave(form);
          }} 
          className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all"
        >
          SIMPAN SERTIFIKASI
        </button>
      </div>
    </Modal>
  );
}



