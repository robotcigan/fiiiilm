/* FIIILM v2 — состояние приложения.
   Главное отличие от v1: папка стала проектом. Отдельного ростера нет,
   содержимое папки — это и есть личный рейтинг (my picks). Лайки стали
   сохранёнками: личный отложенный список, в нём и люди, и фильмы. */

const KEY = 'fiiilm-state-v4';

const ME = { id: 'me', name: 'ME', weight: 2, me: true, photo: 'u-me.jpg' };

const EMPTY = {
  signedIn: false,
  user: { name: 'robotcigan', email: 'robotcigan@gmail.com' },
  folders: [],
  collections: [],      // подборки сохранёнок: {id, name, people[], movies[], createdAt}
  notes: {},
  roles: ['DIRECTOR', 'FIRST ASSISTANT DIRECTOR', 'PRODUCER', 'DOP', 'LEAD', 'SUPPORTING'],
  seq: 0,
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(structuredClone(EMPTY), JSON.parse(raw));
  } catch (e) {}
  return structuredClone(EMPTY);
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}

const listeners = [];
function onChange(fn) { listeners.push(fn); }
function commit() { save(); listeners.forEach(fn => fn()); }

function uid(p) { return p + '-' + (++state.seq); }

/* ---------- папки-проекты ---------- */

function createFolder(name, tags) {
  const f = {
    id: uid('f'),
    name: name.trim(),
    tags: tags.slice(),
    createdAt: Date.now(),
    members: [structuredClone(ME)],
    candidates: [],            // {personId, dept, role, comment, parked, addedBy}
    ranks: { me: [] },         // memberId -> порядок personId
    goal: '',
    closed: false,
  };
  state.folders.unshift(f);
  commit();
  return f;
}

function folder(id) { return state.folders.find(f => f.id === id); }

function updateFolder(id, patch) { Object.assign(folder(id), patch); commit(); }

function deleteFolder(id) {
  state.folders = state.folders.filter(f => f.id !== id);
  commit();
}

/* папка считается общей, когда в ней есть кто-то кроме меня */
function isShared(f) { return f.members.length > 1; }

function addCandidate(folderId, personId, byId = 'me') {
  const f = folder(folderId);
  if (f.candidates.some(c => c.personId === personId)) return false;
  const person = FIIILM_DATA.byId.person[personId];
  f.candidates.push({
    personId, dept: person.dept, role: '', comments: {}, parked: false, addedBy: byId,
  });
  f.members.forEach(m => {
    f.ranks[m.id] = f.ranks[m.id] || [];
    if (m.id === byId) f.ranks[m.id].push(personId);
  });
  commit();
  return true;
}

function removeCandidate(folderId, personId) {
  const f = folder(folderId);
  f.candidates = f.candidates.filter(c => c.personId !== personId);
  Object.keys(f.ranks).forEach(k => (f.ranks[k] = f.ranks[k].filter(id => id !== personId)));
  commit();
}

/* комментарий пишет каждый участник свой — в team picks видны все */
function setComment(folderId, personId, memberId, text) {
  const c = folder(folderId).candidates.find(c => c.personId === personId);
  if (!c) return;
  c.comments = c.comments || {};
  if (text) c.comments[memberId] = text; else delete c.comments[memberId];
  commit();
}

function commentsOf(c) {
  return Object.entries(c.comments || {}).map(([id, text]) => ({ id, text }));
}

function setCandidate(folderId, personId, patch) {
  const c = folder(folderId).candidates.find(c => c.personId === personId);
  if (c) Object.assign(c, patch);
  commit();
}

function hasCandidate(folderId, personId) {
  return folder(folderId).candidates.some(c => c.personId === personId);
}

/* мой порядок: список кандидатов в порядке ranks.me, остальные в конец */
function myPicks(f) {
  const order = f.ranks.me || [];
  const seen = new Set(order);
  return [...order.map(id => f.candidates.find(c => c.personId === id)).filter(Boolean),
          ...f.candidates.filter(c => !seen.has(c.personId))];
}

/* порядок после жеста перетаскивания: DOM уже перестроен,
   поэтому сохраняем тихо, без перерисовки — иначе анимация сорвётся */
function setMyPicks(folderId, entries) {
  const f = folder(folderId);
  f.ranks.me = entries.map(e => e.personId);
  entries.forEach(e => setCandidateDept(f, e.personId, e.dept));
  save();
}

function moveInMyPicks(folderId, personId, beforeId, dept) {
  const f = folder(folderId);
  const order = f.ranks.me = myPicks(f).map(c => c.personId);
  const i = order.indexOf(personId);
  order.splice(i, 1);
  if (dept) setCandidateDept(f, personId, dept);
  const j = beforeId ? order.indexOf(beforeId) : -1;
  if (j === -1) order.push(personId); else order.splice(j, 0, personId);
  commit();
}

function setCandidateDept(f, personId, dept) {
  const c = f.candidates.find(c => c.personId === personId);
  if (c) c.dept = dept;
}

/* ---------- общий рейтинг ----------
   Формула из спеки: score = avg + (1 − coverage) × 1000.
   Позиции считаются внутри департамента, начиная с первой. */

function positionsOf(f, memberId) {
  const order = f.ranks[memberId] || [];
  const perDept = {};
  const out = {};
  order.forEach(id => {
    const c = f.candidates.find(c => c.personId === id);
    if (!c || c.parked) return;
    perDept[c.dept] = (perDept[c.dept] || 0) + 1;
    out[id] = perDept[c.dept];
  });
  return out;
}

function teamScore(f, personId) {
  const totalW = f.members.reduce((s, m) => s + m.weight, 0);
  let wsum = 0, wpos = 0;
  const votes = [];
  f.members.forEach(m => {
    const pos = positionsOf(f, m.id)[personId];
    if (!pos) return;
    wsum += m.weight;
    wpos += m.weight * pos;
    votes.push({ member: m, pos });
  });
  if (!wsum) return { score: Infinity, votes, coverage: 0 };
  const avg = wpos / wsum;
  const coverage = wsum / totalW;
  return { score: avg + (1 - coverage) * 1000, votes, coverage, avg };
}

function teamPicks(f) {
  return f.candidates
    .filter(c => !c.parked)
    .map(c => ({ ...c, ...teamScore(f, c.personId) }))
    .sort((a, b) => a.score - b.score);
}

/* ---------- сохранёнки: личные подборки ----------
   Подборка — это не проект: в ней нет участников, рейтинга и голосов,
   только то, что ты отложил на потом. Люди и фильмы лежат вместе. */

function collection(id) { return state.collections.find(c => c.id === id); }

function createCollection(name) {
  const c = { id: uid('c'), name: name.trim(), people: [], movies: [], createdAt: Date.now() };
  state.collections.unshift(c);
  commit();
  return c;
}

function deleteCollection(id) {
  state.collections = state.collections.filter(c => c.id !== id);
  commit();
}

/* в каких подборках лежит элемент */
function collectionsOf(kind, id) {
  return state.collections.filter(c => c[kind].includes(id)).map(c => c.id);
}

function isSaved(kind, id) { return collectionsOf(kind, id).length > 0; }

/* выставляет членство целиком: элемент лежит ровно в выбранных подборках */
function setCollections(kind, id, ids) {
  state.collections.forEach(c => {
    const has = c[kind].includes(id);
    const want = ids.includes(c.id);
    if (want && !has) c[kind].unshift(id);
    if (!want && has) c[kind] = c[kind].filter(x => x !== id);
  });
  commit();
}

function removeFromCollection(colId, kind, id) {
  const c = collection(colId);
  c[kind] = c[kind].filter(x => x !== id);
  commit();
}

/* все сохранённые люди без дублей — из них предлагаем добавлять в проект */
function savedPeople() {
  const seen = new Set();
  state.collections.forEach(c => c.people.forEach(id => seen.add(id)));
  return [...seen];
}

/* ---------- заметки и роли ---------- */

function notesOf(personId) { return state.notes[personId] || []; }

function saveNote(personId, noteId, text) {
  const list = state.notes[personId] = state.notes[personId] || [];
  const time = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  const found = list.find(n => n.id === noteId);
  if (found) { found.text = text; found.time = time; }
  else list.unshift({ id: uid('n'), text, time });
  commit();
}

function deleteNote(personId, noteId) {
  state.notes[personId] = notesOf(personId).filter(n => n.id !== noteId);
  commit();
}

function addRole(role) {
  const r = role.trim().toUpperCase();
  if (r && !state.roles.includes(r)) state.roles.push(r);
  commit();
  return r;
}

/* ---------- демо-состояние ----------
   Приложение открывается залогиненным, с двумя папками и сохранёнками.
   Участники и их голоса выдуманы: приглашений в прототипе нет. */

function seed() {
  state = structuredClone(EMPTY);
  state.signedIn = true;

  // Проект только со мной
  const solo = createFolder('Test', ['ACTION']);
  ['holland', 'stone', 'pattinson', 'hathaway', 'nolan', 'tarantino', 'linus', 'skip']
    .forEach(id => addCandidate(solo.id, id));
  setCandidate(solo.id, 'holland', { role: 'MAIN MALE ACTOR' });
  setCandidate(solo.id, 'stone', { role: 'LEAD' });
  setComment(solo.id, 'stone', 'me', 'Ждём ответ агента');
  solo.goal = '';

  // Проект с командой — как на макете folders-list
  const team = createFolder('The Odyssey', ['ACTION']);
  team.members = [
    structuredClone(ME),
    { id: 'alex', name: 'ALEX', weight: 2, photo: 'u-alex.jpg' },
    { id: 'polina', name: 'POLINA', weight: 1, photo: 'u-polina.jpg' },
  ];
  team.goal = 'SET UP YOUR PLAN';

  const picks = {
    me:     ['holland', 'stone', 'zendaya', 'charlize', 'nolan', 'tarantino', 'hoyte', 'travis'],
    alex:   ['stone', 'holland', 'hathaway', 'zendaya', 'nolan', 'tarantino', 'travis'],
    polina: ['zendaya', 'holland', 'stone', 'charlize', 'nolan', 'hoyte'],
  };
  const owners = {
    holland: 'alex', stone: 'polina', zendaya: 'me', charlize: 'me', hathaway: 'alex',
    nolan: 'me', tarantino: 'me', hoyte: 'polina', travis: 'alex',
  };
  Object.values(picks).flat().forEach(id => addCandidate(team.id, id, owners[id] || 'me'));
  team.ranks = structuredClone(picks);
  setCandidate(team.id, 'holland', { role: 'MAIN MALE ACTOR' });
  setCandidate(team.id, 'zendaya', { role: 'LEAD' });
  setCandidate(team.id, 'hoyte', { role: 'DOP' });
  setComment(team.id, 'nolan', 'me', 'Если согласится — вопрос закрыт');
  setComment(team.id, 'nolan', 'alex', 'Дорого, но тянет весь блок');
  setComment(team.id, 'holland', 'polina', 'Сильная проба, занят до мая');
  setComment(team.id, 'stone', 'alex', 'Не наш типаж');
  setComment(team.id, 'zendaya', 'polina', 'Согласна на пробы в декабре');

  // личные подборки — без участников и рейтинга
  const refs = createCollection('References');
  refs.movies = ['odyssey', 'sinners', 'oppenheimer', 'dune2', 'madmax'];
  refs.people = ['nolan', 'denis'];
  const ops = createCollection('Cinematographers');
  ops.people = ['hoyte', 'linus', 'rodrigo', 'darius'];
  const cast = createCollection('Casting ideas');
  cast.people = ['damon', 'cillian', 'florence', 'travis', 'charlize'];
  cast.movies = ['challengers'];
  state.notes.nolan = [{ id: uid('n'), text: 'Звонить через агента, не напрямую', time: '10:43' }];

  commit();
}

function reset() { seed(); }

if (!state.signedIn && !state.folders.length) seed();

window.FIIILM_STORE = {
  get state() { return state; },
  onChange, commit, reset,
  createFolder, folder, updateFolder, deleteFolder, isShared,
  addCandidate, removeCandidate, setCandidate, hasCandidate, setComment, commentsOf,
  myPicks, moveInMyPicks, setMyPicks, teamPicks, teamScore, positionsOf,
  collection, createCollection, deleteCollection, collectionsOf, isSaved,
  setCollections, removeFromCollection, savedPeople,
  notesOf, saveNote, deleteNote, addRole,
};
