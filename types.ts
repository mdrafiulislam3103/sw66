
export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'pending' | 'suspended';
export type RequestType = 'seller_application' | 'buy_request' | 'withdrawal';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type TransactionType = 'credit' | 'debit';
export type TransactionStatus = 'completed' | 'pending' | 'rejected';

export interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
  wallet: number;
  role: UserRole;
  status: UserStatus;
  password?: string;
  memberSince?: string;
}

export interface PendingRequest {
  id: number;
  userId: number;
  type: RequestType;
  amount: number;
  status: RequestStatus;
  details: string;
  submittedAt: string;
}

export interface Transaction {
  id: number;
  userId: number;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  date: string;
  approvedBy: string;
  notes: string;
}

export interface CryptoPrice {
  id: string;
  name: string;
  price: number;
  change: number;
}
