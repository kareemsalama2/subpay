// ===================================================
// SubPay â€” App Logic v1.0
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
  roomsSyncInterval:    null,
  authToken:            localStorage.getItem('subpay_token') || '',
  memberToRemove:       null,
  prevScreen:           null,
};

const API_BASE = `${location.origin}/api`;

// ========== Demo Data ==========
const DEMO_USER = {
  id: 'u1',
  name: 'Ù…Ø­Ù…Ø¯ Ø£Ø­Ù…Ø¯',
  email: 'm.ahmed@email.com',
  phone: '+201012345678',
  avatar: 'Ù…',
};

const DEMO_ROOMS = [
  {
    id: 'r1',
    name: 'ChatGPT Plus',
    icon: 'ðŸ¤–',
    iconClass: 'chatgpt',
    service: 'ChatGPT Plus',
    price: 49,
    currency: 'Ø¬Ù†ÙŠÙ‡',
    members: 5,
    maxMembers: 5,
    isPaid: true,
    isAdmin: false,
    username: 'group_chatgpt@mail.com',
    password: 'P@ssw0rd!123',
    renewDate: '1 ÙŠÙˆÙ„ÙŠÙˆ 2025',
    notifications: [
      { id:'rn1', title:'ØªÙ… ØªØ¬Ø¯ÙŠØ¯ Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ', body:'ØªÙ… ØªØ¬Ø¯ÙŠØ¯ ChatGPT Plus Ù„Ù„Ø´Ù‡Ø± Ø§Ù„Ø¬Ø§Ø±ÙŠ Ø¨Ù†Ø¬Ø§Ø­.', time:'Ù…Ù†Ø° ÙŠÙˆÙ…ÙŠÙ†', type:'success', unread:false },
      { id:'rn2', title:'OTP Ø¬Ø¯ÙŠØ¯ Ù…ØªØ§Ø­',     body:'ÙƒÙˆØ¯ ØªØ­Ù‚Ù‚ Ø¬Ø¯ÙŠØ¯ Ø£ÙÙ†Ø´Ø¦. ØªØ­Ù‚Ù‚ Ù…Ù† ØªØ¨ÙˆÙŠØ¨ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ.', time:'Ù…Ù†Ø° Ø³Ø§Ø¹Ø©', type:'info', unread:true },
    ],
    membersList: [
      { id:'m1', name:'Ø£Ø­Ù…Ø¯ Ù…Ø­Ù…ÙˆØ¯',  email:'ahmed@mail.com',      role:'owner',  paid:true,  avatar:'Ø£' },
      { id:'m2', name:'Ù…Ø­Ù…Ø¯ Ø£Ø­Ù…Ø¯',   email:'m.ahmed@email.com',   role:'member', paid:true,  avatar:'Ù…' },
      { id:'m3', name:'Ø³Ø§Ø±Ø© Ø®Ø§Ù„Ø¯',   email:'sara@mail.com',       role:'member', paid:true,  avatar:'Ø³' },
      { id:'m4', name:'Ø¹Ù…Ø± Ø¹Ù„ÙŠ',     email:'omar@mail.com',       role:'member', paid:false, avatar:'Ø¹' },
      { id:'m5', name:'Ø±ÙŠÙ… Ø­Ø³Ù†',     email:'reem@mail.com',       role:'member', paid:true,  avatar:'Ø±' },
    ],
  },
  {
    id: 'r2',
    name: 'Netflix',
    icon: 'ðŸŽ¬',
    iconClass: 'netflix',
    service: 'Netflix Standard',
    price: 99,
    currency: 'Ø¬Ù†ÙŠÙ‡',
    members: 4,
    maxMembers: 4,
    isPaid: false,
    isAdmin: true,
    username: 'netflix_group@mail.com',
    password: 'Netflix#2025!',
    renewDate: '15 ÙŠÙˆÙ†ÙŠÙˆ 2025',
    notifications: [
      { id:'rn3', title:'ØªØ°ÙƒÙŠØ± Ø¨Ø§Ù„Ø¯ÙØ¹', body:'Ù…ÙˆØ¹Ø¯ ØªØ¬Ø¯ÙŠØ¯ Netflix ÙŠÙ‚ØªØ±Ø¨. ÙŠØ±Ø¬Ù‰ Ø§Ù„Ø¯ÙØ¹ Ù‚Ø¨Ù„ 15 ÙŠÙˆÙ†ÙŠÙˆ Ù„ØªØ¬Ù†Ø¨ Ù‚Ø·Ø¹ Ø§Ù„Ø®Ø¯Ù…Ø©.', time:'Ù…Ù†Ø° 3 Ø£ÙŠØ§Ù…', type:'warning', unread:true },
    ],
    membersList: [
      { id:'m6', name:'Ù…Ø­Ù…Ø¯ Ø£Ø­Ù…Ø¯',  email:'m.ahmed@email.com', role:'admin',  paid:false, avatar:'Ù…' },
      { id:'m7', name:'Ù„ÙŠÙ†Ø§ Ø³Ø§Ù…ÙŠ',  email:'lena@mail.com',     role:'member', paid:true,  avatar:'Ù„' },
      { id:'m8', name:'Ø®Ø§Ù„Ø¯ ÙŠÙˆØ³Ù', email:'khaled@mail.com',   role:'member', paid:false, avatar:'Ø®' },
      { id:'m9', name:'Ù…Ù†Ù‰ Ø·Ø§Ø±Ù‚',  email:'mona@mail.com',     role:'member', paid:true,  avatar:'Ù†' },
    ],
  },
  {
    id: 'r3',
    name: 'Spotify',
    icon: 'ðŸŽµ',
    iconClass: 'default',
    service: 'Spotify Premium',
    price: 35,
    currency: 'Ø¬Ù†ÙŠÙ‡',
    members: 3,
    maxMembers: 6,
    isPaid: true,
    isAdmin: false,
    username: 'spotify_fam@mail.com',
    password: 'Sp0tify$2025',
    renewDate: '20 ÙŠÙˆÙ†ÙŠÙˆ 2025',
    notifications: [],
    membersList: [
      { id:'m10', name:'ÙŠÙˆØ³Ù Ø­Ù…Ø¯ÙŠ',  email:'youssef@mail.com', role:'owner',  paid:true, avatar:'ÙŠ' },
      { id:'m11', name:'Ù…Ø­Ù…Ø¯ Ø£Ø­Ù…Ø¯',  email:'m.ahmed@email.com',role:'member', paid:true, avatar:'Ù…' },
      { id:'m12', name:'Ù‡Ø¯Ù‰ Ù…ØµØ·ÙÙ‰', email:'hoda@mail.com',    role:'member', paid:true, avatar:'Ù‡' },
    ],
  },
];

const DEMO_NOTIFICATIONS = [
  { id:'gn1', title:'Ù…Ø±Ø­Ø¨Ø§Ù‹ Ø¨Ùƒ ÙÙŠ SubPay ðŸŽ‰',      body:'ØªÙ… ØªÙØ¹ÙŠÙ„ Ø­Ø³Ø§Ø¨Ùƒ Ø¨Ù†Ø¬Ø§Ø­. Ø§Ø¨Ø¯Ø£ Ø¨Ø§Ù„Ø§Ù†Ø¶Ù…Ø§Ù… Ù„Ø±ÙˆÙ… Ø£Ùˆ Ø¥Ù†Ø´Ø§Ø¡ Ø±ÙˆÙ… Ø¬Ø¯ÙŠØ¯Ø©.',             time:'Ù…Ù†Ø° Ø£Ø³Ø¨ÙˆØ¹',  type:'success', unread:false },
  { id:'gn2', title:'ØªØ°ÙƒÙŠØ±: Netflix ØºÙŠØ± Ù…Ø¯ÙÙˆØ¹',   body:'Ø§Ø´ØªØ±Ø§Ùƒ Netflix ÙŠØ³ØªØ­Ù‚ Ø§Ù„Ø¯ÙØ¹ Ù‚Ø¨Ù„ 15 ÙŠÙˆÙ†ÙŠÙˆ. Ø§Ø¶ØºØ· Ù„Ø¯ÙØ¹ Ø§Ù„Ø¢Ù†.',                   time:'Ù…Ù†Ø° 3 Ø£ÙŠØ§Ù…', type:'warning', unread:true  },
  { id:'gn3', title:'OTP Ø¬Ø¯ÙŠØ¯ â€” ChatGPT Plus',    body:'ÙƒÙˆØ¯ ØªØ­Ù‚Ù‚ Ø¬Ø¯ÙŠØ¯ Ù…ØªØ§Ø­ ÙÙŠ Ø±ÙˆÙ… ChatGPT Plus.',                                     time:'Ù…Ù†Ø° Ø³Ø§Ø¹Ø©',   type:'info',    unread:true  },
];

const DEMO_HISTORY = [
  { id:'h1', room:'ChatGPT Plus',     amount:49,  date:'1 Ù…Ø§ÙŠÙˆ 2025',    method:'InstaPay',        status:'success' },
  { id:'h2', room:'Spotify Premium',  amount:35,  date:'20 Ø£Ø¨Ø±ÙŠÙ„ 2025',  method:'Ø§Ù„Ù…Ø­ÙØ¸Ø©',          status:'success' },
  { id:'h3', room:'Netflix Standard', amount:99,  date:'15 Ø£Ø¨Ø±ÙŠÙ„ 2025',  method:'Ø¨Ø·Ø§Ù‚Ø© Ø¨Ù†ÙƒÙŠØ©',     status:'failed'  },
  { id:'h4', room:'ChatGPT Plus',     amount:49,  date:'1 Ø£Ø¨Ø±ÙŠÙ„ 2025',   method:'InstaPay',        status:'success' },
];

const FAQ_ITEMS = [
  { q:'Ù…Ø§ Ù‡Ùˆ SubPayØŸ',
    a:'SubPay Ù…Ù†ØµØ© Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø§Ø´ØªØ±Ø§ÙƒØ§Øª Ø§Ù„Ù…Ø´ØªØ±ÙƒØ©. ÙŠÙ…ÙƒÙ†Ùƒ Ø¥Ù†Ø´Ø§Ø¡ "Ø±ÙˆÙ…" Ù„Ø£ÙŠ Ø®Ø¯Ù…Ø© Ø§Ø´ØªØ±Ø§Ùƒ ÙˆØ¥Ø¶Ø§ÙØ© Ø£Ø¹Ø¶Ø§Ø¡ ÙŠØªØ´Ø§Ø±ÙƒÙˆÙ† Ù…Ø¹Ùƒ ØªÙƒÙ„ÙØ© Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ ÙˆØ¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ÙˆØµÙˆÙ„.' },
  { q:'ÙƒÙŠÙ Ø£Ù†Ø¶Ù… Ù„Ø±ÙˆÙ…ØŸ',
    a:'Ø§Ø¶ØºØ· Ø¹Ù„Ù‰ Ø²Ø± "Ø§Ù†Ø¶Ù… Ù„Ø±ÙˆÙ…" ÙÙŠ Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© ÙˆØ£Ø¯Ø®Ù„ ÙƒÙˆØ¯ Ø§Ù„Ø¯Ø¹ÙˆØ© Ø§Ù„Ø°ÙŠ Ø£Ø±Ø³Ù„Ù‡ Ù„Ùƒ Ø§Ù„Ø£Ø¯Ù…Ù†. Ø§Ù„ÙƒÙˆØ¯ Ø¹Ø¨Ø§Ø±Ø© Ø¹Ù† 4-12 Ø­Ø±Ù/Ø±Ù‚Ù….' },
  { q:'Ù…Ø§Ø°Ø§ ÙŠØ­Ø¯Ø« Ù„Ùˆ Ù„Ù… Ø£Ø¯ÙØ¹ ÙÙŠ Ø§Ù„Ù…ÙˆØ¹Ø¯ØŸ',
    a:'Ø³ÙŠØªÙ… Ø¥ÙŠÙ‚Ø§Ù ÙˆØµÙˆÙ„Ùƒ Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø±ÙˆÙ… (ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ÙˆØ§Ù„Ù€ OTP) ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ø­ØªÙ‰ ØªÙØ¬Ø¯Ù‘Ø¯ Ø§Ø´ØªØ±Ø§ÙƒÙƒ. Ø¨Ø§Ù‚ÙŠ Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ù„Ù† ÙŠØªØ£Ø«Ø±ÙˆØ§.' },
  { q:'Ù‡Ù„ Ø¨ÙŠØ§Ù†Ø§ØªÙŠ Ø¢Ù…Ù†Ø©ØŸ',
    a:'Ù†Ø¹Ù…ØŒ SubPay ÙŠØ³ØªØ®Ø¯Ù… ØªØ´ÙÙŠØ± SSL Ù„Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø§ØªØµØ§Ù„Ø§Øª. Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø© Ù…Ø´ÙØ±Ø© ÙÙŠ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª. Ø£ÙŠ ÙˆØµÙˆÙ„ Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø±ÙˆÙ… Ù‚Ø¯ ÙŠÙØ³Ø¬ÙŽÙ‘Ù„ Ù„Ø£ØºØ±Ø§Ø¶ Ø£Ù…Ù†ÙŠØ©.' },
  { q:'Ù…Ø§ Ø·Ø±Ù‚ Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ù…ØªØ§Ø­Ø©ØŸ',
    a:'InstaPayØŒ Ø§Ù„Ù…Ø­ÙØ¸Ø© Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ© (Vodafone Cash / Orange Cash)ØŒ ÙˆØ§Ù„Ø¨Ø·Ø§Ù‚Ø© Ø§Ù„Ø¨Ù†ÙƒÙŠØ© (Visa / Mastercard).' },
  { q:'ÙƒÙŠÙ Ø£ØªÙˆØ§ØµÙ„ Ù…Ø¹ Ø§Ù„Ø¯Ø¹Ù…ØŸ',
    a:'ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„ØªÙˆØ§ØµÙ„ Ù…Ø¹Ù†Ø§ Ø¹Ø¨Ø± Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ support@subpay.app Ø£Ùˆ Ù…Ù† Ø®Ù„Ø§Ù„ Ù‚Ø³Ù… Ø§Ù„Ù…Ø³Ø§Ø¹Ø¯Ø© Ø¯Ø§Ø®Ù„ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚. Ù†Ø±Ø¯ Ø®Ù„Ø§Ù„ 24 Ø³Ø§Ø¹Ø©.' },
  { q:'Ù‡Ù„ ÙŠÙ…ÙƒÙ†Ù†ÙŠ Ø¥Ù†Ø´Ø§Ø¡ Ø±ÙˆÙ… Ø¬Ø¯ÙŠØ¯Ø©ØŸ',
    a:'Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø±ÙˆÙ…Ø§Øª Ù…ØªØ§Ø­ Ø­Ø§Ù„ÙŠØ§Ù‹ Ù„Ù„Ù…Ø´ØªØ±ÙƒÙŠÙ† ÙÙŠ Ø®Ø·Ø© Ø§Ù„Ø£Ø¯Ù…Ù†. ØªÙˆØ§ØµÙ„ Ù…Ø¹Ù†Ø§ Ø¹Ø¨Ø± Ø§Ù„Ø¯Ø¹Ù… Ù„Ù…Ø¹Ø±ÙØ© Ø§Ù„ØªÙØ§ØµÙŠÙ„.' },
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
  if (lower.includes('chatgpt') || lower.includes('gpt')) return { icon: 'ðŸ¤–', iconClass: 'chatgpt' };
  if (lower.includes('netflix')) return { icon: 'ðŸŽ¬', iconClass: 'netflix' };
  if (lower.includes('spotify')) return { icon: 'ðŸŽµ', iconClass: 'default' };
  return { icon: 'ðŸ’³', iconClass: 'default' };
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
    imageUrl: room.imageUrl || '',
    price: room.monthlyPrice || 0,
    currency: 'Ø¬Ù†ÙŠÙ‡',
    members: members.length,
    maxMembers: Math.max(members.length, 5),
    isAdmin: ['owner', 'admin'].includes(room.role),
    isPaid: ['owner', 'admin'].includes(room.role) || Boolean(room.paidUntil),
    username: room.subscriptionEmail || room.inboundEmail || '',
    password: room.password || '',
    otpTtlMinutes: room.otpTtlMinutes || 5,
    renewDate: room.paidUntil || 'ØºÙŠØ± Ù…Ø­Ø¯Ø¯',
    latestOtp: latestOtpMessage?.otp || null,
    latestOtpMessageId: latestOtpMessage?.id || null,
    latestOtpCreatedAt: latestOtpMessage?.createdAt || null,
    latestOtpExpiresAt: latestOtpMessage?.otpExpiresAt || null,
    notifications: messages.slice(0, 10).map((message) => ({
      id: message.id,
      title: message.otp ? `OTP Ø¬Ø¯ÙŠØ¯ â€” ${room.name}` : (message.subject || 'Ø±Ø³Ø§Ù„Ø© ÙˆØ§Ø±Ø¯Ø©'),
      body: message.otp ? `ÙƒÙˆØ¯ Ø§Ù„ØªØ­Ù‚Ù‚ Ø§Ù„Ø¬Ø¯ÙŠØ¯: ${message.otp}` : (message.body || ''),
      time: formatRelativeTime(message.createdAt),
      type: message.otp ? 'info' : 'success',
      unread: false,
    })),
    membersList: members.map((member) => ({
      id: member.id,
      name: member.user?.name || 'Ø¹Ø¶Ùˆ',
      email: member.user?.email || '',
      role: member.role,
      paid: Boolean(member.paidUntil),
      paidUntil: member.paidUntil || '',
      avatar: member.user?.avatar || (member.user?.name || 'S').charAt(0),
    })),
  };
}

function formatRelativeTime(ts) {
  const diff = Math.max(0, Date.now() - Number(ts || Date.now()));
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Ø§Ù„Ø¢Ù†';
  if (min < 60) return `Ù…Ù†Ø° ${min} Ø¯Ù‚ÙŠÙ‚Ø©`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `Ù…Ù†Ø° ${hours} Ø³Ø§Ø¹Ø©`;
  return `Ù…Ù†Ø° ${Math.floor(hours / 24)} ÙŠÙˆÙ…`;
}

function formatExactTime(ts) {
  if (!ts) return '';
  return new Date(Number(ts)).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function formatOtpStatus(message) {
  if (!message?.otp) return 'Ø¨Ø§Ù†ØªØ¸Ø§Ø± OTP';
  const arrived = formatExactTime(message.createdAt);
  const expired = message.otpExpiresAt && Date.now() > Number(message.otpExpiresAt);
  return `${expired ? 'Ø§Ù†ØªÙ‡Ù‰' : 'ÙˆØµÙ„'}${arrived ? ` Ø§Ù„Ø³Ø§Ø¹Ø© ${arrived}` : ''}`;
}

async function syncBackendRooms() {
  try {
    const data = await apiFetch('/rooms');
    const rooms = (data.rooms || []).map(normalizeBackendRoom);
    state.rooms = rooms;
    renderRoomsList();
    if (state.currentUser) loadHomeScreen();
    if (state.currentRoom) {
      const updated = state.rooms.find((room) => room.id === state.currentRoom.id);
      if (updated) state.currentRoom = updated;
    }
  } catch (error) {
    console.warn('Backend rooms sync skipped:', error.message);
  }
}

function startRoomsSyncLoop() {
  if (state.roomsSyncInterval) clearInterval(state.roomsSyncInterval);
  state.roomsSyncInterval = setInterval(() => {
    if (state.currentUser && state.authToken) syncBackendRooms();
  }, 30000);
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
    console.warn('Backend login failed:', error.message);
    throw error;
  }
}

async function registerWithBackend({ name, phone, email, password }) {
  const result = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, phone, email, password }),
  });
  state.authToken = result.token;
  localStorage.setItem('subpay_token', result.token);
  const user = {
    id: result.user.id,
    name: result.user.name || name,
    email: result.user.email,
    phone: result.user.phone || phone,
    avatar: result.user.avatar || name.charAt(0),
    role: result.user.role || 'member',
  };
  return { user, rooms: [] };
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
  if (timeEl) timeEl.textContent = 'ÙˆØµÙ„ Ø§Ù„Ø¢Ù†';
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
        title: `OTP Ø¬Ø¯ÙŠØ¯ â€” ${state.currentRoom.name}`,
        body: `ÙƒÙˆØ¯ Ø§Ù„ØªØ­Ù‚Ù‚ Ø§Ù„Ø¬Ø¯ÙŠØ¯: ${message.otp}`,
        time: 'Ø§Ù„Ø¢Ù†',
        type: 'info',
        unread: true,
      },
      ...(state.currentRoom.notifications || []),
    ];
    renderRoomNotifications(state.currentRoom);
  }
  showToast(`OTP Ø¬Ø¯ÙŠØ¯: ${message.otp}`, 'success');
}

function applyOtpMessageDedup(message) {
  if (!message || !message.otp) return;
  const isNewMessage = state.currentRoom?.latestOtpMessageId !== message.id;
  const codeEl = document.getElementById('otp-code');
  const timeEl = document.getElementById('otp-time-left');
  const barEl = document.getElementById('otp-bar');
  const remaining = Math.max(0, Number(message.otpExpiresAt || 0) - Date.now());

  if (codeEl) codeEl.textContent = message.otp;
  if (timeEl) timeEl.textContent = formatOtpStatus(message);
  if (barEl) {
    const ttlMs = Math.max(1, Number(state.currentRoom?.otpTtlMinutes || 5)) * 60 * 1000;
    const percent = message.otpExpiresAt ? Math.max(0, Math.min(100, (remaining / ttlMs) * 100)) : 100;
    barEl.style.width = `${percent}%`;
    barEl.style.background = remaining || !message.otpExpiresAt ? 'var(--success)' : 'var(--danger)';
  }

  if (state.currentRoom) {
    state.currentRoom.latestOtp = message.otp;
    state.currentRoom.latestOtpMessageId = message.id;
    state.currentRoom.latestOtpCreatedAt = message.createdAt;
    state.currentRoom.latestOtpExpiresAt = message.otpExpiresAt;
    if (isNewMessage) {
      state.currentRoom.notifications = [
        {
          id: message.id,
          title: `OTP Ø¬Ø¯ÙŠØ¯ â€” ${state.currentRoom.name}`,
          body: `ÙƒÙˆØ¯ Ø§Ù„ØªØ­Ù‚Ù‚ Ø§Ù„Ø¬Ø¯ÙŠØ¯: ${message.otp} (${formatOtpStatus(message)})`,
          time: formatRelativeTime(message.createdAt),
          type: 'info',
          unread: true,
        },
        ...(state.currentRoom.notifications || []).filter((item) => item.id !== message.id),
      ];
      renderRoomNotifications(state.currentRoom);
    }
  }
  if (isNewMessage) showToast(`OTP Ø¬Ø¯ÙŠØ¯: ${message.otp}`, 'success');
}

function applyRoomMessage(message) {
  if (!message) return;
  if (message.otp) {
    applyOtpMessageDedup(message);
    return;
  }
  if (!state.currentRoom || state.currentRoom.id !== message.roomId) return;
  const exists = (state.currentRoom.notifications || []).some((item) => item.id === message.id);
  if (exists) return;
  state.currentRoom.notifications = [
    {
      id: message.id,
      title: message.subject || 'Ø±Ø³Ø§Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø©',
      body: message.body || '',
      time: formatRelativeTime(message.createdAt),
      type: message.type === 'admin' ? 'success' : 'info',
      unread: true,
    },
    ...(state.currentRoom.notifications || []),
  ];
  renderRoomNotifications(state.currentRoom);
  showToast(message.subject || 'Ø±Ø³Ø§Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø©', 'info');
}

async function loadLatestBackendOtp(room) {
  try {
    const data = await apiFetch(`/rooms/${room.id}/messages`);
    const latest = (data.messages || []).find((message) => message.otp);
    if (latest) applyOtpMessageDedup(latest);
  } catch (error) {
    console.warn('Latest OTP load failed:', error.message);
  }
}

async function pollRoomOtpNow(room) {
  if (!room?.backendRoom) return;
  try {
    const data = await apiFetch(`/rooms/${room.id}/imap/poll`, { method: 'POST' });
    const latest = (data.created || []).find((message) => message.otp);
    if (latest) {
      applyOtpMessageDedup(latest);
      return;
    }
    await loadLatestBackendOtp(room);
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
  }, 60000);
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
    applyRoomMessage(JSON.parse(event.data));
  });
  state.otpEventSource.onerror = () => {
    const timeEl = document.getElementById('otp-time-left');
    if (timeEl) timeEl.textContent = 'Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø§ØªØµØ§Ù„...';
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
// Auth â€” Login
// ===================================================
async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value.trim();
  let valid = true;

  clearFieldError('login-email');
  clearFieldError('login-password');

  if (!email) {
    showFieldError('login-email', 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù…Ø·Ù„ÙˆØ¨'); valid = false;
  } else if (!isValidEmail(email)) {
    showFieldError('login-email', 'Ø¨Ø±ÙŠØ¯ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØºÙŠØ± ØµØ­ÙŠØ­'); valid = false;
  }
  if (!pass) {
    showFieldError('login-password', 'ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ù…Ø·Ù„ÙˆØ¨Ø©'); valid = false;
  }
  if (!valid) return;

  const btn = document.getElementById('btn-login');
  setButtonLoading(btn, true);

  try {
    const backendSession = await loginWithBackend(email, pass, DEMO_USER.name);
    setButtonLoading(btn, false);
    loginSuccess(backendSession.user, backendSession.rooms, []);
    showToast('Ø£Ù‡Ù„Ø§Ù‹ Ø¨Ùƒ ÙÙŠ SubPay âœ…', 'success');
  } catch (error) {
    setButtonLoading(btn, false);
    showToast('Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¯Ø®ÙˆÙ„ ØºÙŠØ± ØµØ­ÙŠØ­Ø© Ø£Ùˆ Ø§Ù„Ø³ÙŠØ±ÙØ± ØºÙŠØ± Ù…ØªØ§Ø­', 'error');
  }
}

function handleGoogleLogin() {
  showToast('ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ø¬ÙˆØ¬Ù„ ØºÙŠØ± Ù…ÙØ¹Ù„ Ø­Ø§Ù„ÙŠØ§Ù‹. Ø§Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø¨Ø±ÙŠØ¯ ÙˆÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±.', 'warning', 5000);
}

function loginSuccess(user, rooms, notifs) {
  state.currentUser   = user;
  state.rooms         = JSON.parse(JSON.stringify(rooms)); // deep copy
  state.notifications = JSON.parse(JSON.stringify(notifs));
  loadHomeScreen();
  navigateTo('screen-home');
  setActiveNav('home');
  syncBackendRooms();
  startRoomsSyncLoop();
}

// ===================================================
// Auth â€” Register
// ===================================================
async function handleRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-password').value.trim();

  if (!name || !phone || !email || !pass) {
    showToast('ÙŠØ±Ø¬Ù‰ ØªØ¹Ø¨Ø¦Ø© Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø­Ù‚ÙˆÙ„', 'error'); return;
  }
  if (!isValidEmail(email)) {
    showToast('Ø¨Ø±ÙŠØ¯ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØºÙŠØ± ØµØ­ÙŠØ­', 'error'); return;
  }
  if (pass.length < 6) {
    showToast('ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† 6 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„', 'error'); return;
  }

  const btn = document.getElementById('btn-register');
  setButtonLoading(btn, true);

  try {
    const session = await registerWithBackend({ name, phone, email, password: pass });
    setButtonLoading(btn, false);
    loginSuccess(session.user, session.rooms, []);
    showToast('ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨Ùƒ Ø¨Ù†Ø¬Ø§Ø­ ðŸŽ‰', 'success');
  } catch (error) {
    setButtonLoading(btn, false);
    showToast(error.message || 'ÙØ´Ù„ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨', 'error');
  }
}

// ===================================================
// Auth â€” Forgot Password (3-step flow)
// ===================================================
let forgotStep = 0;

function handleForgotSend() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email || !isValidEmail(email)) {
    showToast('ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø¨Ø±ÙŠØ¯ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØµØ­ÙŠØ­', 'error'); return;
  }
  showToast('ØªÙ… Ø¥Ø±Ø³Ø§Ù„ ÙƒÙˆØ¯ Ø§Ù„ØªØ­Ù‚Ù‚ âœ‰ï¸', 'success');
  setForgotStep(1);
}

function handleForgotVerify() {
  const code = document.getElementById('forgot-code').value.trim();
  if (code.length < 4) {
    showToast('ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„ÙƒØ§Ù…Ù„', 'error'); return;
  }
  showToast('ØªÙ… Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„ÙƒÙˆØ¯ âœ…', 'success');
  setForgotStep(2);
}

function handleResetPassword() {
  const p1 = document.getElementById('forgot-new-pass').value;
  const p2 = document.getElementById('forgot-confirm-pass').value;
  if (!p1 || p1.length < 6) {
    showToast('ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† 6 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„', 'error'); return;
  }
  if (p1 !== p2) {
    showToast('ÙƒÙ„Ù…ØªØ§ Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± Ù…ØªØ·Ø§Ø¨Ù‚ØªÙŠÙ†', 'error'); return;
  }
  showToast('ØªÙ… ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¨Ù†Ø¬Ø§Ø­ ðŸ”’', 'success');
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
  const titles = ['Ø§Ø³ØªØ¹Ø§Ø¯Ø© ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ðŸ”‘', 'Ø£Ø¯Ø®Ù„ ÙƒÙˆØ¯ Ø§Ù„ØªØ­Ù‚Ù‚ ðŸ”', 'ÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ± Ø¬Ø¯ÙŠØ¯Ø© âœ¨'];
  const subs   = ['Ø£Ø¯Ø®Ù„ Ø¨Ø±ÙŠØ¯Ùƒ Ù„Ø¥Ø±Ø³Ø§Ù„ ÙƒÙˆØ¯ Ø§Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø©', 'ØªØ­Ù‚Ù‚ Ù…Ù† Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ', 'Ø§Ø®ØªØ± ÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ± Ø¬Ø¯ÙŠØ¯Ø© ÙˆØ¢Ù…Ù†Ø©'];
  const t = document.getElementById('forgot-title');
  const s = document.getElementById('forgot-subtitle');
  if (t) t.textContent = titles[step];
  if (s) s.textContent = subs[step];
}

function handleLogout() {
  // Stop OTP timer
  if (state.otpInterval) { clearInterval(state.otpInterval); state.otpInterval = null; }
  closeOtpRealtime();
  if (state.roomsSyncInterval) { clearInterval(state.roomsSyncInterval); state.roomsSyncInterval = null; }
  state.authToken = '';
  localStorage.removeItem('subpay_token');
  state.currentUser  = null;
  state.rooms        = [];
  state.currentRoom  = null;
  showToast('ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬ Ø¨Ù†Ø¬Ø§Ø­', 'info');
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
        <div class="empty-title">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø±ÙˆÙ… Ø¨Ø¹Ø¯</div>
        <div class="empty-subtitle">Ø§Ù†Ø¶Ù… Ù„Ø±ÙˆÙ… Ø¨ÙƒÙˆØ¯ Ø¯Ø¹ÙˆØ© Ù…Ù† Ø§Ù„Ø£Ø¯Ù…Ù†</div>
        <button class="btn btn-primary" style="max-width:200px;margin-top:8px" onclick="openModal('modal-join')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Ø§Ù†Ø¶Ù… Ù„Ø±ÙˆÙ…
        </button>
      </div>`;
    return;
  }

  list.innerHTML = state.rooms.map(room => `
    <div class="room-card fade-in" onclick="openRoom('${room.id}')">
      <div class="room-icon ${room.iconClass}">${room.icon}</div>
      <div class="room-info">
        <div class="room-name">${room.name}</div>
        <div class="room-meta">${room.members} Ø£Ø¹Ø¶Ø§Ø¡ Â· ÙŠÙØ¬Ø¯Ø¯ ${room.renewDate}</div>
        <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">
          ${room.isPaid
            ? '<span class="badge badge-success"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Ù…Ø¯ÙÙˆØ¹</span>'
            : '<span class="badge badge-danger">âš  ØºÙŠØ± Ù…Ø¯ÙÙˆØ¹</span>'
          }
          <span class="badge badge-primary">${room.price} ${room.currency}/Ø´Ù‡Ø±</span>
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
      'Ù„Ù… ÙŠØªÙ… Ø³Ø¯Ø§Ø¯ Ø§Ø´ØªØ±Ø§Ùƒ ' + room.name + ' Ù„Ù„Ø´Ù‡Ø± Ø§Ù„Ø¬Ø§Ø±ÙŠ. Ø§Ø¯ÙØ¹ Ù„Ù„ÙˆØµÙˆÙ„ Ù„Ø¬Ù…ÙŠØ¹ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø±ÙˆÙ….';
    document.getElementById('locked-amount').innerHTML =
      room.price + ' <span>' + room.currency + '/Ø´Ù‡Ø±</span>';
    navigateTo('screen-unpaid');
    return;
  }

  renderRoomHeader(room);

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
  const adminMessageActions = document.getElementById('room-admin-message-actions');
  if (adminMessageActions) {
    adminMessageActions.style.display = room.isAdmin ? 'block' : 'none';
  }

  // Reset to first tab
  switchTab('room', 'data');

  navigateTo('screen-room');
}

function renderRoomHeader(room) {
  const iconEl = document.getElementById('room-detail-icon');
  if (iconEl) {
    if (room.imageUrl) {
      iconEl.innerHTML = `<img src="${room.imageUrl}" alt="">`;
      iconEl.classList.add('has-image');
    } else {
      iconEl.textContent = room.icon;
      iconEl.classList.remove('has-image');
    }
  }
  document.getElementById('room-detail-name').textContent = room.name;
  document.getElementById('room-detail-meta').textContent =
    `${room.members} أعضاء · ${room.isAdmin ? `${room.membersList.filter((m) => m.paid).length} مدفوع` : (room.isPaid ? 'مدفوع' : 'مطلوب الدفع')}`;
}

function renderRoomInfoCard(room) {
  const card = document.getElementById('room-info-card');
  if (!card) return;
  card.innerHTML = `
    ${room.isAdmin ? `
      <div class="info-row">
        <span class="info-key">رسالة للمشتركين</span>
        <span class="info-val">
          <button class="toggle-vis" onclick="openModal('modal-admin-message')" title="إرسال رسالة">اكتب رسالة</button>
        </span>
      </div>
      <div class="info-row">
        <span class="info-key">مدة صلاحية OTP</span>
        <span class="info-val" style="gap:8px">
          <input id="room-otp-ttl-input" class="form-input ltr" type="number" min="1" max="60" value="${room.otpTtlMinutes || 5}" style="width:82px;padding:8px 10px">
          <span>دقيقة</span>
          <button class="toggle-vis" onclick="saveRoomOtpTtl()" title="حفظ مدة OTP">حفظ</button>
        </span>
      </div>
    ` : ''}
    <div class="info-row">
      <span class="info-key">كود الدعوة</span>
      <span class="info-val" style="gap:8px">
        <span class="mono" style="direction:ltr;text-align:left">${room.code || '--'}</span>
        <button class="toggle-vis" onclick="copyRoomInviteCode()" title="نسخ كود الدعوة">نسخ</button>
      </span>
    </div>
    <div class="info-row">
      <span class="info-key">Ø§Ù„Ø®Ø¯Ù…Ø©</span>
      <span class="info-val">${room.service}</span>
    </div>
    <div class="info-row">
      <span class="info-key">Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø´Ù‡Ø±ÙŠ</span>
      <span class="info-val">${room.price} ${room.currency}</span>
    </div>
    <div class="info-row">
      <span class="info-key">ØªØ§Ø±ÙŠØ® Ø§Ù„ØªØ¬Ø¯ÙŠØ¯</span>
      <span class="info-val">${room.renewDate}</span>
    </div>
    <div class="info-row">
      <span class="info-key">Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…</span>
      <span class="info-val mono" style="direction:ltr;text-align:left">${room.username}</span>
    </div>
    <div class="info-row" style="border-bottom:none">
      <span class="info-key">ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±</span>
      <span class="info-val" style="gap:8px">
        <span class="mono blurred" id="room-pass-val" style="direction:ltr;letter-spacing:2px">${room.password}</span>
        <button class="toggle-vis" id="room-pass-toggle" onclick="toggleRoomPassword()" title="Ø¥Ø¸Ù‡Ø§Ø± / Ø¥Ø®ÙØ§Ø¡">
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

async function saveRoomOtpTtl() {
  if (!state.currentRoom?.id) return;
  const input = document.getElementById('room-otp-ttl-input');
  const otpTtlMinutes = Number(input?.value || 5);
  if (!Number.isFinite(otpTtlMinutes) || otpTtlMinutes < 1 || otpTtlMinutes > 60) {
    showToast('مدة OTP لازم تكون من 1 إلى 60 دقيقة', 'error');
    return;
  }
  try {
    const result = await apiFetch(`/rooms/${state.currentRoom.id}/settings`, {
      method: 'PATCH',
      body: JSON.stringify({ otpTtlMinutes }),
    });
    const room = normalizeBackendRoom(result.room);
    state.currentRoom = room;
    state.rooms = [room, ...state.rooms.filter((item) => item.id !== room.id)];
    renderRoomInfoCard(room);
    showToast('تم حفظ مدة صلاحية OTP', 'success');
  } catch (error) {
    showToast(error.message || 'فشل حفظ مدة OTP', 'error');
  }
}

async function copyRoomInviteCode() {
  const code = state.currentRoom?.code;
  if (!code) {
    showToast('Ù„Ø§ ÙŠÙˆØ¬Ø¯ ÙƒÙˆØ¯ Ø¯Ø¹ÙˆØ© Ù„Ù„Ø±ÙˆÙ…', 'error');
    return;
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
      showToast(`ÙƒÙˆØ¯ Ø§Ù„Ø±ÙˆÙ…: ${code}`, 'info', 9000);
    } else {
      const input = document.createElement('textarea');
      input.value = code;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    showToast('ØªÙ… Ù†Ø³Ø® ÙƒÙˆØ¯ Ø§Ù„Ø¯Ø¹ÙˆØ©', 'success');
  } catch (error) {
    showToast('Ø§Ù†Ø³Ø® Ø§Ù„ÙƒÙˆØ¯ ÙŠØ¯ÙˆÙŠØ§Ù‹: ' + code, 'info', 6000);
  }
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
    if (timeEl) timeEl.textContent = state.currentRoom.latestOtp ? 'Ø¢Ø®Ø± ÙƒÙˆØ¯ Ù…Ø­ÙÙˆØ¸' : 'Ø¨Ø§Ù†ØªØ¸Ø§Ø± OTP';
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
    list.innerHTML = emptyState('Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ù„Ù‡Ø°Ù‡ Ø§Ù„Ø±ÙˆÙ…', 'bell');
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

  if (actDiv) {
    actDiv.style.display = room.isAdmin ? 'block' : 'none';
    if (room.isAdmin) {
      const paidCount = room.membersList.filter((member) => member.paid).length;
      actDiv.innerHTML = `
        <div class="info-card" style="margin-bottom:12px">
          <div class="info-row">
            <span class="info-key">المشتركين</span>
            <span class="info-val">${room.membersList.length} عضو · ${paidCount} On</span>
          </div>
          <div class="info-row" style="border-bottom:none">
            <span class="info-key">كود الروم</span>
            <span class="info-val" style="gap:8px">
              <span class="mono" style="direction:ltr;text-align:left">${room.code || '--'}</span>
              <button class="toggle-vis" onclick="copyRoomInviteCode()" title="نسخ كود الروم">نسخ</button>
            </span>
          </div>
        </div>
        <div class="admin-action-row">
          <button class="btn btn-outline" onclick="openModal('modal-add-member')">إضافة عضو</button>
          <button class="btn btn-outline" onclick="resetRoomPayments()">تجديد شهر: الكل Off</button>
        </div>
      `;
    }
  }

  list.innerHTML = room.membersList.map(m => `
    <div class="member-item fade-in">
      <div class="member-avatar">${m.avatar}</div>
      <div class="member-info">
        <div class="member-name">${m.name}</div>
        <div class="member-email">${m.email}</div>
        <div style="margin-top:5px;display:flex;gap:4px;flex-wrap:wrap">
          ${roleBadge(m.role)}
          ${m.paid
            ? '<span class="badge badge-success">On · مدفوع</span>'
            : '<span class="badge badge-danger">Off · مطلوب دفع</span>'}
        </div>
      </div>
      ${(room.isAdmin && m.role !== 'owner') ? `
        <div class="member-actions">
          <button class="btn btn-xs ${m.paid ? 'btn-danger' : 'btn-success'}" onclick="toggleMemberPayment('${m.id}', ${m.paid ? 'false' : 'true'})">${m.paid ? 'Off' : 'On'}</button>
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

async function toggleMemberPayment(memberId, paid) {
  if (!state.currentRoom?.id) return;
  try {
    const result = await apiFetch(`/rooms/${state.currentRoom.id}/members/${memberId}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paid }),
    });
    const room = normalizeBackendRoom(result.room);
    state.currentRoom = room;
    state.rooms = [room, ...state.rooms.filter((item) => item.id !== room.id)];
    renderRoomHeader(room);
    renderRoomMembers(room);
    renderRoomsList();
    showToast(paid ? 'تم فتح وصول العضو' : 'تم إيقاف وصول العضو', 'success');
  } catch (error) {
    showToast(error.message || 'فشل تعديل حالة الدفع', 'error');
  }
}

async function resetRoomPayments() {
  if (!state.currentRoom?.id) return;
  try {
    const result = await apiFetch(`/rooms/${state.currentRoom.id}/members/reset-payments`, { method: 'POST' });
    const room = normalizeBackendRoom(result.room);
    state.currentRoom = room;
    state.rooms = [room, ...state.rooms.filter((item) => item.id !== room.id)];
    renderRoomHeader(room);
    renderRoomMembers(room);
    renderRoomsList();
    showToast('تم إيقاف كل المشتركين غير الأونر لبداية التجديد', 'success', 6000);
  } catch (error) {
    showToast(error.message || 'فشل بدء دورة التجديد', 'error');
  }
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
  const months = ['ÙŠÙ†Ø§ÙŠØ±','ÙØ¨Ø±Ø§ÙŠØ±','Ù…Ø§Ø±Ø³','Ø£Ø¨Ø±ÙŠÙ„','Ù…Ø§ÙŠÙˆ','ÙŠÙˆÙ†ÙŠÙˆ','ÙŠÙˆÙ„ÙŠÙˆ','Ø£ØºØ³Ø·Ø³','Ø³Ø¨ØªÙ…Ø¨Ø±','Ø£ÙƒØªÙˆØ¨Ø±','Ù†ÙˆÙÙ…Ø¨Ø±','Ø¯ÙŠØ³Ù…Ø¨Ø±'];
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
        date:   'Ø§Ù„Ø¢Ù†',
        method: paymentMethodLabel(state.selectedPaymentMethod),
        status: 'success',
      });
      loadHomeScreen();
      showToast('ØªÙ… Ø§Ù„Ø¯ÙØ¹ Ø¨Ù†Ø¬Ø§Ø­ âœ…', 'success');
      setTimeout(() => openRoom(state.currentRoom.id), 700);
    }
  }, 1500);
}

function paymentMethodLabel(m) {
  return { instapay:'InstaPay', wallet:'Ø§Ù„Ù…Ø­ÙØ¸Ø©', card:'Ø¨Ø·Ø§Ù‚Ø© Ø¨Ù†ÙƒÙŠØ©' }[m] || m;
}

// ===================================================
// Notifications
// ===================================================
function renderNotificationsList() {
  const list = document.getElementById('notifs-list');
  if (!list) return;
  if (state.notifications.length === 0) {
    list.innerHTML = emptyState('Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª', 'bell');
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
  showToast('ØªÙ… ØªØ­Ø¯ÙŠØ¯ Ø§Ù„ÙƒÙ„ ÙƒÙ…Ù‚Ø±ÙˆØ¡ âœ…', 'success');
}

// ===================================================
// Payment History
// ===================================================
function renderHistoryList() {
  const list = document.getElementById('history-list');
  if (!list) return;
  if (DEMO_HISTORY.length === 0) {
    list.innerHTML = emptyState('Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø¹Ø§Ù…Ù„Ø§Øª Ø¨Ø¹Ø¯', 'card');
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
        <div style="font-size:12px;color:var(--text-muted)">${h.method} Â· ${h.date}</div>
      </div>
      <div style="font-size:16px;font-weight:800;flex-shrink:0;
        ${h.status === 'success' ? 'color:var(--success)' : 'color:var(--danger)'}">
        ${h.amount} Ø¬
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
async function handleJoinRoom() {
  const input   = document.getElementById('join-code-input');
  const errorEl = document.getElementById('join-code-error');
  const errTxt  = document.getElementById('join-code-error-text');
  const code    = input ? input.value.trim() : '';

  if (errorEl) errorEl.style.display = 'none';

  if (!code) {
    if (errorEl) errorEl.style.display = 'flex';
    if (errTxt)  errTxt.textContent    = 'ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ ÙƒÙˆØ¯ Ø§Ù„Ø¯Ø¹ÙˆØ©';
    return;
  }
  if (code.length < 4) {
    if (errorEl) errorEl.style.display = 'flex';
    if (errTxt)  errTxt.textContent    = 'Ø§Ù„ÙƒÙˆØ¯ Ù‚ØµÙŠØ± Ø¬Ø¯Ø§Ù‹';
    return;
  }

  const btn = document.getElementById('btn-join-confirm');
  setButtonLoading(btn, true);
  try {
    const result = await apiFetch('/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    const room = normalizeBackendRoom(result.room);
    state.rooms = [room, ...state.rooms.filter((item) => item.id !== room.id)];
    renderRoomsList();
    closeModal('modal-join');
    if (input) input.value = '';
    showToast('ØªÙ… Ø§Ù„Ø§Ù†Ø¶Ù…Ø§Ù… Ù„Ù„Ø±ÙˆÙ… Ø¨Ù†Ø¬Ø§Ø­ ðŸŽ‰', 'success');
  } catch (error) {
    if (errorEl) errorEl.style.display = 'flex';
    if (errTxt) errTxt.textContent = 'ÙƒÙˆØ¯ Ø§Ù„Ø¯Ø¹ÙˆØ© ØºÙŠØ± ØµØ­ÙŠØ­ Ø£Ùˆ ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£ÙˆÙ„Ø§Ù‹';
  } finally {
    setButtonLoading(btn, false);
  }
}

async function handleCreateRoom() {
  if (state.currentUser?.role !== 'admin') {
    showToast('Ø­Ø³Ø§Ø¨ Ø£Ø¯Ù…Ù† Ù…Ø·Ù„ÙˆØ¨ Ù„Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø±ÙˆÙ…Ø§Øª', 'error');
    return;
  }

  const name = document.getElementById('create-room-name')?.value.trim();
  const imageFile = document.getElementById('create-room-image')?.files?.[0];
  const subscriptionEmail = document.getElementById('create-room-sub-email')?.value.trim();
  const password = document.getElementById('create-room-sub-password')?.value.trim();
  const monthlyPrice = document.getElementById('create-room-price')?.value.trim();
  const otpTtlMinutes = document.getElementById('create-room-otp-ttl')?.value.trim();
  const imapEmail = document.getElementById('create-room-imap-email')?.value.trim();
  const imapAppPassword = document.getElementById('create-room-imap-password')?.value.trim();

  if (!name || !subscriptionEmail || !password || !imapEmail || !imapAppPassword) {
    showToast('Ø§Ù…Ù„Ø£ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø±ÙˆÙ… ÙˆØ§Ù„Ù…ÙŠÙ„ Ø¨Ø§Ù„ÙƒØ§Ù…Ù„', 'error');
    return;
  }
  if (!isValidEmail(subscriptionEmail) || !isValidEmail(imapEmail)) {
    showToast('ØªØ£ÙƒØ¯ Ù…Ù† ØµØ­Ø© Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„Ø§Øª', 'error');
    return;
  }

  const btn = document.getElementById('btn-create-room-confirm');
  setButtonLoading(btn, true);
  try {
    const imageUrl = imageFile ? await imageFileToDataUrl(imageFile) : '';
    const result = await apiFetch('/rooms', {
      method: 'POST',
      body: JSON.stringify({
        name,
        imageUrl,
        subscriptionEmail,
        password,
        monthlyPrice: Number(monthlyPrice || 0),
        otpTtlMinutes: Number(otpTtlMinutes || 5),
        inboundEmail: imapEmail,
        imapEmail,
        imapAppPassword,
      }),
    });
    const room = normalizeBackendRoom(result.room);
    state.rooms.unshift(room);
    renderRoomsList();
    closeModal('modal-create-room');
    ['create-room-name', 'create-room-image', 'create-room-sub-email', 'create-room-sub-password', 'create-room-price', 'create-room-otp-ttl', 'create-room-imap-email', 'create-room-imap-password']
      .forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.value = '';
      });
    const ttlInput = document.getElementById('create-room-otp-ttl');
    if (ttlInput) ttlInput.value = '5';
    showToast(`ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø±ÙˆÙ…. ÙƒÙˆØ¯ Ø§Ù„Ø¯Ø¹ÙˆØ©: ${room.code}`, 'success', 6000);
  } catch (error) {
    showToast(error.message || 'ÙØ´Ù„ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø±ÙˆÙ…', 'error');
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

function imageFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة الصورة'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('فشل تجهيز الصورة'));
      img.onload = () => {
        const size = 360;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const scale = Math.max(size / img.width, size / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        ctx.drawImage(img, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (input) input.type = input.type === 'password' ? 'text' : 'password';
}

function fixAdminArabicText() {
  const createTitle = document.querySelector('#modal-create-room .modal-title');
  if (createTitle) createTitle.textContent = 'إنشاء روم جديد';

  const labels = [
    ['create-room-name', 'اسم الروم'],
    ['create-room-sub-email', 'إيميل الاشتراك'],
    ['create-room-sub-password', 'باسورد الاشتراك'],
    ['create-room-price', 'السعر الشهري'],
    ['create-room-imap-email', 'Gmail الذي يستقبل OTP'],
    ['create-room-imap-password', 'Gmail App Password'],
  ];
  labels.forEach(([id, text]) => {
    const input = document.getElementById(id);
    const label = input?.closest('.form-group')?.querySelector('.form-label');
    if (label) label.textContent = text;
  });

  if (!document.getElementById('create-room-otp-ttl')) {
    const priceGroup = document.getElementById('create-room-price')?.closest('.form-group');
    priceGroup?.insertAdjacentHTML('afterend', `
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">مدة صلاحية OTP بالدقائق</label>
        <input type="number" class="form-input ltr" id="create-room-otp-ttl" placeholder="5" min="1" max="60" value="5">
      </div>
    `);
  }

  const createBtn = document.getElementById('btn-create-room-confirm');
  if (createBtn) createBtn.textContent = 'إنشاء وربط OTP';
  const createCancel = document.querySelector('#modal-create-room .btn-outline');
  if (createCancel) createCancel.textContent = 'إلغاء';
  const adminMessageTitle = document.querySelector('#modal-admin-message .modal-title');
  if (adminMessageTitle) adminMessageTitle.textContent = 'رسالة للمشتركين';
  const subject = document.getElementById('admin-message-subject');
  if (subject) {
    subject.placeholder = 'تحديث بيانات الاشتراك';
    const label = subject.closest('.form-group')?.querySelector('.form-label');
    if (label) label.textContent = 'عنوان الرسالة';
  }
  const body = document.getElementById('admin-message-body');
  if (body) {
    body.placeholder = 'اكتب الرسالة التي ستظهر لكل أعضاء الروم';
    const label = body.closest('.form-group')?.querySelector('.form-label');
    if (label) label.textContent = 'نص الرسالة';
  }
  const sendBtn = document.getElementById('btn-admin-message-confirm');
  if (sendBtn) sendBtn.textContent = 'إرسال الرسالة';
  const messageCancel = document.querySelector('#modal-admin-message .btn-outline');
  if (messageCancel) messageCancel.textContent = 'إلغاء';
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

async function handleAddMember() {
  const emailInput = document.getElementById('add-member-email');
  const email = emailInput ? emailInput.value.trim() : '';
  if (!email || !isValidEmail(email)) {
    showToast('Ø¨Ø±ÙŠØ¯ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØºÙŠØ± ØµØ­ÙŠØ­', 'error');
    return;
  }
  if (!state.currentRoom?.id) return;

  const btn = document.getElementById('btn-add-member-confirm');
  setButtonLoading(btn, true);
  try {
    const result = await apiFetch(`/rooms/${state.currentRoom.id}/members`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    const room = normalizeBackendRoom(result.room);
    state.currentRoom = room;
    state.rooms = [room, ...state.rooms.filter((item) => item.id !== room.id)];
    renderRoomsList();
    renderRoomMembers(room);
    closeModal('modal-add-member');
    if (emailInput) emailInput.value = '';
    if (result.inviteRequired) {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(result.code).catch(() => {});
      showToast(`Ø§Ù„Ø¹Ø¶Ùˆ Ù„Ù… ÙŠÙ†Ø´Ø¦ Ø­Ø³Ø§Ø¨Ø§Ù‹ Ø¨Ø¹Ø¯. Ø§Ø¨Ø¹Øª Ù„Ù‡ ÙƒÙˆØ¯ Ø§Ù„Ø±ÙˆÙ…: ${result.code}`, 'info', 8000);
    } else {
      showToast('ØªÙ…Øª Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø¹Ø¶Ùˆ Ù„Ù„Ø±ÙˆÙ…', 'success');
    }
  } catch (error) {
    showToast(error.message || 'ÙØ´Ù„ Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø¹Ø¶Ùˆ', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

async function handleAdminMessage() {
  if (!state.currentRoom?.id) return;
  const subjectInput = document.getElementById('admin-message-subject');
  const bodyInput = document.getElementById('admin-message-body');
  const subject = subjectInput ? subjectInput.value.trim() : '';
  const body = bodyInput ? bodyInput.value.trim() : '';
  if (!subject || !body) {
    showToast('Ø§ÙƒØªØ¨ Ø¹Ù†ÙˆØ§Ù† ÙˆÙ†Øµ Ø§Ù„Ø±Ø³Ø§Ù„Ø©', 'error');
    return;
  }

  const btn = document.getElementById('btn-admin-message-confirm');
  setButtonLoading(btn, true);
  try {
    const result = await apiFetch(`/rooms/${state.currentRoom.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ type: 'admin', subject, body }),
    });
    const message = result.message;
    state.currentRoom.notifications = [
      {
        id: message.id,
        title: message.subject,
        body: message.body,
        time: formatRelativeTime(message.createdAt),
        type: 'success',
        unread: true,
      },
      ...(state.currentRoom.notifications || []).filter((item) => item.id !== message.id),
    ];
    renderRoomNotifications(state.currentRoom);
    closeModal('modal-admin-message');
    if (subjectInput) subjectInput.value = '';
    if (bodyInput) bodyInput.value = '';
    showToast('ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ù„Ù„Ù…Ø´ØªØ±ÙƒÙŠÙ†', 'success');
  } catch (error) {
    showToast(error.message || 'ÙØ´Ù„ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø±Ø³Ø§Ù„Ø©', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

// ===================================================
// Event Listeners (after DOM ready)
// ===================================================
function setupEventListeners() {
  const addMemberServerBtn = document.getElementById('btn-add-member-confirm');
  if (addMemberServerBtn) {
    addMemberServerBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      handleAddMember();
    }, true);
  }

  const adminMessageBtn = document.getElementById('btn-admin-message-confirm');
  if (adminMessageBtn) adminMessageBtn.addEventListener('click', handleAdminMessage);

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
        showToast('Ø¨Ø±ÙŠØ¯ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØºÙŠØ± ØµØ­ÙŠØ­', 'error'); return;
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
      showToast('ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¯Ø¹ÙˆØ© âœ…', 'success');
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
      showToast('ØªÙ… Ø¥Ø²Ø§Ù„Ø© Ø§Ù„Ø¹Ø¶Ùˆ', 'success');
    });
  }

  // Delete Account confirm
  const deleteBtn = document.getElementById('btn-delete-confirm');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const val = (document.getElementById('delete-confirm-input') || {}).value || '';
      if (val.trim() !== 'Ø§Ø­Ø°Ù Ø­Ø³Ø§Ø¨ÙŠ') {
        showToast('Ø§ÙƒØªØ¨ "Ø§Ø­Ø°Ù Ø­Ø³Ø§Ø¨ÙŠ" Ø¨Ø§Ù„Ø¶Ø¨Ø· Ù„Ù„ØªØ£ÙƒÙŠØ¯', 'error'); return;
      }
      if (state.otpInterval) clearInterval(state.otpInterval);
      closeModal('modal-delete-account');
      showToast('ØªÙ… Ø­Ø°Ù Ø§Ù„Ø­Ø³Ø§Ø¨ Ù†Ù‡Ø§Ø¦ÙŠØ§Ù‹', 'info');
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

  // Auto-advance splash â†’ login
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
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => registration.update().catch(() => {}))
      .catch((error) => {
        console.warn('Service worker registration failed:', error.message);
      });
  });
}

