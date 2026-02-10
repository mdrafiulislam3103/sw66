
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  User, 
  PendingRequest, 
  Transaction, 
  CryptoPrice, 
  UserRole, 
  RequestType, 
  RequestStatus,
  TransactionType 
} from './types';
import { 
  INITIAL_USERS, 
  INITIAL_REQUESTS, 
  INITIAL_TRANSACTIONS, 
  PAYMENT_METHODS 
} from './constants';

// --- HELPER COMPONENTS ---

const Notification = ({ message, type, show }: { message: string; type: 'success' | 'error'; show: boolean }) => (
  <div className={`fixed top-5 right-5 z-[3000] px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 transition-transform duration-300 ${show ? 'translate-x-0' : 'translate-x-[150%]'} ${type === 'success' ? 'bg-success' : 'bg-danger'} text-white`}>
    <i className={`fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
    <span>{message}</span>
  </div>
);

// Fix: Making children optional in the prop type definition to satisfy TypeScript when children are passed via JSX nested elements.
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 px-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-darkCard w-full max-w-lg p-6 md:p-10 rounded-2xl relative max-h-[90vh] overflow-y-auto fade-in">
        <button className="absolute top-5 right-5 text-2xl text-textSecondary hover:text-white" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-6 text-center">{title}</h2>
        {children}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  // --- STATE ---
  const [view, setView] = useState<'public' | 'user' | 'admin'>('public');
  const [subView, setSubView] = useState<string>('overview');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(() => JSON.parse(localStorage.getItem('axcrypto_users') || JSON.stringify(INITIAL_USERS)));
  const [requests, setRequests] = useState<PendingRequest[]>(() => JSON.parse(localStorage.getItem('axcrypto_requests') || JSON.stringify(INITIAL_REQUESTS)));
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(localStorage.getItem('axcrypto_transactions') || JSON.stringify(INITIAL_TRANSACTIONS)));
  
  const [prices, setPrices] = useState<CryptoPrice[]>([
    { id: 'btc', name: 'Bitcoin (BTC)', price: 117926.99, change: 2.45 },
    { id: 'eth', name: 'Ethereum (ETH)', price: 3647.14, change: -0.59 },
    { id: 'bnb', name: 'BNB', price: 790.52, change: 4.25 },
  ]);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error'; show: boolean }>({ message: '', type: 'success', show: false });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Modals
  const [modals, setModals] = useState({
    login: false,
    buy: false,
    seller: false,
    adminAddFunds: false,
    viewRequest: false,
    viewUser: false,
  });
  
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('axcrypto_users', JSON.stringify(users));
    localStorage.setItem('axcrypto_requests', JSON.stringify(requests));
    localStorage.setItem('axcrypto_transactions', JSON.stringify(transactions));
  }, [users, requests, transactions]);

  // --- CRYPTO PRICE UPDATER ---
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => prev.map(p => {
        const change = (Math.random() - 0.5) * 0.5;
        return {
          ...p,
          price: p.price * (1 + change / 100),
          change: p.change + change
        };
      }));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // --- ACTION HANDLERS ---
  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type, show: true });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 5000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    const identifier = form[0].value;
    const password = form[1].value;

    const user = users.find(u => (u.email === identifier || u.mobile === identifier) && u.password === password);
    if (user) {
      if (user.status !== 'active') {
        showNotify('Account inactive. Contact support.', 'error');
        return;
      }
      setCurrentUser(user);
      setModals(m => ({ ...m, login: false }));
      setView(user.role === 'admin' ? 'admin' : 'user');
      setSubView('overview');
      showNotify(`Welcome back, ${user.name}!`);
    } else {
      showNotify('Invalid credentials!', 'error');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    const name = form[0].value;
    const email = form[1].value;
    const mobile = form[2].value;
    const password = form[3].value;
    const confirm = form[4].value;

    if (password !== confirm) return showNotify('Passwords mismatch!', 'error');
    if (users.find(u => u.email === email || u.mobile === mobile)) return showNotify('User already exists!', 'error');

    const newUser: User = {
      id: users.length + 1,
      name, email, mobile, password,
      wallet: 0,
      role: 'user',
      status: 'active',
      memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setModals(m => ({ ...m, login: false }));
    setView('user');
    setSubView('overview');
    showNotify('Account created successfully!');
  };

  const logout = () => {
    setCurrentUser(null);
    setView('public');
    showNotify('Logged out successfully');
  };

  const submitRequest = (type: RequestType, amount: number, details: string) => {
    if (!currentUser) return showNotify('Please login first!', 'error');
    const newReq: PendingRequest = {
      id: requests.length + 1,
      userId: currentUser.id,
      type,
      amount,
      status: 'pending',
      details,
      submittedAt: new Date().toISOString().replace('T', ' ').substr(0, 19)
    };
    setRequests(prev => [...prev, newReq]);
    showNotify('Request submitted for admin review!');
  };

  const handleAdminApprove = (reqId: number, amountToCredit: number) => {
    const req = requests.find(r => r.id === reqId);
    if (!req) return;

    setRequests(prev => prev.filter(r => r.id !== reqId));
    setUsers(prev => prev.map(u => u.id === req.userId ? { ...u, wallet: u.wallet + amountToCredit } : u));
    
    const newTrans: Transaction = {
      id: transactions.length + 1,
      userId: req.userId,
      type: 'credit',
      amount: amountToCredit,
      status: 'completed',
      date: new Date().toISOString().replace('T', ' ').substr(0, 19),
      approvedBy: currentUser?.name || 'Admin',
      notes: `Approved ${req.type.replace('_', ' ')}`
    };
    setTransactions(prev => [newTrans, ...prev]);
    showNotify('Request approved and wallet updated!');
    setModals(m => ({ ...m, viewRequest: false }));
  };

  const handleAdminReject = (reqId: number) => {
    const req = requests.find(r => r.id === reqId);
    if (!req) return;

    setRequests(prev => prev.filter(r => r.id !== reqId));
    const newTrans: Transaction = {
      id: transactions.length + 1,
      userId: req.userId,
      type: 'debit',
      amount: 0,
      status: 'rejected',
      date: new Date().toISOString().replace('T', ' ').substr(0, 19),
      approvedBy: currentUser?.name || 'Admin',
      notes: `Rejected ${req.type.replace('_', ' ')}`
    };
    setTransactions(prev => [newTrans, ...prev]);
    showNotify('Request rejected!');
    setModals(m => ({ ...m, viewRequest: false }));
  };

  // --- VIEW RENDERING ---

  const renderPublic = () => (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-20 text-center bg-[radial-gradient(circle_at_center,_rgba(102,126,234,0.1)_0%,_transparent_70%)]">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-primary-gradient bg-clip-text text-transparent fade-in">Buy & Sell Crypto Instantly</h1>
          <p className="text-lg md:text-xl text-textSecondary max-w-2xl mx-auto mb-10 fade-in">Secure P2P cryptocurrency trading platform. Buy and sell USDT, Bitcoin, and other cryptocurrencies with local payment methods in Bangladesh.</p>
          <div className="flex flex-wrap justify-center gap-4 fade-in">
            <button className="bg-primary-gradient px-8 py-3 rounded-lg font-bold hover:scale-105 transition" onClick={() => currentUser ? (setView('user'), setSubView('buy')) : setModals(m => ({ ...m, buy: true }))}>Buy Crypto Now</button>
            <button className="bg-white/10 border border-white/20 px-8 py-3 rounded-lg font-bold hover:bg-white/20 transition" onClick={() => document.getElementById('seller-section')?.scrollIntoView({ behavior: 'smooth' })}>Become a Seller</button>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-darkBg/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Today's Rates</h2>
          <div className="bg-primary-gradient rounded-3xl p-10 text-center max-w-lg mx-auto mb-12 shadow-2xl fade-in">
            <h3 className="uppercase text-sm opacity-80 mb-2">USD TO BDT RATE</h3>
            <div className="text-5xl font-black mb-4">$1 = 130 TK</div>
            <p className="text-xs opacity-70">Updated: Just now • Admin controlled rate</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {prices.map(p => (
              <div key={p.id} className="bg-darkCard p-6 rounded-2xl text-center border border-darkBorder fade-in">
                <div className="text-textSecondary text-sm mb-1">{p.name}</div>
                <div className="text-2xl font-bold mb-1">${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className={`text-sm font-semibold ${p.change >= 0 ? 'text-success' : 'text-danger'}`}>
                  {p.change >= 0 ? '+' : ''}{p.change.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Payment Methods</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PAYMENT_METHODS.map(m => (
              <div key={m.name} className="bg-darkCard/50 border border-darkBorder p-8 rounded-2xl text-center hover:border-success transition-all duration-300 fade-in">
                <div className="text-4xl text-success mb-4"><i className={`fas ${m.icon}`}></i></div>
                <h3 className="text-xl font-bold mb-2">{m.name}</h3>
                <p className="text-textSecondary text-sm mb-4">Instant {m.name} payments with 24/7 support</p>
                <div className="text-lg font-mono font-bold text-white">{m.number}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seller Application Section */}
      <section id="seller-section" className="py-16 bg-darkBg">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Become a Verified Seller</h2>
          <div className="bg-gradient-to-br from-warning/10 to-transparent border border-warning/30 rounded-3xl p-8 md:p-12 max-w-3xl mx-auto shadow-xl fade-in">
            <h2 className="text-2xl font-bold text-warning mb-4 text-center">Earn Money by Selling Crypto</h2>
            <p className="text-center mb-8">Join our network of verified sellers and start earning. We provide 24/7 support and secure platform.</p>
            <h3 className="text-xl font-bold text-warning mb-4">Requirements:</h3>
            <ul className="space-y-4 mb-10">
              {[
                'Security Deposit: 1.5 Lakh BDT (Negotiable)',
                'Bank Blank Cheque (Scanned Copy)',
                'Passport Copy',
                'NID Copy (Front & Back)',
                'Last Month Bank Statement',
                'WhatsApp: 01865467486 (For Verification)'
              ].map(req => (
                <li key={req} className="flex items-center gap-3 border-b border-white/5 pb-2">
                  <span className="text-success font-bold">✓</span> {req}
                </li>
              ))}
            </ul>
            <button 
              className="w-full bg-warning-gradient py-4 rounded-xl font-bold text-lg hover:scale-[1.02] transition"
              onClick={() => currentUser ? (setView('user'), setSubView('sell')) : setModals(m => ({ ...m, seller: true }))}
            >
              Apply as Seller Now
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-darkCard/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose axcrypto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: 'fa-shield-alt', title: '100% Secure', desc: 'Bank-level security with encrypted transactions and secure escrow system' },
              { icon: 'fa-bolt', title: 'Instant Processing', desc: 'Most transactions completed within 5-15 minutes with 24/7 support' },
              { icon: 'fa-headset', title: '24/7 Support', desc: 'Dedicated support team available round the clock via WhatsApp and email' },
              { icon: 'fa-handshake', title: 'P2P Trading', desc: 'Direct peer-to-peer trading with verified users and escrow protection' }
            ].map(f => (
              <div key={f.title} className="bg-darkCard p-8 rounded-2xl border border-darkBorder hover:border-primary transition fade-in">
                <div className="w-14 h-14 bg-primary-gradient rounded-xl flex items-center justify-center text-2xl mb-6 shadow-lg shadow-primary/20">
                  <i className={`fas ${f.icon}`}></i>
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-textSecondary text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-darkBg border-t border-darkBorder pt-16 pb-8">
        <div className="container mx-auto px-4 text-center">
          <div className="text-3xl font-black bg-primary-gradient bg-clip-text text-transparent mb-6">axcrypto</div>
          <div className="flex justify-center gap-6 mb-8 text-textSecondary text-sm flex-wrap">
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Contact</a>
            <a href="https://wa.me/8801865467486" className="text-success font-bold">WhatsApp: 01865467486</a>
          </div>
          <p className="text-xs text-textSecondary opacity-50">© 2024 axcrypto. All rights reserved. | P2P Crypto Trading Platform</p>
        </div>
      </footer>
    </div>
  );

  const renderUserDashboard = () => (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-darkCard border-r border-darkBorder sticky top-0 h-screen hidden md:block">
        <div className="p-8 text-center text-xl font-bold tracking-widest text-primary">MY WALLET</div>
        <nav className="flex flex-col">
          {[
            { id: 'overview', icon: 'fa-tachometer-alt', label: 'Overview' },
            { id: 'buy', icon: 'fa-shopping-cart', label: 'Buy Crypto' },
            { id: 'sell', icon: 'fa-user-tie', label: 'Become Seller' },
            { id: 'withdraw', icon: 'fa-arrow-up', label: 'Withdraw Funds' },
            { id: 'history', icon: 'fa-history', label: 'History' },
            { id: 'profile', icon: 'fa-user', label: 'Profile' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setSubView(item.id)}
              className={`flex items-center gap-4 px-6 py-4 transition-all duration-300 border-l-4 ${subView === item.id ? 'bg-primary/10 border-primary text-primary' : 'border-transparent text-textSecondary hover:bg-primary/5 hover:text-white'}`}
            >
              <i className={`fas ${item.icon} w-5`}></i>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
          <button onClick={logout} className="flex items-center gap-4 px-6 py-4 text-textSecondary hover:text-danger hover:bg-danger/10 transition-all border-l-4 border-transparent mt-auto mb-10">
            <i className="fas fa-sign-out-alt w-5"></i>
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-full overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold bg-primary-gradient bg-clip-text text-transparent capitalize">{subView}</h1>
          <div className="hidden md:flex items-center gap-6 bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20">
            <div>
              <div className="text-[10px] text-textSecondary uppercase tracking-wider">Account Balance</div>
              <div className="text-xl font-black text-primary">${currentUser?.wallet.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {subView === 'overview' && (
          <div className="fade-in">
            <div className="bg-primary-gradient p-10 rounded-3xl text-center mb-10 shadow-2xl relative overflow-hidden">
               {/* Decorative Circle */}
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
               <div className="relative z-10">
                 <div className="text-white/80 text-sm mb-2 font-medium">Available Balance</div>
                 <div className="text-5xl font-black mb-4">${currentUser?.wallet.toFixed(2)}</div>
                 <div className="text-xs text-white/70 mb-8">Account Status: <span className="text-success font-bold">ACTIVE</span></div>
                 <div className="flex flex-wrap justify-center gap-4">
                   <button className="bg-white text-primary px-8 py-3 rounded-xl font-bold shadow-lg" onClick={() => setSubView('buy')}>Buy Crypto</button>
                   <button className="bg-black/20 text-white border border-white/20 px-8 py-3 rounded-xl font-bold" onClick={() => setSubView('withdraw')}>Withdraw</button>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-darkCard p-8 rounded-3xl border border-darkBorder">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">Recent Transactions</h3>
                    <button onClick={() => setSubView('history')} className="text-primary text-sm hover:underline">View All</button>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="text-xs text-textSecondary text-left border-b border-white/5 uppercase tracking-wider">
                        <tr>
                          <th className="pb-4">Date</th>
                          <th className="pb-4">Notes</th>
                          <th className="pb-4">Amount</th>
                          <th className="pb-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {transactions.filter(t => t.userId === currentUser?.id).slice(0, 5).map(t => (
                          <tr key={t.id} className="text-sm">
                            <td className="py-4">{new Date(t.date).toLocaleDateString()}</td>
                            <td className="py-4 text-textSecondary">{t.notes}</td>
                            <td className={`py-4 font-bold ${t.type === 'credit' ? 'text-success' : 'text-danger'}`}>
                              {t.type === 'credit' ? '+' : '-'}${t.amount.toFixed(2)}
                            </td>
                            <td className="py-4"><span className={`px-2 py-1 rounded-full text-[10px] uppercase font-black ${t.status === 'completed' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>{t.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               </div>

               <div className="bg-darkCard p-8 rounded-3xl border border-darkBorder">
                 <h3 className="text-lg font-bold mb-6">Pending Requests</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="text-xs text-textSecondary text-left border-b border-white/5 uppercase tracking-wider">
                        <tr>
                          <th className="pb-4">Type</th>
                          <th className="pb-4">Amount</th>
                          <th className="pb-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {requests.filter(r => r.userId === currentUser?.id).map(r => (
                          <tr key={r.id} className="text-sm">
                            <td className="py-4 capitalize">{r.type.replace('_', ' ')}</td>
                            <td className="py-4 font-bold">${r.amount.toLocaleString()}</td>
                            <td className="py-4"><span className="px-2 py-1 rounded-full text-[10px] uppercase font-black bg-warning/20 text-warning">{r.status}</span></td>
                          </tr>
                        ))}
                        {requests.filter(r => r.userId === currentUser?.id).length === 0 && (
                          <tr><td colSpan={3} className="py-10 text-center text-textSecondary opacity-50">No pending requests</td></tr>
                        )}
                      </tbody>
                    </table>
                 </div>
               </div>
            </div>
          </div>
        )}

        {subView === 'buy' && (
          <div className="max-w-2xl mx-auto bg-darkCard p-8 rounded-3xl border border-darkBorder fade-in">
             <div className="bg-warning/10 border border-warning/30 p-6 rounded-2xl mb-8">
               <h4 className="text-warning font-bold flex items-center gap-2 mb-4"><i className="fas fa-info-circle"></i> Send Payment To:</h4>
               <div className="space-y-2 text-sm">
                 <p><span className="font-bold">01306755110</span> (Rocket)</p>
                 <p><span className="font-bold">01917142350</span> (bKash, Nagad)</p>
                 <p><span className="font-bold">01865467486</span> (Rocket, Nagad, Upay)</p>
               </div>
             </div>
             <form className="space-y-6" onSubmit={(e) => {
               e.preventDefault();
               const form = e.target as any;
               submitRequest('buy_request', parseFloat(form[1].value), `Buy via ${form[2].value}`);
               form.reset();
             }}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Select Crypto</label>
                  <select required className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 focus:border-primary outline-none">
                    <option value="USDT">USDT (Tether)</option>
                    <option value="BTC">Bitcoin (BTC)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Amount (USD)</label>
                  <input type="number" required placeholder="100" min="10" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 focus:border-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Payment Method</label>
                  <select required className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 focus:border-primary outline-none">
                    <option value="bkash">bKash</option>
                    <option value="rocket">Rocket</option>
                    <option value="nagad">Nagad</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Transaction ID</label>
                  <input type="text" required placeholder="TX123456" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 focus:border-primary outline-none" />
                </div>
                <button type="submit" className="w-full bg-primary-gradient py-4 rounded-xl font-bold shadow-xl">Submit Buy Request</button>
             </form>
          </div>
        )}

        {subView === 'withdraw' && (
          <div className="max-w-2xl mx-auto bg-darkCard p-8 rounded-3xl border border-darkBorder fade-in">
             <form className="space-y-6" onSubmit={(e) => {
               e.preventDefault();
               const form = e.target as any;
               const amount = parseFloat(form[0].value);
               if (amount > (currentUser?.wallet || 0)) return showNotify('Insufficient balance!', 'error');
               submitRequest('withdrawal', amount, `Withdrawal to ${form[2].value} via ${form[1].value}`);
               form.reset();
             }}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Amount (USD)</label>
                  <input type="number" required placeholder="50" min="10" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 focus:border-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Payment Method</label>
                  <select required className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 focus:border-primary outline-none">
                    <option value="bkash">bKash</option>
                    <option value="rocket">Rocket</option>
                    <option value="nagad">Nagad</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Account Number</label>
                  <input type="text" required placeholder="01XXXXXXXXX" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 focus:border-primary outline-none" />
                </div>
                <button type="submit" className="w-full bg-primary-gradient py-4 rounded-xl font-bold shadow-xl">Request Withdrawal</button>
             </form>
          </div>
        )}

        {subView === 'history' && (
           <div className="bg-darkCard p-8 rounded-3xl border border-darkBorder fade-in">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="text-xs text-textSecondary text-left border-b border-white/5 uppercase tracking-wider">
                    <tr>
                      <th className="pb-4">Date</th>
                      <th className="pb-4">Type</th>
                      <th className="pb-4">Amount</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.filter(t => t.userId === currentUser?.id).map(t => (
                      <tr key={t.id} className="text-sm">
                        <td className="py-4 whitespace-nowrap">{new Date(t.date).toLocaleString()}</td>
                        <td className="py-4 capitalize font-medium">{t.type}</td>
                        <td className={`py-4 font-bold ${t.type === 'credit' ? 'text-success' : 'text-danger'}`}>
                          {t.type === 'credit' ? '+' : '-'}${t.amount.toFixed(2)}
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-black ${t.status === 'completed' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-4 text-textSecondary">{t.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        )}

        {subView === 'profile' && (
          <div className="max-w-2xl mx-auto bg-darkCard p-10 rounded-3xl border border-darkBorder fade-in">
             <div className="flex items-center gap-6 mb-12">
                <div className="w-24 h-24 bg-primary-gradient rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/10 shadow-2xl">
                  {currentUser?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-black">{currentUser?.name}</h3>
                  <p className="text-textSecondary">Member since: {currentUser?.memberSince}</p>
                </div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: 'Email', value: currentUser?.email },
                  { label: 'Phone', value: currentUser?.mobile },
                  { label: 'Status', value: currentUser?.status, badge: true },
                  { label: 'Account Type', value: 'Verified User' }
                ].map(item => (
                  <div key={item.label} className="bg-white/5 p-6 rounded-2xl border border-white/5">
                    <div className="text-xs text-textSecondary uppercase tracking-widest mb-1">{item.label}</div>
                    <div className={`font-bold ${item.badge ? 'text-success uppercase' : ''}`}>{item.value}</div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-darkCard border-r border-darkBorder sticky top-0 h-screen hidden md:block">
        <div className="p-8 text-center text-xl font-black tracking-widest bg-primary-gradient bg-clip-text text-transparent">ADMIN</div>
        <nav className="flex flex-col">
          {[
            { id: 'overview', icon: 'fa-tachometer-alt', label: 'Dashboard' },
            { id: 'users', icon: 'fa-users', label: 'Users' },
            { id: 'requests', icon: 'fa-file-invoice-dollar', label: 'Requests', count: requests.length },
            { id: 'wallet', icon: 'fa-wallet', label: 'Wallet Mgmt' },
            { id: 'settings', icon: 'fa-cog', label: 'Settings' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setSubView(item.id)}
              className={`flex items-center gap-4 px-6 py-4 transition-all duration-300 border-l-4 ${subView === item.id ? 'bg-primary/10 border-primary text-primary' : 'border-transparent text-textSecondary hover:bg-primary/5 hover:text-white'}`}
            >
              <i className={`fas ${item.icon} w-5`}></i>
              <span className="font-medium">{item.label}</span>
              {item.count !== undefined && item.count > 0 && <span className="ml-auto bg-warning text-[10px] text-white font-black px-2 py-1 rounded-lg">{item.count}</span>}
            </button>
          ))}
          <button onClick={logout} className="flex items-center gap-4 px-6 py-4 text-textSecondary hover:text-danger hover:bg-danger/10 transition-all border-l-4 border-transparent mt-auto mb-10">
            <i className="fas fa-sign-out-alt w-5"></i>
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Admin Content */}
      <main className="flex-1 p-6 md:p-10 max-w-full overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black bg-primary-gradient bg-clip-text text-transparent capitalize">Admin {subView}</h1>
          <div className="hidden md:block bg-darkCard px-6 py-3 rounded-2xl border border-darkBorder shadow-xl">
            <div className="text-[10px] text-textSecondary uppercase tracking-widest">Total Managed Assets</div>
            <div className="text-xl font-black text-success">$125,678.90</div>
          </div>
        </div>

        {subView === 'overview' && (
          <div className="fade-in space-y-10">
            {/* Admin Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { label: 'Pending Requests', value: requests.length, border: 'border-warning' },
                 { label: 'Approved Today', value: '128', border: 'border-success' },
                 { label: 'Suspended Users', value: '3', border: 'border-danger' },
                 { label: 'Total Users', value: users.length, border: 'border-primary' }
               ].map(stat => (
                 <div key={stat.label} className={`bg-darkCard p-8 rounded-3xl border-l-8 ${stat.border} shadow-lg shadow-black/20`}>
                   <div className="text-3xl font-black mb-1">{stat.value}</div>
                   <div className="text-xs text-textSecondary uppercase tracking-widest">{stat.label}</div>
                 </div>
               ))}
            </div>

            {/* Pending Requests Admin Table */}
            <div className="bg-darkCard p-8 rounded-3xl border border-darkBorder shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-bold">Manage Pending User Requests</h3>
                 <button className="bg-success text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-success/20" onClick={() => setModals(m => ({ ...m, adminAddFunds: true }))}>+ Add Funds to User</button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full">
                    <thead className="text-[10px] text-textSecondary text-left border-b border-white/5 uppercase tracking-widest">
                      <tr>
                        <th className="pb-4">User</th>
                        <th className="pb-4">Request Type</th>
                        <th className="pb-4">Amount</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {requests.map(req => {
                        const user = users.find(u => u.id === req.userId);
                        return (
                          <tr key={req.id} className="text-sm">
                            <td className="py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-gradient rounded-full flex items-center justify-center font-bold">{user?.name.charAt(0)}</div>
                                <div>
                                  <div className="font-bold">{user?.name}</div>
                                  <div className="text-[10px] text-textSecondary">{user?.mobile}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-6 capitalize font-medium">{req.type.replace('_', ' ')}</td>
                            <td className="py-6 font-bold text-lg">${req.amount.toLocaleString()}</td>
                            <td className="py-6"><span className="px-3 py-1 bg-warning/20 text-warning text-[10px] font-black rounded-full uppercase">PENDING</span></td>
                            <td className="py-6">
                              <div className="flex gap-2">
                                <button className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition" onClick={() => { setSelectedRequestId(req.id); setCreditAmount(req.type === 'seller_application' ? 10 : 0); setModals(m => ({ ...m, viewRequest: true })) }}><i className="fas fa-eye"></i></button>
                                <button className="p-2 bg-success/20 text-success rounded-lg hover:bg-success hover:text-white transition" onClick={() => handleAdminApprove(req.id, req.type === 'seller_application' ? 10 : 0)}><i className="fas fa-check"></i></button>
                                <button className="p-2 bg-danger/20 text-danger rounded-lg hover:bg-danger hover:text-white transition" onClick={() => handleAdminReject(req.id)}><i className="fas fa-times"></i></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {requests.length === 0 && (
                        <tr><td colSpan={5} className="py-20 text-center text-textSecondary italic">No active requests to display</td></tr>
                      )}
                    </tbody>
                 </table>
              </div>
            </div>
          </div>
        )}

        {subView === 'users' && (
           <div className="bg-darkCard p-8 rounded-3xl border border-darkBorder fade-in">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="text-[10px] text-textSecondary text-left border-b border-white/5 uppercase tracking-widest">
                    <tr>
                      <th className="pb-4">ID</th>
                      <th className="pb-4">Name</th>
                      <th className="pb-4">Email</th>
                      <th className="pb-4">Mobile</th>
                      <th className="pb-4">Balance</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map(u => (
                      <tr key={u.id} className="text-sm">
                        <td className="py-6 text-textSecondary">#{u.id}</td>
                        <td className="py-6 font-bold">{u.name}</td>
                        <td className="py-6">{u.email}</td>
                        <td className="py-6 font-mono">{u.mobile}</td>
                        <td className="py-6 font-bold text-primary">${u.wallet.toFixed(2)}</td>
                        <td className="py-6"><span className={`px-2 py-1 rounded-full text-[10px] uppercase font-black ${u.status === 'active' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>{u.status}</span></td>
                        <td className="py-6">
                           <button className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition" onClick={() => { setSelectedUserId(u.id); setModals(m => ({ ...m, viewUser: true })) }}><i className="fas fa-eye"></i></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        )}

        {subView === 'settings' && (
           <div className="max-w-2xl mx-auto bg-darkCard p-10 rounded-3xl border border-darkBorder fade-in">
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); showNotify('System settings saved!'); }}>
                <div className="space-y-2">
                   <label className="text-xs uppercase tracking-widest font-bold text-textSecondary">USD TO BDT Rate</label>
                   <input type="number" defaultValue="130" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 focus:border-primary outline-none" />
                </div>
                <div className="space-y-2">
                   <label className="text-xs uppercase tracking-widest font-bold text-textSecondary">Commission Rate (%)</label>
                   <input type="number" defaultValue="2.5" step="0.1" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 focus:border-primary outline-none" />
                </div>
                <div className="space-y-2">
                   <label className="text-xs uppercase tracking-widest font-bold text-textSecondary">Min Withdrawal (USD)</label>
                   <input type="number" defaultValue="20" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 focus:border-primary outline-none" />
                </div>
                <button type="submit" className="w-full bg-primary-gradient py-4 rounded-xl font-bold shadow-xl">Save Configuration</button>
              </form>
           </div>
        )}
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-darkBg text-white selection:bg-primary selection:text-white">
      <Notification message={notification.message} type={notification.type} show={notification.show} />

      {/* Shared Header (Visible only when not in Dashboard) */}
      {view === 'public' && (
        <header className="fixed top-0 w-full z-[1000] bg-darkCard/80 backdrop-blur-xl border-b border-darkBorder shadow-lg">
          <div className="container mx-auto px-4 h-20 flex items-center justify-between">
            <a href="#" className="text-3xl font-black bg-primary-gradient bg-clip-text text-transparent hover:scale-105 transition" onClick={() => setView('public')}>axcrypto</a>
            
            <nav className="hidden md:flex items-center gap-10">
              {['Home', 'How It Works', 'Features', 'Become Seller', 'Contact'].map(link => (
                <a key={link} href="#" className="text-textSecondary font-semibold hover:text-white transition" onClick={() => { setView('public'); if (link === 'Become Seller') document.getElementById('seller-section')?.scrollIntoView({ behavior: 'smooth' }); }}>{link}</a>
              ))}
              <button 
                className="bg-success-gradient px-6 py-2 rounded-full font-bold shadow-lg shadow-success/20 flex items-center gap-2 hover:scale-105 transition"
                onClick={() => setModals(prev => ({ ...prev, login: true }))}
              >
                <i className="fas fa-user"></i> Login / Register
              </button>
            </nav>

            <button className="md:hidden text-2xl" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>

          {/* Mobile Menu */}
          <div className={`md:hidden absolute top-20 left-0 w-full bg-darkCard border-b border-darkBorder flex flex-col p-6 gap-6 transition-all duration-300 shadow-2xl ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
             {['Home', 'How It Works', 'Features', 'Become Seller', 'Contact'].map(link => (
                <a key={link} href="#" className="text-xl font-bold" onClick={() => { setMobileMenuOpen(false); setView('public'); if (link === 'Become Seller') document.getElementById('seller-section')?.scrollIntoView({ behavior: 'smooth' }); }}>{link}</a>
             ))}
             <button className="bg-success-gradient py-4 rounded-xl font-bold" onClick={() => { setMobileMenuOpen(false); setModals(prev => ({ ...prev, login: true })); }}>Login / Register</button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      {view === 'public' && renderPublic()}
      {view === 'user' && renderUserDashboard()}
      {view === 'admin' && renderAdminDashboard()}

      {/* Modals */}
      <Modal isOpen={modals.login} title="Welcome to axcrypto" onClose={() => setModals(m => ({ ...m, login: false }))}>
        <div className="flex border-b border-darkBorder mb-8">
          <button className={`flex-1 py-3 font-bold border-b-2 transition ${authTab === 'login' ? 'border-primary text-primary' : 'border-transparent text-textSecondary'}`} onClick={() => setAuthTab('login')}>Login</button>
          <button className={`flex-1 py-3 font-bold border-b-2 transition ${authTab === 'register' ? 'border-primary text-primary' : 'border-transparent text-textSecondary'}`} onClick={() => setAuthTab('register')}>Register</button>
        </div>
        {authTab === 'login' ? (
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-textSecondary">Email or Mobile</label>
              <input type="text" required placeholder="admin@axcrypto.com" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 focus:border-primary outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-textSecondary">Password</label>
              <input type="password" required placeholder="admin123" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 focus:border-primary outline-none" />
            </div>
            <button type="submit" className="w-full bg-primary-gradient py-4 rounded-xl font-bold shadow-xl mt-4">Login to Account</button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleRegister}>
            <input type="text" required placeholder="Full Name" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 focus:border-primary outline-none" />
            <input type="email" required placeholder="Email Address" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 focus:border-primary outline-none" />
            <input type="tel" required placeholder="Mobile Number (01XXXXXXXXX)" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 focus:border-primary outline-none" />
            <input type="password" required placeholder="Create Password" title="Min 6 characters" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 focus:border-primary outline-none" />
            <input type="password" required placeholder="Confirm Password" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 focus:border-primary outline-none" />
            <button type="submit" className="w-full bg-primary-gradient py-4 rounded-xl font-bold shadow-xl mt-4">Create Account</button>
          </form>
        )}
      </Modal>

      <Modal isOpen={modals.buy} title="Buy Crypto Request" onClose={() => setModals(m => ({ ...m, buy: false }))}>
         <div className="bg-success/10 border border-success/30 p-6 rounded-2xl mb-8">
            <h4 className="text-success font-bold flex items-center gap-2 mb-2"><i className="fas fa-info-circle"></i> Instructions</h4>
            <p className="text-xs opacity-80">Send your payment to one of our merchant numbers below and submit this form with the Transaction ID.</p>
            <div className="mt-4 space-y-1 text-sm font-bold">
               <p>bKash/Nagad: 01917142350</p>
               <p>Rocket/Upay: 01306755110</p>
            </div>
         </div>
         <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const f = e.target as any; submitRequest('buy_request', parseFloat(f[1].value), `Buy via ${f[2].value}`); setModals(m => ({ ...m, buy: false })); }}>
           <select required className="w-full bg-white/5 border border-darkBorder rounded-xl p-4"><option value="USDT">USDT</option><option value="BTC">BTC</option></select>
           <input type="number" required placeholder="Amount (USD)" min="10" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4" />
           <select required className="w-full bg-white/5 border border-darkBorder rounded-xl p-4"><option value="bkash">bKash</option><option value="nagad">Nagad</option></select>
           <input type="text" required placeholder="Your Sender Number" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4" />
           <input type="text" required placeholder="Transaction ID" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4" />
           <button type="submit" className="w-full bg-primary-gradient py-4 rounded-xl font-bold">Submit Buy Request</button>
         </form>
      </Modal>

      <Modal isOpen={modals.seller} title="Seller Application" onClose={() => setModals(m => ({ ...m, seller: false }))}>
         <div className="bg-warning/10 border border-warning/30 p-6 rounded-2xl mb-6">
            <h4 className="text-warning font-bold mb-2">Notice</h4>
            <p className="text-xs opacity-80">Requires 1.5 Lakh BDT Security Deposit. We will verify documents on WhatsApp.</p>
         </div>
         <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submitRequest('seller_application', 150000, 'Seller application from public page'); setModals(m => ({ ...m, seller: false })); }}>
            <input type="tel" required placeholder="WhatsApp Number" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4" />
            <div className="space-y-2">
               <label className="text-xs uppercase font-bold text-textSecondary">Upload Documents (PDF/JPG)</label>
               <input type="file" required className="w-full text-sm file:bg-primary file:border-none file:px-4 file:py-2 file:rounded-lg file:text-white" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none py-2">
              <input type="checkbox" required className="w-5 h-5 accent-primary" />
              <span className="text-xs">I agree to the security deposit and terms</span>
            </label>
            <button type="submit" className="w-full bg-warning-gradient py-4 rounded-xl font-bold">Submit Application</button>
         </form>
      </Modal>

      <Modal isOpen={modals.viewRequest} title="Request Details" onClose={() => setModals(m => ({ ...m, viewRequest: false }))}>
         {selectedRequestId && (() => {
           const req = requests.find(r => r.id === selectedRequestId);
           const user = users.find(u => u.id === req?.userId);
           return (
             <div className="space-y-6">
               <div className="bg-white/5 p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-textSecondary">User</span>
                    <span className="font-bold">{user?.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-textSecondary">Type</span>
                    <span className="font-bold capitalize">{req?.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-textSecondary">Amount</span>
                    <span className="font-bold">${req?.amount.toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-textSecondary italic">"{req?.details}"</div>
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold">Credit Amount to Wallet (USD)</label>
                 <input type="number" value={creditAmount} onChange={(e) => setCreditAmount(parseFloat(e.target.value))} className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 outline-none" />
               </div>
               <div className="flex gap-4">
                 <button className="flex-1 bg-success py-4 rounded-xl font-bold" onClick={() => handleAdminApprove(selectedRequestId, creditAmount)}>Approve & Credit</button>
                 <button className="flex-1 bg-danger py-4 rounded-xl font-bold" onClick={() => handleAdminReject(selectedRequestId)}>Reject</button>
               </div>
             </div>
           );
         })()}
      </Modal>

      <Modal isOpen={modals.viewUser} title="User Profile Details" onClose={() => setModals(m => ({ ...m, viewUser: false }))}>
         {selectedUserId && (() => {
           const u = users.find(user => user.id === selectedUserId);
           return (
             <div className="space-y-8">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary-gradient rounded-full flex items-center justify-center text-2xl font-bold">{u?.name.charAt(0)}</div>
                  <div>
                    <h3 className="text-xl font-bold">{u?.name}</h3>
                    <p className="text-textSecondary text-sm">{u?.email}</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/5 p-4 rounded-xl">
                    <div className="text-textSecondary text-xs uppercase mb-1">Mobile</div>
                    <div className="font-bold">{u?.mobile}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl">
                    <div className="text-textSecondary text-xs uppercase mb-1">Wallet Balance</div>
                    <div className="font-bold text-success">${u?.wallet.toFixed(2)}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl">
                    <div className="text-textSecondary text-xs uppercase mb-1">Status</div>
                    <div className="font-black uppercase text-primary">{u?.status}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl">
                    <div className="text-textSecondary text-xs uppercase mb-1">Role</div>
                    <div className="font-bold capitalize">{u?.role}</div>
                  </div>
               </div>
               <button className="w-full bg-white/10 py-4 rounded-xl font-bold hover:bg-white/20" onClick={() => setModals(m => ({ ...m, viewUser: false }))}>Close</button>
             </div>
           );
         })()}
      </Modal>

      <Modal isOpen={modals.adminAddFunds} title="Add Funds Manual" onClose={() => setModals(m => ({ ...m, adminAddFunds: false }))}>
         <form className="space-y-6" onSubmit={(e) => {
           e.preventDefault();
           const form = e.target as any;
           const uId = parseInt(form[0].value);
           const amt = parseFloat(form[1].value);
           const nts = form[2].value;
           
           setUsers(prev => prev.map(u => u.id === uId ? { ...u, wallet: u.wallet + amt } : u));
           const newTrans: Transaction = {
             id: transactions.length + 1,
             userId: uId,
             type: 'credit',
             amount: amt,
             status: 'completed',
             date: new Date().toISOString().replace('T', ' ').substr(0, 19),
             approvedBy: currentUser?.name || 'Admin',
             notes: `Admin Adjustment: ${nts}`
           };
           setTransactions(prev => [newTrans, ...prev]);
           showNotify(`Added $${amt} to user wallet!`);
           setModals(m => ({ ...m, adminAddFunds: false }));
         }}>
            <select required className="w-full bg-white/5 border border-darkBorder rounded-xl p-4">
              <option value="">Select User</option>
              {users.filter(u => u.role === 'user').map(u => <option key={u.id} value={u.id}>{u.name} ({u.mobile})</option>)}
            </select>
            <input type="number" required placeholder="Amount (USD)" min="1" step="0.01" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4" />
            <textarea placeholder="Notes" className="w-full bg-white/5 border border-darkBorder rounded-xl p-4 h-24"></textarea>
            <button type="submit" className="w-full bg-success py-4 rounded-xl font-bold shadow-xl">Add Funds Now</button>
         </form>
      </Modal>
    </div>
  );
}
