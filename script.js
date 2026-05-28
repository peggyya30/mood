
const app = document.getElementById("app");

const todayKey = new Date().toISOString().slice(0, 10);
const now = new Date();

function defaultUserState() {
  return {
    mood: "尚未填寫",
    stress: "-",
    note: "",
    pressureReason: [],
    streak: 0,
    lastCheckinDate: "",
    checkinDates: [],
    moodRecords: [],
    pressureRecords: [],
    todos: [
      { text: "整理今天的筆記重點", time: "20 分鐘", done: false },
      { text: "完成數學作業練習題", time: "40 分鐘", done: false },
      { text: "閱讀一篇英文課文", time: "30 分鐘", done: false }
    ],
    theme: "yellow",
    fontSize: "normal",
    fontFamily: "default"
  };
}

let state = defaultUserState();

function getLoginInfo() {
  return JSON.parse(localStorage.getItem("moodstudy_login") || "null");
}

function getCurrentUsername() {
  const login = getLoginInfo();
  return login?.username || "guest";
}

function getCurrentDataKey() {
  return `moodstudy_data_${getCurrentUsername()}`;
}

function loadCurrentUserState() {
  const key = getCurrentDataKey();
  const saved = localStorage.getItem(key);
  state = saved ? { ...defaultUserState(), ...JSON.parse(saved) } : defaultUserState();
  ensureDataShape();
  ensureSettings();
  applySettings();
}

function resetToGuestState() {
  state = defaultUserState();
  applySettings();
}



const demoAccounts = {
  student: { username: "student", password: "1234", name: "王小明" },
  teacher: { username: "1399", password: "1399", name: "教師管理者" }
};

function getRegisteredAccounts() {
  return JSON.parse(localStorage.getItem("moodstudy_registered_accounts") || "{}");
}

function saveRegisteredAccounts(accounts) {
  localStorage.setItem("moodstudy_registered_accounts", JSON.stringify(accounts));
}

function findAccount(role, username) {
  const registered = getRegisteredAccounts();
  if (registered[username] && registered[username].role === role) {
    return registered[username];
  }
  const demo = demoAccounts[role];
  if (demo && demo.username === username) {
    return demo;
  }
  return null;
}

function loginTopbar() {
  return `
    <header class="topbar">
      <div class="logo" onclick="renderLogin()">
        <span>MoodStudy</span>
      </div>
    </header>
  `;
}

function loginWithDemoAccount() {
  const role = document.querySelector("input[name='role']:checked").value;
  const username = document.getElementById("loginUser").value.trim();
  const password = document.getElementById("loginPass").value.trim();
  const account = findAccount(role, username);

  const error = document.getElementById("loginError");

  if (account && password === account.password) {
    localStorage.setItem("moodstudy_login", JSON.stringify({
      role,
      username,
      name: account.name || account.nickname || username,
      loginAt: new Date().toISOString()
    }));
    loadCurrentUserState();
    if (role === "teacher" && username === "1399") {
      renderTeacherDashboard();
    } else {
      renderDashboard();
    }
  } else {
    error.textContent = "帳號或密碼錯誤，請確認後再試一次。";
    error.style.display = "block";
  }
}



function renderRegister() {
  app.innerHTML = `
    <div class="app-frame">
      ${loginTopbar()}
      <main class="register-body">
        <section class="register-intro">
          <h1>建立 MoodStudy 帳號</h1>
          <p>請填寫基本資料並設定帳號密碼，完成後即可使用新帳號登入系統。</p>
          <div class="register-illustration">📝✨</div>
        </section>

        <section class="register-card">
          <h2>立即註冊</h2>

          <div class="register-grid">
            <div class="field"><span>姓</span><input id="regLastName" placeholder="例如：王"></div>
            <div class="field"><span>名</span><input id="regFirstName" placeholder="例如：小明"></div>
          </div>

          <div class="field"><span>暱稱</span><input id="regNickname" placeholder="例如：小明"></div>
          <div class="field"><span>電話</span><input id="regPhone" placeholder="例如：0912345678"></div>

          <div class="role-row register-role">
            <label><input type="radio" name="regRole" value="student" checked> 學生</label>
            <label><input type="radio" name="regRole" value="teacher"> 教師</label>
          </div>

          <div class="field"><span>帳號</span><input id="regUsername" placeholder="請設定登入帳號"></div>
          <div class="field"><span>密碼</span><input id="regPassword" type="password" placeholder="請設定密碼"></div>
          <div class="field"><span>確認</span><input id="regConfirm" type="password" placeholder="再次輸入密碼"></div>

          <div id="registerError" class="login-error"></div>

          <button class="primary" onclick="createAccount()">建立帳號</button>
          <p class="register">已經有帳號？ <a href="#" onclick="renderLogin()">返回登入</a></p>
        </section>
      </main>
      <footer class="footer">
        <span>© 2024 MoodStudy. All rights reserved.</span>
      </footer>
    </div>
  `;
}

function createAccount() {
  const lastName = document.getElementById("regLastName").value.trim();
  const firstName = document.getElementById("regFirstName").value.trim();
  const nickname = document.getElementById("regNickname").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const role = document.querySelector("input[name='regRole']:checked").value;
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const confirm = document.getElementById("regConfirm").value.trim();
  const error = document.getElementById("registerError");

  if (!lastName || !firstName || !nickname || !phone || !username || !password || !confirm) {
    error.textContent = "請完整填寫所有欄位。";
    error.style.display = "block";
    return;
  }

  if (password.length < 4) {
    error.textContent = "密碼至少需要 4 個字元。";
    error.style.display = "block";
    return;
  }

  if (password !== confirm) {
    error.textContent = "兩次輸入的密碼不一致。";
    error.style.display = "block";
    return;
  }

  const registered = getRegisteredAccounts();

  if (registered[username] || username === "student" || username === "teacher" || username === "1399") {
    error.textContent = "這個帳號已經被使用，請換一個帳號。";
    error.style.display = "block";
    return;
  }

  registered[username] = {
    role,
    username,
    password,
    lastName,
    firstName,
    nickname,
    phone,
    name: nickname || (lastName + firstName),
    createdAt: new Date().toISOString()
  };

  saveRegisteredAccounts(registered);
  localStorage.setItem(`moodstudy_data_${username}`, JSON.stringify(defaultUserState()));

  alert("註冊成功！請使用剛剛設定的帳號密碼登入。");
  resetToGuestState();
renderLogin();
}


function logout() {
  localStorage.removeItem("moodstudy_login");
  resetToGuestState();
  renderLogin();
}


function ensureDataShape() {
  if (!state.moodRecords) state.moodRecords = [];
  if (!state.pressureRecords) state.pressureRecords = [];
  if (!state.checkinDates) state.checkinDates = [];
  if (!state.pressureReason) state.pressureReason = [];
}

ensureDataShape();

function ensureSettings() {
  if (!state.theme) state.theme = "yellow";
  if (!state.fontSize) state.fontSize = "normal";
  if (!state.fontFamily) state.fontFamily = "default";
}

ensureSettings();

function applySettings() {
  document.body.classList.remove("theme-yellow", "theme-blue", "theme-purple", "font-small", "font-normal", "font-large", "font-default", "font-rounded", "font-formal", "font-handwrite");
  document.body.classList.add(`theme-${state.theme}`);
  document.body.classList.add(`font-${state.fontSize}`);
  document.body.classList.add(`font-${state.fontFamily}`);
}



function upsertRecord(list, date, data) {
  const index = list.findIndex(item => item.date === date);
  if (index >= 0) {
    list[index] = { ...list[index], ...data };
  } else {
    list.push({ date, ...data });
  }
}

function getRecordByDate(list, date) {
  return list.find(item => item.date === date);
}

function getWeekDates(baseDate = new Date()) {
  const date = new Date(baseDate);
  const day = date.getDay();
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - day);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function getWeeklyPressureAverage() {
  const dates = getWeekDates();
  const records = state.pressureRecords.filter(r => dates.includes(r.date) && Number(r.stress));
  if (records.length === 0) {
    return { avg: "-", count: 0, records: [] };
  }
  const sum = records.reduce((total, r) => total + Number(r.stress), 0);
  return {
    avg: (sum / records.length).toFixed(1),
    count: records.length,
    records
  };
}

function weeklyMoodSummary() {
  const dates = getWeekDates();
  const moods = state.moodRecords.filter(r => dates.includes(r.date)).map(r => r.mood);
  if (moods.length === 0) return "本週尚未填寫學習狀態";
  const count = {};
  moods.forEach(m => count[m] = (count[m] || 0) + 1);
  return Object.entries(count).sort((a,b)=>b[1]-a[1])[0][0];
}

function pressureLevelText(avg) {
  if (avg === "-") return "尚未有足夠資料";
  const n = Number(avg);
  if (n <= 2) return "本週壓力偏低，學習狀態較穩定。";
  if (n <= 3.5) return "本週壓力中等，建議持續觀察作業與考試壓力。";
  return "本週壓力偏高，建議減少任務堆疊並安排休息。";
}

function renderWeeklySummaryCard() {
  const weekly = getWeeklyPressureAverage();
  const dates = getWeekDates();
  const weekRange = `${dates[0].slice(5)} ～ ${dates[6].slice(5)}`;

  return `
    <section class="weekly-card">
      <div class="weekly-head">
        <div>
          <h3>本週狀態分析</h3>
          <p>${weekRange}</p>
        </div>
        <button class="small-outline" onclick="renderCalendar()">查看每日紀錄</button>
      </div>

      <div class="weekly-grid">
        <div class="weekly-item">
          <span>平均壓力值</span>
          <strong>${weekly.avg === "-" ? "-" : weekly.avg + " / 5"}</strong>
          <p>${pressureLevelText(weekly.avg)}</p>
        </div>

        <div class="weekly-item">
          <span>本週主要狀態</span>
          <strong>${weeklyMoodSummary()}</strong>
          <p>依本週每日學習狀態回饋統計。</p>
        </div>

        <div class="weekly-item">
          <span>壓力檢測天數</span>
          <strong>${weekly.count} 天</strong>
          <p>填寫越完整，AI 建議會越準確。</p>
        </div>
      </div>
    </section>
  `;
}

function save() {
  localStorage.setItem(getCurrentDataKey(), JSON.stringify(state));
  applySettings();
}


function currentUser() {
  return JSON.parse(localStorage.getItem("moodstudy_login") || "null");
}

function currentName() {
  const user = currentUser();
  return user?.name || "使用者";
}


function getMoodEmoji(mood) {
  const moodMap = {
    "開心": "😊",
    "普通": "🙂",
    "焦慮": "😰",
    "疲累": "😵",
    "沒動力": "😞",
    "尚未填寫": "🙂"
  };
  return moodMap[mood] || "🙂";
}

function getAdvice() {
  if (state.mood === "焦慮") return "你今天感到有些焦慮，建議先從小任務開始，逐步建立學習節奏，記得適時休息喔！";
  if (state.mood === "疲累") return "你今天比較疲累，建議先休息 10 分鐘，再做一個低強度任務，例如整理筆記。";
  if (state.mood === "沒動力") return "你今天動力較低，建議先完成一個 5 分鐘小任務，降低開始學習的壓力。";
  if (state.mood === "開心") return "你今天狀態很好，可以安排需要專注力的任務，維持目前節奏。";
  if (state.mood === "普通") return "你目前狀態穩定，建議依照 To-Do List 完成今日任務。";
  return "完成學習狀態回饋後，AI 將為你產生個人化學習建議。";
}

function getPressureAdvice() {
  const s = Number(state.stress);
  if (!s) return "尚未完成壓力檢測。";
  if (s <= 2) return "目前壓力偏低，可以維持現在的學習節奏。";
  if (s === 3) return "目前壓力中等，建議安排明確待辦，避免任務累積。";
  if (s === 4) return "目前壓力偏高，建議優先處理最急迫的一件事，並安排短暫休息。";
  return "目前壓力很高，建議先停止追加任務，進行休息或呼吸練習後再開始。";
}

function topbar(simple = false) {
  return `
    <header class="topbar">
      <div class="logo" onclick="renderLogin()">
        <span>MoodStudy</span>
      </div>
      ${simple ? `<button class="back-btn" onclick="renderDashboard()">⌂ 返回首頁</button>` : `
        <nav class="top-nav">
          <button onclick="renderDashboard()">首頁</button>
          <button onclick="renderMoodFeedback()">學習狀態回饋</button>
          <button onclick="renderPressureTest()">壓力檢測</button>
          <button onclick="renderAI()">AI 學習引導</button>
        </nav>
        <div class="top-actions">
          
          <button class="user-btn">${currentName()}⌄</button>
        </div>`}
    </header>
  `;
}

function renderLogin() {
  app.innerHTML = `
    <div class="app-frame">
      ${loginTopbar()}
      <main class="login-body">
        <section class="login-hero">
          <h1>歡迎回到<span>MoodStudy</span></h1>
          <p>綜合情緒回饋與學習分析的<br>LMS 學習平台</p>
          <div class="illustration">
            <div class="plant">🪴</div>
            <div class="person">👩🏻‍💻</div>
            <div class="bubbles">
              <span>🙂</span><span>😐</span><span>☹️</span>
            </div>
          </div>
        </section>

        <section class="login-card">
          <h2>登入您的帳號</h2>
          <div class="role-row">
            <label><input type="radio" name="role" value="student" checked> 學生</label>
            <label><input type="radio" name="role" value="teacher"> 教師</label>
          </div>
          <div class="field"><span>👤</span><input id="loginUser" placeholder="帳號，例如 student"></div>
          <div class="field"><span>🔒</span><input id="loginPass" type="password" placeholder="密碼，例如 1234"></div>
          <div id="loginError" class="login-error"></div>
          <div class="login-options">
            <label><input type="checkbox"> 記住我</label>
            <a href="#">忘記密碼？</a>
          </div>
          <button class="primary" onclick="loginWithDemoAccount()">登入</button>
          <p class="register">還沒有帳號？ <a href="#" onclick="renderRegister()">立即註冊</a></p>
        </section>
      </main>
      <footer class="footer">
        <span>© 2024 MoodStudy. All rights reserved.</span>
        <span>隱私權政策　使用條款　聯絡我們</span>
      </footer>
    </div>
  `;
}


function getCurrentRoleLabel() {
  const user = currentUser();
  if (!user) return "未登入";
  return user.role === "teacher" ? "教師" : "學生";
}

function getCurrentMoodLabel() {
  if (!state || !state.mood || state.mood === "尚未填寫") return "尚未填寫";
  return `${getMoodEmoji(state.mood)} ${state.mood}`;
}

function toggleUserMenu() {
  const menu = document.getElementById("userDropdownMenu");
  if (!menu) return;
  menu.classList.toggle("show");
}

function renderUserMenu() {
  return `
    <div class="user-menu-wrap">
      <button class="user-btn" onclick="toggleUserMenu()">
        <span class="user-avatar">${getMoodEmoji(state?.mood || "尚未填寫")}</span>
        <span>${currentName()}</span>
        <span class="chevron">⌄</span>
      </button>

      <div id="userDropdownMenu" class="user-dropdown">
        <div class="user-dropdown-head">
          <div class="user-avatar big">${getMoodEmoji(state?.mood || "尚未填寫")}</div>
          <div>
            <strong>${currentName()}</strong>
            <p>${getCurrentRoleLabel()}｜${getCurrentMoodLabel()}</p>
          </div>
        </div>

        <button onclick="renderProfile()">個人資料</button>
        <button onclick="renderSettings()">主題設定</button>
        <button onclick="renderSettings()">字體大小</button>
        <button onclick="renderAI()">我的學習統計</button>
        <button class="logout-option" onclick="logout()">登出</button>
      </div>
    </div>
  `;
}

document.addEventListener("click", function(event) {
  const wrap = event.target.closest(".user-menu-wrap");
  const menu = document.getElementById("userDropdownMenu");
  if (!wrap && menu) {
    menu.classList.remove("show");
  }
});

function renderProfile() {
  const login = currentUser();
  const registered = getRegisteredAccounts();
  const account = registered[login?.username] || null;

  const content = `
    <div class="page-title">
      <h1>個人資料</h1>
      <p>這裡顯示目前登入帳號的基本資料與學習狀態。</p>
    </div>

    <section class="profile-grid">
      <div class="profile-card">
        <div class="profile-avatar">${getMoodEmoji(state.mood)}</div>
        <h2>${currentName()}</h2>
        <p>${getCurrentRoleLabel()}</p>
      </div>

      <div class="profile-card detail">
        <h3>帳號資訊</h3>
        <p><strong>帳號：</strong>${login?.username || "-"}</p>
        <p><strong>姓名／暱稱：</strong>${currentName()}</p>
        <p><strong>電話：</strong>${account?.phone || "-"}</p>
        <p><strong>登入身份：</strong>${getCurrentRoleLabel()}</p>
      </div>

      <div class="profile-card detail">
        <h3>目前學習狀態</h3>
        <p><strong>今日狀態：</strong>${state.mood}</p>
        <p><strong>壓力程度：</strong>${state.stress === "-" ? "尚未檢測" : state.stress + " / 5"}</p>
        <p><strong>連續學習：</strong>${state.streak || 0} 天</p>
        <p><strong>本週平均壓力：</strong>${getWeeklyPressureAverage().avg === "-" ? "尚無資料" : getWeeklyPressureAverage().avg + " / 5"}</p>
      </div>
    </section>
  `;

  appLayout("profile", "個人資料", content);
}


function appLayout(page, title, content) {
  app.innerHTML = `
    <div class="app-frame workspace">
      <aside class="sidebar">
<nav class="side-nav">
          <button class="${page === "home" ? "active" : ""}" onclick="renderDashboard()">首頁</button>
          <button class="${page === "mood" ? "active" : ""}" onclick="renderMoodFeedback()">學習狀態回饋</button>
          <button class="${page === "pressure" ? "active" : ""}" onclick="renderPressureTest()">壓力檢測</button>
          <button class="${page === "ai" ? "active" : ""}" onclick="renderAI()">AI 學習引導</button>
          <button class="${page === "calendar" ? "active" : ""}" onclick="renderCalendar()">連續學習</button>
        </nav>
        <div class="side-bottom">
          <button class="${page === "settings" ? "active" : ""}" onclick="renderSettings()">設定</button>
          <button onclick="logout()">登出</button>
        </div>
      </aside>
      <section class="main-panel">
        <div class="panel-top">
          <h2>${title}</h2>
          <button class="center-brand" onclick="renderDashboard()">MoodStudy</button>
          <div class="top-actions">
            ${renderUserMenu()}
          </div>
        </div>
        <div class="panel-content">${content}</div>
      </section>
    </div>
  `;
}


function getAllStudentRows() {
  const registered = getRegisteredAccounts();
  const students = [];

  Object.values(registered).forEach(account => {
    if (account.role === "student") {
      const dataKey = `moodstudy_data_${account.username}`;
      const data = JSON.parse(localStorage.getItem(dataKey) || "null") || defaultUserState();

      students.push({
        username: account.username,
        name: account.name || account.nickname || account.username,
        nickname: account.nickname || account.name || account.username,
        phone: account.phone || "-",
        mood: data.mood || "尚未填寫",
        stress: data.stress || "-",
        streak: data.streak || 0,
        todos: data.todos || [],
        moodRecords: data.moodRecords || [],
        pressureRecords: data.pressureRecords || [],
        checkinDates: data.checkinDates || []
      });
    }
  });

  const demoData = JSON.parse(localStorage.getItem("moodstudy_data_student") || "null");
  students.unshift({
    username: "student",
    name: "王小明",
    nickname: "王小明",
    phone: "-",
    mood: demoData?.mood || "尚未填寫",
    stress: demoData?.stress || "-",
    streak: demoData?.streak || 0,
    todos: demoData?.todos || defaultUserState().todos,
    moodRecords: demoData?.moodRecords || [],
    pressureRecords: demoData?.pressureRecords || [],
    checkinDates: demoData?.checkinDates || []
  });

  const unique = [];
  const seen = new Set();
  students.forEach(s => {
    if (!seen.has(s.username)) {
      seen.add(s.username);
      unique.push(s);
    }
  });

  return unique;
}

function calcStudentAvgPressure(student) {
  const records = student.pressureRecords || [];
  if (!records.length) return "-";
  const valid = records.filter(r => Number(r.stress));
  if (!valid.length) return "-";
  const avg = valid.reduce((sum, r) => sum + Number(r.stress), 0) / valid.length;
  return avg.toFixed(1);
}

function getRiskLevel(student) {
  const stress = Number(student.stress);
  const unfinished = (student.todos || []).filter(t => !t.done).length;
  let score = 0;

  if (student.mood === "焦慮") score += 20;
  if (student.mood === "疲累") score += 15;
  if (student.mood === "沒動力") score += 25;
  if (stress >= 4) score += 25;
  if (unfinished >= 3) score += 15;
  if ((student.streak || 0) === 0) score += 10;

  if (score >= 45) return { text: "高關注", className: "risk-high" };
  if (score >= 20) return { text: "需觀察", className: "risk-mid" };
  return { text: "穩定", className: "risk-low" };
}

function teacherLayout(title, content) {
  app.innerHTML = `
    <div class="app-frame workspace">
      <aside class="sidebar teacher-sidebar">
<nav class="side-nav">
          <button class="active" onclick="renderTeacherDashboard()">教師總覽</button>
          <button onclick="renderTeacherStudents()">學生資料</button>
          <button onclick="renderTeacherAnalysis()">班級分析</button>
        </nav>
        <div class="side-bottom">
          <button onclick="logout()">登出</button>
        </div>
      </aside>

      <section class="main-panel">
        <div class="panel-top">
          <h2>${title}</h2>
          <button class="center-brand" onclick="renderTeacherDashboard()">MoodStudy</button>
          <div class="top-actions">
            ${renderUserMenu()}
          </div>
        </div>
        <div class="panel-content">${content}</div>
      </section>
    </div>
  `;
}

function renderTeacherDashboard() {
  const students = getAllStudentRows();
  const total = students.length;
  const highRisk = students.filter(s => getRiskLevel(s).text === "高關注").length;
  const avgStressList = students.map(calcStudentAvgPressure).filter(v => v !== "-").map(Number);
  const classAvg = avgStressList.length ? (avgStressList.reduce((a,b)=>a+b,0) / avgStressList.length).toFixed(1) : "-";
  const avgStreak = total ? (students.reduce((sum, s) => sum + Number(s.streak || 0), 0) / total).toFixed(1) : "0";

  const rows = students.map(s => {
    const risk = getRiskLevel(s);
    return `
      <tr>
        <td>${s.name}</td>
        <td>${s.username}</td>
        <td>${s.mood}</td>
        <td>${s.stress === "-" ? "-" : s.stress + " / 5"}</td>
        <td>${calcStudentAvgPressure(s)}</td>
        <td>${s.streak} 天</td>
        <td><span class="risk-pill ${risk.className}">${risk.text}</span></td>
        <td><button class="table-btn" onclick="renderTeacherStudentDetail('${s.username}')">查看</button></td>
      </tr>
    `;
  }).join("");

  const content = `
    <div class="teacher-title">
      <h1>教師後台 Dashboard</h1>
      <p>此頁面提供教師查看學生學習狀態、壓力指數與需要關注的學生。</p>
    </div>

    <section class="teacher-stats">
      <div class="teacher-stat-card">
        <span>學生總數</span>
        <strong>${total}</strong>
        <p>目前系統中可查看的學生帳號</p>
      </div>
      <div class="teacher-stat-card">
        <span>班級平均壓力</span>
        <strong>${classAvg === "-" ? "-" : classAvg + " / 5"}</strong>
        <p>依學生壓力紀錄平均計算</p>
      </div>
      <div class="teacher-stat-card">
        <span>高關注學生</span>
        <strong>${highRisk}</strong>
        <p>依情緒、壓力與任務狀態判斷</p>
      </div>
      <div class="teacher-stat-card">
        <span>平均連續學習</span>
        <strong>${avgStreak} 天</strong>
        <p>學生平均打卡累積天數</p>
      </div>
    </section>

    <section class="teacher-table-card">
      <div class="table-head">
        <h2>學生狀態總覽</h2>
        <button class="small-outline" onclick="renderTeacherAnalysis()">查看班級分析</button>
      </div>

      <div class="table-wrap">
        <table class="teacher-table">
          <thead>
            <tr>
              <th>姓名 / 暱稱</th>
              <th>帳號</th>
              <th>學習狀態</th>
              <th>目前壓力</th>
              <th>平均壓力</th>
              <th>連續學習</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="8">目前尚無學生資料</td></tr>`}</tbody>
        </table>
      </div>
    </section>
  `;

  teacherLayout("教師總覽", content);
}

function renderTeacherStudents() {
  const students = getAllStudentRows();

  const cards = students.map(s => {
    const risk = getRiskLevel(s);
    const unfinished = (s.todos || []).filter(t => !t.done).length;

    return `
      <div class="student-card">
        <div>
          <h3>${s.name}</h3>
          <p>帳號：${s.username}</p>
          <p>電話：${s.phone}</p>
        </div>
        <div class="student-card-info">
          <span>狀態：${s.mood}</span>
          <span>壓力：${s.stress === "-" ? "-" : s.stress + " / 5"}</span>
          <span>未完成任務：${unfinished}</span>
          <span class="risk-pill ${risk.className}">${risk.text}</span>
        </div>
        <button class="small-outline" onclick="renderTeacherStudentDetail('${s.username}')">查看詳細</button>
      </div>
    `;
  }).join("");

  teacherLayout("學生資料", `
    <div class="teacher-title">
      <h1>學生資料</h1>
      <p>教師可查看每位學生的個別狀態，協助掌握學習情況。</p>
    </div>
    <div class="student-card-grid">${cards || "目前尚無學生資料"}</div>
  `);
}

function renderTeacherStudentDetail(username) {
  const student = getAllStudentRows().find(s => s.username === username);
  if (!student) {
    alert("找不到學生資料");
    return;
  }

  const todoRows = (student.todos || []).map(t => `
    <li class="${t.done ? "done" : ""}">
      ${t.done ? "已完成" : "未完成"}｜${t.text}（${t.time}）
    </li>
  `).join("");

  const moodRows = (student.moodRecords || []).slice(-7).reverse().map(r => `
    <tr>
      <td>${r.date}</td>
      <td>${r.mood}</td>
      <td>${r.note || "-"}</td>
    </tr>
  `).join("");

  const pressureRows = (student.pressureRecords || []).slice(-7).reverse().map(r => `
    <tr>
      <td>${r.date}</td>
      <td>${r.stress} / 5</td>
      <td>${(r.reasons || []).join("、") || "-"}</td>
    </tr>
  `).join("");

  teacherLayout("學生詳細資料", `
    <div class="teacher-title">
      <h1>${student.name} 的學習狀態</h1>
      <p>帳號：${student.username}｜電話：${student.phone}</p>
    </div>

    <section class="teacher-stats">
      <div class="teacher-stat-card">
        <span>目前學習狀態</span>
        <strong>${student.mood}</strong>
      </div>
      <div class="teacher-stat-card">
        <span>目前壓力</span>
        <strong>${student.stress === "-" ? "-" : student.stress + " / 5"}</strong>
      </div>
      <div class="teacher-stat-card">
        <span>平均壓力</span>
        <strong>${calcStudentAvgPressure(student)}</strong>
      </div>
      <div class="teacher-stat-card">
        <span>連續學習</span>
        <strong>${student.streak} 天</strong>
      </div>
    </section>

    <section class="teacher-detail-grid">
      <div class="teacher-table-card">
        <h2>To-Do List</h2>
        <ul class="teacher-task-list">${todoRows || "<li>目前沒有任務</li>"}</ul>
      </div>

      <div class="teacher-table-card">
        <h2>最近學習狀態紀錄</h2>
        <table class="teacher-table mini">
          <thead><tr><th>日期</th><th>狀態</th><th>備註</th></tr></thead>
          <tbody>${moodRows || `<tr><td colspan="3">尚無紀錄</td></tr>`}</tbody>
        </table>
      </div>

      <div class="teacher-table-card full">
        <h2>最近壓力紀錄</h2>
        <table class="teacher-table mini">
          <thead><tr><th>日期</th><th>壓力值</th><th>原因</th></tr></thead>
          <tbody>${pressureRows || `<tr><td colspan="3">尚無紀錄</td></tr>`}</tbody>
        </table>
      </div>
    </section>

    <button class="small-outline" onclick="renderTeacherDashboard()">返回總覽</button>
  `);
}

function renderTeacherAnalysis() {
  const students = getAllStudentRows();
  const moodCount = {};
  students.forEach(s => moodCount[s.mood] = (moodCount[s.mood] || 0) + 1);

  const moodText = Object.entries(moodCount).map(([m, c]) => `
    <div class="analysis-row">
      <span>${m}</span>
      <strong>${c} 人</strong>
    </div>
  `).join("");

  const pressureGroups = {
    "低壓力（1～2）": students.filter(s => Number(s.stress) >= 1 && Number(s.stress) <= 2).length,
    "中壓力（3）": students.filter(s => Number(s.stress) === 3).length,
    "高壓力（4～5）": students.filter(s => Number(s.stress) >= 4).length,
    "尚未檢測": students.filter(s => s.stress === "-").length
  };

  const pressureText = Object.entries(pressureGroups).map(([label, count]) => `
    <div class="analysis-row">
      <span>${label}</span>
      <strong>${count} 人</strong>
    </div>
  `).join("");

  teacherLayout("班級分析", `
    <div class="teacher-title">
      <h1>班級分析</h1>
      <p>整理全班學習狀態與壓力分布，協助教師快速掌握整體情況。</p>
    </div>

    <section class="analysis-grid">
      <div class="teacher-table-card">
        <h2>學習狀態分布</h2>
        ${moodText || "目前尚無資料"}
      </div>

      <div class="teacher-table-card">
        <h2>壓力程度分布</h2>
        ${pressureText}
      </div>

      <div class="teacher-table-card full">
        <h2>教師輔助建議</h2>
        <p>若高壓力或沒動力學生較多，可考慮調整作業期限、提供學習提醒，或安排較小的階段性任務，避免學生累積過多壓力。</p>
      </div>
    </section>
  `);
}


function renderDashboard() {
  const checkedToday = state.lastCheckinDate === todayKey;
  const content = `
    <div class="greeting">
      <h1>嗨嗨，${currentName()}</h1>
      <p>讓我們一起努力學習唄ฅ՞•ﻌ•՞ฅ</p>
    </div>

    <div class="stats">
      <div class="stat-card">
        <h3>今日學習狀態</h3>
        <div class="face">${getMoodEmoji(state.mood)}</div>
        <strong>${state.mood}</strong>
        <p>${state.mood === "尚未填寫" ? "請完成今日學習狀態回饋" : "已完成今日回饋"}</p>
        <button class="small-outline" onclick="renderMoodFeedback()">立即填寫</button>
      </div>

      <div class="stat-card">
        <h3>近期壓力程度</h3>
        <div class="gauge"></div>
        <strong>${state.stress === "-" ? "-" : state.stress + " / 5"}</strong>
        <p>${state.stress === "-" ? "尚未檢測" : "已完成壓力檢測"}</p>
        <button class="small-outline" onclick="renderPressureTest()">前往檢測</button>
      </div>

      <div class="stat-card">
        <h3>連續學習天數</h3>
        <div class="calendar">📅</div>
        <strong>${state.streak} 天</strong>
        <p>${checkedToday ? "今日已完成打卡" : "今天尚未打卡"}</p>
        <button class="small-outline" onclick="renderCalendar()">查看月曆</button>
      </div>
    </div>

    <div class="ai-strip">
      <div>
        <h3>AI 學習建議</h3>
        <p>${getAdvice()}</p>
      </div>
      <div class="bot">🤖</div>
    </div>

    ${renderWeeklySummaryCard()}
  `;
  appLayout("home", "首頁", content);
}

function renderMoodFeedback() {
  const content = `
    <div class="form-title">
      <h1>學習狀態回饋</h1>
      <p>這裡只記錄「今天的學習心情與狀態」，壓力程度請到壓力檢測頁填寫。</p>
    </div>

    <div class="form-card">
      <h3>1. 你今天的學習狀態如何？</h3>
      <div class="moods">
        ${["開心","普通","焦慮","疲累","沒動力"].map((m, i) => `
          <label class="mood-card">
            <span>${["😊","🙂","😰","😵","😞"][i]}</span>
            <b>${m}</b>
            <input type="radio" name="mood" value="${m}" ${state.mood === m || (state.mood === "尚未填寫" && i === 0) ? "checked" : ""}>
          </label>
        `).join("")}
      </div>

      <h3>2. 今天學習上遇到什麼狀況？</h3>
      <textarea id="note" placeholder="例如：今天覺得作業有點多、上課比較累、但還是想完成一個小任務...">${state.note || ""}</textarea>

      <div class="submit-wrap">
        <button class="primary submit-btn" onclick="submitMood()">儲存學習狀態</button>
      </div>
    </div>
  `;
  appLayout("mood", "學習狀態回饋", content);
}

function submitMood() {
  const mood = document.querySelector("input[name='mood']:checked").value;
  const note = document.getElementById("note").value;
  state.mood = mood;
  state.note = note;
  upsertRecord(state.moodRecords, todayKey, {
    mood,
    note,
    updatedAt: new Date().toISOString()
  });
  save();
  renderDashboard();
}

function renderPressureTest() {
  const checkedReasons = state.pressureReason || [];
  const options = ["作業或考試接近截止", "任務太多不知道從哪裡開始", "最近睡眠不足或精神疲累", "擔心成績或進度落後"];
  const content = `
    <div class="page-title">
      <h1>壓力程度檢測</h1>
      <p>這裡專門檢測近期學習壓力，與學習狀態回饋分開記錄。</p>
    </div>

    <div class="pressure-grid">
      <div class="form-card">
        <h3>1. 你目前的壓力程度是多少？（1 最低～5 最高）</h3>
        <div class="range-row">
          <span>1</span>
          <input id="stress" type="range" min="1" max="5" value="${state.stress === "-" ? 3 : state.stress}" oninput="updatePressurePreview()">
          <span>5</span>
        </div>

        <h3>2. 造成壓力的可能原因</h3>
        <div class="pressure-options">
          ${options.map(o => `
            <label>
              <input type="checkbox" value="${o}" ${checkedReasons.includes(o) ? "checked" : ""}>
              ${o}
            </label>
          `).join("")}
        </div>

        <div class="submit-wrap">
          <button class="primary submit-btn" onclick="submitPressure()">儲存壓力檢測</button>
        </div>
      </div>

      <div class="info-card pressure-score">
        <h3>目前壓力指數</h3>
        <div class="score-circle ${getPressureColorClass(state.stress === "-" ? 3 : state.stress)}" id="pressurePreviewScore">${state.stress === "-" ? "3" : state.stress}</div>
        <p id="pressurePreviewText">${getPressurePreviewText(state.stress === "-" ? 3 : state.stress)}</p>
      </div>
    </div>
  `;
  appLayout("pressure", "壓力檢測", content);
}



function getPressureColorClass(value) {
  const s = Number(value);
  if (s === 1) return "level-1";
  if (s === 2) return "level-2";
  if (s === 3) return "level-3";
  if (s === 4) return "level-4";
  if (s === 5) return "level-5";
  return "level-3";
}

function getPressurePreviewText(value) {
  const s = Number(value);
  if (s <= 2) return "目前壓力偏低，可以維持現在的學習節奏。";
  if (s === 3) return "目前壓力中等，建議安排明確待辦，避免任務累積。";
  if (s === 4) return "目前壓力偏高，建議優先處理最急迫的一件事，並安排短暫休息。";
  return "目前壓力很高，建議先停止追加任務，進行休息或呼吸練習後再開始。";
}

function updatePressurePreview() {
  const slider = document.getElementById("stress");
  const score = document.getElementById("pressurePreviewScore");
  const text = document.getElementById("pressurePreviewText");

  if (!slider || !score || !text) return;

  score.textContent = slider.value;
  text.textContent = getPressurePreviewText(slider.value);

  score.classList.remove("low", "middle", "high", "level-1", "level-2", "level-3", "level-4", "level-5");
  score.classList.add(getPressureColorClass(slider.value));
}


function submitPressure() {
  state.stress = document.getElementById("stress").value;
  state.pressureReason = Array.from(document.querySelectorAll(".pressure-options input:checked")).map(i => i.value);
  upsertRecord(state.pressureRecords, todayKey, {
    stress: Number(state.stress),
    reasons: state.pressureReason,
    updatedAt: new Date().toISOString()
  });
  save();
  renderDashboard();
}

function renderCalendar() {
  const checkedToday = state.lastCheckinDate === todayKey;
  const content = `
    <div class="page-title">
      <h1>連續學習月曆</h1>
      <p>每日最多只能打卡一次，避免連續學習天數被重複增加。</p>
    </div>

    <div class="calendar-layout">
      <div class="calendar-card">
        <div class="calendar-head">
          <h2>${now.getFullYear()} 年 ${now.getMonth() + 1} 月</h2>
          <button class="small-outline" ${checkedToday ? "disabled" : ""} onclick="checkInToday()">
            ${checkedToday ? "今日已打卡" : "今日打卡"}
          </button>
        </div>
        ${buildCalendar()}
      </div>

      <div class="info-card">
        <h3>目前連續學習天數</h3>
        <div class="big-number">${state.streak} 天</div>
        <p>${checkedToday ? "今天已經完成學習打卡，明天再繼續累積。" : "今天尚未打卡，完成今日學習後可以打卡一次。"}</p>
        <hr>
        <h3>打卡規則</h3>
        <p>同一天只能打卡一次，系統會用日期判斷是否已完成今日打卡。</p>
      </div>
    </div>
  `;
  appLayout("calendar", "連續學習", content);
}

function buildCalendar() {
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const totalDays = last.getDate();
  let cells = ["日","一","二","三","四","五","六"].map(d => `<div class="day-name">${d}</div>`).join("");

  for (let i = 0; i < startDay; i++) {
    cells += `<div></div>`;
  }

  for (let d = 1; d <= totalDays; d++) {
    const key = `${year}-${String(month+1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const done = state.checkinDates.includes(key);
    const isToday = key === todayKey;
    cells += `<div class="day ${done ? "done" : ""} ${isToday ? "today" : ""}" onclick="renderDailyDetail('${key}')">${d}</div>`;
  }

  return `<div class="calendar-grid">${cells}</div>`;
}

function checkInToday() {
  if (state.lastCheckinDate === todayKey) {
    alert("今天已經打卡過囉！每日最多只能打卡一次。");
    return;
  }
  state.lastCheckinDate = todayKey;
  if (!state.checkinDates.includes(todayKey)) {
    state.checkinDates.push(todayKey);
  }
  state.streak += 1;
  save();
  renderCalendar();
}


function renderDailyDetail(dateKey) {
  const moodRecord = getRecordByDate(state.moodRecords, dateKey);
  const pressureRecord = getRecordByDate(state.pressureRecords, dateKey);
  const checked = state.checkinDates.includes(dateKey);

  const content = `
    <div class="page-title">
      <h1>${dateKey} 每日紀錄</h1>
      <p>查看指定日期的學習狀態回饋與壓力檢測結果。</p>
    </div>

    <div class="daily-detail-grid">
      <div class="info-card">
        <h3>今日學習狀態</h3>
        <div class="daily-big">${moodRecord ? moodRecord.mood : "尚未填寫"}</div>
        <p>${moodRecord && moodRecord.note ? moodRecord.note : "這一天沒有學習狀態備註。"}</p>
      </div>

      <div class="info-card">
        <h3>壓力檢測</h3>
        <div class="daily-big">${pressureRecord ? pressureRecord.stress + " / 5" : "尚未檢測"}</div>
        <p>${pressureRecord && pressureRecord.reasons && pressureRecord.reasons.length ? pressureRecord.reasons.join("、") : "這一天沒有壓力原因紀錄。"}</p>
      </div>

      <div class="info-card">
        <h3>連續學習</h3>
        <div class="daily-big">${checked ? "已打卡" : "未打卡"}</div>
        <p>${checked ? "這一天有完成學習打卡。" : "這一天尚未完成學習打卡。"}</p>
      </div>
    </div>

    <div class="submit-wrap">
      <button class="small-outline" onclick="renderCalendar()">返回月曆</button>
    </div>
  `;
  appLayout("calendar", "每日紀錄", content);
}



function renderSettings() {
  const content = `
    <div class="page-title">
      <h1>介面設定</h1>
      <p>可以依照喜好調整系統主題顏色與字體大小。每個帳號都會保留自己的設定與學習紀錄。</p>
    </div>

    <div class="settings-grid">
      <div class="settings-card">
        <h3>主題顏色</h3>
        <p>選擇你喜歡的介面風格。</p>

        <div class="theme-options">
          <button class="theme-option yellow ${state.theme === "yellow" ? "selected" : ""}" onclick="setTheme('yellow')">
            <span></span>
            黃色
          </button>

          <button class="theme-option blue ${state.theme === "blue" ? "selected" : ""}" onclick="setTheme('blue')">
            <span></span>
            藍色
          </button>

          <button class="theme-option purple ${state.theme === "purple" ? "selected" : ""}" onclick="setTheme('purple')">
            <span></span>
            紫色
          </button>
        </div>
      </div>

      <div class="settings-card">
        <h3>字體大小</h3>
        <p>依照閱讀習慣調整整體文字大小。</p>

        <div class="font-options">
          <button class="${state.fontSize === "small" ? "selected" : ""}" onclick="setFontSize('small')">小</button>
          <button class="${state.fontSize === "normal" ? "selected" : ""}" onclick="setFontSize('normal')">標準</button>
          <button class="${state.fontSize === "large" ? "selected" : ""}" onclick="setFontSize('large')">大</button>
        </div>

        <div class="font-preview">
          <strong>預覽文字</strong>
          <p>這是一段學習狀態回饋與 AI 學習建議的預覽內容。</p>
        </div>
      </div>

      <div class="settings-card font-style-card">
        <h3>字體樣式</h3>
        <p>可以切換不同風格的字體，讓介面更符合你的喜好。</p>

        <div class="font-style-options">
          <button class="${state.fontFamily === "default" ? "selected" : ""}" onclick="setFontFamily('default')">
            <strong>預設字體</strong>
            <span>乾淨、清楚、適合正式報告</span>
          </button>

          <button class="${state.fontFamily === "rounded" ? "selected" : ""}" onclick="setFontFamily('rounded')">
            <strong>圓體風格</strong>
            <span>柔和、可愛、比較有親和力</span>
          </button>

          <button class="${state.fontFamily === "formal" ? "selected" : ""}" onclick="setFontFamily('formal')">
            <strong>正式字體</strong>
            <span>穩重、清楚、適合系統平台</span>
          </button>

          <button class="${state.fontFamily === "handwrite" ? "selected" : ""}" onclick="setFontFamily('handwrite')">
            <strong>手寫感字體</strong>
            <span>溫柔、有學習筆記感</span>
          </button>
        </div>
      </div>
    </div>
  `;

  appLayout("settings", "設定", content);
}

function setTheme(theme) {
  state.theme = theme;
  save();
  renderSettings();
}

function setFontSize(size) {
  state.fontSize = size;
  save();
  renderSettings();
}

function setFontFamily(fontFamily) {
  state.fontFamily = fontFamily;
  save();
  renderSettings();
}


function renderAI() {
  const content = `
    <div class="ai-title">
      <h1>AI 學習建議</h1>
      <p>根據你的學習狀態與壓力檢測，我們為你生成以下建議：</p>
    </div>

    <div class="ai-message">
      <p><strong>${getAdvice()}</strong><br>${getPressureAdvice()}</p>
      <div class="bot">🤖</div>
    </div>

    ${renderWeeklySummaryCard()}

    <div class="ai-grid">
      <div class="todo-card">
        <h2>To-Do List</h2>
        ${state.todos.map((todo, index) => `
          <div class="todo-item">
            <input type="checkbox" ${todo.done ? "checked" : ""} onchange="toggleTodo(${index})">
            <span>${todo.text}</span>
            <small>建議時間：${todo.time}</small>
            <button class="delete-task-btn" onclick="deleteTodo(${index})">刪除</button>
          </div>
        `).join("")}
        <div class="todo-actions">
          <button class="link-btn" onclick="addTodo()">＋ 新增任務</button>
          <button class="delete-all-btn" onclick="clearDoneTodos()">刪除已完成</button>
        </div>
      </div>

      <div class="side-cards">
        <div class="small-card">
          <h3>自律養成</h3>
          <p>連續學習天數</p>
          <div class="big-number">${state.streak} 天</div>
          <p>每日最多打卡一次。</p>
          <button class="small-outline" onclick="renderCalendar()">查看月曆</button>
        </div>

        <div class="small-card">
          <h3>目標拆解</h3>
          <p>將大目標拆解為小任務，一步一步完成！</p>
          <button class="small-outline" onclick="alert('範例：期末報告 → 查資料 → 寫大綱 → 完成初稿 → 修改')">前往拆解</button>
        </div>
      </div>
    </div>
  `;
  appLayout("ai", "AI 學習引導", content);
}

function toggleTodo(index) {
  state.todos[index].done = !state.todos[index].done;
  save();
}

function addTodo() {
  const text = prompt("請輸入新的任務：");
  if (text) {
    state.todos.push({ text, time: "30 分鐘", done: false });
    save();
    renderAI();
  }
}

function deleteTodo(index) {
  const taskName = state.todos[index]?.text || "這個任務";
  if (confirm(`確定要刪除「${taskName}」嗎？`)) {
    state.todos.splice(index, 1);
    save();
    renderAI();
  }
}

function clearDoneTodos() {
  const doneCount = state.todos.filter(todo => todo.done).length;
  if (doneCount === 0) {
    alert("目前沒有已完成的任務可以刪除。");
    return;
  }

  if (confirm(`確定要刪除 ${doneCount} 個已完成任務嗎？`)) {
    state.todos = state.todos.filter(todo => !todo.done);
    save();
    renderAI();
  }
}

renderLogin();
