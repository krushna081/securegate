export type UserRole = 'guard' | 'resident' | 'admin';
export type VisitorStatus = 'pending' | 'approved' | 'rejected';
export type VisitorType =
  | 'guest' | 'delivery' | 'maid' | 'electrician'
  | 'plumber' | 'courier' | 'technician' | 'driver' | 'maintenance';

export interface User {
  _id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  phoneNumber2?: string;
  photoUrl?: string;
  role: UserRole;
  societyId?: string | { _id: string; name: string; address?: string };
  flatId?: string | { _id: string; flatNumber: string; blockName: string };
  gateNumber?: string;
}

export interface Society {
  _id: string;
  name: string;
  address: string;
}

export interface Flat {
  _id: string;
  societyId: string;
  flatNumber: string;
  blockName: string;
  residentId?: { _id: string; fullName: string; email: string; phoneNumber?: string } | null;
}

export interface Visitor {
  _id: string;
  visitorName: string;
  visitorType: string;
  photoUrl?: string;
  phoneNumber?: string;
  societyId: string;
  flatId: { _id: string; flatNumber: string; blockName: string };
  guardId: { _id: string; fullName: string; email: string; phoneNumber?: string };
  residentId?: { _id: string; fullName: string; email: string; phoneNumber?: string } | null;
  status: VisitorStatus;
  notes?: string;
  vehicleNumber?: string;
  createdAt: string;
}

export interface PreApproval {
  _id: string;
  residentId: { _id: string; fullName: string; email: string; phoneNumber?: string };
  flatId: { _id: string; flatNumber: string; blockName: string };
  guestName: string;
  numberOfPeople?: number;
  vehicleType?: 'none' | '2-wheeler' | '4-wheeler';
  vehicleNumber?: string;
  expectedTime?: string;
  notes?: string;
  status: 'expected' | 'approved' | 'arrived';
  createdAt: string;
}

export interface Meeting {
  _id: string;
  societyId: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location?: string;
  createdBy: { _id: string; fullName: string };
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface PushNotificationData {
  type: 'visitor-approval' | 'visitor-catchup';
  visitorId?: string;
  visitorName?: string;
  flatNumber?: string;
  visitors?: Array<{
    visitorId: string;
    visitorName: string;
    flatNumber: string;
    createdAt: string;
  }>;
}
