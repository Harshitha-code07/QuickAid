export interface FirstAidGuide {
  title: string;
  severity: "Critical" | "Moderate" | "Mild" | string;
  whoRef: string;
  steps: string[];
  dos: string[];
  donts: string[];
  emergencyContactRequired: boolean;
}

export interface EmergencyIssuePreset {
  id: string;
  label: string;
  icon: string; // lucide icon name
  description: string;
  guide: FirstAidGuide;
}

export interface HospitalLocation {
  id: string;
  name: string;
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  distance?: string;
  rating?: number;
  openNow?: boolean;
}
