// ===================================================
// SubPay — App Logic v1.0
// ===================================================

// ========== State ==========
const state = {
  currentUser:          null,
  rooms:                [],
  notifications:        [],
  currentRoom:          null,
  selectedPaymentMethod:'instapay',
  otpInterval:          null,
  otpEventSource:       null,
  otpPollInterval:      null,
  authToken:            localStorage.getItem('subpay_token') || '',
  memberToRemove:       null,
  prevScreen:           null,
};

const API_BASE = `${location.origin}/api`;

// ========== Demo Data ==========
const DEMO_USER = {
  id: 'u1',
  name: 'محمد أحمد',
  email: 'm.ahmed@email.com',
  phone: '+201012345678',
  avatar: 'م',
};

const DEMO_ROOMS = [
  {
    id: 'r1',
    name: 'ChatGPT Plus',
    icon: '🤖',
    iconClass: 'chatgpt',
    service: 'ChatGPT Plus',
    price: 49,
    currency: 'جنيه',
    members: 5,
    maxMembers: 5,
    isPaid: true,
    isAdmin: false,
    username: 'group_chatgpt@mail.com',
    password: 'P@ssw0rd!123',
    renewDate: '1 يوليو 2025',
    notifications: [
      { id:'rn1', title:'تم تجديد الاشتراك', body:'تم تجديد ChatGPT Plus للشهر الجاري بنجاح.', time:'منذ يومين', type:'success', unread:false },
      { id:'rn2', title:'OTP جديد متاح',     body:'كود تحقق جديد أُنشئ. تحقق من تبويب بيانات الاشتراك.', time:'منذ ساعة', type:'info', unread:true },
    ],
    membersList: [
      { id:'m1', name:'أحمد محمود',  email:'ahmed@mail.com',      role:'owner',  paid:true,  avatar:'أ' },
      { id:'m2', name:'محمد أحمد',   email:'m.ahmed@email.com',   role:'member', paid:true,  avatar:'م' },
      { id:'m3', name:'سارة خالد',   email:'sara@mail.com',       role:'member', paid:true,  avatar:'س' },
      { id:'m4', name:'عمر علي',     email:'omar@mail.com',       role:'member', paid:false, avatar:'ع' },
      { id:'m5', name:'ريم حسن',     email:'reem@mail.com',       role:'member', paid:true,  avatar:'ر' },
    ],
  },
  {
    id: 'r2',
    name: 'Netflix',
    icon: '🎬',
    iconClass: 'netflix',
    service: 'Netflix Standard',
    price: 99,
    currency: 'جنيه',
    members: 4,
    maxMembers: 4,
    isPaid: false,
    isAdmin: true,
    username: 'netflix_group@mail.com',
    password: 'Netflix#2025!',
    renewDate: '15 يونيو 2025',
    notifications: [
      { id:'rn3', title:'تذكير بالدفع', body:'موعد تجديد Netflix يقترب. يرجى الدفع قبل 15 يونيو لتجنب قطع الخدمة.', time:'منذ 3 أيام', type:'warning', unread:true },
    ],
    membersList: [
      { id:'m6', name:'محمد أحمد',  email:'m.ahmed@email.com', role:'admin',  paid:false, avatar:'م' },
      { id:'m7', name:'لينا سامي',  email:'lena@mail.com',     role:'member', paid:true,  avatar:'ل' },
      { id:'m8', name:'خالد يوسف', email:'khaled@mail.com',   role:'member', paid:false, avatar:'خ' },
      { id:'m9', name:'منى طارق',  email:'mona@mail.com',     role:'member', paid:true,  avatar:'ن' },
    ],
  },
  {
    id: 'r3',
    name: 'Spotify',
    icon: '🎵',
    iconClass: 'default',
    service: 'Spotify Premium',
    price: 35,
    currency: 'جنيه',
    members: 3,
    maxMembers: 6,
    isPaid: true,
    isAdmin: false,
    username: 'spotify_fam@mail.com',
    password: 'Sp0tify$2025',
    renewDate: '20 يونيو 2025',
    notifications: [],
    membersList: [
      { id:'m10', name:'يوسف حمدي',  email:'youssef@mail.com', role:'owner',  paid:true, avatar:'ي' },
      { id:'m11', name:'محمد أحمد',  email:'m.ahmed@email.com',role:'member', paid:true, avatar:'م' },
      { id:'m12', name:'هدى مصطفى', email:'hoda@mail.com',    role:'member', paid:true, avatar:'ه' },
    ],
  },
];

const DEMO_NOTIFICATIONS = [
  { id:'gn1', title:'مرحباً بك في SubPay 🎉',      body:'تم تفعيل حسابك بنجاح. ابدأ بالانضمام لروم أو إنشاء روم جديدة.',             time:'منذ أسبوع',  type:'success', unread:false },
  { id:'gn2', title:'تذكير: Netflix غير مدفوع',   body:'اشتراك Netflix يستحق الدفع قبل 15 يونيو. اضغط لدفع الآن.',                   time:'منذ 3 أيام', type:'warning', unread:true  },
  { id:'gn3', title:'OTP جديد — ChatGPT Plus',    body:'كود تحقق جديد متاح في روم ChatGPT Plus.',                                     time:'منذ ساعة',   type:'info',    unread:true  },
];

const DEMO_HISTORY = [
  { id:'h1', room:'ChatGPT Plus',     amount:49,  date:'1 مايو 2025',    method:'InstaPay',        status:'success' },
  { id:'h2', room:'Spotify Premium',  amount:35,  date:'20 أبريل 2025',  method:'المحفظة',          status:'success' },
  { id:'h3', room:'Netflix Standard', amount:99,  date:'15 أبريل 2025',  method:'بطاقة بنكية',     status:'failed'  },
  { id:'h4', room:'ChatGPT Plus',     amount:49,  date:'1 أبريل 2025',   method:'InstaPay',        status:'success' },
];

const FAQ_ITEMS = [
  { q:'ما هو SubPay؟',
    a:'SubPay منصة لإدارة الاشتراكات المشتركة. يمكنك إنشاء "روم" لأي خدمة اشتراك وإضافة أعضاء يتشاركون معك تكلفة الاشتراك وبيانات الوصول.' },
  { q:'كيف أنضم لروم؟',
    a:'اضغط على زر "انضم لروم" في الصفحة الرئيسية وأدخل كود الدعوة الذي أرسله لك الأدمن. الكود عبارة عن 4-12 حرف/رقم.' },
  { q:'ماذا يحدث لو لم أدفع في الموعد؟',
    a:'سيتم إيقاف وصولك لبيانات الروم (كلمة المرور والـ OTP) تلقائياً حتى تُجدّد اشتراكك. باقي الأعضاء لن يتأثروا.' },
  { q:'هل بياناتي آمنة؟',
    a:'نعم، SubPay يستخدم تشفير SSL لجميع الاتصالات. البيانات الحساسة مشفرة في قاعدة البيانات. أي وصول لبيانات الروم قد يُسجَّل لأغراض أمنية.' },
  { q:'ما طرق الدفع المتاحة؟',
    a:'InstaPay، المحفظة الإلكترونية (Vodafone Cash / Orange Cash)، والبطاقة البنكية (Visa / Mastercard).' },
  { q:'كيف أتواصل مع الدعم؟',
    a:'يمكنك التواصل معنا عبر البريد الإلكتروني support@subpay.app أو من خلال قسم المساعدة داخل التطبيق. نرد خلال 24 ساعة.' },
  { q:'هل يمكنني إنشاء روم جديدة؟',
    a:'إنشاء الرومات متاح حالياً للمشتركين في خطة الأدمن. تواصل معنا عبر الدعم لمعرفة التفاصيل.' },
];

// ===================================================
// Backend API + realtime OTP
// ===================================================
async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (state.authToken) headers.Authorization = `Bearer ${state.authToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API error ${res.status}`);
  }
  return res.json();
}

function roomIconFor(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('chatgpt') || lower.includes('gpt')) return { icon: '🤖', iconClass: 'chatgpt' };
  if (lower.includes('netflix')) return { icon: '🎬', iconClass: 'netflix' };
  if (lower.includes('spotify')) return { icon: '🎵', iconClass: 'default' };
  return { icon: '💳', iconClass: 'default' };
}

function normalizeBackendRoom(room) {
  const icon = roomIconFor(room.name);
  const members = Array.isArray(room.members) ? room.members : [];
  const messages = Array.isArray(room.messages) ? room.messages : [];
  const latestOtpMessage = messages.find((message) => message.otp);

  return {
    id: room.id,
    backendRoom: true,
    name: room.name,
    service: room.name,
    code: room.code,
    ...icon,
    price: room.monthlyPrice || 0,
    currency: 'جنيه',
    members: members.length,
    maxMembers: Math.max(members.length, 5),
    isPaid: true,
    isAdmin: ['owner', 'admin'].includes(room.role),
    username: room.subscriptionEmail || room.inboundEmail || '',
    password: room.password || '',
    renewDate: room.paidUntil || 'غير محدد',
    latestOtp: latestOtpMessage?.otp || null,
    latestOtpExpiresAt: latestOtpMessage?.otpExpiresAt || null,
    notifications: messages.slice(0, 10).map((message) => ({
      id: message.id,
      title: message.otp ? `OTP جديد — ${room.name}` : (message.subject || 'رسالة واردة'),
      body: message.otp ? `كود التحقق الجديد: ${message.otp}` : (message.body || ''),
      time: formatRelativeTime(message.createdAt),
      type: message.otp ? 'info' : 'success',
      unread: false,
    })),
    membersList: members.map((member) => ({
      id: member.id,
      name: member.user?.name || 'عضو',
      email: member.user?.email || '',
      role: member.role,
      paid: Boolean(member.paidUntil),
      avatar: member.user?.avatar || (member.user?.name || 'S').charAt(0),
    })),
  };
}

function formatRelativeTime(ts) {
  const diff = Math.max(0, Date.now() - Number(ts || Date.now()));
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'الآن';
  if (min < 60) return `منذ ${min} دقيقة`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${Math.floor(hours / 24)} يوم`;
}

async function syncBackendRooms() {
  try {
    const data = await apiFetch('/rooms');
    const rooms = (data.rooms || []).map(normalizeBackendRoom);
    if (!rooms.length) return;
    state.rooms = rooms;
    renderRoomsList();
    if (state.currentRoom) {
      const updated = state.rooms.find((room) => room.id === state.currentRoom.id);
      if (updated) state.currentRoom = updated;
    }
  } catch (error) {
    console.warn('Backend rooms sync skipped:', error.message);
  }
}

async function loginWithBackend(email, password, name) {
  try {
    const result = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    state.authToken = result.token;
    localStorage.setItem('subpay_token', result.token);
    const user = {
      id: result.user.id,
      name: result.user.name || name || email,
      email: result.user.email,
      phone: result.user.phone || '',
      avatar: result.user.avatar || (result.user.name || 'S').charAt(0),
      role: result.user.role || 'member',
    };
    const roomsData = await apiFetch('/rooms');
    return { user, rooms: (roomsData.rooms || []).map(normalizeBackendRoom) };
  } catch (error) {
    console.warn('Backend login failed, using demo data:', error.message);
    return null;
  }
}

function closeOtpRealtime() {
  if (state.otpEventSource) {
    state.otpEventSource.close();
    state.otpEventSource = null;
  }
  if (state.otpPollInterval) {
    clearInterval(state.otpPollInterval);
    state.otpPollInterval = null;
  }
}

function applyOtpMessage(message) {
  if (!message || !message.otp) return;
  const codeEl = document.getElementById('otp-code');
  const timeEl = document.getElementById('otp-time-left');
  const barEl = document.getElementById('otp-bar');
  if (codeEl) codeEl.textContent = message.otp;
  if (timeEl) timeEl.textContent = 'وصل الآن';
  if (barEl) {
    barEl.style.width = '100%';
    barEl.style.background = 'var(--success)';
  }

  if (state.currentRoom) {
    state.currentRoom.latestOtp = message.otp;
    state.currentRoom.latestOtpExpiresAt = message.otpExpiresAt;
    state.currentRoom.notifications = [
      {
        id: message.id,
        title: `OTP جديد — ${state.currentRoom.name}`,
        body: `كود التحقق الجديد: ${message.otp}`,
        time: 'الآن',
        type: 'info',
        unread: true,
      },
      ...(state.currentRoom.notifications || []),
    ];
    renderRoomNotifications(state.currentRoom);
  }
  showToast(`OTP جديد: ${message.otp}`, 'success');
}

async function loadLatestBackendOtp(room) {
  try {
    const data = await apiFetch(`/rooms/${room.id}/messages`);
    const latest = (data.messages || []).find((message) => message.otp);
    if (latest) applyOtpMessage(latest);
  } catch (error) {
    console.warn('Latest OTP load failed:', error.message);
  }
}

async function pollRoomOtpNow(room) {
  if (!room?.backendRoom) return;
  try {
    const data = await apiFetch(`/rooms/${room.id}/imap/poll`, { method: 'POST' });
    const latest = (data.created || []).find((message) => message.otp);
    if (latest) applyOtpMessage(latest);
  } catch (error) {
    console.warn('Room OTP poll failed:', error.message);
  }
}

function startRoomOtpPolling(room) {
  if (!room?.backendRoom) return;
  pollRoomOtpNow(room);
  state.otpPollInterval = setInterval(() => {
    if (!state.currentRoom || state.currentRoom.id !== room.id) {
      closeOtpRealtime();
      return;
    }
    pollRoomOtpNow(room);
  }, 5000);
}

function connectRoomOtpRealtime(room) {
  closeOtpRealtime();
  if (!room?.backendRoom) return;
  if (!window.EventSource) {
    startRoomOtpPolling(room);
    return;
  }
  state.otpEventSource = new EventSource(`${API_BASE}/rooms/${room.id}/events`);
  state.otpEventSource.addEventListener('message', (event) => {
    applyOtpMessage(JSON.parse(event.data));
  });
  state.otpEventSource.onerror = () => {
    const timeEl = document.getElementById('otp-time-left');
    if (timeEl) timeEl.textContent = 'إعادة الاتصال...';
  };
  startRoomOtpPolling(room);
}

// ===================================================
// Navigation
// ===================================================
function navigateTo(screenId) {
  if (screenId !== 'screen-room') closeOtpRealtime();
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => s.classList.remove('active'));

  const target = document.getElementById(screenId);
  if (!target) return;

  target.classList.add('active');

  // Reset scroll positions
  target.scrollTop = 0;
  const sb = target.querySelector('.screen-body');
  if (sb) sb.scrollTop = 0;
  const sa = target.querySelector('.scroll-area');
  if (sa) sa.scrollTop = 0;
}

function setActiveNav(navKey) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.nav === navKey);
  });
}

// ===================================================
// Auth — Login
// ===================================================
async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value.trim();
  let valid = true;

  clearFieldError('login-email');
  clearFieldError('login-password');

  if (!email) {
    showFieldError('login-email', 'البريد الإلكتروني مطلوب'); valid = false;
  } else if (!isValidEmail(email)) {
    showFieldError('login-email', 'بريد إلكتروني غير صحيح'); valid = false;
  }
  if (!pass) {
    showFieldError('login-password', 'كلمة المرور مطلوبة'); valid = false;
  }
  if (!valid) return;

  const btn = document.getElementById('btn-login');
  setButtonLoading(btn, true);

    const backendSession = await loginWithBackend(email, pass, DEMO_USER.name);
  setTimeout(() => {
    setButtonLoading(btn, false);
    if (backendSession) {
      loginSuccess(backendSession.user, backendSession.rooms.length ? backendSession.rooms : DEMO_ROOMS, DEMO_NOTIFICATIONS);
    } else {
      loginSuccess(DEMO_USER, DEMO_ROOMS, DEMO_NOTIFICATIONS);
    }
    showToast('أهلاً بك في SubPay ✅', 'success');
  }, 300);
}

function handleGoogleLogin() {
  showToast('جاري الاتصال بـ Google...', 'info');
  setTimeout(() => {
    loginSuccess(DEMO_USER, DEMO_ROOMS, DEMO_NOTIFICATIONS);
    showToast('تم تسجيل الدخول بـ Google ✅', 'success');
  }, 1500);
}

function loginSuccess(user, rooms, notifs) {
  state.currentUser   = user;
  state.rooms         = JSON.parse(JSON.stringify(rooms)); // deep copy
  state.notifications = JSON.parse(JSON.stringify(notifs));
  loadHomeScreen();
  navigateTo('screen-home');
  setActiveNav('home');
  syncBackendRooms();
}

// ===================================================
// Auth — Register
// ===================================================
function handleRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-password').value.trim();

  if (!name || !phone || !email || !pass) {
    showToast('يرجى تعبئة جميع الحقول', 'error'); return;
  }
  if (!isValidEmail(email)) {
    showToast('بريد إلكتروني غير صحيح', 'error'); return;
  }
  if (pass.length < 6) {
    showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error'); return;
  }

  const btn = document.getElementById('btn-register');
  setButtonLoading(btn, true);

  setTimeout(() => {
    setButtonLoading(btn, false);
    const newUser = { id:'u_new', name, email, phone, avatar: name.charAt(0) };
    loginSuccess(newUser, [], [DEMO_NOTIFICATIONS[0]]);
    showToast('تم إنشاء حسابك بنجاح 🎉', 'success');
  }, 1200);
}

// ===================================================
// Auth — Forgot Password (3-step flow)
// ===================================================
let forgotStep = 0;

function handleForgotSend() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email || !isValidEmail(email)) {
    showToast('يرجى إدخال بريد إلكتروني صحيح', 'error'); return;
  }
  showToast('تم إرسال كود التحقق ✉️', 'success');
  setForgotStep(1);
}

function handleForgotVerify() {
  const code = document.getElementById('forgot-code').value.trim();
  if (code.length < 4) {
    showToast('يرجى إدخال الكود الكامل', 'error'); return;
  }
  showToast('تم التحقق من الكود ✅', 'success');
  setForgotStep(2);
}

function handleResetPassword() {
  const p1 = document.getElementById('forgot-new-pass').value;
  const p2 = document.getElementById('forgot-confirm-pass').value;
  if (!p1 || p1.length < 6) {
    showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error'); return;
  }
  if (p1 !== p2) {
    showToast('كلمتا المرور غير متطابقتين', 'error'); return;
  }
  showToast('تم تغيير كلمة المرور بنجاح 🔒', 'success');
  setForgotStep(0);
  document.getElementById('forgot-email').value = '';
  document.getElementById('forgot-code').value  = '';
  document.getElementById('forgot-new-pass').value     = '';
  document.getElementById('forgot-confirm-pass').value = '';
  navigateTo('screen-login');
}

function setForgotStep(step) {
  forgotStep = step;
  [0, 1, 2].forEach(i => {
    const el = document.getElementById('forgot-step-' + i);
    if (el) el.style.display = (i === step) ? 'block' : 'none';
  });
  document.querySelectorAll('#forgot-steps .step-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === step);
    dot.classList.toggle('done',   i < step);
  });
  const titles = ['استعادة كلمة المرور 🔑', 'أدخل كود التحقق 🔐', 'كلمة مرور جديدة ✨'];
  const subs   = ['أدخل بريدك لإرسال كود الاستعادة', 'تحقق من بريدك الإلكتروني', 'اختر كلمة مرور جديدة وآمنة'];
  const t = document.getElementById('forgot-title');
  const s = document.getElementById('forgot-subtitle');
  if (t) t.textContent = titles[step];
  if (s) s.textContent = subs[step];
}

function handleLogout() {
  // Stop OTP timer
  if (state.otpInterval) { clearInterval(state.otpInterval); state.otpInterval = null; }
  state.currentUser  = null;
  state.rooms        = [];
  state.currentRoom  = null;
  showToast('تم تسجيل الخروج بنجاح', 'info');
  navigateTo('screen-login');
}

// ===================================================
// Home Screen
// ===================================================
function loadHomeScreen() {
  if (!state.currentUser) return;

  document.getElementById('home-user-name').textContent = state.currentUser.name;
  document.getElementById('stat-rooms').textContent     = state.rooms.length;
  document.getElementById('stat-paid').textContent      = state.rooms.filter(r => r.isPaid).length;
  document.getElementById('stat-due').textContent       = state.rooms.filter(r => !r.isPaid).length;

  // Notification badge
  const unread = state.notifications.filter(n => n.unread).length;
  const badge  = document.getElementById('notif-badge');
  if (badge) badge.style.display = unread > 0 ? 'block' : 'none';

  // Profile header
  document.getElementById('profile-name').textContent  = state.currentUser.name;
  document.getElementById('profile-email').textContent = state.currentUser.email;
  document.getElementById('profile-avatar').textContent = state.currentUser.avatar || state.currentUser.name.charAt(0);
  const createRoomBtn = document.getElementById('btn-open-create-room');
  if (createRoomBtn) {
    createRoomBtn.style.display = state.currentUser.role === 'admin' ? 'flex' : 'none';
  }

  renderRoomsList();
  renderNotificationsList();
  renderHistoryList();
  renderFAQ();
}

// ===================================================
// Rooms List
// ===================================================
function renderRoomsList() {
  const list = document.getElementById('rooms-list');
  if (!list) return;

  if (state.rooms.length === 0) {
    list.innerHTML = `
      <div class="empty-state fade-in">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <div class="empty-title">لا توجد روم بعد</div>
        <div class="empty-subtitle">انضم لروم بكود دعوة من الأدمن</div>
        <button class="btn btn-primary" style="max-width:200px;margin-top:8px" onclick="openModal('modal-join')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          انضم لروم
        </button>
      </div>`;
    return;
  }

  list.innerHTML = state.rooms.map(room => `
    <div class="room-card fade-in" onclick="openRoom('${room.id}')">
      <div class="room-icon ${room.iconClass}">${room.icon}</div>
      <div class="room-info">
        <div class="room-name">${room.name}</div>
        <div class="room-meta">${room.members} أعضاء · يُجدد ${room.renewDate}</div>
        <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">
          ${room.isPaid
            ? '<span class="badge badge-success"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> مدفوع</span>'
            : '<span class="badge badge-danger">⚠ غير مدفوع</span>'
          }
          <span class="badge badge-primary">${room.price} ${room.currency}/شهر</span>
          ${room.isAdmin ? '<span class="badge badge-warning">Admin</span>' : ''}
        </div>
      </div>
      <svg class="room-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  `).join('');
}

// ===================================================
// Open Room
// ===================================================
function openRoom(roomId) {
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;
  state.currentRoom = room;

  if (!room.isPaid) {
    // Locked screen
    document.getElementById('unpaid-room-name').textContent = room.name;
    document.getElementById('locked-reason').textContent    =
      'لم يتم سداد اشتراك ' + room.name + ' للشهر الجاري. ادفع للوصول لجميع بيانات الروم.';
    document.getElementById('locked-amount').innerHTML =
      room.price + ' <span>' + room.currency + '/شهر</span>';
    navigateTo('screen-unpaid');
    return;
  }

  // Room header
  document.getElementById('room-detail-icon').textContent = room.icon;
  document.getElementById('room-detail-name').textContent = room.name;
  document.getElementById('room-detail-meta').textContent =
    room.members + ' أعضاء · ' + (room.isPaid ? 'مدفوع ✓' : 'غير مدفوع');

  // Info card
  renderRoomInfoCard(room);

  // OTP
  startOTPTimer();

  // Sub-lists
  renderRoomNotifications(room);
  renderRoomMembers(room);

  // Show members tab only for admin/owner
  const membersTabBtn = document.getElementById('tab-members-btn');
  if (membersTabBtn) {
    membersTabBtn.style.display = room.isAdmin ? 'block' : 'none';
  }

  // Reset to first tab
  switchTab('room', 'data');

  navigateTo('screen-room');
}

function renderRoomInfoCard(room) {
  const card = document.getElementById('room-info-card');
  if (!card) return;
  card.innerHTML = `
    <div class="info-row">
      <span class="info-key">الخدمة</span>
      <span class="info-val">${room.service}</span>
    </div>
    <div class="info-row">
      <span class="info-key">السعر الشهري</span>
      <span class="info-val">${room.price} ${room.currency}</span>
    </div>
    <div class="info-row">
      <span class="info-key">تاريخ التجديد</span>
      <span class="info-val">${room.renewDate}</span>
    </div>
    <div class="info-row">
      <span class="info-key">اسم المستخدم</span>
      <span class="info-val mono" style="direction:ltr;text-align:left">${room.username}</span>
    </div>
    <div class="info-row" style="border-bottom:none">
      <span class="info-key">كلمة المرور</span>
      <span class="info-val" style="gap:8px">
        <span class="mono blurred" id="room-pass-val" style="direction:ltr;letter-spacing:2px">${room.password}</span>
        <button class="toggle-vis" id="room-pass-toggle" onclick="toggleRoomPassword()" title="إظهار / إخفاء">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </span>
    </div>
  `;
}

// ===================================================
// Password Toggle
// ===================================================
let passVisible = false;
function toggleRoomPassword() {
  passVisible = !passVisible;
  const val = document.getElementById('room-pass-val');
  if (val) val.classList.toggle('blurred', !passVisible);
}

// ===================================================
// OTP Timer
// ===================================================
function startOTPTimer() {
  if (state.otpInterval) clearInterval(state.otpInterval);
  closeOtpRealtime();

  if (state.currentRoom?.backendRoom) {
    const codeEl = document.getElementById('otp-code');
    const timeEl = document.getElementById('otp-time-left');
    const barEl  = document.getElementById('otp-bar');
    if (codeEl) codeEl.textContent = state.currentRoom.latestOtp || '--';
    if (timeEl) timeEl.textContent = state.currentRoom.latestOtp ? 'آخر كود محفوظ' : 'بانتظار OTP';
    if (barEl) {
      barEl.style.width = state.currentRoom.latestOtp ? '100%' : '12%';
      barEl.style.background = state.currentRoom.latestOtp ? 'var(--success)' : 'var(--warning)';
    }
    loadLatestBackendOtp(state.currentRoom);
    connectRoomOtpRealtime(state.currentRoom);
    return;
  }

  const TOTAL = 30;
  let secsLeft = TOTAL;
  const genOTP = () => String(Math.floor(100000 + Math.random() * 900000));
  let otp = genOTP();

  const update = () => {
    const codeEl = document.getElementById('otp-code');
    const timeEl = document.getElementById('otp-time-left');
    const barEl  = document.getElementById('otp-bar');
    if (!codeEl) { clearInterval(state.otpInterval); return; }

    codeEl.textContent = otp;
    if (timeEl) timeEl.textContent = secsLeft + 's';
    if (barEl) {
      barEl.style.width      = ((secsLeft / TOTAL) * 100) + '%';
      barEl.style.background = secsLeft <= 5 ? 'var(--danger)' : 'var(--primary)';
    }
  };

  update();
  state.otpInterval = setInterval(() => {
    secsLeft--;
    if (secsLeft <= 0) { secsLeft = TOTAL; otp = genOTP(); }
    update();
  }, 1000);
}

// ===================================================
// Room Notifications
// ===================================================
function renderRoomNotifications(room) {
  const list = document.getElementById('room-notifs-list');
  if (!list) return;
  if (!room.notifications || room.notifications.length === 0) {
    list.innerHTML = emptyState('لا توجد إشعارات لهذه الروم', 'bell');
    return;
  }
  list.innerHTML = room.notifications.map(n => notifItemHTML(n)).join('');
}

// ===================================================
// Members
// ===================================================
function renderRoomMembers(room) {
  const list      = document.getElementById('room-members-list');
  const actDiv    = document.getElementById('room-members-actions');
  if (!list) return;

  if (actDiv) actDiv.style.display = room.isAdmin ? 'block' : 'none';

  list.innerHTML = room.membersList.map(m => `
    <div class="member-item fade-in">
      <div class="member-avatar">${m.avatar}</div>
      <div class="member-info">
        <div class="member-name">${m.name}</div>
        <div class="member-email">${m.email}</div>
        <div style="margin-top:5px;display:flex;gap:4px;flex-wrap:wrap">
          ${roleBadge(m.role)}
          ${m.paid
            ? '<span class="badge badge-success">مدفوع</span>'
            : '<span class="badge badge-danger">غير مدفوع</span>'}
        </div>
      </div>
      ${(room.isAdmin && m.role !== 'owner') ? `
        <div class="member-actions">
          <button class="btn btn-xs btn-danger" onclick="confirmRemoveMember('${m.id}','${m.name}')">إزالة</button>
        </div>` : ''}
    </div>
  `).join('');
}

function roleBadge(role) {
  const map = {
    owner:  '<span class="badge badge-primary">Owner</span>',
    admin:  '<span class="badge badge-warning">Admin</span>',
    member: '<span class="badge badge-muted">Member</span>',
  };
  return map[role] || map.member;
}

function confirmRemoveMember(memberId) {
  state.memberToRemove = memberId;
  openModal('modal-remove-member');
}

// ===================================================
// Tabs
// ===================================================
function switchTab(screenKey, tabName) {
  const screen = document.getElementById('screen-' + screenKey);
  if (!screen) return;

  screen.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  screen.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

  const tabMap = { data:0, notifs:1, members:2 };
  const idx    = tabMap[tabName] !== undefined ? tabMap[tabName] : 0;
  const tabs   = screen.querySelectorAll('.tab-item');
  if (tabs[idx]) tabs[idx].classList.add('active');

  const panel = document.getElementById('room-tab-' + tabName);
  if (panel) panel.classList.add('active');
}

// ===================================================
// Payment
// ===================================================
function goToPayment() {
  if (!state.currentRoom) return;
  // Set period label (current month/year)
  const now = new Date();
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const period = months[now.getMonth()] + ' ' + now.getFullYear();

  document.getElementById('payment-room-name').textContent = state.currentRoom.name;
  document.getElementById('payment-period').textContent    = period;
  document.getElementById('payment-amount').textContent    = state.currentRoom.price + ' ' + state.currentRoom.currency;

  // Reset method selection to first
  document.querySelectorAll('.payment-method').forEach((m, i) => {
    m.classList.toggle('selected', i === 0);
    const chk = m.querySelector('.payment-check');
    if (chk) chk.innerHTML = i === 0
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
      : '';
  });
  state.selectedPaymentMethod = 'instapay';

  navigateTo('screen-payment');
}

function selectPaymentMethod(el, method) {
  document.querySelectorAll('.payment-method').forEach(m => {
    m.classList.remove('selected');
    const c = m.querySelector('.payment-check');
    if (c) c.innerHTML = '';
  });
  el.classList.add('selected');
  state.selectedPaymentMethod = method;
  const chk = el.querySelector('.payment-check');
  if (chk) chk.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
}

function handlePayment() {
  const btn = document.getElementById('btn-pay');
  setButtonLoading(btn, true);

  setTimeout(() => {
    setButtonLoading(btn, false);
    if (state.currentRoom) {
      state.currentRoom.isPaid = true;
      // Add to history
      DEMO_HISTORY.unshift({
        id:     'h_' + Date.now(),
        room:   state.currentRoom.name,
        amount: state.currentRoom.price,
        date:   'الآن',
        method: paymentMethodLabel(state.selectedPaymentMethod),
        status: 'success',
      });
      loadHomeScreen();
      showToast('تم الدفع بنجاح ✅', 'success');
      setTimeout(() => openRoom(state.currentRoom.id), 700);
    }
  }, 1500);
}

function paymentMethodLabel(m) {
  return { instapay:'InstaPay', wallet:'المحفظة', card:'بطاقة بنكية' }[m] || m;
}

// ===================================================
// Notifications
// ===================================================
function renderNotificationsList() {
  const list = document.getElementById('notifs-list');
  if (!list) return;
  if (state.notifications.length === 0) {
    list.innerHTML = emptyState('لا توجد إشعارات', 'bell');
    return;
  }
  list.innerHTML = state.notifications.map(n => notifItemHTML(n, true)).join('');
}

function notifItemHTML(n, clickable = false) {
  const icons = {
    success: 'background:var(--success-soft);color:var(--success)',
    warning: 'background:var(--warning-soft);color:var(--warning)',
    danger:  'background:var(--danger-soft);color:var(--danger)',
    info:    'background:var(--primary-soft);color:var(--primary)',
  };
  const svgs = {
    success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
    warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',
    danger:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  };
  const style   = icons[n.type]  || icons.info;
  const iconSVG = svgs[n.type]   || svgs.info;
  const click   = clickable ? `onclick="markNotifRead('${n.id}')"` : '';
  return `
    <div class="notif-item ${n.unread ? 'unread' : ''} fade-in" ${click}>
      <div class="notif-icon" style="${style}">${iconSVG}</div>
      <div class="notif-content">
        <div class="notif-title">${n.title}</div>
        <div class="notif-body">${n.body}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>`;
}

function markNotifRead(id) {
  const n = state.notifications.find(x => x.id === id);
  if (n) n.unread = false;
  renderNotificationsList();
  const unread = state.notifications.filter(x => x.unread).length;
  const badge  = document.getElementById('notif-badge');
  if (badge) badge.style.display = unread > 0 ? 'block' : 'none';
}

function markAllRead() {
  state.notifications.forEach(n => n.unread = false);
  renderNotificationsList();
  const badge = document.getElementById('notif-badge');
  if (badge) badge.style.display = 'none';
  showToast('تم تحديد الكل كمقروء ✅', 'success');
}

// ===================================================
// Payment History
// ===================================================
function renderHistoryList() {
  const list = document.getElementById('history-list');
  if (!list) return;
  if (DEMO_HISTORY.length === 0) {
    list.innerHTML = emptyState('لا توجد معاملات بعد', 'card');
    return;
  }
  list.innerHTML = DEMO_HISTORY.map(h => `
    <div class="info-card fade-in" style="display:flex;align-items:center;gap:12px;padding:14px 16px;margin-bottom:10px">
      <div style="width:46px;height:46px;border-radius:var(--r-sm);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;
        ${h.status === 'success'
          ? 'background:var(--success-soft);color:var(--success)'
          : 'background:var(--danger-soft);color:var(--danger)'}">
        ${h.status === 'success'
          ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
          : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h.room}</div>
        <div style="font-size:12px;color:var(--text-muted)">${h.method} · ${h.date}</div>
      </div>
      <div style="font-size:16px;font-weight:800;flex-shrink:0;
        ${h.status === 'success' ? 'color:var(--success)' : 'color:var(--danger)'}">
        ${h.amount} ج
      </div>
    </div>
  `).join('');
}

// ===================================================
// FAQ
// ===================================================
function renderFAQ() {
  const list = document.getElementById('faq-list');
  if (!list) return;
  list.innerHTML = FAQ_ITEMS.map((item, i) => `
    <div class="faq-item" id="faq-item-${i}">
      <div class="faq-question" onclick="toggleFAQ(${i})">
        <span>${item.q}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="faq-answer">${item.a}</div>
    </div>
  `).join('');
}

function toggleFAQ(idx) {
  const item = document.getElementById('faq-item-' + idx);
  if (item) item.classList.toggle('open');
}

// ===================================================
// Join Room
// ===================================================
function handleJoinRoom() {
  const input   = document.getElementById('join-code-input');
  const errorEl = document.getElementById('join-code-error');
  const errTxt  = document.getElementById('join-code-error-text');
  const code    = input ? input.value.trim() : '';

  if (errorEl) errorEl.style.display = 'none';

  if (!code) {
    if (errorEl) errorEl.style.display = 'flex';
    if (errTxt)  errTxt.textContent    = 'يرجى إدخال كود الدعوة';
    return;
  }
  if (code.length < 4) {
    if (errorEl) errorEl.style.display = 'flex';
    if (errTxt)  errTxt.textContent    = 'الكود قصير جداً';
    return;
  }

  closeModal('modal-join');
  if (input) input.value = '';
  showToast('تم الانضمام للروم بنجاح 🎉', 'success');
}

async function handleCreateRoom() {
  if (state.currentUser?.role !== 'admin') {
    showToast('حساب أدمن مطلوب لإنشاء الرومات', 'error');
    return;
  }

  const name = document.getElementById('create-room-name')?.value.trim();
  const subscriptionEmail = document.getElementById('create-room-sub-email')?.value.trim();
  const password = document.getElementById('create-room-sub-password')?.value.trim();
  const monthlyPrice = document.getElementById('create-room-price')?.value.trim();
  const imapEmail = document.getElementById('create-room-imap-email')?.value.trim();
  const imapAppPassword = document.getElementById('create-room-imap-password')?.value.trim();

  if (!name || !subscriptionEmail || !password || !imapEmail || !imapAppPassword) {
    showToast('املأ بيانات الروم والميل بالكامل', 'error');
    return;
  }
  if (!isValidEmail(subscriptionEmail) || !isValidEmail(imapEmail)) {
    showToast('تأكد من صحة الإيميلات', 'error');
    return;
  }

  const btn = document.getElementById('btn-create-room-confirm');
  setButtonLoading(btn, true);
  try {
    const result = await apiFetch('/rooms', {
      method: 'POST',
      body: JSON.stringify({
        name,
        subscriptionEmail,
        password,
        monthlyPrice: Number(monthlyPrice || 0),
        inboundEmail: imapEmail,
        imapEmail,
        imapAppPassword,
      }),
    });
    const room = normalizeBackendRoom(result.room);
    state.rooms.unshift(room);
    renderRoomsList();
    closeModal('modal-create-room');
    ['create-room-name', 'create-room-sub-email', 'create-room-sub-password', 'create-room-price', 'create-room-imap-email', 'create-room-imap-password']
      .forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.value = '';
      });
    showToast(`تم إنشاء الروم. كود الدعوة: ${room.code}`, 'success', 6000);
  } catch (error) {
    showToast(error.message || 'فشل إنشاء الروم', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

// ===================================================
// Modals
// ===================================================
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}

// Close on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ===================================================
// Toast
// ===================================================
function showToast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const iconMap = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
    error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',
    info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  };

  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = (iconMap[type] || iconMap.info) + '<span>' + msg + '</span>';
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===================================================
// Helpers
// ===================================================
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(fieldId, message) {
  const input   = document.getElementById(fieldId);
  const errDiv  = document.getElementById(fieldId + '-error');
  const errText = document.getElementById(fieldId + '-error-text');
  if (input)   input.classList.add('error');
  if (errDiv)  errDiv.style.display = 'flex';
  if (errText) errText.textContent  = message;
}

function clearFieldError(fieldId) {
  const input  = document.getElementById(fieldId);
  const errDiv = document.getElementById(fieldId + '-error');
  if (input)  input.classList.remove('error');
  if (errDiv) errDiv.style.display = 'none';
}

function setButtonLoading(btn, loading) {
  if (!btn) return;
  btn.classList.toggle('btn-loading', loading);
  btn.disabled = loading;
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (input) input.type = input.type === 'password' ? 'text' : 'password';
}

function emptyState(title, icon) {
  const icons = {
    bell: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>',
    card: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    room: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>',
  };
  return `
    <div class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${icons[icon] || icons.room}</svg>
      </div>
      <div class="empty-title">${title}</div>
    </div>`;
}

// ===================================================
// Event Listeners (after DOM ready)
// ===================================================
function setupEventListeners() {
  // Join Room confirm
  const joinBtn = document.getElementById('btn-join-confirm');
  if (joinBtn) joinBtn.addEventListener('click', handleJoinRoom);

  const createRoomBtn = document.getElementById('btn-create-room-confirm');
  if (createRoomBtn) createRoomBtn.addEventListener('click', handleCreateRoom);

  // Add Member confirm
  const addMemberBtn = document.getElementById('btn-add-member-confirm');
  if (addMemberBtn) {
    addMemberBtn.addEventListener('click', () => {
      const emailInput = document.getElementById('add-member-email');
      const email = emailInput ? emailInput.value.trim() : '';
      if (!email || !isValidEmail(email)) {
        showToast('بريد إلكتروني غير صحيح', 'error'); return;
      }
      if (state.currentRoom) {
        const newM = {
          id:     'nm_' + Date.now(),
          name:    email.split('@')[0],
          email:   email,
          role:   'member',
          paid:    false,
          avatar:  email.charAt(0).toUpperCase(),
        };
        state.currentRoom.membersList.push(newM);
        state.currentRoom.members++;
        renderRoomMembers(state.currentRoom);
      }
      closeModal('modal-add-member');
      if (emailInput) emailInput.value = '';
      showToast('تم إرسال الدعوة ✅', 'success');
    });
  }

  // Remove Member confirm
  const removeMemberBtn = document.getElementById('btn-remove-member-confirm');
  if (removeMemberBtn) {
    removeMemberBtn.addEventListener('click', () => {
      if (state.memberToRemove && state.currentRoom) {
        state.currentRoom.membersList = state.currentRoom.membersList.filter(m => m.id !== state.memberToRemove);
        state.currentRoom.members     = state.currentRoom.membersList.length;
        renderRoomMembers(state.currentRoom);
        state.memberToRemove = null;
      }
      closeModal('modal-remove-member');
      showToast('تم إزالة العضو', 'success');
    });
  }

  // Delete Account confirm
  const deleteBtn = document.getElementById('btn-delete-confirm');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const val = (document.getElementById('delete-confirm-input') || {}).value || '';
      if (val.trim() !== 'احذف حسابي') {
        showToast('اكتب "احذف حسابي" بالضبط للتأكيد', 'error'); return;
      }
      if (state.otpInterval) clearInterval(state.otpInterval);
      closeModal('modal-delete-account');
      showToast('تم حذف الحساب نهائياً', 'info');
      setTimeout(() => navigateTo('screen-login'), 800);
    });
  }
}

// ===================================================
// App Init
// ===================================================
function init() {
  registerServiceWorker();
  renderFAQ(); // pre-render so FAQ screen is instant
  setupEventListeners();
  navigateTo('screen-splash');

  // Auto-advance splash → login
  setTimeout(() => navigateTo('screen-login'), 2400);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.warn('Service worker registration failed:', error.message);
    });
  });
}
