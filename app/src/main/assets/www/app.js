const OTP_TTL_MS = 5 * 60 * 1000;

const initialState = {
  language: "ar",
  user: {
    name: "أحمد محمد علي",
    email: "ahmed@example.com",
    phone: "01000000000",
    avatar: "SP"
  },
  selectedRoomId: "chatgpt",
  activeTab: "messages",
  paymentMethod: "visa",
  rooms: [
    roomSeed({
      id: "chatgpt",
      name: "ChatGPT Room",
      code: "GPT728",
      inviteLink: "subpay://join/GPT728",
      inboundEmail: "chatgpt-room@subpay.app",
      subscriptionEmail: "team.chatgpt@gmail.com",
      monthlyPrice: 50,
      password: "Chat@2026",
      paid: true,
      color: "technical",
      art: "AI",
      members: [
        { name: "أحمد محمد علي", email: "ahmed@example.com" },
        { name: "Eman Mohamed", email: "eman@example.com" }
      ],
      messages: [
        emailMessage("كود تسجيل دخول ChatGPT", "Your login code is 839221. It expires soon.", "noreply@openai.com", Date.now() - 85000),
        noteMessage("تم تجديد الاشتراك لهذا الشهر. قيمة الاشتراك 50 جنيه.", "admin", Date.now() - 4500000)
      ]
    }),
    roomSeed({
      id: "medical",
      name: "Medical Room",
      code: "MED204",
      inviteLink: "subpay://join/MED204",
      inboundEmail: "medical-room@subpay.app",
      subscriptionEmail: "medical.shared@gmail.com",
      monthlyPrice: 50,
      password: "Medi5165@",
      paid: true,
      color: "medical",
      art: "MD",
      members: [
        { name: "أحمد محمد علي", email: "ahmed@example.com" },
        { name: "Mohamed Bahaa", email: "mark@example.com" }
      ],
      messages: [
        emailMessage("OTP جديد", "رمز التحقق الخاص بك هو 512904", "service@medical.com", Date.now() - 220000)
      ]
    }),
    roomSeed({
      id: "got",
      name: "GOT Room",
      code: "GOT991",
      inviteLink: "subpay://join/GOT991",
      inboundEmail: "got-room@subpay.app",
      subscriptionEmail: "got.shared@gmail.com",
      monthlyPrice: 40,
      password: "Series@2026",
      paid: false,
      color: "media",
      art: "GT",
      members: [{ name: "أحمد محمد علي", email: "ahmed@example.com" }],
      messages: []
    })
  ],
  wallet: {
    balance: 0,
    methods: [
      { id: "visa", label: "Visa", enabled: false },
      { id: "vodafone", label: "Vodafone Cash", enabled: false }
    ],
    transactions: [
      { title: "اشتراك ChatGPT Room", amount: 50, status: "مدفوع", date: "يونيو 2026" },
      { title: "اشتراك Medical Room", amount: 50, status: "مدفوع", date: "يونيو 2026" }
    ]
  }
};

let state = loadState();

function roomSeed(room) {
  return room;
}

function emailMessage(subject, body, from, createdAt) {
  const otp = extractOtp(body);
  return {
    id: id(),
    type: "email",
    subject,
    body,
    from,
    createdAt,
    otp,
    otpExpiresAt: otp ? createdAt + OTP_TTL_MS : null
  };
}

function noteMessage(body, from, createdAt) {
  return {
    id: id(),
    type: "note",
    subject: "رسالة داخل الروم",
    body,
    from,
    createdAt,
    otp: extractOtp(body),
    otpExpiresAt: extractOtp(body) ? createdAt + OTP_TTL_MS : null
  };
}

function id() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function extractOtp(text) {
  const match = String(text).match(/\b\d{4,8}\b/);
  return match ? match[0] : null;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("subpay-state-v2"));
    return saved ? mergeState(initialState, saved) : structuredClone(initialState);
  } catch (_) {
    return structuredClone(initialState);
  }
}

function mergeState(base, saved) {
  return { ...structuredClone(base), ...saved, user: { ...base.user, ...saved.user }, wallet: { ...base.wallet, ...saved.wallet } };
}

function save() {
  localStorage.setItem("subpay-state-v2", JSON.stringify(state));
}

function go(route) {
  location.hash = route;
}

function route() {
  return location.hash.replace("#", "") || "splash";
}

function currentRoom() {
  return state.rooms.find((room) => room.id === state.selectedRoomId) || state.rooms[0];
}

const routes = {
  splash: () => `
    <section class="splash">
      <div class="brand">SubPay</div>
    </section>
  `,
  login: () => authLayout("تسجيل الدخول", `
    ${field("البريد الإلكتروني", "email", state.user.email, "ltr")}
    ${field("كلمة المرور", "password", "", "ltr", "password")}
    <button class="small-link" data-go="forgot">هل نسيت كلمة السر؟</button>
    <button class="primary-btn" data-login-submit>تسجيل الدخول</button>
    ${socialLogin()}
    <p class="auth-note">ليس لديك حساب؟ <button class="small-link" data-go="register">إنشاء حساب</button></p>
  `),
  register: () => authLayout("إنشاء حساب جديد", `
    ${field("اسم المستخدم", "name", "", "")}
    ${field("رقم الهاتف", "phone", "", "ltr")}
    ${field("البريد الإلكتروني", "email", "", "ltr")}
    ${field("كلمة المرور", "password", "", "ltr", "password")}
    <button class="primary-btn" data-register-submit>إنشاء حساب</button>
    ${socialLogin()}
    <p class="auth-note">لديك حساب؟ <button class="small-link" data-go="login">تسجيل الدخول</button></p>
  `),
  forgot: () => page("تغيير كلمة السر", `
    <p style="text-align:center;color:#666;line-height:1.8">ادخل بريدك الإلكتروني لإرسال كود تغيير كلمة السر</p>
    ${field("البريد الإلكتروني", "email", state.user.email, "ltr")}
  `, { back: true, bottom: `<button class="primary-btn" data-go="reset">أرسل الكود</button>` }),
  reset: () => page("تغيير كلمة السر", `
    ${field("الكود", "code", "", "ltr")}
    ${field("كلمة السر الجديدة", "new_password", "", "ltr", "password")}
  `, { back: true, bottom: `<button class="primary-btn" data-go="login">حفظ</button>` }),
  home: () => page("الصفحة الرئيسية", `
    <div class="home-head">
      <h2 class="section-title">روماتي</h2>
      <button class="icon-btn" data-go="profile" title="الملف الشخصي">حساب</button>
    </div>
    <div class="rooms-grid">
      ${state.rooms.map(roomCard).join("")}
    </div>
  `, { nav: "home", bottom: `<button class="primary-btn" data-go="join">دخول روم بكود</button>` }),
  wallet: () => page("المحفظة", `
    <div class="card" style="text-align:center">
      <p style="margin:0;color:#666">الرصيد الحالي</p>
      <p style="font-size:34px;margin:14px 0;color:var(--primary);font-weight:700">${state.wallet.balance} جنيه</p>
    </div>
    <h2 class="section-title">طرق الدفع</h2>
    ${state.wallet.methods.map(methodCard).join("")}
    <h2 class="section-title" style="margin-top:24px">سجل المدفوعات</h2>
    ${state.wallet.transactions.map(txCard).join("")}
  `, { nav: "wallet" }),
  profile: () => page("الملف الشخصي", `
    <div class="card profile-card">
      <div class="avatar">${state.user.avatar}</div>
      <div>
        <div class="member-name">${state.user.name}</div>
        <div class="member-email">${state.user.email}</div>
      </div>
      <button class="icon-btn" data-go="edit-profile">تعديل</button>
    </div>
    <div class="card menu">
      <button data-go="language"><span>اللغة</span><span>${state.language === "ar" ? "العربية" : "English"}</span></button>
      <button data-go="notifications"><span>الإشعارات</span><span>جرس</span></button>
      <button data-go="create-room"><span>إنشاء روم</span><span>+</span></button>
      <button data-go="faq"><span>معلومات عنا</span><span>؟</span></button>
      <button data-go="login"><span>تسجيل الخروج</span><span>خروج</span></button>
    </div>
  `, { nav: "profile" }),
  "edit-profile": () => page("تعديل الملف الشخصي", `
    <div style="display:grid;place-items:center;margin:12px 0 28px"><div class="avatar" style="width:96px;height:96px">${state.user.avatar}</div></div>
    ${field("الاسم", "name", state.user.name)}
    ${field("البريد الإلكتروني", "email", state.user.email, "ltr")}
    ${field("رقم الهاتف", "phone", state.user.phone, "ltr")}
  `, { back: true, bottom: `<button class="primary-btn" data-save-profile>حفظ</button>` }),
  language: () => page("اللغة", `
    ${choice("ar", "العربية", state.language === "ar", "data-lang")}
    ${choice("en", "English", state.language === "en", "data-lang")}
  `, { back: true }),
  "create-room": () => page("إنشاء روم جديدة", `
    ${field("اسم الروم", "room_name", "", "", "text", "مثال: ChatGPT Room")}
    ${field("إيميل استقبال الرسائل", "room_inbound_email", "", "ltr", "email", "room@subpay.app")}
    ${field("إيميل الاشتراك الأصلي", "room_subscription_email", "", "ltr", "email", "subscription@example.com")}
    ${field("سعر الاشتراك الشهري", "room_price", "50", "ltr")}
    <p class="room-form-note">هذا الإيميل هو مصدر الرسائل داخل الروم. أي OTP أو رسالة يتم استقبالها عليه تظهر في الروم، وصلاحية OTP خمس دقائق.</p>
  `, { back: true, bottom: `<button class="primary-btn" data-create-room>إنشاء الروم</button>` }),
  "room-created": () => {
    const room = currentRoom();
    return page("تم إنشاء الروم", `
      <div class="card" style="text-align:center;line-height:1.8">
        <p style="font-size:42px;margin:0;color:var(--ok)">✓</p>
        <h2>${room.name}</h2>
        <p>استخدم الكود أو اللينك لدعوة المستخدمين.</p>
        <div class="otp-box">
          <div class="otp-code">${room.code}</div>
          <button class="secondary-btn" data-copy="${room.code}">نسخ الكود</button>
        </div>
        <p class="ltr">${room.inviteLink}</p>
      </div>
    `, { back: true, bottom: `<button class="primary-btn" data-go="room">فتح الروم</button>` });
  },
  join: () => page("دخول روم بكود", `
    <p style="text-align:center;color:#666;line-height:1.9;margin-top:120px">ادخل كود الروم الذي أرسله لك صاحب الروم</p>
    <input class="input code-input" id="join_code" maxlength="8" placeholder="GPT728">
  `, { back: true, bottom: `<button class="primary-btn" data-join-room>دخول</button>` }),
  room: () => {
    const room = currentRoom();
    if (!room.paid) return unpaidRoom(room);
    return page(room.name, `
      <div class="tabs">
        ${tab("messages", "الرسائل")}
        ${tab("data", "بيانات الروم")}
        ${tab("members", "الأعضاء")}
      </div>
      ${roomBody(room)}
    `, { back: true });
  },
  payment: () => page("الدفع", `
    <p style="text-align:right;margin:0 0 18px">اختر طريقة الدفع</p>
    ${choice("visa", "Visa", state.paymentMethod === "visa", "data-pay-method", "متوقفة حالياً")}
    ${choice("vodafone", "Vodafone Cash", state.paymentMethod === "vodafone", "data-pay-method", "متوقفة حالياً")}
  `, { back: true, bottom: `<button class="primary-btn" data-pay-room>تسجيل الدفع</button>` }),
  notifications: () => page("الإشعارات", `
    ${state.rooms.flatMap((room) => room.messages.slice(0, 2).map((message) => `
      <div class="card">
        <span class="pill">${room.name}</span>
        <p><b>${message.subject}</b></p>
        <p>${escapeHtml(message.body).slice(0, 100)}</p>
      </div>
    `)).join("") || `<div class="card">لا توجد إشعارات حتى الآن</div>`}
  `, { back: true }),
  faq: () => page("من نحن", `
    <div class="card" style="line-height:1.8">
      <p><b>ما هو SubPay؟</b><br>تطبيق لإدارة رومات الاشتراكات المشتركة، مع أكواد دعوة ومحفظة ومتابعة رسائل و OTP داخل كل روم.</p>
      <p><b>كيف أدخل روم؟</b><br>صاحب الروم يرسل لك كود أو لينك. أدخل الكود من الصفحة الرئيسية لتظهر الروم عندك.</p>
      <p><b>كيف تصل الرسائل للروم؟</b><br>عند إنشاء الروم يتم تحديد إيميل استقبال. الرسائل الواردة لهذا الإيميل تظهر داخل الروم.</p>
    </div>
  `, { back: true, bottom: `<button class="primary-btn" data-go="support">تواصل معنا</button>` }),
  support: () => page("تواصل معنا", `
    <textarea class="message-textarea" id="support_message" placeholder="اكتب رسالتك هنا"></textarea>
  `, { back: true, bottom: `<button class="primary-btn" data-support-submit>إرسال</button>` })
};

function authLayout(title, body) {
  return `<section class="screen form-screen"><h1 class="form-title">${title}</h1>${body}</section>`;
}

function page(title, body, options = {}) {
  const bottom = options.bottom ? `<div class="bottom-action">${options.bottom}</div>` : "";
  const nav = options.nav ? bottomNav(options.nav) : "";
  return `
    <section class="screen">
      <header class="top">
        <div class="top-row">
          ${options.back ? `<button class="icon-btn" data-back>‹</button>` : `<span></span>`}
          <h1 class="title">${title}</h1>
          <span></span>
        </div>
      </header>
      <div class="content ${nav ? "with-nav" : ""}">${body}</div>
      ${bottom}
      ${nav}
    </section>
  `;
}

function bottomNav(active) {
  return `
    <nav class="bottom-nav">
      <button class="${active === "home" ? "active" : ""}" data-go="home"><span>الرئيسية</span></button>
      <button class="${active === "wallet" ? "active" : ""}" data-go="wallet"><span>المحفظة</span></button>
      <button class="${active === "profile" ? "active" : ""}" data-go="profile"><span>البروفايل</span></button>
    </nav>
  `;
}

function field(label, name, value = "", cls = "", type = "text", placeholder = "") {
  return `
    <div class="field">
      <label for="${name}">${label}</label>
      <input id="${name}" class="input ${cls}" type="${type}" placeholder="${placeholder}" value="${escapeHtml(value)}">
    </div>
  `;
}

function socialLogin() {
  return `<div class="divider">أو تسجيل الدخول عن طريق</div><button class="google" data-go="home">G</button>`;
}

function roomCard(room) {
  return `
    <button class="room-card ${room.color}" data-room="${room.id}">
      <div class="art">${room.art}</div>
      <h3>${room.name}</h3>
      <span class="pill">${room.paid ? "مفعل" : "بانتظار الدفع"}</span>
    </button>
  `;
}

function methodCard(method) {
  return `
    <div class="card pay-option">
      <span>${method.label}</span>
      <span class="pill">${method.enabled ? "متاح" : "متوقفة حالياً"}</span>
    </div>
  `;
}

function txCard(tx) {
  return `
    <div class="card">
      <p><b>${tx.title}</b></p>
      <p>${tx.amount} جنيه - ${tx.status}</p>
      <p class="member-email">${tx.date}</p>
    </div>
  `;
}

function choice(idValue, label, checked, attr, hint = "") {
  return `
    <button class="card pay-option" ${attr}="${idValue}" style="width:100%;border:0">
      <span>${label}${hint ? `<small style="display:block;color:#777;margin-top:5px">${hint}</small>` : ""}</span>
      <span class="radio ${checked ? "active" : ""}"></span>
    </button>
  `;
}

function tab(idValue, label) {
  return `<button class="tab ${state.activeTab === idValue ? "active" : ""}" data-tab="${idValue}">${label}</button>`;
}

function roomBody(room) {
  if (state.activeTab === "data") return roomData(room);
  if (state.activeTab === "members") return roomMembers(room);
  return room.messages.map(messageCard).join("") || `<div class="card">لا توجد رسائل حتى الآن</div>`;
}

function roomData(room) {
  return `
    <div class="card">
      <p><b>إيميل استقبال الرسائل</b></p>
      <p class="ltr">${room.inboundEmail}</p>
      <p class="room-form-note">الرسائل التي تصل لهذا الإيميل تظهر داخل هذه الروم.</p>
    </div>
    <div class="card">
      <p><b>كود الدعوة</b></p>
      <div class="otp-code">${room.code}</div>
      <button class="secondary-btn" data-copy="${room.code}">نسخ الكود</button>
      <p class="ltr">${room.inviteLink}</p>
    </div>
    <div class="card">
      <p><b>إيميل الاشتراك</b></p>
      <p class="ltr">${room.subscriptionEmail}</p>
      <p><b>كلمة المرور</b></p>
      <p class="ltr" data-secret>••••••••</p>
      <button class="secondary-btn" data-reveal-secret>إظهار كلمة المرور</button>
    </div>
    <button class="secondary-btn" data-add-inbound-message style="width:100%">إضافة رسالة واردة</button>
  `;
}

function roomMembers(room) {
  return `
    <button class="secondary-btn" data-add-member style="width:100%;margin-bottom:14px">إضافة عضو</button>
    ${room.members.map((member) => `
      <div class="card member">
        <div>
          <div class="member-name">${member.name}</div>
          <div class="member-email">${member.email}</div>
        </div>
        <button class="danger-btn" data-remove-member="${member.email}">حذف</button>
      </div>
    `).join("")}
  `;
}

function messageCard(message) {
  return `
    <div class="message-meta">${formatTime(message.createdAt)}</div>
    <div class="card message-card">
      <p><b>${message.subject}</b></p>
      <p>${escapeHtml(message.body).replace(/\n/g, "<br>")}</p>
      <p class="member-email">From: ${message.from}</p>
      ${message.otp ? otpBlock(message) : ""}
    </div>
  `;
}

function otpBlock(message) {
  const remaining = message.otpExpiresAt - Date.now();
  if (remaining <= 0) return `<div class="otp-box expired">انتهت صلاحية OTP</div>`;
  return `
    <div class="otp-box">
      <div class="otp-row">
        <span class="otp-code">${message.otp}</span>
        <button class="secondary-btn" data-copy="${message.otp}">نسخ</button>
      </div>
      <div class="timer">ينتهي بعد ${formatRemaining(remaining)}</div>
    </div>
  `;
}

function unpaidRoom(room) {
  return page(room.name, `
    <div class="empty-state">
      <div>
        <div class="ban"></div>
        <p style="font-size:18px;line-height:1.8">لا يمكنك فتح هذه الروم قبل دفع الاشتراك الشهري.</p>
      </div>
    </div>
  `, { back: true, bottom: `<button class="primary-btn" data-go="payment">دفع</button>` });
}

function bind() {
  document.querySelectorAll("[data-go]").forEach((el) => el.addEventListener("click", () => go(el.dataset.go)));
  document.querySelectorAll("[data-back]").forEach((el) => el.addEventListener("click", () => history.length > 1 ? history.back() : go("home")));

  document.querySelectorAll("[data-login-submit]").forEach((el) => el.addEventListener("click", () => {
    state.user.email = document.getElementById("email")?.value || state.user.email;
    save();
    go("home");
  }));

  document.querySelectorAll("[data-register-submit]").forEach((el) => el.addEventListener("click", () => {
    state.user.name = document.getElementById("name")?.value || state.user.name;
    state.user.phone = document.getElementById("phone")?.value || state.user.phone;
    state.user.email = document.getElementById("email")?.value || state.user.email;
    save();
    go("home");
  }));

  document.querySelectorAll("[data-room]").forEach((el) => el.addEventListener("click", () => {
    state.selectedRoomId = el.dataset.room;
    state.activeTab = "messages";
    save();
    go("room");
  }));

  document.querySelectorAll("[data-tab]").forEach((el) => el.addEventListener("click", () => {
    state.activeTab = el.dataset.tab;
    save();
    render();
  }));

  document.querySelectorAll("[data-lang]").forEach((el) => el.addEventListener("click", () => {
    state.language = el.getAttribute("data-lang");
    save();
    render();
  }));

  document.querySelectorAll("[data-pay-method]").forEach((el) => el.addEventListener("click", () => {
    state.paymentMethod = el.getAttribute("data-pay-method");
    save();
    render();
  }));

  document.querySelectorAll("[data-pay-room]").forEach((el) => el.addEventListener("click", () => {
    currentRoom().paid = true;
    state.wallet.transactions.unshift({ title: `اشتراك ${currentRoom().name}`, amount: currentRoom().monthlyPrice, status: "مدفوع", date: "اليوم" });
    save();
    go("room");
  }));

  document.querySelectorAll("[data-create-room]").forEach((el) => el.addEventListener("click", () => {
    const name = document.getElementById("room_name")?.value || "روم جديدة";
    const code = makeCode(name);
    const room = {
      id: `room-${id().slice(0, 8)}`,
      name,
      code,
      inviteLink: `subpay://join/${code}`,
      inboundEmail: document.getElementById("room_inbound_email")?.value || `${code.toLowerCase()}@subpay.app`,
      subscriptionEmail: document.getElementById("room_subscription_email")?.value || "subscription@example.com",
      monthlyPrice: Number(document.getElementById("room_price")?.value || 50),
      password: "لم يتم تعيين كلمة مرور",
      paid: true,
      color: "media",
      art: name.slice(0, 2).toUpperCase(),
      members: [{ name: state.user.name, email: state.user.email }],
      messages: [noteMessage(`تم ربط إيميل استقبال الرسائل بهذه الروم.`, "admin", Date.now())]
    };
    state.rooms.unshift(room);
    state.selectedRoomId = room.id;
    save();
    go("room-created");
  }));

  document.querySelectorAll("[data-join-room]").forEach((el) => el.addEventListener("click", () => {
    const code = String(document.getElementById("join_code")?.value || "").trim().toUpperCase();
    const found = state.rooms.find((room) => room.code.toUpperCase() === code);
    if (!found) {
      toast("الكود غير صحيح");
      return;
    }
    if (!found.members.some((member) => member.email === state.user.email)) {
      found.members.push({ name: state.user.name, email: state.user.email });
    }
    found.paid = found.paid || false;
    state.selectedRoomId = found.id;
    save();
    go("room");
  }));

  document.querySelectorAll("[data-add-member]").forEach((el) => el.addEventListener("click", () => {
    const index = currentRoom().members.length + 1;
    currentRoom().members.push({ name: `عضو ${index}`, email: `member${index}@example.com` });
    save();
    render();
  }));

  document.querySelectorAll("[data-remove-member]").forEach((el) => el.addEventListener("click", () => {
    currentRoom().members = currentRoom().members.filter((member) => member.email !== el.dataset.removeMember);
    save();
    render();
  }));

  document.querySelectorAll("[data-add-inbound-message]").forEach((el) => el.addEventListener("click", () => {
    const code = Math.floor(100000 + Math.random() * 900000);
    currentRoom().messages.unshift(emailMessage("رسالة واردة جديدة", `رمز التحقق الخاص بك هو ${code}`, currentRoom().inboundEmail, Date.now()));
    state.activeTab = "messages";
    save();
    render();
  }));

  document.querySelectorAll("[data-reveal-secret]").forEach((el) => el.addEventListener("click", () => {
    document.querySelector("[data-secret]").textContent = currentRoom().password;
  }));

  document.querySelectorAll("[data-copy]").forEach((el) => el.addEventListener("click", () => {
    navigator.clipboard?.writeText(el.dataset.copy);
    toast("تم النسخ");
  }));

  document.querySelectorAll("[data-save-profile]").forEach((el) => el.addEventListener("click", () => {
    state.user.name = document.getElementById("name")?.value || state.user.name;
    state.user.email = document.getElementById("email")?.value || state.user.email;
    state.user.phone = document.getElementById("phone")?.value || state.user.phone;
    save();
    go("profile");
  }));

  document.querySelectorAll("[data-support-submit]").forEach((el) => el.addEventListener("click", () => {
    toast("تم إرسال رسالتك");
    go("profile");
  }));

  if (route() === "splash") setTimeout(() => go("login"), 900);
}

function makeCode(name) {
  const letters = String(name).replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "ROM";
  return `${letters}${Math.floor(100 + Math.random() * 900)}`;
}

function toast(message) {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function formatTime(timestamp) {
  const diff = Date.now() - timestamp;
  if (diff < 86400000) return "اليوم";
  if (diff < 172800000) return "أمس";
  return new Date(timestamp).toLocaleString("ar-EG");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function render() {
  document.getElementById("app").innerHTML = (routes[route()] || routes.home)();
  bind();
}

window.addEventListener("hashchange", render);
setInterval(() => {
  if (route() === "room" && state.activeTab === "messages") render();
}, 1000);
render();
