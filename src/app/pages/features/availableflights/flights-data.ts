// تعريف شكل بيانات الرحلة
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
  originCountry?: string;

  destination: string;
  destinationCode: string;
  destinationName: string;
  destinationCity: string;
  destinationCountry?: string;

  departureTime: string;
  arrivalTime: string;
  departureDate: string;

  aircraft: string;
  registration: string;

  economySeats: number;
  businessSeats: number;
}

// مصفوفة فارغة لضمان عدم استخدام أي بيانات وهمية
export const flightsData: Flight[] = [];
