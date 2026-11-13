// تعريف شكل بيانات الرحلة المشتركة بين الصفحتين.
export interface Flight {
  id?: number;
  number: string;
  airline: string;
  code: string;
  logo: string;
  logoClass: string;

  status: string;
  statusClass: string;
  statusDot: string;

  origin: string;
  originCode: string;
  originName: string;
  originCity: string;

  destination: string;
  destinationCode: string;
  destinationName: string;
  destinationCity: string;

  departureTime: string;
  arrivalTime: string;
  departureDate: string;

  aircraft: string;
  registration: string;

  economySeats: number;
  businessSeats: number;
}

// بيانات الرحلات التجريبية المشتركة بين الصفحتين.
export const flightsData: Flight[] = [

  // الرحلة الأولى.
  {
    number: 'MDR-101',
    airline: 'طيران مَدار',
    code: 'MDR',
    logo: 'مـ',
    logoClass: 'bg-primary-container text-tertiary',

    status: 'مؤكدة',
    statusClass: 'bg-emerald-50 text-emerald-800',
    statusDot: 'bg-emerald-600',

    origin: 'SAH',
    originCode: 'SAH',
    originName: 'مطار صنعاء الدولي',
    originCity: 'صنعاء، الجمهورية اليمنية',

    destination: 'CAI',
    destinationCode: 'CAI',
    destinationName: 'مطار القاهرة الدولي',
    destinationCity: 'القاهرة، جمهورية مصر العربية',

    departureTime: '08:00',
    arrivalTime: '11:30',
    departureDate: 'السبت، 7 نوفمبر 2026',

    aircraft: 'Airbus A320neo',
    registration: '7O-MDR',

    economySeats: 42,
    businessSeats: 8
  },

  // الرحلة الثانية.
  {
    number: 'IY-602',
    airline: 'الخطوط الجوية اليمنية',
    code: 'IY',
    logo: 'يـ',
    logoClass: 'bg-red-900',

    status: 'مجدولة',
    statusClass: 'bg-slate-100 text-slate-800',
    statusDot: 'bg-primary-container',

    origin: 'ADE',
    originCode: 'ADE',
    originName: 'مطار عدن الدولي',
    originCity: 'عدن، الجمهورية اليمنية',

    destination: 'JED',
    destinationCode: 'JED',
    destinationName: 'مطار الملك عبد العزيز الدولي',
    destinationCity: 'جدة، المملكة العربية السعودية',

    departureTime: '14:15',
    arrivalTime: '16:45',
    departureDate: 'السبت، 7 نوفمبر 2026',

    aircraft: 'Airbus A330-200',
    registration: '7O-IYA',

    economySeats: 110,
    businessSeats: 14
  },

  // الرحلة الثالثة.
  {
    number: 'BQ-310',
    airline: 'بلقيس للطيران',
    code: 'BQ',
    logo: 'بـ',
    logoClass: 'bg-amber-800',

    status: 'متأخرة',
    statusClass: 'bg-amber-50 text-amber-900',
    statusDot: 'bg-amber-500',

    origin: 'GXF',
    originCode: 'GXF',
    originName: 'مطار سيئون الدولي',
    originCity: 'سيئون، الجمهورية اليمنية',

    destination: 'AMM',
    destinationCode: 'AMM',
    destinationName: 'مطار الملكة علياء الدولي',
    destinationCity: 'عمّان، المملكة الأردنية الهاشمية',

    departureTime: '09:40',
    arrivalTime: '13:20',
    departureDate: 'السبت، 7 نوفمبر 2026',

    aircraft: 'Boeing 737-800',
    registration: '7O-BQA',

    economySeats: 28,
    businessSeats: 0
  },

  // الرحلة الرابعة.
  {
    number: 'MDR-204',
    airline: 'طيران مَدار',
    code: 'MDR',
    logo: 'مـ',
    logoClass: 'bg-primary-container text-tertiary',

    status: 'مؤكدة',
    statusClass: 'bg-emerald-50 text-emerald-800',
    statusDot: 'bg-emerald-600',

    origin: 'CAI',
    originCode: 'CAI',
    originName: 'مطار القاهرة الدولي',
    originCity: 'القاهرة، جمهورية مصر العربية',

    destination: 'ADE',
    destinationCode: 'ADE',
    destinationName: 'مطار عدن الدولي',
    destinationCity: 'عدن، الجمهورية اليمنية',

    departureTime: '18:00',
    arrivalTime: '21:40',
    departureDate: 'السبت، 7 نوفمبر 2026',

    aircraft: 'Airbus A321neo',
    registration: '7O-MDB',

    economySeats: 64,
    businessSeats: 12
  },

  // الرحلة الخامسة.
  {
    number: 'IY-448',
    airline: 'الخطوط الجوية اليمنية',
    code: 'IY',
    logo: 'يـ',
    logoClass: 'bg-red-900',

    status: 'ملغاة',
    statusClass: 'bg-red-50 text-error',
    statusDot: 'bg-error',

    origin: 'SAH',
    originCode: 'SAH',
    originName: 'مطار صنعاء الدولي',
    originCity: 'صنعاء، الجمهورية اليمنية',

    destination: 'AMM',
    destinationCode: 'AMM',
    destinationName: 'مطار الملكة علياء الدولي',
    destinationCity: 'عمّان، المملكة الأردنية الهاشمية',

    departureTime: '06:30',
    arrivalTime: '10:15',
    departureDate: 'السبت، 7 نوفمبر 2026',

    aircraft: 'Airbus A320',
    registration: '7O-IYB',

    economySeats: 0,
    businessSeats: 0
  }
];