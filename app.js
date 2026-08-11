import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, getDocs, doc, setDoc, deleteDoc, updateDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyDwBMOwkusrREAlpMhvf9E0sZPEytnQlhI",
  authDomain: "findirector2.firebaseapp.com",
  projectId: "findirector2",
  storageBucket: "findirector2.firebasestorage.app",
  messagingSenderId: "1037712647995",
  appId: "1:1037712647995:web:6666fa1b41629aa683b91e"
};

const fbApp = initializeApp(firebaseConfig);
// Кэш в IndexedDB: чтение работает офлайн, записи уходят при появлении сети
const db = initializeFirestore(fbApp, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// Кому разрешён вход. Тот же список должен стоять в правилах Firestore —
// здесь он только ради понятного сообщения, защита живёт на сервере.
const ALLOWED = [
  'akimdauletkeldy@gmail.com',
];

const auth = getAuth(fbApp);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({prompt: 'select_account'});

// Новые коллекции с префиксом v2_ — старый ФинДиректор не затрагивается
const COL = {
  profiles: 'v2_profiles',
  wallets:  'v2_wallets',
  cats:     'v2_cats',
  ops:      'v2_ops',
  budgets:  'v2_budgets',
};

// Ответ сервера не ждём: id генерируем локально, Firestore досылает сам
const onErr = e => console.warn('sync:', e);
function fbAdd(col, data){ const r = doc(collection(db, col)); setDoc(r, data).catch(onErr); return r.id; }
function fbSet(col, id, data){ setDoc(doc(db, col, id), data).catch(onErr); }
function fbUpd(col, id, patch){ updateDoc(doc(db, col, id), patch).catch(onErr); }
function fbDel(col, id){ deleteDoc(doc(db, col, id)).catch(onErr); }

// ============ справочники ============

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const DOW = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];

const CURRENCIES = [
  {code:'KZT', sign:'₸', name:'Казахстанский тенге'},
  {code:'USD', sign:'$', name:'Доллар США'},
  {code:'EUR', sign:'€', name:'Евро'},
  {code:'RUB', sign:'₽', name:'Российский рубль'},
  {code:'KGS', sign:'с', name:'Киргизский сом'},
];

const PALETTE = ['#5ac8fa','#5e5ce6','#ff6b35','#3b46d4','#ff9ecd','#4a5ae8','#a4d233','#32ade6',
  '#ff453a','#30d158','#af52de','#ffd60a','#ff9f0a','#64d2ff','#bf5af2','#8e8e93'];

const ICONS = ['🛒','🏠','🧾','👑','🥤','🚕','🍔','🧳','📱','💊','🚗','⛽','👔','🪥','🎁','💳','🕌','🎉',
  '🍖','📚','🎮','🚨','💕','💼','☕','🅿️','🛁','🔨','💰','🎖','💹','🏝','💻','👛','🏦','🕵️','✈️','🐣','💍','⛏','🧾','🥤','🚗','⛽'];

// Категории расходов по умолчанию.
// Сбережений и погашения кредитов здесь намеренно нет: это переводы между
// кошельками, а не траты. Иначе расходы за месяц выглядят больше реальных.
const EXPENSE_TREE = [
  {n:'Жильё и ЖКХ', i:'🏠', c:'#5e5ce6',
   sub:['Аренда/Ипотека','Квартплата и счета','Связь и интернет','Быт и расходники']},
  {n:'Питание', i:'🛒', c:'#5ac8fa',
   sub:['Продукты','Кафе и рестораны','Доставка еды','Кофе и перекусы']},
  {n:'Транспорт', i:'🚕', c:'#4a5ae8',
   sub:['Общественный транспорт','Такси/Каршеринг','Топливо','Сервис и ремонт']},
  {n:'Здоровье и красота', i:'💊', c:'#ff453a',
   sub:['Медицина/Аптека','Уход и косметика','Салон','Спорт']},
  {n:'Одежда и стиль', i:'👔', c:'#ffd60a',
   sub:['Одежда','Обувь','Аксессуары']},
  {n:'Развлечения и досуг', i:'🎮', c:'#af52de',
   sub:['Кино/Театр/Выставки','Хобби и развитие','Подписки','Путешествия']},
  {n:'Сабина', i:'💕', c:'#ff9ecd',
   sub:['Салон и уход','Одежда и украшения','Совместный досуг','Цветы и подарки']},
  {n:'Семья и родные', i:'👑', c:'#3b46d4',
   sub:['Родителям','Братья и сёстры','Поездки к своим']},
  {n:'Той и традиции', i:'🎉', c:'#ff6b35',
   sub:['Коримдік','Сүйінші','Ас/Дастархан','Подарки на той']},
  {n:'Свадьба', i:'💍', c:'#ff2d55',
   sub:['Тойхана','Наряды','Кольца','Фото и видео','Ведущий и музыка']},
  {n:'Вахта', i:'⛏', c:'#32ade6',
   sub:['Дорога','Спецодежда','Еда в пути']},
  {n:'Финансы и прочее', i:'💼', c:'#8e8e93',
   sub:['Налоги','Комиссии банка','Непредвиденное','Благотворительность']},
];

// sub — подкатегории, создаются вместе с родителем
// Номер версии набора: увеличивается, если структура категорий меняется
const TREE_VERSION = 2;

const DEF_EXP = EXPENSE_TREE.map(n => ({n:n.n, i:n.i, c:n.c, sub:n.sub}));

const DEF_INC = [
  {n:'Зарплата',  i:'💰', c:'#a4d233', sub:['Аванс','Основная']},
  {n:'Премия',    i:'🎖', c:'#ff2d55', sub:[]},
  {n:'Отпускные', i:'🏝', c:'#3b46d4', sub:[]},
  {n:'Проценты',  i:'💹', c:'#ff6b35', sub:[]},
  {n:'Фриланс',   i:'💻', c:'#5ac8fa', sub:[]},
  {n:'Подарок',   i:'🎁', c:'#bf5af2', sub:[]},
  {n:'Прочее',    i:'💵', c:'#8e8e93', sub:[]},
];


const DEF_WALLETS = [
  {n:'Наличные',      i:'👛', c:'#5ac8fa', kind:'normal'},
  {n:'Каспи голд',    i:'💳', c:'#ff6b35', kind:'normal'},
  {n:'Каспи депозит', i:'🏦', c:'#ff2d55', kind:'normal'},
  {n:'Долги',         i:'🕵️', c:'#af52de', kind:'debt'},
];

// ============ состояние ============

const today = new Date();
const LS = {
  get(k, d){ try { return JSON.parse(localStorage.getItem('fin2_'+k)) ?? d; } catch { return d; } },
  set(k, v){ try { localStorage.setItem('fin2_'+k, JSON.stringify(v)); } catch {} },
};

let S = {
  ready:false, syncing:false,
  authReady:false, user:null, authError:'', signingIn:false,
  tab:'panel',                       // panel | history | report | settings
  month:today.getMonth(), year:today.getFullYear(),
  profiles:[], wallets:[], cats:[], ops:[], budgets:{},
  profileId: LS.get('profile', null),
  mainCurrency: LS.get('currency', 'KZT'),
  rates: LS.get('rates', {USD:540, EUR:590, RUB:6.5, KGS:6.2}),
  open: LS.get('open', {income:true, wallets:true, expense:true}),
  showDebt: LS.get('showDebt', true),
  search:'',
  reportKind:'expense',              // expense | income | both
  debtFilter:'all',                  // i | me | all
  sheet:null,                        // {mode, ...}
  monthPicker:false,
};

function setS(patch){ Object.assign(S, typeof patch === 'function' ? patch(S) : patch); render(); }

// ============ утилиты ============

const fmt = n => new Intl.NumberFormat('ru-RU').format(Math.round(Number(n)||0));
const sign = code => (CURRENCIES.find(c=>c.code===code)||CURRENCIES[0]).sign;
const mainSign = () => sign(S.mainCurrency);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const mkOf = d => `${d.getFullYear()}-${d.getMonth()}`;
const curMk = () => `${S.year}-${S.month}`;
const esc = s => String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function localInput(d){
  const p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function toKZT(amount, currency){
  if(currency === S.mainCurrency) return amount;
  const r = currency === S.mainCurrency ? 1 : (S.rates[currency] || 1);
  return amount * r;
}

// ============ выборки ============

const profile = () => S.profiles.find(p=>p.id===S.profileId) || S.profiles[0] || null;
const myWallets = () => S.wallets.filter(w=>w.profileId===S.profileId);
const wallet = id => S.wallets.find(w=>w.id===id);
const cat = id => S.cats.find(c=>c.id===id);
const parents = type => S.cats.filter(c=>c.profileId===S.profileId && c.type===type && !c.parentId)
  .sort((a,b)=>(a.order||0)-(b.order||0));
const childrenOf = pid => S.cats.filter(c=>c.parentId===pid).sort((a,b)=>(a.order||0)-(b.order||0));

const monthOps = (mkey = curMk()) =>
  S.ops.filter(o => o.profileId===S.profileId && o.monthKey===mkey);

function walletBalance(id){
  const w = wallet(id);
  if(!w) return 0;
  // Кошелёк «Долги» — не хранилище денег, а сводка: сколько вам должны минус ваши долги
  if(w.kind === 'debt') return debtTotal();

  let bal = Number(w.initialBalance) || 0;
  for(const o of S.ops){
    if(o.type === 'expense' && o.walletId === id) bal -= o.amount;
    else if(o.type === 'income' && o.walletId === id) bal += o.amount;
    else if(o.type === 'debt' && o.walletId === id){
      bal += (DEBT_DIR[o.debtDir]?.wallet || 0) * o.amount;
    }
    else if(o.type === 'transfer'){
      if(o.walletId === id) bal -= o.amount;
      if(o.toWalletId === id) bal += (o.amountTo ?? o.amount);
    }
  }
  return bal;
}

// Сумма по родительской категории — вместе со всеми подкатегориями
function catTotals(type, mkey = curMk()){
  const out = {};
  for(const o of monthOps(mkey)){
    if(o.type !== type) continue;
    const c = cat(o.catId);
    const rootId = c ? (c.parentId || c.id) : o.catId;
    out[rootId] = (out[rootId] || 0) + o.amount;
  }
  return out;
}
const sumOf = (type, mkey = curMk()) =>
  monthOps(mkey).filter(o=>o.type===type).reduce((s,o)=>s+o.amount, 0);

function dayFactor(){
  const now = new Date();
  if(S.year === now.getFullYear() && S.month === now.getMonth()) return now.getDate();
  return new Date(S.year, S.month+1, 0).getDate();
}

// ============ загрузка и посев ============

async function loadAll(){
  const [pSnap, wSnap, cSnap, oSnap, bSnap] = await Promise.all([
    getDocs(collection(db, COL.profiles)),
    getDocs(collection(db, COL.wallets)),
    getDocs(collection(db, COL.cats)),
    getDocs(collection(db, COL.ops)),
    getDocs(collection(db, COL.budgets)),
  ]);
  const pick = snap => { const a=[]; snap.forEach(d=>a.push({...d.data(), id:d.id})); return a; };
  S.profiles = pick(pSnap).sort((a,b)=>(a.order||0)-(b.order||0));
  S.wallets  = pick(wSnap).sort((a,b)=>(a.order||0)-(b.order||0));
  S.cats     = pick(cSnap);
  S.ops      = pick(oSnap).sort((a,b)=> new Date(b.date) - new Date(a.date));
  S.budgets  = {};
  bSnap.forEach(d => { S.budgets[d.id] = d.data().amount || 0; });

  if(!S.profiles.length) seedProfile('Личный', 'Л');
  if(!S.profiles.some(p=>p.id===S.profileId)) S.profileId = S.profiles[0].id;
  LS.set('profile', S.profileId);

  // Разовое обновление структуры категорий для профилей, заведённых раньше.
  // Метка treeV на профиле не даёт повториться при следующих запусках.
  for(const p of S.profiles){
    const prev = S.profileId;
    S.profileId = p.id;
    dedupeCategories();                          // подчищаем следы прошлых гонок
    if(p.treeV !== TREE_VERSION){
      applyExpenseTree();
      dedupeCategories();
      p.treeV = TREE_VERSION;
      fbUpd(COL.profiles, p.id, {treeV: TREE_VERSION});
    }
    S.profileId = prev;
  }
}

function seedProfile(name, icon){
  const pid = uid();
  const p = {id:pid, name, icon, order:S.profiles.length, treeV:TREE_VERSION};
  fbSet(COL.profiles, pid, {name, icon, order:p.order, treeV:TREE_VERSION});
  S.profiles = [...S.profiles, p];

  DEF_WALLETS.forEach((w, i) => {
    const id = uid();
    const data = {profileId:pid, name:w.n, icon:w.i, color:w.c, currency:S.mainCurrency,
      initialBalance:0, kind:w.kind, order:i};
    fbSet(COL.wallets, id, data);
    S.wallets.push({...data, id});
  });

  const seedCats = (list, type) => list.forEach((c, i) => {
    const id = uid();
    const data = {profileId:pid, type, name:c.n, icon:c.i, color:c.c, parentId:null, order:i};
    fbSet(COL.cats, id, data);
    S.cats.push({...data, id});
    c.sub.forEach((sn, j) => {
      const sid = uid();
      const sd = {profileId:pid, type, name:sn, icon:c.i, color:c.c, parentId:id, order:j};
      fbSet(COL.cats, sid, sd);
      S.cats.push({...sd, id:sid});
    });
  });
  seedCats(DEF_EXP, 'expense');
  seedCats(DEF_INC, 'income');
  return pid;
}

// ============ операции ============

function saveOp(data, id){
  const d = new Date(data.date);
  const body = {...data, monthKey: mkOf(d), profileId: S.profileId};
  if(id){
    fbUpd(COL.ops, id, body);
    S.ops = S.ops.map(o => o.id===id ? {...o, ...body} : o);
  } else {
    const nid = fbAdd(COL.ops, body);
    S.ops = [{...body, id:nid}, ...S.ops];
  }
  S.ops.sort((a,b)=> new Date(b.date) - new Date(a.date));
}
function deleteOp(id){
  fbDel(COL.ops, id);
  S.ops = S.ops.filter(o => o.id !== id);
}
function setBudget(catId, amount){
  const key = `${S.profileId}__${catId}`;
  if(amount > 0){ fbSet(COL.budgets, key, {amount, profileId:S.profileId, catId}); S.budgets[key] = amount; }
  else { fbDel(COL.budgets, key); delete S.budgets[key]; }
}
const budgetOf = catId => S.budgets[`${S.profileId}__${catId}`] || 0;
// ==================== ПАНЕЛЬ ====================

function tileHTML(id, name, icon, color, value, kind){
  const zero = !value;
  return `<button class="tile" data-tile="${kind}" data-id="${id}">
    <div class="tile-name">${esc(name)}</div>
    <div class="tile-icon" style="background:${color}">${icon}</div>
    <div class="tile-val${zero?' zero':''}">${fmt(value)} ${mainSign()}</div>
  </button>`;
}

function addTileHTML(what){
  const label = what === 'wallets' ? 'Добавить кошелёк' : 'Добавить категорию';
  // Пустая подпись — распорка, чтобы кружок встал вровень с соседними
  return `<button class="tile" data-add-tile="${what}" aria-label="${label}" title="${label}">
    <div class="tile-name"></div>
    <div class="tile-icon add">+</div>
  </button>`;
}

function chunk(arr, n){
  const out = [];
  for(let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out.length ? out : [[]];
}

// Секция панели: плитки разложены по страницам, лишние листаются вбок
function sectionHTML(key, title, sum, items, maxRows){
  const open = S.open[key];
  const perPage = maxRows * 4;
  const pages = chunk(items, perPage);
  const rows = Math.min(maxRows, Math.max(1, Math.ceil(Math.min(items.length, perPage) / 4)));

  return `
  <div class="sec-head">
    <button class="sec-name" data-toggle="${key}">
      <span class="chev${open?'':' closed'}">▾</span>${title}
    </button>
    <span class="sec-sum">${fmt(sum)} ${mainSign()}</span>
  </div>
  ${open ? `<div class="tile-box">
    <div class="pager" data-pager="${key}">
      ${pages.map(p => `<div class="page"><div class="tiles"
        style="grid-template-rows:repeat(${rows},auto)">${p.join('')}</div></div>`).join('')}
    </div>
    ${pages.length > 1 ? `<div class="dots" data-dots="${key}">
      ${pages.map((_, i) => `<span class="dot${i===0?' on':''}"></span>`).join('')}
    </div>` : ''}
  </div>` : ''}`;
}

function viewPanel(){
  const p = profile();
  const incTot = catTotals('income'), expTot = catTotals('expense');

  const incTiles = parents('income').filter(c => !c.hidden)
    .map(c => tileHTML(c.id, c.name, c.icon, c.color, incTot[c.id]||0, 'cat'));
  const expTiles = parents('expense').filter(c => !c.hidden)
    .map(c => tileHTML(c.id, c.name, c.icon, c.color, expTot[c.id]||0, 'cat'));

  const ws = myWallets().filter(w => !w.hidden && (S.showDebt || w.kind !== 'debt'));
  const walTiles = ws.map(w =>
    tileHTML(w.id, w.name, w.icon, w.color, walletBalance(w.id), 'wallet'));

  // Долги — это обязательства, а не деньги в кармане, поэтому в итог не идут
  const walTotal = myWallets()
    .filter(w => w.kind !== 'debt')
    .reduce((s,w) => s + toKZT(walletBalance(w.id), w.currency), 0);

  return `
  <div class="top">
    <button class="avatar" id="profileBtn">${esc(p ? p.icon : '·')}</button>
    <button class="month-btn" id="monthBtn">${MONTHS[S.month].toUpperCase()} ▾</button>
    <button class="round-btn" data-go-tab="settings">•••</button>
  </div>
  <div class="wrap">
    ${sectionHTML('income','Доходы', sumOf('income'), [...incTiles, addTileHTML('income')], 1)}
    ${sectionHTML('wallets','Кошельки', walTotal, [...walTiles, addTileHTML('wallets')], 1)}
    ${sectionHTML('expense','Расходы', sumOf('expense'), [...expTiles, addTileHTML('expense')], 3)}
    ${!parents('expense').length ? '<div class="empty">Категорий пока нет.<br>Добавьте их в настройках.</div>' : ''}
  </div>`;
}

// ==================== ИСТОРИЯ ====================

function opTitle(o){
  if(o.type === 'debt'){
    const d = DEBT_DIR[o.debtDir];
    return `${d ? d.label : 'Долг'}: ${o.person || '—'}`;
  }
  if(o.type === 'transfer'){
    const a = wallet(o.walletId), b = wallet(o.toWalletId);
    return `${a?a.name:'—'} → ${b?b.name:'—'}`;
  }
  const c = cat(o.catId);
  if(!c) return 'Без категории';
  if(c.parentId){
    const p = cat(c.parentId);
    return `${p?p.name:'—'} / ${c.name}`;
  }
  return c.name;
}
function opVisual(o){
  if(o.type === 'debt') return {icon:'🤝', color:'#af52de'};
  if(o.type === 'transfer') return {icon:'↔️', color:'#8e8e93'};
  const c = cat(o.catId);
  if(!c) return {icon:'💼', color:'#8e8e93'};
  return {icon:c.icon, color:c.color};
}

function viewHistory(){
  const q = S.search.trim().toLowerCase();
  let list = monthOps();
  if(q) list = list.filter(o =>
    (o.note||'').toLowerCase().includes(q) ||
    opTitle(o).toLowerCase().includes(q) ||
    String(o.amount).includes(q));

  const inc = sumOf('income'), exp = sumOf('expense'), saldo = inc - exp;

  // группировка по дням
  const byDay = {};
  for(const o of list){
    const d = new Date(o.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    (byDay[key] = byDay[key] || []).push(o);
  }
  const dayKeys = Object.keys(byDay).sort((a,b)=>{
    const [ay,am,ad]=a.split('-').map(Number), [by,bm,bd]=b.split('-').map(Number);
    return new Date(by,bm,bd) - new Date(ay,am,ad);
  });

  const days = dayKeys.map(k => {
    const [y,m,dd] = k.split('-').map(Number);
    const d = new Date(y,m,dd);
    const ops = byDay[k];
    const net = ops.reduce((s,o)=> s + (o.type==='income' ? o.amount : o.type==='expense' ? -o.amount : 0), 0);
    return `
    <div class="day-head">
      <span>${dd} ${MONTHS_GEN[m]} ${y}, ${DOW[d.getDay()]}</span>
      <span style="color:${net>=0?'var(--green)':'var(--text)'}">${net>0?'+':''}${fmt(net)} ${mainSign()}</span>
    </div>
    ${ops.map(o => {
      const v = opVisual(o);
      const w = wallet(o.walletId);
      const dw = o.type==='debt' ? (DEBT_DIR[o.debtDir]?.wallet || 0) : 0;
      const col = o.type==='income' ? 'var(--green)'
                : o.type==='debt' ? (dw>0 ? 'var(--green)' : 'var(--red)')
                : o.type==='transfer' ? 'var(--muted)' : 'var(--text)';
      const pre = o.type==='income' ? '+' : o.type==='expense' ? '−'
                : o.type==='debt' ? (dw>0 ? '+' : '−') : '';
      return `<button class="op" data-edit-op="${o.id}">
        <div class="op-icon" style="background:${v.color}">${v.icon}</div>
        <div class="op-main">
          <div class="op-title">${esc(opTitle(o))}</div>
          ${o.type!=='transfer' && w ? `<div class="op-wallet">${esc(w.name)}</div>` : ''}
          ${o.note ? `<div class="op-note">${esc(o.note)}</div>` : ''}
        </div>
        <div class="op-amt" style="color:${col}">${pre}${fmt(o.amount)} ${mainSign()}</div>
      </button>`;
    }).join('')}`;
  }).join('');

  return `
  <div class="top">
    <span style="width:48px"></span>
    <button class="month-btn" id="monthBtn">${MONTHS[S.month]} ${S.year} ▾</button>
    <span style="width:48px"></span>
  </div>
  <div class="wrap">
    <div class="search">
      <span style="color:var(--muted)">🔍</span>
      <input id="searchInp" placeholder="Поиск по операциям" value="${esc(S.search)}"/>
      ${S.search ? '<button id="clearSearch" style="color:var(--muted)">✕</button>' : ''}
    </div>
    <div class="big-sum">
      <div class="l">сальдо</div>
      <div class="v" style="color:${saldo>=0?'var(--green)':'var(--text)'}">${saldo>0?'+':''}${fmt(saldo)} ${mainSign()}</div>
    </div>
    <div class="duo">
      <div class="duo-box"><div class="duo-l">Поступления</div>
        <div class="duo-v" style="color:var(--green)">${fmt(inc)} ${mainSign()}</div></div>
      <div class="duo-box"><div class="duo-l">Списания</div>
        <div class="duo-v" style="color:var(--red)">${fmt(exp)} ${mainSign()}</div></div>
    </div>
    <div style="font-size:22px;font-weight:800;margin-bottom:10px">Список операций</div>
    ${list.length ? days : `<div class="empty">${q ? 'Ничего не нашлось' : 'За этот месяц операций нет.<br>Нажмите + чтобы добавить первую.'}</div>`}
  </div>`;
}

// ==================== ОТЧЁТ ====================

function donut(slices, total){
  if(!total) return '<div class="empty">Нет данных за месяц</div>';
  const R = 90, r = 52, cx = 110, cy = 110;
  let angle = -Math.PI/2;
  const paths = slices.map(s => {
    const frac = s.value / total;
    const a2 = angle + frac * Math.PI * 2;
    const big = frac > .5 ? 1 : 0;
    const pt = (rad, a) => `${(cx + rad*Math.cos(a)).toFixed(2)} ${(cy + rad*Math.sin(a)).toFixed(2)}`;
    // полный круг нельзя нарисовать одной дугой — рисуем кольцо целиком
    const d = frac > .999
      ? `M ${cx-R} ${cy} A ${R} ${R} 0 1 1 ${cx+R} ${cy} A ${R} ${R} 0 1 1 ${cx-R} ${cy} Z
         M ${cx-r} ${cy} A ${r} ${r} 0 1 0 ${cx+r} ${cy} A ${r} ${r} 0 1 0 ${cx-r} ${cy} Z`
      : `M ${pt(R,angle)} A ${R} ${R} 0 ${big} 1 ${pt(R,a2)} L ${pt(r,a2)} A ${r} ${r} 0 ${big} 0 ${pt(r,angle)} Z`;
    const mid = angle + frac*Math.PI;
    const label = frac > .06
      ? `<text x="${(cx + 71*Math.cos(mid)).toFixed(1)}" y="${(cy + 71*Math.sin(mid)).toFixed(1)}"
           text-anchor="middle" dominant-baseline="central" fill="#fff"
           font-size="12" font-weight="700">${(frac*100).toFixed(1).replace('.',',')}%</text>` : '';
    angle = a2;
    return `<path d="${d}" fill="${s.color}" fill-rule="evenodd"/>${label}`;
  }).join('');
  return `<svg viewBox="0 0 220 220" width="100%" style="max-width:280px;display:block;margin:8px auto 18px">${paths}</svg>`;
}

function viewReport(){
  const kind = S.reportKind;
  const days = dayFactor();

  const build = type => {
    const totals = catTotals(type);
    const sum = sumOf(type);
    const items = parents(type)
      .filter(c => totals[c.id])
      .map(c => ({id:c.id, name:c.name, color:c.color, icon:c.icon, value:totals[c.id]}))
      .sort((a,b)=> b.value - a.value);
    return {items, sum};
  };

  const primary = kind === 'income' ? build('income') : build('expense');
  const label = kind === 'income' ? 'Доходы' : 'Расходы';
  const budgetSum = parents('expense').reduce((s,c)=> s + budgetOf(c.id), 0);

  let body;
  if(kind === 'both'){
    const inc = build('income'), exp = build('expense');
    const max = Math.max(inc.sum, exp.sum, 1);
    body = `
    <div class="card">
      <div style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;font-size:15px">
          <span>Доходы</span><span style="color:var(--green);font-weight:700">${fmt(inc.sum)} ${mainSign()}</span>
        </div>
        <div class="bar"><div class="bar-fill" style="width:${inc.sum/max*100}%;background:var(--green)"></div></div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;font-size:15px">
          <span>Расходы</span><span style="color:var(--red);font-weight:700">${fmt(exp.sum)} ${mainSign()}</span>
        </div>
        <div class="bar"><div class="bar-fill" style="width:${exp.sum/max*100}%;background:var(--red)"></div></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:18px;padding-top:14px;
        border-top:.5px solid var(--line);font-size:16px;font-weight:700">
        <span>Сальдо</span>
        <span style="color:${inc.sum-exp.sum>=0?'var(--green)':'var(--red)'}">
          ${inc.sum-exp.sum>0?'+':''}${fmt(inc.sum-exp.sum)} ${mainSign()}</span>
      </div>
    </div>`;
  } else {
    body = `
    ${donut(primary.items, primary.sum)}
    <div class="stat-3">
      <div><div class="stat-l">Бюджет</div><div class="stat-v">${kind==='expense'?fmt(budgetSum):'—'} ${kind==='expense'?mainSign():''}</div></div>
      <div><div class="stat-l">${label}</div>
        <div class="stat-v" style="color:${kind==='income'?'var(--green)':'var(--red)'}">${fmt(primary.sum)} ${mainSign()}</div></div>
      <div><div class="stat-l">~ в день</div><div class="stat-v">${fmt(primary.sum/days)} ${mainSign()}</div></div>
    </div>
    <div class="card">
      <div style="font-size:19px;font-weight:800;margin-bottom:6px">${label} по категориям</div>
      ${primary.items.length ? primary.items.map(it => {
        const pct = primary.sum ? it.value/primary.sum*100 : 0;
        const bud = kind==='expense' ? budgetOf(it.id) : 0;
        const over = bud && it.value > bud;
        return `<div class="legend" style="display:block">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="legend-dot" style="background:${it.color}"></div>
            <div style="flex:1;font-size:15px">${it.icon} ${esc(it.name)}</div>
            <div style="font-weight:700;font-size:15px">${fmt(it.value)} ${mainSign()}</div>
            <div style="color:var(--muted);font-size:13px;width:46px;text-align:right">${pct.toFixed(1)}%</div>
          </div>
          <div class="bar"><div class="bar-fill" style="width:${pct}%;background:${it.color}"></div></div>
          ${kind==='expense' ? `<div style="display:flex;align-items:center;gap:8px;margin-top:8px">
            <span style="font-size:12px;color:${over?'var(--red)':'var(--muted)'}">
              ${bud ? (over ? `превышен на ${fmt(it.value-bud)}` : `из ${fmt(bud)} ${mainSign()}`) : 'лимит не задан'}</span>
            <input class="inp budget-inp" data-cat="${it.id}" type="number" inputmode="decimal"
              placeholder="лимит" value="${bud||''}"
              style="margin-left:auto;width:110px;padding:7px 10px;font-size:13px;text-align:right"/>
          </div>` : ''}
        </div>`;
      }).join('') : '<div class="empty">Нет операций за месяц</div>'}
    </div>`;
  }

  return `
  <div class="screen-title">Отчёт</div>
  <div class="wrap">
    <div class="seg">
      <button class="${kind==='income'?'on':''}" data-report="income">Доходы</button>
      <button class="${kind==='expense'?'on':''}" data-report="expense">Расходы</button>
      <button class="${kind==='both'?'on':''}" data-report="both">Вместе</button>
    </div>
    <div style="display:flex;align-items:center;justify-content:center;gap:18px;margin-bottom:16px">
      <button id="prevMonth" style="color:var(--muted);font-size:22px;padding:4px 10px">‹</button>
      <button class="month-btn" id="monthBtn">${MONTHS[S.month]} ${S.year} ▾</button>
      <button id="nextMonth" style="color:var(--muted);font-size:22px;padding:4px 10px">›</button>
    </div>
    ${body}
  </div>`;
}
// ==================== ВХОД ====================

function viewLogin(){
  return `
  <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;
    justify-content:center;padding:32px;text-align:center">
    <div style="width:84px;height:84px;border-radius:50%;background:var(--accent);
      display:flex;align-items:center;justify-content:center;font-size:40px;margin-bottom:24px">₸</div>
    <div style="font-size:30px;font-weight:800;letter-spacing:-.5px">ФинДиректор</div>
    <div style="color:var(--muted);font-size:15px;margin:10px 0 32px;line-height:1.5;max-width:300px">
      Личный учёт денег. Данные видны только вам.
    </div>
    ${S.authError ? `<div style="color:var(--red);font-size:14px;margin-bottom:18px;
      line-height:1.5;max-width:320px">${esc(S.authError)}</div>` : ''}
    <button class="btn" id="loginBtn" style="max-width:320px">
      ${S.signingIn ? 'Открываем окно входа…' : 'Войти через Google'}
    </button>
  </div>`;
}

// ==================== НАСТРОЙКИ ====================

function viewSettings(){
  const p = profile();
  const cur = CURRENCIES.find(c=>c.code===S.mainCurrency) || CURRENCIES[0];
  const ws = myWallets();

  return `
  <div class="screen-title">Настройки</div>
  <div class="wrap">
    <div class="card" style="padding:0 16px">
      <div class="row">
        <div class="row-main">
          <div class="row-title">Аккаунт</div>
          <div class="row-sub">${esc(S.user?.email || '')}</div>
        </div>
        <button class="row-go" id="signOutBtn" style="color:var(--accent)">Выйти</button>
      </div>
    </div>

    <div class="card" style="padding:0 16px">
      <button class="row" style="width:100%" data-sheet="profiles">
        <div class="row-main">
          <div class="row-title">Профили</div>
          <div class="row-sub">Сейчас: ${esc(p?p.name:'—')}. Отдельный учёт для личного и рабочего.</div>
        </div><span class="row-go">›</span>
      </button>
      <button class="row" style="width:100%" data-sheet="currency">
        <div class="row-main">
          <div class="row-title">Основная валюта</div>
          <div class="row-sub">${esc(cur.name)}</div>
        </div><span class="row-go">${cur.sign} ›</span>
      </button>
      <div class="row">
        <div class="row-main">
          <div class="row-title">Показывать долги</div>
          <div class="row-sub">Кошелёк с долгами на панели. В итог по кошелькам не входит.</div>
        </div>
        <button id="toggleDebt" style="font-size:30px;color:${S.showDebt?'var(--green)':'var(--dim)'}">
          ${S.showDebt?'◉':'◎'}</button>
      </div>
    </div>

    <div class="card" style="padding:0 16px">
      <button class="row" style="width:100%" data-sheet="wallets">
        <div class="row-main">
          <div class="row-title">Кошельки</div>
          <div class="row-sub">${ws.length} шт. Здесь же правится текущий остаток.</div>
        </div><span class="row-go">›</span>
      </button>
      <button class="row" style="width:100%" data-sheet="panel">
        <div class="row-main">
          <div class="row-title">Настройка панели</div>
          <div class="row-sub">Порядок плиток и что показывать на главной</div>
        </div><span class="row-go">›</span>
      </button>
      <button class="row" style="width:100%" data-sheet="cats-expense">
        <div class="row-main">
          <div class="row-title">Категории расходов</div>
          <div class="row-sub">${parents('expense').length} основных, ${S.cats.filter(c=>c.profileId===S.profileId&&c.type==='expense'&&c.parentId).length} подкатегорий</div>
        </div><span class="row-go">›</span>
      </button>
      <button class="row" style="width:100%" data-sheet="cats-income">
        <div class="row-main">
          <div class="row-title">Категории доходов</div>
          <div class="row-sub">${parents('income').length} основных</div>
        </div><span class="row-go">›</span>
      </button>
    </div>

    <div class="card" style="padding:0 16px">
      <button class="row" style="width:100%" id="exportCsv">
        <div class="row-main">
          <div class="row-title">Экспорт в CSV</div>
          <div class="row-sub">Все операции профиля одним файлом для Excel</div>
        </div><span class="row-go">›</span>
      </button>
      <button class="row" style="width:100%" data-sheet="wipe">
        <div class="row-main">
          <div class="row-title" style="color:var(--red)">Удалить данные</div>
          <div class="row-sub">Стереть операции и начать учёт заново</div>
        </div><span class="row-go">›</span>
      </button>
    </div>

    <div style="text-align:center;color:var(--dim);font-size:13px;padding:8px 0 20px">
      ФинДиректор 2 · операций в базе: ${S.ops.filter(o=>o.profileId===S.profileId).length}
    </div>
  </div>`;
}

// ==================== НИЖНИЕ ЛИСТЫ ====================

function sheetWrap(title, inner, extraHead=''){
  return `<div class="sheet-bg" id="sheetBg"><div class="sheet" id="sheetBody">
    <div class="grabber"></div>
    <div class="sheet-head">
      <div class="sheet-title">${title}</div>
      <div style="display:flex;align-items:center;gap:6px">${extraHead}<button class="x" id="closeSheet">✕</button></div>
    </div>
    ${inner}
  </div></div>`;
}

// ---- лист операции ----

const TYPE_NAME = {expense:'Расход', income:'Доход', transfer:'Перевод'};

function dateStripDays(selected){
  const days = [];
  const base = new Date();
  base.setHours(0,0,0,0);
  for(let i = 9; i >= 0; i--){
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    days.push(d);
  }
  // Если правим старую запись — показываем и её день
  const sel = new Date(selected);
  sel.setHours(0,0,0,0);
  if(!days.some(d => d.getTime() === sel.getTime())) days.unshift(sel);
  return days;
}
const dayKey = d => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function withDate(iso, d){
  const t = iso.slice(11) || '12:00';
  const p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${t}`;
}

// Выбор кошелька или категории — отдельный экран внутри листа
function opPicker(){
  const s = S.sheet;
  if(s.picking === 'cat'){
    const type = s.type === 'income' ? 'income' : 'expense';
    return sheetWrap('Категория', `
      <div class="pick-grid" style="max-height:none">
        ${parents(type).map(c => `
          <button class="pick${(cat(s.catId)?.parentId || s.catId) === c.id ? ' on' : ''}" data-pick-cat="${c.id}">
            <div class="pick-ic" style="background:${c.color}">${c.icon}</div>
            <div class="pick-n">${esc(c.name)}</div>
          </button>`).join('')}
      </div>`, `<button class="x" id="pickBack">‹</button>`);
  }
  const field = s.picking;   // 'wallet' | 'to'
  const cur = field === 'to' ? s.toWalletId : s.walletId;
  return sheetWrap(field === 'to' ? 'Куда' : 'Кошелёк', `
    <div class="pick-grid" style="max-height:none">
      ${myWallets().map(w => `
        <button class="pick${cur === w.id ? ' on' : ''}" data-pick-${field === 'to' ? 'to' : 'wallet'}="${w.id}">
          <div class="pick-ic" style="background:${w.color}">${w.icon}</div>
          <div class="pick-n">${esc(w.name)}</div>
        </button>`).join('')}
    </div>`, `<button class="x" id="pickBack">‹</button>`);
}

function sheetOp(){
  const s = S.sheet;
  if(s.picking) return opPicker();

  const isTransfer = s.type === 'transfer';
  const chosen = s.catId ? cat(s.catId) : null;
  const rootId = chosen ? (chosen.parentId || chosen.id) : null;
  const root = rootId ? cat(rootId) : null;
  const subs = rootId ? childrenOf(rootId) : [];

  const wFrom = wallet(s.walletId);
  const wTo   = wallet(s.toWalletId);

  // Левый и правый кружок и направление стрелки зависят от типа операции
  const left = isTransfer
    ? {label:'Откуда', name: wFrom ? wFrom.name : 'Выберите кошелёк',
       icon: wFrom ? wFrom.icon : '?', color: wFrom ? wFrom.color : '', pick:'wallet'}
    : {label:'Кошелёк', name: wFrom ? wFrom.name : 'Выберите кошелёк',
       icon: wFrom ? wFrom.icon : '?', color: wFrom ? wFrom.color : '', pick:'wallet'};
  const right = isTransfer
    ? {label:'Куда', name: wTo ? wTo.name : 'Выберите кошелёк',
       icon: wTo ? wTo.icon : '?', color: wTo ? wTo.color : '', pick:'to'}
    : {label:'Категория', name: root ? root.name : 'Выберите категорию',
       icon: root ? root.icon : '?', color: root ? root.color : '', pick:'cat'};
  const arrow = s.type === 'income' ? '«' : '»';

  const circle = side => `
    <div class="flow-side">
      <div class="flow-l">${side.label}</div>
      <div class="flow-n">${esc(side.name)}</div>
      <button class="flow-circle${side.color ? ' set' : ''}"
        style="${side.color ? `background:${side.color};color:${side.color}` : ''}"
        data-open-pick="${side.pick}">${side.icon}</button>
    </div>`;

  const selDay = dayKey(new Date(s.date));
  const dateChips = dateStripDays(s.date).map(d => {
    const k = dayKey(d);
    const now = new Date(); now.setHours(0,0,0,0);
    const diff = Math.round((now - d) / 86400000);
    const w = diff === 0 ? 'Сегодня' : diff === 1 ? 'Вчера' : DOW[d.getDay()];
    return `<button class="date-chip${k === selDay ? ' on' : ''}" data-pick-day="${d.getFullYear()}-${d.getMonth()}-${d.getDate()}">
      <div class="d">${String(d.getDate()).padStart(2,'0')}</div>
      <div class="m">${MONTHS_GEN[d.getMonth()]}</div>
      <div class="w${diff <= 1 ? ' hot' : ''}">${w}</div>
    </button>`;
  }).join('');

  return sheetWrap(`
    <div style="position:relative">
      <button class="type-btn" id="typeBtn">${TYPE_NAME[s.type]} ▾</button>
      ${s.typeOpen ? `<div class="type-list">
        ${Object.entries(TYPE_NAME).map(([k,v]) =>
          `<button class="${s.type===k?'on':''}" data-op-type="${k}">${v}</button>`).join('')}
      </div>` : ''}
    </div>`, `
    <input class="amount-in" id="opAmt" type="number" inputmode="decimal"
      placeholder="0" value="${s.amount||''}" autocomplete="off"/>
    <div class="amount-lbl" style="margin:-10px 0 18px">Сумма</div>

    <div class="flow">
      ${circle(left)}
      <div class="flow-arrow">${arrow}${arrow}</div>
      ${circle(right)}
    </div>

    ${!isTransfer && root ? `
      <div class="field-l">Подкатегория</div>
      <div class="sub-tiles" style="margin-bottom:18px">
        <button class="sub-tile${s.catId === rootId ? ' on' : ''}" data-pick-cat="${rootId}">
          <div class="big">?</div><div class="cap">без</div>
        </button>
        ${subs.map(sc => `
          <button class="sub-tile${s.catId === sc.id ? ' on' : ''}" data-pick-cat="${sc.id}">
            <div class="big">${esc(sc.name[0].toUpperCase())}</div>
            <div class="cap">${esc(sc.name)}</div>
          </button>`).join('')}
        <button class="sub-tile" data-add-sub="${rootId}">
          <div class="big">+</div><div class="cap">Добавить</div>
        </button>
      </div>` : ''}

    ${isTransfer && wFrom && wTo && wFrom.currency !== wTo.currency ? `
      <div class="field-l">Сколько придёт в ${esc(wTo.name)} (${wTo.currency})</div>
      <input class="inp" id="opAmtTo" type="number" inputmode="decimal"
        placeholder="сумма зачисления" value="${s.amountTo||''}" style="margin-bottom:18px"/>` : ''}

    <button class="field-l" id="dateBtn" style="color:var(--accent);display:block">🗓 Дата</button>
    ${s.dateOpen
      ? `<input class="inp" id="opDate" type="datetime-local" value="${s.date}" style="margin-bottom:18px"/>`
      : `<div class="date-strip" style="margin-bottom:18px">${dateChips}</div>`}

    <div class="field-l">Комментарий</div>
    <input class="inp" id="opNote" placeholder="необязательно" value="${esc(s.note||'')}"/>

    <div class="switch-row">
      <div class="switch${s.keepOpen ? ' on' : ''}" id="keepOpen"><i></i></div>
      <div style="font-size:16px">Добавить ещё операцию</div>
    </div>

    <button class="btn" id="saveOp">${s.id ? 'Сохранить' : 'Сохранить'}</button>
    ${s.id ? `<button class="btn danger" id="deleteOp" style="margin-top:8px">Удалить операцию</button>` : ''}
  `);
}

// ---- выбор месяца ----
function sheetMonth(){
  const years = [S.year-1, S.year, S.year+1];
  return sheetWrap('Период', `
    <div class="field-l">Год</div>
    <div class="chips" style="margin-bottom:18px">
      ${years.map(y => `<button class="chip${y===S.year?' on':''}" data-pick-year="${y}">${y}</button>`).join('')}
    </div>
    <div class="field-l">Месяц</div>
    <div class="chips">
      ${MONTHS.map((m,i) => `<button class="chip${i===S.month?' on':''}" data-pick-month="${i}">${m}</button>`).join('')}
    </div>
  `);
}

// ---- профили ----
function sheetProfiles(){
  return sheetWrap('Профили', `
    ${S.profiles.map(p => `
      <div class="row">
        <button class="row-main" style="text-align:left" data-use-profile="${p.id}">
          <div class="row-title">${esc(p.icon)} ${esc(p.name)}${p.id===S.profileId?' ✓':''}</div>
          <div class="row-sub">${S.ops.filter(o=>o.profileId===p.id).length} операций · ${S.wallets.filter(w=>w.profileId===p.id).length} кошельков</div>
        </button>
        ${S.profiles.length>1 ? `<button class="row-go" style="color:var(--red)" data-del-profile="${p.id}">Удалить</button>` : ''}
      </div>`).join('')}
    <div class="field-l" style="margin-top:18px">Новый профиль</div>
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <input class="inp" id="npIcon" value="Р" style="width:64px;text-align:center"/>
      <input class="inp" id="npName" placeholder="Например, Фриланс"/>
    </div>
    <button class="btn" id="addProfile">Создать профиль</button>
    <div style="color:var(--dim);font-size:13px;margin-top:10px;line-height:1.5">
      У нового профиля будут свои кошельки и категории. Операции между профилями не смешиваются.
    </div>
  `);
}

// ---- валюта ----
function sheetCurrency(){
  return sheetWrap('Основная валюта', `
    ${CURRENCIES.map(c => `
      <button class="row" style="width:100%" data-pick-currency="${c.code}">
        <div class="row-main">
          <div class="row-title">${c.sign} ${c.name}</div>
          <div class="row-sub">${c.code}</div>
        </div>
        <span class="row-go">${c.code===S.mainCurrency?'✓':''}</span>
      </button>`).join('')}
    <div class="field-l" style="margin-top:18px">Курсы к основной валюте</div>
    ${CURRENCIES.filter(c=>c.code!==S.mainCurrency).map(c => `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <span style="width:52px;color:var(--muted);font-size:14px">${c.code}</span>
        <input class="inp rate-inp" data-rate="${c.code}" type="number" inputmode="decimal"
          value="${S.rates[c.code]||''}" placeholder="курс"/>
      </div>`).join('')}
    <div style="color:var(--dim);font-size:13px;line-height:1.5">
      Курсы нужны только чтобы свести кошельки в разных валютах в один итог.
    </div>
  `);
}

// ---- кошельки ----
function sheetWallets(){
  const ws = myWallets();
  const e = S.sheet.edit;
  if(e){
    return sheetWrap(e.id ? 'Кошелёк' : 'Новый кошелёк', `
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <input class="inp" id="wIcon" value="${esc(e.icon)}" style="width:64px;text-align:center;font-size:22px"/>
        <input class="inp" id="wName" placeholder="Название" value="${esc(e.name)}"/>
      </div>
      <div class="field-l">Валюта</div>
      <div class="chips" style="margin-bottom:14px">
        ${CURRENCIES.map(c => `<button class="chip${e.currency===c.code?' on':''}" data-w-cur="${c.code}">${c.code}</button>`).join('')}
      </div>
      <div class="field-l">Текущий остаток</div>
      <input class="inp" id="wBal" type="number" inputmode="decimal" value="${e.displayBalance}" style="margin-bottom:8px"/>
      <div style="color:var(--dim);font-size:13px;margin-bottom:14px;line-height:1.5">
        Впишите реальную сумму на счёте. Разницу с посчитанной по операциям приложение запомнит как стартовый остаток.
      </div>
      <div class="field-l">Тип</div>
      <div class="chips" style="margin-bottom:14px">
        <button class="chip${e.kind==='normal'?' on':''}" data-w-kind="normal">Обычный</button>
        <button class="chip${e.kind==='debt'?' on':''}" data-w-kind="debt">Долги</button>
      </div>
      <div class="field-l">Цвет</div>
      <div class="chips" style="margin-bottom:18px">
        ${PALETTE.map(c => `<button data-w-color="${c}" style="width:34px;height:34px;border-radius:50%;background:${c};
          box-shadow:${e.color===c?'0 0 0 3px #fff':'none'}"></button>`).join('')}
      </div>
      <button class="btn" id="saveWallet">Сохранить</button>
      ${e.id && ws.length>1 ? `<button class="btn danger" id="delWallet" style="margin-top:8px">Удалить кошелёк</button>` : ''}
    `, `<button class="x" id="backSheet">‹</button>`);
  }
  return sheetWrap('Кошельки', `
    ${ws.map(w => `
      <button class="row" style="width:100%" data-edit-wallet="${w.id}">
        <div class="op-icon" style="background:${w.color};width:38px;height:38px;font-size:17px;margin-right:12px">${w.icon}</div>
        <div class="row-main">
          <div class="row-title">${esc(w.name)}</div>
          <div class="row-sub">${w.currency}${w.kind==='debt'?' · долги':''}</div>
        </div>
        <div style="font-weight:700">${fmt(walletBalance(w.id))} ${sign(w.currency)}</div>
        <span class="row-go">›</span>
      </button>`).join('')}
    <button class="btn grey" id="newWallet" style="margin-top:16px">+ Новый кошелёк</button>
  `);
}

// ---- категории ----
function sheetCats(){
  const type = S.sheet.catType;
  const e = S.sheet.edit;
  if(e){
    const roots = parents(type);
    return sheetWrap(e.id ? 'Категория' : 'Новая категория', `
      <div style="display:flex;gap:8px;margin-bottom:14px">
        <input class="inp" id="cIcon" value="${esc(e.icon)}" style="width:64px;text-align:center;font-size:22px"/>
        <input class="inp" id="cName" placeholder="Название" value="${esc(e.name)}"/>
      </div>
      <div class="field-l">Иконка</div>
      <div class="chips" style="margin-bottom:14px;max-height:120px;overflow-y:auto">
        ${ICONS.map(ic => `<button class="chip${e.icon===ic?' on':''}" data-c-icon="${ic}" style="font-size:19px;padding:6px 10px">${ic}</button>`).join('')}
      </div>
      <div class="field-l">Уровень</div>
      <div class="chips" style="margin-bottom:14px">
        <button class="chip${!e.parentId?' on':''}" data-c-parent="">Основная</button>
        ${roots.filter(r=>r.id!==e.id).map(r => `<button class="chip${e.parentId===r.id?' on':''}" data-c-parent="${r.id}">внутри ${esc(r.name)}</button>`).join('')}
      </div>
      ${!e.parentId ? `<div class="field-l">Цвет</div>
      <div class="chips" style="margin-bottom:18px">
        ${PALETTE.map(c => `<button data-c-color="${c}" style="width:34px;height:34px;border-radius:50%;background:${c};
          box-shadow:${e.color===c?'0 0 0 3px #fff':'none'}"></button>`).join('')}
      </div>` : ''}
      <button class="btn" id="saveCat">Сохранить</button>
      ${e.id ? `<button class="btn danger" id="delCat" style="margin-top:8px">Удалить категорию</button>` : ''}
    `, `<button class="x" id="backSheet">‹</button>`);
  }
  return sheetWrap(type==='expense' ? 'Категории расходов' : 'Категории доходов', `
    ${parents(type).map(c => `
      <div style="padding:10px 0;border-bottom:.5px solid var(--line)">
        <button style="display:flex;align-items:center;gap:12px;width:100%;text-align:left" data-edit-cat="${c.id}">
          <div class="op-icon" style="background:${c.color};width:38px;height:38px;font-size:17px">${c.icon}</div>
          <div style="flex:1;font-size:16px">${esc(c.name)}</div>
          <span class="row-go">›</span>
        </button>
        <div class="chips" style="margin-top:8px;padding-left:50px">
          ${childrenOf(c.id).map(sc => `<button class="chip" data-edit-cat="${sc.id}">${esc(sc.name)}</button>`).join('')}
          <button class="chip on-soft" data-new-sub="${c.id}">+ подкатегория</button>
        </div>
      </div>`).join('')}
    <button class="btn grey" id="newCat" style="margin-top:16px">+ Новая категория</button>
  `);
}

// ---- удаление данных ----
function sheetWipe(){
  const n = S.ops.filter(o=>o.profileId===S.profileId).length;
  return sheetWrap('Удалить данные', `
    <div style="color:var(--muted);font-size:15px;line-height:1.6;margin-bottom:20px">
      В профиле «${esc(profile()?.name||'')}» сейчас ${n} операций.
      Кошельки и категории останутся на месте — сотрутся только операции.
      Отменить это нельзя.
    </div>
    <button class="btn danger" id="wipeOps" style="background:var(--surface2)">Удалить все операции профиля</button>
  `);
}

// ---- настройка панели ----
function panelItems(kind){
  if(kind === 'wallets') return myWallets();
  return parents(kind);
}

function sheetPanel(){
  const kind = S.sheet.panelKind || 'expense';
  const items = panelItems(kind);
  const tabs = [['income','Доходы'],['wallets','Кошельки'],['expense','Расходы']];

  return sheetWrap('Настройка панели', `
    <div class="seg">
      ${tabs.map(([k,l]) => `<button class="${kind===k?'on':''}" data-panel-kind="${k}">${l}</button>`).join('')}
    </div>
    <div style="color:var(--dim);font-size:13px;margin-bottom:14px;line-height:1.5">
      Тяните за ячейки слева, чтобы поменять порядок. Глаз убирает плитку с панели —
      сама категория и её операции остаются на месте.
    </div>
    <div class="drag-list" id="dragList" data-kind="${kind}">
      ${items.map(it => `
        <div class="drag-row${it.hidden?' hidden-item':''}" data-drag-id="${it.id}">
          <span class="drag-handle" data-handle>⠿</span>
          <div class="op-icon" style="background:${it.color};width:34px;height:34px;font-size:16px">${it.icon}</div>
          <div class="drag-name">${esc(it.name)}</div>
          <button class="eye${it.hidden?' off':''}" data-hide="${it.id}">${it.hidden?'🚫':'👁'}</button>
        </div>`).join('')}
    </div>
    ${!items.length ? '<div class="empty">Здесь пока пусто</div>' : ''}
  `);
}

// ==================== ДОЛГИ ====================
// Долг — не трата: деньги не исчезли, а сменили владельца. Поэтому отдельный
// тип операции, который не попадает ни в расходы, ни в доходы.

const DEBT_DIR = {
  lent:            {label:'Я дал',      wallet:-1, owed:+1},
  returned_to_me:  {label:'Мне вернули', wallet:+1, owed:-1},
  borrowed:        {label:'Мне дали',   wallet:+1, owed:-1},
  returned_by_me:  {label:'Я вернул',   wallet:-1, owed:+1},
};

const debtOps = () => S.ops.filter(o => o.profileId === S.profileId && o.type === 'debt');

// Плюс — должны мне, минус — должен я
function personBalance(name){
  return debtOps()
    .filter(o => o.person === name)
    .reduce((s,o) => s + (DEBT_DIR[o.debtDir]?.owed || 0) * o.amount, 0);
}

function debtPeople(){
  const names = [...new Set(debtOps().map(o => o.person).filter(Boolean))];
  return names.map(name => {
    const ops = debtOps().filter(o => o.person === name)
      .sort((a,b) => new Date(b.date) - new Date(a.date));
    return {name, balance: personBalance(name), last: ops[0], count: ops.length};
  }).sort((a,b) => Math.abs(b.balance) - Math.abs(a.balance));
}

const debtTotal = () => debtPeople().reduce((s,p) => s + p.balance, 0);

function viewDebts(){
  const filter = S.debtFilter || 'all';
  const all = debtPeople();
  const list = all.filter(p =>
    filter === 'i'  ? p.balance < 0 :
    filter === 'me' ? p.balance > 0 : p.balance !== 0 || p.count);

  const shown = filter === 'i'  ? all.filter(p => p.balance < 0).reduce((s,p)=>s+p.balance,0)
              : filter === 'me' ? all.filter(p => p.balance > 0).reduce((s,p)=>s+p.balance,0)
              : debtTotal();

  return sheetWrap('Долги', `
    <div class="seg">
      <button class="${filter==='i'?'on':''}" data-debt-filter="i">Я должен</button>
      <button class="${filter==='me'?'on':''}" data-debt-filter="me">Мне должны</button>
      <button class="${filter==='all'?'on':''}" data-debt-filter="all">Все</button>
    </div>

    <div class="big-sum">
      <div class="v" style="color:${shown>0?'var(--green)':shown<0?'var(--red)':'var(--text)'}">
        ${shown>0?'+':''}${fmt(shown)} ${mainSign()}</div>
      <div class="l" style="margin-top:6px">
        ${shown>0 ? 'должны вам' : shown<0 ? 'должны вы' : 'всё сведено'}</div>
    </div>

    ${list.length ? list.map(p => {
      const d = p.last ? new Date(p.last.date) : null;
      const dir = p.last ? DEBT_DIR[p.last.debtDir] : null;
      return `<button class="op" data-debt-person="${esc(p.name)}" style="width:100%">
        <div class="op-icon" style="background:var(--surface2);color:${p.balance>=0?'var(--green)':'var(--red)'};font-weight:700">
          ${esc(p.name[0].toUpperCase())}</div>
        <div class="op-main">
          <div class="op-title">${esc(p.name)}</div>
          <div class="op-note">${dir ? `${dir.label} ${fmt(p.last.amount)} ${mainSign()}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}` : ''}</div>
        </div>
        <div class="op-amt" style="color:${p.balance>0?'var(--green)':p.balance<0?'var(--red)':'var(--muted)'}">
          ${p.balance>0?'+':''}${fmt(p.balance)} ${mainSign()}</div>
      </button>`;
    }).join('') : '<div class="empty">Здесь пока пусто.<br>Добавьте первую запись.</div>'}

    <button class="btn" id="newDebt" style="margin-top:18px">+ Новая запись</button>
  `);
}

function viewDebtPerson(){
  const name = S.sheet.person;
  const bal = personBalance(name);
  const ops = debtOps().filter(o => o.person === name)
    .sort((a,b) => new Date(b.date) - new Date(a.date));

  return sheetWrap(esc(name), `
    <div class="big-sum">
      <div class="v" style="color:${bal>0?'var(--green)':bal<0?'var(--red)':'var(--text)'}">
        ${bal>0?'+':''}${fmt(bal)} ${mainSign()}</div>
      <div class="l" style="margin-top:6px">
        ${bal>0 ? 'должен вам' : bal<0 ? 'должны вы' : 'рассчитались'}</div>
    </div>

    <div class="chips" style="margin-bottom:18px">
      ${Object.entries(DEBT_DIR).map(([k,v]) =>
        `<button class="chip" data-debt-quick="${k}">${v.label}</button>`).join('')}
    </div>

    <div class="field-l">История</div>
    ${ops.map(o => {
      const d = new Date(o.date);
      const dir = DEBT_DIR[o.debtDir];
      const w = wallet(o.walletId);
      return `<button class="op" data-edit-debt="${o.id}" style="width:100%">
        <div class="op-main">
          <div class="op-title">${dir.label}</div>
          <div class="op-note">${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}${w ? ' · '+esc(w.name) : ''}${o.note ? ' · '+esc(o.note) : ''}</div>
        </div>
        <div class="op-amt" style="color:${dir.owed>0?'var(--green)':'var(--red)'}">
          ${dir.owed>0?'+':'−'}${fmt(o.amount)} ${mainSign()}</div>
      </button>`;
    }).join('')}
  `, `<button class="x" id="debtBack">‹</button>`);
}

function viewDebtForm(){
  const s = S.sheet;
  const ws = myWallets().filter(w => w.kind !== 'debt');
  const names = [...new Set(debtOps().map(o => o.person).filter(Boolean))];

  return sheetWrap(s.id ? 'Запись о долге' : 'Новая запись', `
    <div class="field-l">Что произошло</div>
    <div class="chips" style="margin-bottom:18px">
      ${Object.entries(DEBT_DIR).map(([k,v]) =>
        `<button class="chip${s.debtDir===k?' on':''}" data-debt-dir="${k}">${v.label}</button>`).join('')}
    </div>

    <input class="amount-in" id="debtAmt" type="number" inputmode="decimal"
      placeholder="0" value="${s.amount||''}"/>
    <div class="amount-lbl" style="margin:-10px 0 18px">Сумма</div>

    <div class="field-l">Кто</div>
    <input class="inp" id="debtPerson" placeholder="Имя" value="${esc(s.person||'')}" style="margin-bottom:8px"/>
    ${names.length ? `<div class="chips" style="margin-bottom:18px">
      ${names.map(n => `<button class="chip" data-debt-name="${esc(n)}">${esc(n)}</button>`).join('')}
    </div>` : '<div style="margin-bottom:18px"></div>'}

    <div class="field-l">Кошелёк</div>
    <div class="chips" style="margin-bottom:18px">
      ${ws.map(w => `<button class="chip${s.walletId===w.id?' on':''}" data-debt-wallet="${w.id}">${w.icon} ${esc(w.name)}</button>`).join('')}
    </div>

    <div class="field-l">Дата</div>
    <input class="inp" id="debtDate" type="datetime-local" value="${s.date}" style="margin-bottom:18px"/>

    <div class="field-l">Комментарий</div>
    <input class="inp" id="debtNote" placeholder="необязательно" value="${esc(s.note||'')}" style="margin-bottom:18px"/>

    <button class="btn" id="saveDebt">Сохранить</button>
    ${s.id ? `<button class="btn danger" id="deleteDebt" style="margin-top:8px">Удалить запись</button>` : ''}
  `, `<button class="x" id="debtBack">‹</button>`);
}

function renderSheet(){
  if(!S.sheet) return '';
  switch(S.sheet.mode){
    case 'op':       return sheetOp();
    case 'month':    return sheetMonth();
    case 'profiles': return sheetProfiles();
    case 'currency': return sheetCurrency();
    case 'wallets':  return sheetWallets();
    case 'cats':     return sheetCats();
    case 'panel':    return sheetPanel();
    case 'debts':      return viewDebts();
    case 'debtPerson': return viewDebtPerson();
    case 'debtForm':   return viewDebtForm();
    case 'wipe':     return sheetWipe();
    default:         return '';
  }
}

// ==================== СБОРКА ====================

// Позиции прокрутки, которые надо пережить перерисовку
function grabScroll(){
  const body = document.getElementById('sheetBody');
  const map = {};
  document.querySelectorAll('.pager[data-pager]').forEach(p => map['pager:'+p.dataset.pager] = p.scrollLeft);
  const sub = document.querySelector('.sub-tiles');
  if(sub) map.sub = sub.scrollLeft;
  const dates = document.querySelector('.date-strip');
  if(dates) map.dates = dates.scrollLeft;
  return {open: !!body, top: body ? body.scrollTop : 0, map};
}

function restoreScroll(prev){
  const body = document.getElementById('sheetBody');
  if(body && prev.open){
    // Лист уже был открыт — не проигрываем выезд снизу заново
    body.style.animation = 'none';
    const bg = document.getElementById('sheetBg');
    if(bg) bg.style.animation = 'none';
    body.scrollTop = prev.top;
  }
  document.querySelectorAll('.pager[data-pager]').forEach(p => {
    const v = prev.map['pager:'+p.dataset.pager];
    if(v) p.scrollLeft = v;
  });
  const sub = document.querySelector('.sub-tiles');
  if(sub && prev.map.sub) sub.scrollLeft = prev.map.sub;
  const dates = document.querySelector('.date-strip');
  if(dates && prev.map.dates) dates.scrollLeft = prev.map.dates;
}

function render(){
  const root = document.getElementById('app');
  const prev = grabScroll();
  // Если жест оборвался нештатно, копия плитки могла остаться висеть поверх экрана
  document.querySelectorAll('.tile-ghost, .drag-hint').forEach(el => el.remove());
  if(!S.authReady){
    root.innerHTML = '<div class="empty" style="padding-top:40vh">Проверяем вход…</div>';
    return;
  }
  if(!S.user){
    root.innerHTML = viewLogin();
    bindLogin();
    return;
  }
  if(!S.ready){
    root.innerHTML = '<div class="empty" style="padding-top:40vh">Загрузка…</div>';
    return;
  }
  const screen =
    S.tab === 'panel'   ? viewPanel()   :
    S.tab === 'history' ? viewHistory() :
    S.tab === 'report'  ? viewReport()  : viewSettings();

  const tabs = [
    ['panel','⠿','Панель'],
    ['history','☰','История'],
    ['report','◕','Отчёт'],
    ['settings','⚙','Настройки'],
  ];

  root.innerHTML = `
    ${S.syncing ? '<div class="sync">Сохранение…</div>' : ''}
    ${screen}
    <nav class="tabbar"><div class="tabbar-in">
      ${tabs.map(([t,ic,l]) => `<button class="tab${S.tab===t?' on':''}" data-go-tab="${t}">
        <span class="ic">${ic}</span>${l}</button>`).join('')}
    </div></nav>
    ${renderSheet()}`;

  restoreScroll(prev);
  bind();
}
// ==================== СОБЫТИЯ ====================

const $  = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const on = (sel, fn) => $$(sel).forEach(el => el.onclick = () => fn(el));

function lastUsedWallet(){
  const last = S.ops.find(o => o.profileId === S.profileId && o.walletId && wallet(o.walletId));
  return last ? last.walletId : (myWallets()[0]?.id || null);
}

function openOpSheet(patch = {}){
  const ws = myWallets();
  const def = lastUsedWallet();
  setS({sheet:{
    mode:'op', type:'expense', id:null, amount:'', catId:null,
    walletId: def, toWalletId: (ws.find(w => w.id !== def) || {}).id || null,
    amountTo:'', note:'', date: localInput(new Date()),
    keepOpen:false, typeOpen:false, dateOpen:false, picking:null, ...patch
  }});
}
function readOpInputs(){
  const s = S.sheet;
  if(!s || s.mode !== 'op') return;
  s.amount   = $('#opAmt')?.value ?? s.amount;
  s.note     = $('#opNote')?.value ?? s.note;
  s.date     = $('#opDate')?.value || s.date;
  s.amountTo = $('#opAmtTo')?.value ?? s.amountTo;
}
const patchSheet = patch => { readOpInputs(); setS({sheet:{...S.sheet, ...patch}}); };

function bind(){
  // --- навигация ---
  on('[data-go-tab]', el => setS({tab: el.dataset.goTab, search:''}));
  on('[data-toggle]', el => {
    const open = {...S.open, [el.dataset.toggle]: !S.open[el.dataset.toggle]};
    LS.set('open', open); setS({open});
  });
  on('#monthBtn', () => setS({sheet:{mode:'month'}}));
  on('#prevMonth', () => setS(S.month === 0 ? {month:11, year:S.year-1} : {month:S.month-1}));
  on('#nextMonth', () => setS(S.month === 11 ? {month:0, year:S.year+1} : {month:S.month+1}));
  on('#profileBtn', () => setS({sheet:{mode:'profiles'}}));
  on('[data-report]', el => setS({reportKind: el.dataset.report}));

  // --- панель: касание и перетаскивание плиток ---
  bindTileDrag();
  bindPagers();
  on('[data-add-tile]', el => {
    const what = el.dataset.addTile;
    if(what === 'wallets'){
      setS({sheet:{mode:'wallets', edit:{
        id:null, name:'', icon:'👛', color:PALETTE[0], currency:S.mainCurrency,
        kind:'normal', displayBalance:0, initialBalance:0}}});
    } else {
      setS({sheet:{mode:'cats', catType:what, edit:{
        id:null, name:'', icon: what === 'income' ? '💵' : '💼',
        color:PALETTE[0], parentId:null, type:what}}});
    }
  });

  // --- история ---
  const si = $('#searchInp');
  if(si){
    si.oninput = e => { S.search = e.target.value; renderKeepFocus(); };
  }
  on('#clearSearch', () => setS({search:''}));
  on('[data-edit-op]', el => {
    const o = S.ops.find(x => x.id === el.dataset.editOp);
    if(!o) return;
    setS({sheet:{mode:'op', type:o.type, id:o.id, amount:o.amount, catId:o.catId,
      walletId:o.walletId, toWalletId:o.toWalletId, amountTo:o.amountTo||'',
      note:o.note||'', date: localInput(new Date(o.date))}});
  });

  // --- настройки (эти кнопки живут на экране, а не в листе) ---
  on('[data-sheet]', el => {
    const v = el.dataset.sheet;
    if(v.startsWith('cats-')) setS({sheet:{mode:'cats', catType: v.slice(5), edit:null}});
    else setS({sheet:{mode:v, edit:null}});
  });
  on('#toggleDebt', () => { const v = !S.showDebt; LS.set('showDebt', v); setS({showDebt:v}); });
  on('#exportCsv', () => exportCsv());
  on('#signOutBtn', async () => {
    if(!confirm('Выйти из аккаунта? Данные останутся в облаке.')) return;
    await signOut(auth);
  });

  // --- бюджеты ---
  $$('.budget-inp').forEach(inp => {
    inp.onchange = () => { setBudget(inp.dataset.cat, Number(inp.value) || 0); render(); };
    inp.onkeydown = e => { if(e.key === 'Enter') inp.blur(); };
  });

  bindSheet();
}

function renderKeepFocus(){
  const pos = $('#searchInp')?.selectionStart;
  render();
  const inp = $('#searchInp');
  if(inp){ inp.focus(); try { inp.setSelectionRange(pos, pos); } catch {} }
}

function openDebtForm(patch = {}){
  const ws = myWallets().filter(w => w.kind !== 'debt');
  return {mode:'debtForm', id:null, debtDir:'lent', person:'', amount:'',
    walletId: ws[0]?.id || null, note:'', date: localInput(new Date()), ...patch};
}
function readDebtInputs(){
  const s = S.sheet;
  if(!s || s.mode !== 'debtForm') return;
  s.amount = $('#debtAmt')?.value ?? s.amount;
  s.person = $('#debtPerson')?.value ?? s.person;
  s.note   = $('#debtNote')?.value ?? s.note;
  s.date   = $('#debtDate')?.value || s.date;
}
const patchDebt = patch => { readDebtInputs(); setS({sheet:{...S.sheet, ...patch}}); };

function bindSheet(){
  const close = () => setS({sheet:null});
  on('#closeSheet', close);
  const bg = $('#sheetBg');
  if(bg) bg.onclick = e => { if(e.target === bg) close(); };
  on('#backSheet', () => setS({sheet:{...S.sheet, edit:null}}));
  if(!S.sheet) return;

  // ---- операция ----
  if(S.sheet.mode === 'op' && S.sheet.focusAmount){
    S.sheet.focusAmount = false;          // без setS, чтобы не вызвать перерисовку
    const amt = $('#opAmt');
    if(amt) setTimeout(() => amt.focus(), 60);
  }
  on('#typeBtn', () => patchSheet({typeOpen: !S.sheet.typeOpen}));
  on('#dateBtn', () => patchSheet({dateOpen: !S.sheet.dateOpen}));
  on('#keepOpen', () => patchSheet({keepOpen: !S.sheet.keepOpen}));
  on('#pickBack', () => patchSheet({picking: null}));
  on('[data-open-pick]', el => patchSheet({picking: el.dataset.openPick}));
  on('[data-add-sub]', el => {
    const parentId = el.dataset.addSub;
    const name = prompt('Название подкатегории');
    if(!name || !name.trim()) return;
    const p = cat(parentId);
    const data = {profileId:S.profileId, type:p.type, name:name.trim(),
      icon:p.icon, color:p.color, parentId, order: childrenOf(parentId).length};
    const id = fbAdd(COL.cats, data);
    S.cats.push({...data, id});
    patchSheet({catId: id});
  });
  on('[data-op-type]', el => {
    const type = el.dataset.opType;
    const first = parents(type === 'income' ? 'income' : 'expense')[0];
    const keepCat = S.sheet.catId && cat(S.sheet.catId)?.type === type;
    patchSheet({type, typeOpen:false,
      catId: type === 'transfer' ? null : (keepCat ? S.sheet.catId : (first ? first.id : null)),
      toWalletId: type === 'transfer'
        ? (S.sheet.toWalletId || (myWallets().find(w => w.id !== S.sheet.walletId) || {}).id)
        : S.sheet.toWalletId});
  });
  on('[data-pick-cat]', el => patchSheet({catId: el.dataset.pickCat, picking: null}));
  on('[data-pick-wallet]', el => patchSheet({walletId: el.dataset.pickWallet, picking: null}));
  on('[data-pick-to]', el => patchSheet({toWalletId: el.dataset.pickTo, picking: null}));

  // Подкатегория и дата меняются прямо в DOM: лист не пересобирается,
  // поэтому нет ни мигания, ни сброса прокрутки
  $$('.sub-tile[data-pick-cat]').forEach(btn => btn.onclick = () => {
    S.sheet.catId = btn.dataset.pickCat;
    $$('.sub-tile[data-pick-cat]').forEach(b => b.classList.toggle('on', b === btn));
  });
  $$('.date-chip[data-pick-day]').forEach(btn => btn.onclick = () => {
    const [y,m,d] = btn.dataset.pickDay.split('-').map(Number);
    S.sheet.date = withDate(S.sheet.date, new Date(y, m, d));
    $$('.date-chip[data-pick-day]').forEach(b => b.classList.toggle('on', b === btn));
  });

  on('#saveOp', () => {
    readOpInputs();
    const s = S.sheet;
    const amount = Number(s.amount);
    if(!amount || amount <= 0){ alert('Впишите сумму больше нуля'); return; }
    if(s.type === 'transfer'){
      if(!s.walletId || !s.toWalletId || s.walletId === s.toWalletId){
        alert('Выберите два разных кошелька'); return;
      }
    } else {
      if(!s.catId){ alert('Выберите категорию'); return; }
      if(!s.walletId){ alert('Выберите кошелёк'); return; }
    }

    const data = {
      type: s.type, amount,
      walletId: s.walletId || null,
      catId: s.type === 'transfer' ? null : s.catId,
      toWalletId: s.type === 'transfer' ? s.toWalletId : null,
      amountTo: s.type === 'transfer' ? (Number(s.amountTo) || amount) : null,
      note: (s.note || '').trim(),
      date: new Date(s.date).toISOString(),
    };
    saveOp(data, s.id);
    const d = new Date(s.date);
    if(s.keepOpen && !s.id){
      // Форма остаётся открытой: тип, кошелёк и категория те же, сумма чистая
      setS({month:d.getMonth(), year:d.getFullYear(),
        sheet:{...S.sheet, amount:'', note:'', amountTo:'', focusAmount:true}});
    } else {
      setS({sheet:null, month:d.getMonth(), year:d.getFullYear()});
    }
  });

  on('#deleteOp', () => {
    if(!confirm('Удалить эту операцию?')) return;
    deleteOp(S.sheet.id);
    setS({sheet:null});
  });

  // ---- период ----
  on('[data-pick-month]', el => setS({month: +el.dataset.pickMonth, sheet:null}));
  on('[data-pick-year]', el => setS({year: +el.dataset.pickYear}));

  // ---- профили ----
  on('[data-use-profile]', el => {
    LS.set('profile', el.dataset.useProfile);
    setS({profileId: el.dataset.useProfile, sheet:null});
  });
  on('#addProfile', () => {
    const name = $('#npName')?.value.trim();
    if(!name){ alert('Впишите название профиля'); return; }
    const icon = ($('#npIcon')?.value || name[0]).slice(0,2);
    const pid = seedProfile(name, icon);
    LS.set('profile', pid);
    setS({profileId: pid, sheet:null});
  });
  on('[data-del-profile]', el => {
    const id = el.dataset.delProfile;
    const p = S.profiles.find(x => x.id === id);
    if(!confirm(`Удалить профиль «${p.name}» со всеми его операциями, кошельками и категориями?`)) return;
    S.ops.filter(o=>o.profileId===id).forEach(o => fbDel(COL.ops, o.id));
    S.wallets.filter(w=>w.profileId===id).forEach(w => fbDel(COL.wallets, w.id));
    S.cats.filter(c=>c.profileId===id).forEach(c => fbDel(COL.cats, c.id));
    fbDel(COL.profiles, id);
    S.ops = S.ops.filter(o=>o.profileId!==id);
    S.wallets = S.wallets.filter(w=>w.profileId!==id);
    S.cats = S.cats.filter(c=>c.profileId!==id);
    S.profiles = S.profiles.filter(x=>x.id!==id);
    const next = S.profiles[0].id;
    LS.set('profile', next);
    setS({profileId: next, sheet:null});
  });

  // ---- валюта ----
  on('[data-pick-currency]', el => {
    LS.set('currency', el.dataset.pickCurrency);
    setS({mainCurrency: el.dataset.pickCurrency});
  });
  $$('.rate-inp').forEach(inp => inp.onchange = () => {
    const rates = {...S.rates, [inp.dataset.rate]: Number(inp.value) || 0};
    LS.set('rates', rates); setS({rates});
  });

  // ---- кошельки ----
  on('#newWallet', () => setS({sheet:{...S.sheet, edit:{
    id:null, name:'', icon:'👛', color:PALETTE[0], currency:S.mainCurrency,
    kind:'normal', displayBalance:0, initialBalance:0}}}));
  on('[data-edit-wallet]', el => {
    const w = wallet(el.dataset.editWallet);
    setS({sheet:{...S.sheet, edit:{...w, displayBalance: walletBalance(w.id)}}});
  });
  const readWallet = () => ({
    name: $('#wName')?.value ?? S.sheet.edit.name,
    icon: $('#wIcon')?.value ?? S.sheet.edit.icon,
    displayBalance: $('#wBal')?.value ?? S.sheet.edit.displayBalance,
  });
  on('[data-w-cur]', el => setS({sheet:{...S.sheet, edit:{...S.sheet.edit, ...readWallet(), currency: el.dataset.wCur}}}));
  on('[data-w-kind]', el => setS({sheet:{...S.sheet, edit:{...S.sheet.edit, ...readWallet(), kind: el.dataset.wKind}}}));
  on('[data-w-color]', el => setS({sheet:{...S.sheet, edit:{...S.sheet.edit, ...readWallet(), color: el.dataset.wColor}}}));
  on('#saveWallet', () => {
    const e = {...S.sheet.edit, ...readWallet()};
    if(!String(e.name).trim()){ alert('Впишите название кошелька'); return; }
    const wanted = Number(e.displayBalance) || 0;
    if(e.id){
      // Двигаем стартовый остаток так, чтобы итог совпал с введённым
      const computed = walletBalance(e.id) - (Number(e.initialBalance) || 0);
      const data = {name:e.name.trim(), icon:e.icon, color:e.color, currency:e.currency,
        kind:e.kind, initialBalance: wanted - computed, profileId:S.profileId, order:e.order||0};
      fbUpd(COL.wallets, e.id, data);
      S.wallets = S.wallets.map(w => w.id === e.id ? {...w, ...data} : w);
    } else {
      const data = {name:e.name.trim(), icon:e.icon, color:e.color, currency:e.currency,
        kind:e.kind, initialBalance: wanted, profileId:S.profileId, order:myWallets().length};
      S.wallets.push({...data, id: fbAdd(COL.wallets, data)});
    }
    setS({sheet:{...S.sheet, edit:null}});
  });
  on('#delWallet', () => {
    const e = S.sheet.edit;
    const used = S.ops.filter(o => o.walletId === e.id || o.toWalletId === e.id).length;
    if(!confirm(used ? `С этим кошельком связано ${used} операций. Они останутся, но потеряют кошелёк. Удалить?` : 'Удалить кошелёк?')) return;
    fbDel(COL.wallets, e.id);
    S.wallets = S.wallets.filter(w => w.id !== e.id);
    setS({sheet:{...S.sheet, edit:null}});
  });

  // ---- категории ----
  const type = S.sheet.catType;
  on('#newCat', () => setS({sheet:{...S.sheet, edit:{
    id:null, name:'', icon:'💼', color:PALETTE[0], parentId:null, type}}}));
  on('[data-new-sub]', el => setS({sheet:{...S.sheet, edit:{
    id:null, name:'', icon: cat(el.dataset.newSub).icon, color: cat(el.dataset.newSub).color,
    parentId: el.dataset.newSub, type}}}));
  on('[data-edit-cat]', el => setS({sheet:{...S.sheet, edit:{...cat(el.dataset.editCat)}}}));
  const readCat = () => ({
    name: $('#cName')?.value ?? S.sheet.edit.name,
    icon: $('#cIcon')?.value ?? S.sheet.edit.icon,
  });
  on('[data-c-icon]', el => setS({sheet:{...S.sheet, edit:{...S.sheet.edit, ...readCat(), icon: el.dataset.cIcon}}}));
  on('[data-c-color]', el => setS({sheet:{...S.sheet, edit:{...S.sheet.edit, ...readCat(), color: el.dataset.cColor}}}));
  on('[data-c-parent]', el => setS({sheet:{...S.sheet, edit:{...S.sheet.edit, ...readCat(), parentId: el.dataset.cParent || null}}}));
  on('#saveCat', () => {
    const e = {...S.sheet.edit, ...readCat()};
    if(!String(e.name).trim()){ alert('Впишите название категории'); return; }
    const parent = e.parentId ? cat(e.parentId) : null;
    const data = {profileId:S.profileId, type: e.type || type, name:e.name.trim(),
      icon: parent ? parent.icon : e.icon, color: parent ? parent.color : e.color,
      parentId: e.parentId || null, order: e.order ?? S.cats.length};
    if(e.id){
      fbUpd(COL.cats, e.id, data);
      S.cats = S.cats.map(c => c.id === e.id ? {...c, ...data} : c);
    } else {
      S.cats.push({...data, id: fbAdd(COL.cats, data)});
    }
    setS({sheet:{...S.sheet, edit:null}});
  });
  on('#delCat', () => {
    const e = S.sheet.edit;
    const kids = childrenOf(e.id);
    const used = S.ops.filter(o => o.catId === e.id || kids.some(k => k.id === o.catId)).length;
    if(!confirm(used ? `В этой категории ${used} операций. Они останутся в истории без категории. Удалить?` : 'Удалить категорию?')) return;
    [e.id, ...kids.map(k=>k.id)].forEach(id => { fbDel(COL.cats, id); });
    S.cats = S.cats.filter(c => c.id !== e.id && c.parentId !== e.id);
    setS({sheet:{...S.sheet, edit:null}});
  });

  // ---- настройка панели ----
  on('[data-panel-kind]', el => setS({sheet:{...S.sheet, panelKind: el.dataset.panelKind}}));
  bindPanelDrag();

  // ---- долги ----
  on('[data-debt-filter]', el => setS({debtFilter: el.dataset.debtFilter}));
  on('#debtBack', () => setS({sheet:{mode:'debts'}}));
  on('[data-debt-person]', el => setS({sheet:{mode:'debtPerson', person: el.dataset.debtPerson}}));
  on('#newDebt', () => setS({sheet:openDebtForm()}));
  on('[data-debt-quick]', el => setS({sheet:openDebtForm({
    debtDir: el.dataset.debtQuick, person: S.sheet.person})}));
  on('[data-edit-debt]', el => {
    const o = S.ops.find(x => x.id === el.dataset.editDebt);
    if(!o) return;
    setS({sheet:{mode:'debtForm', id:o.id, debtDir:o.debtDir, person:o.person,
      amount:o.amount, walletId:o.walletId, note:o.note||'', date: localInput(new Date(o.date))}});
  });
  on('[data-debt-dir]', el => patchDebt({debtDir: el.dataset.debtDir}));
  on('[data-debt-wallet]', el => patchDebt({walletId: el.dataset.debtWallet}));
  on('[data-debt-name]', el => patchDebt({person: el.dataset.debtName}));
  on('#saveDebt', () => {
    readDebtInputs();
    const s = S.sheet;
    const amount = Number(s.amount);
    if(!amount || amount <= 0){ alert('Впишите сумму больше нуля'); return; }
    if(!String(s.person||'').trim()){ alert('Впишите имя'); return; }
    if(!s.walletId){ alert('Выберите кошелёк'); return; }
    saveOp({type:'debt', debtDir:s.debtDir, person:s.person.trim(), amount,
      walletId:s.walletId, catId:null, toWalletId:null, amountTo:null,
      note:(s.note||'').trim(), date:new Date(s.date).toISOString()}, s.id);
    setS({sheet:{mode:'debtPerson', person:s.person.trim()}});
  });
  on('#deleteDebt', () => {
    if(!confirm('Удалить эту запись?')) return;
    const person = S.sheet.person;
    deleteOp(S.sheet.id);
    setS({sheet: personBalance(person) || debtOps().some(o => o.person === person)
      ? {mode:'debtPerson', person} : {mode:'debts'}});
  });

  // ---- очистка ----
  on('#wipeOps', () => {
    if(!confirm('Точно удалить все операции этого профиля?')) return;
    S.ops.filter(o => o.profileId === S.profileId).forEach(o => fbDel(COL.ops, o.id));
    S.ops = S.ops.filter(o => o.profileId !== S.profileId);
    setS({sheet:null});
  });
}

// Точки под секцией показывают, на какой странице плиток мы находимся
function bindPagers(){
  $$('.pager').forEach(pager => {
    const dots = document.querySelector(`[data-dots="${pager.dataset.pager}"]`);
    if(!dots) return;
    pager.addEventListener('scroll', () => {
      const i = Math.round(pager.scrollLeft / Math.max(1, pager.clientWidth));
      Array.from(dots.children).forEach((d, n) => d.classList.toggle('on', n === i));
    }, {passive:true});
  });
}

// ==================== ЖЕСТ НА ПАНЕЛИ ====================
// Тянем плитку на плитку: доход → кошелёк, кошелёк → расход, кошелёк → кошелёк.

const LONG_PRESS = 260;   // мс удержания до захвата
const MOVE_SLOP  = 10;    // px, дальше этого до срабатывания — это скролл, а не жест

let drag = null;
let dragDocBound = false;

function tileMeta(el){
  if(!el) return null;
  const id = el.dataset.id;
  if(el.dataset.tile === 'wallet'){
    const w = wallet(id);
    if(!w) return null;
    // Долги живут по своим правилам, обычные жесты к ним не применяются
    return {kind: w.kind === 'debt' ? 'debt' : 'wallet', id, name:w.name};
  }
  const c = cat(id);
  return c ? {kind: c.type, id, name:c.name} : null;
}

// Что получится, если бросить src на dst. null — сочетание бессмысленное.
function pairing(src, dst){
  if(!src || !dst || src.id === dst.id) return null;
  if(src.kind === 'debt' || dst.kind === 'debt') return null;   // долги оформляются в своём разделе
  const w = src.kind === 'wallet' ? src : dst.kind === 'wallet' ? dst : null;
  const other = w === src ? dst : src;

  if(src.kind === 'wallet' && dst.kind === 'wallet')
    return {type:'transfer', walletId:src.id, toWalletId:dst.id,
            hint:`Перевод: ${src.name} → ${dst.name}`};
  if(!w) return null;
  if(other.kind === 'income')
    return {type:'income', walletId:w.id, catId:other.id,
            hint:`Доход «${other.name}» в ${w.name}`};
  if(other.kind === 'expense')
    return {type:'expense', walletId:w.id, catId:other.id,
            hint:`Расход «${other.name}» из ${w.name}`};
  return null;
}

function bindTileDrag(){
  const tiles = $$('.tile[data-tile]');   // плитки «+» не перетаскиваются
  if(!tiles.length) return;

  tiles.forEach(tile => {
    tile.addEventListener('pointerdown', e => {
      if(e.button && e.button !== 0) return;
      const meta = tileMeta(tile);
      if(!meta) return;
      cleanupDrag();                       // вдруг прошлый жест не завершился
      drag = {tile, meta, x:e.clientX, y:e.clientY, startX:e.clientX, startY:e.clientY,
              armed:false, ghost:null, hint:null, target:null, pairing:null,
              timer: setTimeout(() => armDrag(), LONG_PRESS)};
    });
  });

  if(dragDocBound) return;
  dragDocBound = true;
  document.addEventListener('pointermove', onDragMove, {passive:false});
  document.addEventListener('pointerup', onDragEnd);
  document.addEventListener('pointercancel', cancelDrag);
  // iOS начинает прокрутку сама — глушим её, пока идёт жест
  document.addEventListener('touchmove', preventWhileDragging, {passive:false});
  // Страховка: если система перехватила жест, событие отпускания может не прийти
  document.addEventListener('touchend', onDragEnd);
  document.addEventListener('touchcancel', cancelDrag);
  window.addEventListener('blur', cancelDrag);
  document.addEventListener('visibilitychange', () => { if(document.hidden) cancelDrag(); });
}

function preventWhileDragging(e){ if(drag && drag.armed) e.preventDefault(); }

function armDrag(){
  if(!drag) return;
  drag.armed = true;
  document.body.classList.add('dragging-mode');
  drag.tile.classList.add('drag-src');

  const ghost = drag.tile.cloneNode(true);
  ghost.className = 'tile tile-ghost';
  ghost.style.left = drag.x + 'px';
  ghost.style.top  = drag.y + 'px';
  document.body.appendChild(ghost);
  drag.ghost = ghost;

  // Последний рубеж: жест не может длиться вечно
  drag.deadline = setTimeout(cancelDrag, 20000);

  if(navigator.vibrate) navigator.vibrate(12);
}

function onDragMove(e){
  if(!drag) return;

  if(!drag.armed){
    // Палец уехал раньше срабатывания — значит человек листает страницу
    if(Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > MOVE_SLOP) cancelDrag();
    return;
  }

  e.preventDefault();
  drag.x = e.clientX; drag.y = e.clientY;
  drag.ghost.style.left = drag.x + 'px';
  drag.ghost.style.top  = drag.y + 'px';

  const under = document.elementFromPoint(drag.x, drag.y);
  const tile = under && under.closest ? under.closest('.tile') : null;
  const target = tile && tile !== drag.tile ? tile : null;

  if(target !== drag.target){
    if(drag.target) drag.target.classList.remove('drop-ok');
    drag.target = target;
    drag.pairing = target ? pairing(drag.meta, tileMeta(target)) : null;
    if(drag.pairing) target.classList.add('drop-ok');
  }
  showHint(drag.pairing ? drag.pairing.hint : null);
}

function showHint(text){
  if(!text){
    if(drag.hint){ drag.hint.remove(); drag.hint = null; }
    return;
  }
  if(!drag.hint){
    drag.hint = document.createElement('div');
    drag.hint.className = 'drag-hint';
    document.body.appendChild(drag.hint);
  }
  drag.hint.textContent = text;
}

function onDragEnd(){
  if(!drag) return;
  const armed = drag.armed, pair = drag.pairing, meta = drag.meta;
  cleanupDrag();

  if(!armed){
    // Обычное касание — прежнее поведение: открыть форму по плитке
    if(meta.kind === 'debt'){
      setS({sheet:{mode:'debts'}});
    } else if(meta.kind === 'wallet'){
      const ws = myWallets().filter(w => w.kind !== 'debt');
      openOpSheet({type:'transfer', walletId:meta.id,
                   toWalletId:(ws.find(w => w.id !== meta.id) || {}).id});
    } else {
      openOpSheet({type: meta.kind, catId: meta.id});
    }
    return;
  }

  if(pair){
    if(navigator.vibrate) navigator.vibrate(18);
    openOpSheet({...pair, focusAmount:true});
  }
}

function cancelDrag(){ if(drag){ cleanupDrag(); } }

function cleanupDrag(){
  if(!drag) return;
  clearTimeout(drag.timer);
  clearTimeout(drag.deadline);
  if(drag.ghost) drag.ghost.remove();
  if(drag.hint) drag.hint.remove();
  if(drag.target) drag.target.classList.remove('drop-ok');
  drag.tile.classList.remove('drag-src');
  document.body.classList.remove('dragging-mode');
  drag = null;
  // на случай, если копия осталась от прерванного жеста
  document.querySelectorAll('.tile-ghost, .drag-hint').forEach(el => el.remove());
}

// Ставит набор EXPENSE_TREE. Категории с операциями не трогаются никогда —
// иначе история потеряет привязку. Пустые лишние удаляются, чтобы не мусорить.
function applyExpenseTree(){
  // Возвращает сводку; вызывается автоматически при первой загрузке профиля
  const norm = s => s.trim().toLowerCase();
  const opsCount = id => S.ops.filter(o => o.catId === id).length;
  const mine = S.cats.filter(c => c.profileId === S.profileId && c.type === 'expense');

  let added = 0, kept = 0, removed = 0;

  EXPENSE_TREE.forEach((node, i) => {
    let parent = mine.find(c => !c.parentId && norm(c.name) === norm(node.n));
    if(parent){
      fbUpd(COL.cats, parent.id, {icon:node.i, color:node.c, order:i});
      Object.assign(parent, {icon:node.i, color:node.c, order:i});
    } else {
      const data = {profileId:S.profileId, type:'expense', name:node.n,
        icon:node.i, color:node.c, parentId:null, order:i};
      parent = {...data, id: fbAdd(COL.cats, data)};
      S.cats.push(parent);
      mine.push(parent);
      added++;
    }
    node.sub.forEach((sn, j) => {
      const exists = S.cats.find(c => c.parentId === parent.id && norm(c.name) === norm(sn));
      if(exists){
        fbUpd(COL.cats, exists.id, {icon:node.i, color:node.c, order:j});
        Object.assign(exists, {icon:node.i, color:node.c, order:j});
        return;
      }
      const sd = {profileId:S.profileId, type:'expense', name:sn,
        icon:node.i, color:node.c, parentId:parent.id, order:j};
      S.cats.push({...sd, id: fbAdd(COL.cats, sd)});
      added++;
    });
  });

  // Всё, чего нет в наборе: пустое убираем, использованное оставляем
  const wanted = new Set();
  EXPENSE_TREE.forEach(node => {
    wanted.add(norm(node.n));
    node.sub.forEach(sn => wanted.add(norm(node.n) + '/' + norm(sn)));
  });
  const isWanted = c => c.parentId
    ? wanted.has(norm(cat(c.parentId)?.name || '') + '/' + norm(c.name))
    : wanted.has(norm(c.name));

  const doomed = [];
  S.cats.filter(c => c.profileId === S.profileId && c.type === 'expense' && !isWanted(c))
    .forEach(c => {
      const used = opsCount(c.id) + childrenOf(c.id).reduce((s,k) => s + opsCount(k.id), 0);
      if(used){ kept++; } else { doomed.push(c); }
    });
  doomed.forEach(c => {
    if(!c.parentId) childrenOf(c.id).forEach(k => { fbDel(COL.cats, k.id); });
    fbDel(COL.cats, c.id);
    removed++;
  });
  const doomedIds = new Set(doomed.map(c => c.id));
  S.cats = S.cats.filter(c => !doomedIds.has(c.id) && !doomedIds.has(c.parentId));

  return {added, removed, kept};
}

// Схлопывает категории с одинаковым названием на одном уровне.
// Операции и подкатегории переезжают на выжившую, поэтому история не теряется.
function dedupeCategories(){
  const norm = s => (s||'').trim().toLowerCase();
  let merged = 0;

  const pass = roots => {
    const seen = new Map();
    S.cats
      .filter(c => c.profileId === S.profileId && (roots ? !c.parentId : !!c.parentId))
      .slice()
      .sort((a,b) => String(a.id).localeCompare(String(b.id)))
      .forEach(c => {
        const key = `${c.type}|${c.parentId || ''}|${norm(c.name)}`;
        const keep = seen.get(key);
        if(!keep){ seen.set(key, c); return; }
        S.ops.forEach(o => {
          if(o.catId === c.id){ o.catId = keep.id; fbUpd(COL.ops, o.id, {catId: keep.id}); }
        });
        S.cats.forEach(k => {
          if(k.parentId === c.id){ k.parentId = keep.id; fbUpd(COL.cats, k.id, {parentId: keep.id}); }
        });
        fbDel(COL.cats, c.id);
        c.__dead = true;
        merged++;
      });
  };

  pass(true);                                    // сначала верхний уровень
  S.cats = S.cats.filter(c => !c.__dead);
  pass(false);                                   // затем подкатегории под общими родителями
  S.cats = S.cats.filter(c => !c.__dead);
  return merged;
}

// ==================== ПЕРЕТАСКИВАНИЕ ====================

function commitOrder(kind, ids){
  const col = kind === 'wallets' ? COL.wallets : COL.cats;
  const pos = {};
  ids.forEach((id, i) => { pos[id] = i; fbUpd(col, id, {order: i}); });
  if(kind === 'wallets'){
    S.wallets = S.wallets.map(w => pos[w.id] === undefined ? w : {...w, order: pos[w.id]})
                         .sort((a,b) => (a.order||0) - (b.order||0));
  } else {
    S.cats = S.cats.map(c => pos[c.id] === undefined ? c : {...c, order: pos[c.id]});
  }
  render();
}

function toggleHidden(kind, id){
  if(kind === 'wallets'){
    const w = wallet(id);
    fbUpd(COL.wallets, id, {hidden: !w.hidden});
    S.wallets = S.wallets.map(x => x.id === id ? {...x, hidden: !w.hidden} : x);
  } else {
    const c = cat(id);
    fbUpd(COL.cats, id, {hidden: !c.hidden});
    S.cats = S.cats.map(x => x.id === id ? {...x, hidden: !c.hidden} : x);
  }
  render();
}

function bindPanelDrag(){
  const list = document.getElementById('dragList');
  if(!list) return;
  const kind = list.dataset.kind;

  list.querySelectorAll('[data-hide]').forEach(btn => {
    btn.onclick = e => { e.stopPropagation(); toggleHidden(kind, btn.dataset.hide); };
  });

  let row = null, startY = 0;

  const move = e => {
    if(!row) return;
    e.preventDefault();
    row.style.transform = `translateY(${e.clientY - startY}px)`;

    // Середина перетаскиваемой строки внутри соседа — значит меняем их местами
    const box = row.getBoundingClientRect();
    const mid = box.top + box.height / 2;
    for(const other of Array.from(list.children)){
      if(other === row) continue;
      const r = other.getBoundingClientRect();
      if(mid > r.top && mid < r.bottom){
        const below = row.compareDocumentPosition(other) & 4; // DOCUMENT_POSITION_FOLLOWING
        row.style.transform = '';
        if(below) other.after(row); else other.before(row);
        startY = e.clientY;           // сбрасываем отсчёт от нового места
        break;
      }
    }
  };

  const end = () => {
    if(!row) return;
    row.style.transform = '';
    row.classList.remove('dragging');
    row = null;
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', end);
    document.removeEventListener('pointercancel', end);
    commitOrder(kind, Array.from(list.children).map(el => el.dataset.dragId));
  };

  list.querySelectorAll('[data-handle]').forEach(handle => {
    handle.addEventListener('pointerdown', e => {
      row = handle.closest('.drag-row');
      startY = e.clientY;
      row.classList.add('dragging');
      e.preventDefault();
      document.addEventListener('pointermove', move, {passive:false});
      document.addEventListener('pointerup', end);
      document.addEventListener('pointercancel', end);
    });
  });
}

// ==================== ЭКСПОРТ ====================

function exportCsv(){
  const rows = [['Дата','Тип','Категория','Подкатегория','Кошелёк','Сумма','Валюта','Примечание']];
  const typeName = {expense:'Расход', income:'Доход', transfer:'Перевод', debt:'Долг'};
  S.ops.filter(o => o.profileId === S.profileId)
    .slice().sort((a,b) => new Date(a.date) - new Date(b.date))
    .forEach(o => {
      const c = o.catId ? cat(o.catId) : null;
      const parent = c && c.parentId ? cat(c.parentId) : null;
      const w = wallet(o.walletId);
      rows.push([
        new Date(o.date).toLocaleString('ru-RU'),
        typeName[o.type] || o.type,
        o.type === 'debt' ? (DEBT_DIR[o.debtDir]?.label || 'Долг') : (parent ? parent.name : (c ? c.name : '')),
        o.type === 'debt' ? (o.person || '') : (parent ? c.name : ''),
        o.type === 'transfer' ? `${w?w.name:''} → ${wallet(o.toWalletId)?.name || ''}` : (w ? w.name : ''),
        o.amount,
        w ? w.currency : S.mainCurrency,
        o.note || '',
      ]);
    });
  const csv = '\uFEFF' + rows
    .map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(';'))
    .join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
  const a = document.createElement('a');
  a.href = url;
  a.download = `findirector-${profile()?.name || 'profile'}-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// ==================== СТАРТ ====================

function bindLogin(){
  const btn = document.getElementById('loginBtn');
  if(btn) btn.onclick = doSignIn;
}

async function doSignIn(){
  setS({signingIn:true, authError:''});
  try {
    await signInWithPopup(auth, provider);
  } catch(err){
    // В приложении с домашнего экрана всплывающее окно часто блокируется —
    // тогда уходим на вход с переходом на страницу Google и возвращаемся обратно
    const popupFailed = ['auth/popup-blocked','auth/popup-closed-by-user',
      'auth/cancelled-popup-request','auth/operation-not-supported-in-this-environment'];
    if(popupFailed.includes(err.code)){
      try { await signInWithRedirect(auth, provider); return; }
      catch(e2){ setS({signingIn:false, authError:'Не удалось открыть вход: ' + e2.message}); return; }
    }
    setS({signingIn:false, authError: authMessage(err)});
  }
}

function authMessage(err){
  if(err.code === 'auth/unauthorized-domain')
    return 'Этот адрес не разрешён в Firebase. Добавьте домен в Authentication → Settings → Authorized domains.';
  if(err.code === 'auth/operation-not-allowed')
    return 'Вход через Google выключен. Включите провайдера Google в Firebase → Authentication.';
  return 'Не удалось войти: ' + err.message;
}

if('serviceWorker' in navigator){
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(()=>{}));
}

render();

getRedirectResult(auth).catch(err => setS({authError: authMessage(err)}));

onAuthStateChanged(auth, async user => {
  S.authReady = true;
  S.signingIn = false;

  if(!user){
    S.user = null; S.ready = false;
    S.profiles = []; S.wallets = []; S.cats = []; S.ops = []; S.budgets = {};
    render();
    return;
  }

  const email = (user.email || '').toLowerCase();
  if(ALLOWED.length && !ALLOWED.includes(email)){
    await signOut(auth);
    setS({user:null, authError:`Аккаунт ${email} не в списке разрешённых.`});
    return;
  }

  S.user = {uid:user.uid, email:user.email, name:user.displayName};
  S.authError = '';
  render();

  try {
    await loadAll();
    S.ready = true;
    render();
  } catch(err){
    document.getElementById('app').innerHTML =
      `<div class="empty">Не удалось загрузить данные.<br>${esc(err.message)}<br><br>
       Проверьте правила Firestore и обновите страницу.</div>`;
  }
});
