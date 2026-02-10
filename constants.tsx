
import { User, PendingRequest, Transaction } from './types';

export const INITIAL_USERS: User[] = [
  { id: 1, name: "John Doe", email: "john@example.com", mobile: "01712345678", wallet: 1250.50, role: "user", status: "active", password: "password123", memberSince: "Jan 2024" },
  { id: 2, name: "Sarah Smith", email: "sarah@example.com", mobile: "01812345678", wallet: 540.00, role: "user", status: "active", password: "password123", memberSince: "Feb 2024" },
  { id: 3, name: "Mike Johnson", email: "mike@example.com", mobile: "01912345678", wallet: 0, role: "user", status: "pending", password: "password123", memberSince: "Mar 2024" },
  { id: 4, name: "Admin User", email: "admin@axcrypto.com", mobile: "01612345678", wallet: 3250.75, role: "admin", status: "active", password: "admin123", memberSince: "Jan 2023" }
];

export const INITIAL_REQUESTS: PendingRequest[] = [
  { 
    id: 1, 
    userId: 3, 
    type: "seller_application", 
    amount: 150000, 
    status: "pending",
    details: "New seller application with all documents submitted",
    submittedAt: "2024-01-25 10:30:00"
  },
  { 
    id: 2, 
    userId: 1, 
    type: "buy_request", 
    amount: 500, 
    status: "pending",
    details: "Buy 500 USDT via bKash",
    submittedAt: "2024-01-25 11:15:00"
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1, userId: 1, type: "credit", amount: 100, status: "completed", date: "2024-01-25 10:00:00", approvedBy: "Admin", notes: "Welcome bonus" },
  { id: 2, userId: 2, type: "debit", amount: 50, status: "completed", date: "2024-01-25 09:30:00", approvedBy: "Admin", notes: "Withdrawal" },
  { id: 3, userId: 1, type: "credit", amount: 500, status: "completed", date: "2024-01-25 08:15:00", approvedBy: "Admin", notes: "Buy order approved" }
];

export const PAYMENT_METHODS = [
  { name: 'bKash', number: '01917142350', icon: 'fa-bkash' },
  { name: 'Rocket', number: '01306755110', icon: 'fa-rocket' },
  { name: 'Nagad', number: '01865467486', icon: 'fa-money-bill-wave' },
  { name: 'Upay', number: '01865467486', icon: 'fa-mobile-alt' }
];
