/* FIIILM v2 — экраны и переходы.
   Собрано по макетам из ../screens/screens-v2.
   Экраны — функции от FIIILM_STORE.state, действия помечены data-act. */

const D = window.FIIILM_DATA;
const S = window.FIIILM_STORE;

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ic = (n, cls = 'ic') => `<svg class="${cls}"><use href="#i-${n}"/></svg>`;

const ui = { q: {}, overlay: null, overlayArg: null, sheetPicked: [], sheetCols: [], pendingSave: null };
/* клик, прилетевший сразу после перетаскивания, карточку открывать не должен */
let suppressClick = false;

function route() {
  const p = (location.hash.slice(1) || '').split('/').filter(Boolean);
  return { name: p[0] || 'folders', a: p[1], b: p[2] };
}
function go(h) { location.hash = h; }

/* ---------- общие куски ---------- */

/* превью 2×2: сначала то, у чего есть картинка, остальное — серая заглушка */
function tiles(srcs) {
  const sorted = [...srcs.filter(Boolean), ...srcs.filter(s => !s)].slice(0, 4);
  while (sorted.length < 4) sorted.push('');
  return sorted.map(s => s ? `<img class="prj__tile" src="${s}" alt="">` : '<div class="prj__tile"></div>').join('');
}

function photo(person, cls) {
  return person.photo ? `<img class="${cls}" src="assets/${person.photo}" alt="">`
                      : `<div class="${cls}"></div>`;
}

function avatar(member, cls = 'ava') {
  return member.photo ? `<img class="${cls}" src="assets/${member.photo}" alt="">`
                      : `<div class="${cls}">${member.name[0]}</div>`;
}

/* плавающие кнопки-пилюли поверх шапки */
function pills(back, right = '') {
  return `<div class="pills">
    ${back ? `<button class="pill-btn" data-act="go" data-arg="${back}">${ic('arrow-left')}</button>` : '<span></span>'}
    ${right ? `<div class="pills__right">${right}</div>` : ''}
  </div>`;
}

function pillBtn(icon, act, arg) {
  return `<button class="pill-btn" data-act="${act}" data-arg="${arg}">${ic(icon)}</button>`;
}

const TABS = [
  { key: 'search',  hash: 'search',  icon: 'search' },
  { key: 'folders', hash: 'folders', icon: 'folder' },
  { key: 'saved',   hash: 'saved',   icon: 'saves' },
  { key: 'profile', hash: 'profile', icon: '' },
];

/* Нижняя панель целиком — один компонент, как в Figma (1024:3244):
   градиент в канвас, ряд с кнопкой, чёрная капсула, место под home indicator. */
function bottomBar(active, button) {
  const nav = `<nav class="tabbar">${TABS.map(t => {
    const on = t.key === active;
    const inner = t.key === 'profile'
      ? `<img class="tabbar__me${on ? ' is-active' : ''}" src="assets/u-me.jpg" alt="">`
      : ic(t.icon, 'tabbar__ic' + (on ? ' is-active' : ''));
    return `<button data-act="go" data-arg="${t.hash}">${inner}</button>`;
  }).join('')}</nav>`;
  return `<div class="bottombar${button ? '' : ' bottombar--bare'}">
    ${button || ''}
    <div class="bottombar__nav">${nav}</div>
  </div>`;
}

/* кнопка над навигацией: с подписью (56) либо только «+» (80×40) */
function addBtn(label, act, arg, iconOnly) {
  return `<div class="bottombar__btn"><button class="add-btn${iconOnly ? ' add-btn--icon' : ''}"
    aria-label="${label}" data-act="${act}"${arg ? ` data-arg="${arg}"` : ''}>
    ${ic('plus', 'add-btn__plus')}${iconOnly ? '' : `<span>${label}</span>`}</button></div>`;
}

function searchField(scope, placeholder) {
  const v = ui.q[scope] || '';
  return `<div class="search-field">
    <input class="search-field__input" type="text" data-q="${scope}" value="${esc(v)}" placeholder="${placeholder}">
    ${v ? `<button class="search-field__clear" data-act="clearQ" data-arg="${scope}">${ic('close')}</button>` : ''}
  </div>`;
}

/* ============================ ЭКРАНЫ ============================ */

const SCREENS = {

  /* ---------- список проектов ---------- */
  folders() {
    const list = S.state.folders;
    return pills('back', pillBtn('more', 'overlay', 'profile-menu')) + `
      <div class="scroll pad" style="padding-top:40px">
        ${list.length ? list.map(f => {
          const preview = S.myPicks(f).map(c => D.byId.person[c.personId]);
          return `<div class="prj" data-act="go" data-arg="f/${f.id}">
            <div class="prj__grid">${tiles(preview.map(p => p.photo ? `assets/${p.photo}` : ''))}</div>
            <div class="prj__body">
              <div class="prj__name">${esc(f.name)}</div>
              <div class="prj__meta">
                ${f.tags.map(t => `[${esc(t)}]`).join(' ')}
              </div>
              <div class="prj__members">
                ${f.members.map(m => avatar(m, 'ava ava--sm')).join('')}
              </div>
            </div>
            <button class="prj__more" data-act="overlay" data-arg="folder-menu:${f.id}" data-stop="1">${ic('more')}</button>
          </div>`;
        }).join('') : `<div class="empty-note">
            <p class="display">NO PROJECTS<br>YET</p>
            <p class="caption">Создай проект и собери в нём команду.</p>
          </div>`}
      </div>
      ${bottomBar('folders', addBtn('ADD FOLDER', 'go', 'folder-new', true))}`;
  },

  /* ---------- создание проекта ---------- */
  'folder-new'() {
    const tags = ui.newTags || (ui.newTags = []);
    return pills('folders') + `
      <div class="scroll pad" style="padding-top:52px">
        <p class="label">NAME YOUR FOLDER</p>
        <div class="search-field" style="margin-top:14px">
          <input class="search-field__input search-field__input--sm" type="text"
                 id="folder-name" value="${esc(ui.newName || '')}" placeholder="FOLDER NAME">
        </div>
        <p class="label" style="margin-top:30px">ADD TAGS</p>
        <div class="search-field" style="margin-top:14px">
          <input class="search-field__input search-field__input--tag" type="text" id="folder-tag" placeholder="ADD TAGS">
          <button data-act="addTag">${ic('plus')}</button>
        </div>
        <div class="chips chips--wrap" style="margin-top:12px">
          ${tags.map((t, i) => `<span class="chip chip--outline" data-act="dropTag" data-arg="${i}">${esc(t)} &times;</span>`).join('')}
        </div>
      </div>
      ${bottomBar('folders', addBtn('CREATE FOLDER', 'createFolder'))}`;
  },

  /* ---------- проект ---------- */
  f(id, tab) {
    const f = S.folder(id);
    if (!f) return SCREENS.folders();
    if (tab === 'add') return folderAdd(f);
    const shared = S.isShared(f);
    const team = tab === 'team' && shared;

    return pills('folders',
        pillBtn('send', 'overlay', `share:${f.id}`) + pillBtn('more', 'overlay', `folder-menu:${f.id}`)) + `
      <div class="phead">
        <button class="phead__goal" data-act="overlay" data-arg="goal:${f.id}">
          GOAL: ${esc(f.goal || 'SET UP YOUR PLAN')}</button>
        <h2 class="phead__title">${esc(f.name)}</h2>
        <div class="phead__pad"></div>
      </div>
      ${shared ? `<div class="tabs">
        <button class="${team ? '' : 'is-active'}" data-act="go" data-arg="f/${f.id}">MY PICKS</button>
        <button class="${team ? 'is-active' : ''}" data-act="go" data-arg="f/${f.id}/team">TEAM PICKS</button>
      </div>` : ''}
      <div class="scroll scroll--cards${f.closed ? ' is-closed' : ''}">
        ${team ? teamList(f) : myList(f)}
      </div>
      ${bottomBar('folders', f.closed ? '' : addBtn('ADD SPECIALIST', 'go', `f/${f.id}/add`, true))}`;
  },

  /* ---------- поиск: макеты 1028:5022 (пустой) и 1028:4775 (с запросом) ---------- */
  search() {
    const q = ui.q.search || '';
    const has = !!q.trim();
    const ppl = D.searchPeople(q);
    const mov = D.searchMovies(q);
    const LIMIT = 6;
    const shown = ui.searchAll ? ppl : ppl.slice(0, LIMIT);
    const movShown = ui.searchAll ? mov : mov.slice(0, LIMIT);

    return `
      <div class="sh">
        <div class="sh__icon">${ic('search')}</div>
        <label class="sf${q ? '' : ' is-empty'}">
          <input class="sf__input" type="text" data-q="search" value="${esc(q)}"
                 placeholder="Search" autocomplete="off" spellcheck="false">
          <span class="sf__caret"></span>
          ${q ? `<button class="sf__clear" data-act="clearQ" data-arg="search" aria-label="Clear">${ic('clear')}</button>` : ''}
        </label>
        <div class="sh__rule"></div>
        ${has ? `<div class="sh__filter"><button class="filter-chip" data-act="toast"
          data-arg="Экрана фильтров в макете нет">filter</button></div>` : ''}
      </div>
      <div class="scroll scroll--cards">
        ${has ? `
          <div class="shead">
            <span class="shead__title">Specialists [${ppl.length}]</span>
            ${ppl.length > LIMIT ? `<button class="shead__more" data-act="searchAll">${ui.searchAll ? 'show less' : 'show all'}</button>` : ''}
          </div>
          ${ppl.length ? `<div class="card-group">${shown.map(searchRow).join('')}</div>`
            : '<div class="no-results">No specialists found</div>'}
          <div class="shead" style="margin-top:6px"><span class="shead__title">Movies [${mov.length}]</span></div>
          ${mov.length ? `<div class="card-group">${movShown.map(searchMovieRow).join('')}</div>`
            : '<div class="no-results">No movies found</div>'}` : ''}
      </div>
      ${bottomBar('search')}`;
  },

  /* ---------- сохранёнки: список подборок ---------- */
  saved() {
    const list = S.state.collections;
    return pills('back') + `
      <div class="scroll pad" style="padding-top:40px">
        ${list.length ? list.map(c => {
          const srcs = [
            ...c.people.map(id => D.byId.person[id]).filter(Boolean).map(p => p.photo ? `assets/${p.photo}` : ''),
            ...c.movies.map(id => D.byId.movie[id]).filter(Boolean).map(m => m.poster ? `assets/${m.poster}` : ''),
          ];
          const meta = [c.people.length && `${c.people.length} ${c.people.length === 1 ? 'PERSON' : 'PEOPLE'}`, c.movies.length && `${c.movies.length} ${c.movies.length === 1 ? 'MOVIE' : 'MOVIES'}`]
            .filter(Boolean).join(' · ') || 'EMPTY';
          return `<div class="prj" data-act="go" data-arg="col/${c.id}">
            <div class="prj__grid">${tiles(srcs)}</div>
            <div class="prj__body">
              <div class="prj__name">${esc(c.name)}</div>
              <div class="prj__meta">${meta}</div>
            </div>
            <button class="prj__more" data-act="overlay" data-arg="collection-menu:${c.id}" data-stop="1">${ic('more')}</button>
          </div>`;
        }).join('') : `<div class="empty-note">
            <p class="display">NO COLLECTIONS<br>YET</p>
            <p class="caption">Откладывай людей и фильмы закладкой — они лягут в подборку.</p>
          </div>`}
      </div>
      ${bottomBar('saved', addBtn('ADD COLLECTION', 'go', 'collection-new', true))}`;
  },

  /* ---------- новая подборка ---------- */
  'collection-new'() {
    const pending = ui.pendingSave;
    return pills('back') + `
      <div class="scroll pad" style="padding-top:52px">
        <p class="label">NAME YOUR COLLECTION</p>
        <div class="search-field" style="margin-top:14px">
          <input class="search-field__input search-field__input--sm" type="text"
                 id="col-name" value="${esc(ui.newColName || '')}" placeholder="COLLECTION NAME">
        </div>
        ${pending ? `<p class="caption" style="margin-top:14px">
          После создания сюда сразу попадёт ${pending.kind === 'people'
            ? esc(D.byId.person[pending.id].name) : esc(D.byId.movie[pending.id].title.toUpperCase())}.</p>` : ''}
      </div>
      ${bottomBar('saved', addBtn('CREATE COLLECTION', 'createCollection'))}`;
  },

  /* ---------- подборка: люди и фильмы ---------- */
  col(id, tab) {
    const c = S.collection(id);
    if (!c) return SCREENS.saved();
    const isMovies = tab === 'movies';
    const ppl = c.people.map(x => D.byId.person[x]).filter(Boolean);
    const mov = c.movies.map(x => D.byId.movie[x]).filter(Boolean);
    const unsave = (kind, x) => `<button data-act="uncollect" data-arg="${c.id}:${kind}:${x}" data-stop="1">${ic('saves')}</button>`;
    return pills('saved', pillBtn('more', 'overlay', `collection-menu:${c.id}`)) + `
      <div class="phead">
        <div class="phead__goal">COLLECTION</div>
        <h2 class="phead__title">${esc(c.name)}</h2>
        <div class="phead__pad"></div>
      </div>
      <div class="tabs">
        <button class="${isMovies ? '' : 'is-active'}" data-act="go" data-arg="col/${c.id}">PEOPLE (${ppl.length})</button>
        <button class="${isMovies ? 'is-active' : ''}" data-act="go" data-arg="col/${c.id}/movies">MOVIES (${mov.length})</button>
      </div>
      <div class="scroll scroll--cards">
        ${(isMovies ? mov : ppl).length
          ? `<div class="card-group">${isMovies
              ? mov.map(m => movieRow(m, unsave('movies', m.id))).join('')
              : ppl.map(p => personRow(p, null, unsave('people', p.id))).join('')}</div>`
          : `<div class="empty-note"><p class="caption">${isMovies ? 'Фильмов' : 'Людей'} в этой подборке пока нет.</p></div>`}
      </div>
      ${bottomBar('saved')}`;
  },

  /* ---------- профиль ---------- */
  profile() {
    return pills('back') + `
      <div class="scroll" style="padding-top:46px">
        <div class="prof">
          <img class="prof__ava" src="assets/u-me.jpg" alt="">
          <h2 class="title">${esc(S.state.user.name)}</h2>
          <p class="prof__mail">${esc(S.state.user.email)}</p>
          <button class="btn btn--sf prof__edit" data-act="toast" data-arg="Экрана правки профиля в макете нет">Edit Profile</button>
        </div>
        <div class="pad">
          <div class="sec-head">ПРОТОТИП</div>
          <button class="link-row" data-act="resetDemo">${ic('import')}СБРОСИТЬ ДЕМО-ДАННЫЕ</button>
          <p class="caption" style="margin-top:10px">
            Вернёт два проекта и сохранёнки в исходный вид.</p>
        </div>
      </div>
      ${bottomBar('profile')}`;
  },

  /* ---------- карточка человека ---------- */
  person(id) {
    const p = D.byId.person[id];
    if (!p) return SCREENS.folders();
    const credits = D.creditsOf(id);
    const saved = S.isSaved('people', id);
    return pills('back',
        `<button class="pill-btn" data-act="toggleSaved" data-arg="people:${id}">${ic(saved ? 'saves' : 'save')}</button>`
        + pillBtn('more', 'overlay', `person-menu:${id}`)) + `
      ${photo(p, 'person-hero')}
      <div class="person-scrim"></div>
      <div class="scroll pad">
        <h2 class="title" style="margin-top:14px">${esc(p.name)}</h2>
        <p class="caption" style="margin-top:6px">[${p.dept}]</p>
        ${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ''}
        <div class="sec-head" style="margin-top:18px">DISCOGRAPHY (${credits.length})</div>
        <div class="disco">
          ${credits.map(c => `<figure data-act="go" data-arg="movie/${c.movie.id}">
            ${c.movie.poster ? `<img src="assets/${c.movie.poster}" alt="">` : '<div class="ph"></div>'}
            <figcaption>${esc(c.movie.title.toUpperCase())}</figcaption>
            <div class="year">${c.movie.year}</div>
          </figure>`).join('')}
        </div>
      </div>
      ${bottomBar(null, addBtn('ADD TO FOLDER', 'pick', id))}`;
  },

  /* ---------- карточка фильма ---------- */
  movie(id, tab) {
    const m = D.byId.movie[id];
    if (!m) return SCREENS.folders();
    const isCast = tab === 'cast';
    const list = isCast ? m.cast : m.crew;
    const saved = S.isSaved('movies', id);
    const grouped = {};
    list.forEach(([pid, role]) => {
      const d = D.byId.person[pid].dept;
      (grouped[d] = grouped[d] || []).push([pid, role]);
    });
    return pills('back',
        `<button class="pill-btn" data-act="toggleSaved" data-arg="movies:${id}">${ic(saved ? 'saves' : 'save')}</button>`) + `
      <div class="mhead mhead--top">
        <h2 class="mhead__title">${esc(m.title)}</h2>
        <p class="mhead__sub">${m.year} &middot; ${m.genres.join(' &middot; ')}</p>
      </div>
      <div class="seg seg--inline">
        <button class="${isCast ? '' : 'is-active'}" data-act="go" data-arg="movie/${id}/crew">CREW</button>
        <button class="${isCast ? 'is-active' : ''}" data-act="go" data-arg="movie/${id}/cast">CAST</button>
      </div>
      <div class="scroll pad">
        ${Object.entries(grouped).map(([dept, items]) => `
          <div class="dept-row"><span class="dept-row__hash">#</span>${dept}</div>
          <div class="card-group">${items.map(([pid, role]) => personRow(D.byId.person[pid], role)).join('')}</div>`).join('')}
      </div>`;
  },

  /* ---------- заметки ---------- */
  notes(pid) {
    const p = D.byId.person[pid];
    const list = S.notesOf(pid);
    return pills(`person/${pid}`) + `
      <div class="scroll" style="padding-top:46px">
        <div class="mhead"><h2 class="mhead__title">${esc(titleCase(p.name))}</h2>
          <p class="mhead__sub">ЗАМЕТКИ</p></div>
        ${list.length ? `<div class="card-group" style="margin:0 var(--gutter)">` + list.map(n => `
          <div class="note-item" data-act="go" data-arg="note/${pid}/${n.id}">
            <div class="bar"></div>
            <div class="body"><div class="text">${esc(n.text)}</div><div class="time">${n.time}</div></div>
            <button data-act="deleteNote" data-arg="${pid}:${n.id}" data-stop="1">${ic('trash', 'ic ic--sm ic--muted')}</button>
          </div>`).join('') + '</div>'
        : '<p class="caption" style="padding:20px var(--gutter)">Заметок пока нет.</p>'}
      </div>
      ${bottomBar(null, addBtn('ADD NOTE', 'go', `note/${pid}/new`))}`;
  },

  note(pid, nid) {
    const p = D.byId.person[pid];
    const ex = nid !== 'new' ? S.notesOf(pid).find(n => n.id === nid) : null;
    return `<div class="topbar topbar--edit">
        <button class="px nav-act" data-act="go" data-arg="notes/${pid}">CANCEL</button>
        <span class="topbar__title topbar__title--sm">${esc(titleCase(p.name))}</span>
        <button class="px nav-act" data-act="saveNote" data-arg="${pid}:${nid}">SAVE</button>
      </div>
      <div class="note-editor">
        <div class="bar"></div>
        <textarea id="note-text" placeholder="Write your note...">${esc(ex ? ex.text : '')}</textarea>
      </div>`;
  },
};

/* ---------- списки внутри проекта ---------- */

/* номер позиции барабаном: колонка на каждую цифру, лента 0–9 внутри */
const DIGITS = '<span>0</span><span>1</span><span>2</span><span>3</span><span>4</span>'
             + '<span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>';

function rollHTML(n) {
  return `<span class="roll" data-value="${n}">${String(n).split('').map(d =>
    `<span class="roll__col"><span class="roll__track" style="transform:translateY(${-d * 10}%)">${DIGITS}</span></span>`
  ).join('')}</span>`;
}

/* меняем только трансформацию — цифра докручивается, а не перерисовывается */
function setRoll(box, n) {
  if (!box || box.dataset.value === String(n)) return;
  const digits = String(n).split('');
  const cols = [...box.querySelectorAll('.roll__col')];
  if (cols.length !== digits.length) {
    box.outerHTML = rollHTML(n);
    return;
  }
  digits.forEach((d, i) => {
    cols[i].firstElementChild.style.transform = `translateY(${-d * 10}%)`;
  });
  box.dataset.value = n;
}

function deptGroups(items) {
  const map = new Map();
  items.forEach(c => {
    if (!map.has(c.dept)) map.set(c.dept, []);
    map.get(c.dept).push(c);
  });
  return [...map.entries()];
}

function myList(f) {
  const groups = deptGroups(S.myPicks(f).filter(c => !c.parked));
  if (!groups.length) return '<div class="empty-note"><p class="caption">Пока никого. Добавь специалиста.</p></div>';
  return groups.map(([dept, items]) => `
    <div class="dept-row"><span class="dept-row__hash">#</span>${dept}</div>
    <div class="card-group">${items.map((c, i) => candRow(f, c, i + 1, false)).join('')}</div>`).join('');
}

function teamList(f) {
  const groups = deptGroups(S.teamPicks(f));
  if (!groups.length) return '<div class="empty-note"><p class="caption">Команда ещё никого не добавила.</p></div>';
  return groups.map(([dept, items]) => `
    <div class="dept-row"><span class="dept-row__hash">#</span>${dept}</div>
    <div class="card-group">${items.map((c, i) => candRow(f, c, i + 1, true)).join('')}</div>`).join('');
}

function candRow(f, c, pos, team) {
  const p = D.byId.person[c.personId];
  const votes = team ? S.teamScore(f, c.personId).votes : [];
  const comments = S.commentsOf(c);
  const mine = (c.comments || {}).me || '';
  /* в team picks порядок считает формула — руками его не переставить,
     поэтому ручки перетаскивания там нет */
  const canDrag = !team && !f.closed;
  return `<div class="cand${team ? ' cand--team' : ''}${c.parked ? ' is-parked' : ''}"
               data-cand="${c.personId}" data-act="go" data-arg="person/${p.id}">
    <div class="cand__rank">
      <span class="cand__pos">#${rollHTML(pos)}</span>
      ${canDrag ? `<button class="cand__drag" data-act="noop" data-stop="1" aria-label="Переставить">${ic('drag', 'ic ic--sm ic--muted')}</button>` : ''}
    </div>
    ${photo(p, 'cand__photo')}
    <div class="cand__body">
      <div class="cand__name">${esc(p.name)}</div>
      ${!team && mine ? `<p class="cand__comment">${esc(mine)}</p>` : ''}
      <button class="cand__role" data-act="overlay" data-arg="role:${f.id}:${c.personId}" data-stop="1">
        ${ic('tag')}<span>${esc(c.role || 'ROLE')}</span></button>
    </div>
    <div class="cand__actions">
      <button class="cand__note" data-stop="1"
              data-act="overlay" data-arg="${team ? 'comments' : 'reason'}:${f.id}:${c.personId}">
        ${ic('comment', (team ? comments.length : mine) ? 'ic ic--note is-on' : 'ic ic--note ic--muted')}
        ${team && comments.length > 1 ? `<span class="cand__notecount">${comments.length}</span>` : ''}
      </button>
    </div>
    ${votes.length ? `<span class="cand__voters" data-act="overlay" data-arg="votes:${f.id}:${c.personId}" data-stop="1">
      ${votes.map(v => avatar(v.member, 'ava')).join('')}</span>` : ''}
  </div>`;
}

/* ---------- добавление специалиста ---------- */

function folderAdd(f) {
  const q = ui.q['f-add'] || '';
  const found = D.searchPeople(q);
  const savedPeople = S.savedPeople().map(id => D.byId.person[id]).filter(Boolean);
  const list = q.trim() ? found : savedPeople;
  return pills(`f/${f.id}`) + `
    <div class="pad" style="padding-top:52px">${searchField('f-add', 'FIND SPECIALIST')}</div>
    <div class="scroll pad">
      ${!q.trim() ? `<div class="sec-head">ИЗ СОХРАНЁНОК (${savedPeople.length})</div>` : ''}
      ${list.length ? `<div class="card-group">${list.map(p => {
        const added = S.hasCandidate(f.id, p.id);
        return personRow(p, null, added
          ? '<span class="added">ADDED</span>'
          : `<button data-act="addToFolder" data-arg="${f.id}:${p.id}" data-stop="1">${ic('plus')}</button>`);
      }).join('')}</div>` : '<div class="no-results">No specialists found</div>'}
    </div>`;
}

/* ---------- строки ---------- */

/* строка результата поиска: без номера, фото 72×80, справа пилюля «+» */
function searchRow(p) {
  return `<div class="srow" data-act="go" data-arg="person/${p.id}">
    ${photo(p, 'srow__photo')}
    <div class="srow__body">
      <div class="srow__name">${esc(p.name)}</div>
      <div class="srow__tag">[${p.dept}]</div>
    </div>
    <button class="add-pill" data-act="pick" data-arg="${p.id}" data-stop="1" aria-label="Add to folder">${ic('plus-pixel')}</button>
  </div>`;
}

/* фильм в поиске: «+» кладёт его в подборку, в проекты фильмы не добавляются */
function searchMovieRow(m) {
  return `<div class="srow" data-act="go" data-arg="movie/${m.id}">
    ${m.poster ? `<img class="srow__photo" src="assets/${m.poster}" alt="">` : '<div class="srow__photo"></div>'}
    <div class="srow__body">
      <div class="srow__name">${esc(m.title.toUpperCase())}</div>
      <div class="srow__tag">[${m.genres[0]}] · ${m.year}</div>
    </div>
    <button class="add-pill${S.isSaved('movies', m.id) ? ' is-on' : ''}" data-act="toggleSaved"
            data-arg="movies:${m.id}" data-stop="1" aria-label="Save">${ic('plus-pixel')}</button>
  </div>`;
}

function personRow(p, sub, actions) {
  const saved = S.isSaved('people', p.id);
  return `<div class="row" data-act="go" data-arg="person/${p.id}">
    ${photo(p, 'row__photo')}
    <div class="row__body">
      <div class="row__name">${esc(p.name)}</div>
      <div class="row__sub">${esc(sub || `${p.known.toUpperCase()}, ${p.year}`)}</div>
      <div class="row__tag">[${p.dept}]</div>
    </div>
    <div class="row__actions">${actions !== undefined ? actions
      : `<button data-act="toggleSaved" data-arg="people:${p.id}" data-stop="1">${saved ? ic('saves') : ic('save', 'ic ic--muted')}</button>`}</div>
  </div>`;
}

function movieRow(m, actions) {
  const saved = S.isSaved('movies', m.id);
  return `<div class="row" data-act="go" data-arg="movie/${m.id}">
    ${m.poster ? `<img class="row__photo" src="assets/${m.poster}" alt="">` : '<div class="row__photo"></div>'}
    <div class="row__body">
      <div class="row__name">${esc(m.title.toUpperCase())}</div>
      <div class="row__sub">${m.year}</div>
      <div class="row__tag">[${m.genres[0]}]</div>
    </div>
    <div class="row__actions">${actions !== undefined ? actions
      : `<button data-act="toggleSaved" data-arg="movies:${m.id}" data-stop="1">${saved ? ic('saves') : ic('save', 'ic ic--muted')}</button>`}</div>
  </div>`;
}

/* ============================ ОВЕРЛЕИ ============================ */

/* картинки грузятся с той же меткой, что скрипты и стили: заменил фото — браузер возьмёт новое */
function bust(html) {
  const v = window.FRESH || 1;
  return html.replace(/(src="assets\/[^"?]+)"/g, `$1?v=${v}"`);
}

function renderOverlay() {
  const box = $('#overlays');
  if (!ui.overlay) { box.innerHTML = ''; return; }
  const [kind, ...args] = ui.overlayArg;
  box.innerHTML = bust(`<div class="overlay is-open">
    <div class="overlay__scrim" data-act="closeOverlay"></div>
    ${OVERLAYS[kind] ? OVERLAYS[kind](...args) : ''}
  </div>`);
}

const OVERLAYS = {
  'folder-menu'(id) {
    const shared = S.isShared(S.folder(id));
    return `<div class="menu" style="right:14px;top:110px">
      ${shared ? `<button data-act="overlay" data-arg="members:${id}"><span style="width:16px;flex:none"></span>PARTICIPANTS</button>` : ''}
      <button data-act="overlay" data-arg="share:${id}">${ic('send', 'ic ic--sm')}SHARE</button>
      <button class="is-danger" data-act="deleteFolder" data-arg="${id}">${ic('trash', 'ic ic--sm ic--danger')}DELETE</button>
    </div>`;
  },

  'person-menu'(id) {
    return `<div class="menu" style="right:14px;top:70px">
      <button data-act="pick" data-arg="${id}">${ic('plus', 'ic ic--sm')}ADD TO FOLDER</button>
      <button data-act="go" data-arg="notes/${id}">${ic('note', 'ic ic--sm')}NOTES</button>
    </div>`;
  },

  'select-folder'(personId) {
    return `<div class="sheet">
      <div class="sheet__grabber"></div>
      <div class="sheet__label">SELECT FOLDER</div>
      ${S.state.folders.map(f => `
        <div class="sheet-row" data-act="pickFolder" data-arg="${f.id}">
          <span><span class="px">${esc(f.name.toUpperCase())}</span></span>
          <span class="checkbox${ui.sheetPicked.includes(f.id) ? ' is-on' : ''}"></span>
        </div>`).join('')}
      <div class="sheet-row" data-act="go" data-arg="folder-new">
        <span style="display:flex;align-items:center;gap:10px">${ic('plus')}<span class="px">NEW FOLDER</span></span>
      </div>
      <div class="sheet__footer">
        <button class="btn btn--primary${ui.sheetPicked.length ? '' : ' btn--disabled'}"
                data-act="confirmPick" data-arg="${personId}">ADD</button>
      </div>
    </div>`;
  },

  role(folderId, personId) {
    const c = S.folder(folderId).candidates.find(c => c.personId === personId);
    const p = D.byId.person[personId];
    return `<div class="sheet" style="padding-bottom:20px">
      <div class="sheet__grabber"></div>
      <div style="text-align:center">
        <div style="font-size:19px;font-weight:600;color:var(--text-primary)">${esc(titleCase(p.name))}</div>
        <div style="font-size:15px;color:var(--text-muted);margin-top:2px">Role</div>
      </div>
      <div style="margin-top:10px;max-height:290px;overflow:auto">
        ${['', ...S.state.roles].map(r => `
          <button class="role-row${c.role === r ? ' is-on' : ''}"
                  data-act="setRole" data-arg="${folderId}:${personId}:${encodeURIComponent(r)}">
            ${ic('check')}<span>${r || 'No role'}</span></button>`).join('')}
      </div>
      <div style="display:flex;gap:10px;margin-top:16px">
        <input id="role-new" type="text" placeholder="New role" class="plain-input">
        <button class="plain-btn" data-act="addRole" data-arg="${folderId}:${personId}">Add</button>
      </div>
    </div>`;
  },

  reason(folderId, personId) {
    const c = c0(S.folder(folderId), personId);
    const p = D.byId.person[personId];
    return `<div class="dialog dialog--sf">
      <h3>Reason</h3>
      <p>Why you ranked ${esc(titleCase(p.name))} like this — visible to all participants.</p>
      <textarea id="reason-text" placeholder="Add reason…">${esc((c.comments || {}).me || '')}</textarea>
      <div class="dialog__actions">
        <button class="btn btn--sf" style="background:var(--bg-subtle);color:var(--text-primary)" data-act="closeOverlay">Cancel</button>
        <button class="btn btn--sf" style="background:var(--bg-accent);color:var(--text-on-accent)"
                data-act="saveReason" data-arg="${folderId}:${personId}">Save</button>
      </div>
    </div>`;
  },

  goal(folderId) {
    const f = S.folder(folderId);
    return `<div class="dialog dialog--sf">
      <h3>Goal</h3>
      <p>Что мы ищем в этом проекте — видно всем участникам.</p>
      <textarea id="goal-text" maxlength="1000" placeholder="Set up your plan">${esc(f.goal)}</textarea>
      <div class="dialog__actions">
        <button class="btn btn--sf" style="background:var(--bg-subtle);color:var(--text-primary)" data-act="closeOverlay">Cancel</button>
        <button class="btn btn--sf" style="background:var(--bg-accent);color:var(--text-on-accent)"
                data-act="saveGoal" data-arg="${folderId}">Save</button>
      </div>
    </div>`;
  },

  members(folderId) {
    const f = S.folder(folderId);
    return `<div class="sheet">
      <div class="sheet__grabber"></div>
      <div class="sheet__label">PARTICIPANTS (${f.members.length})</div>
      ${f.members.map(m => `<div class="sheet-row">
        <span style="display:flex;align-items:center;gap:12px">
          ${avatar(m, 'ava ava--sm')}<span class="px">${esc(m.name)}</span>
          ${m.me ? '<span class="caption">это ты</span>' : ''}
        </span>
        <span class="caption">вес ${m.weight}</span>
      </div>`).join('')}
      <div class="sheet__footer">
        <button class="btn btn--primary btn--disabled" data-act="toast"
                data-arg="Приглашений в прототипе нет">INVITE</button>
      </div>
    </div>`;
  },

  'collections-pick'(kind, id) {
    const saved = S.isSaved(kind, id);
    const any = ui.sheetCols.length > 0;
    const title = kind === 'people' ? D.byId.person[id].name : D.byId.movie[id].title.toUpperCase();
    return `<div class="sheet">
      <div class="sheet__grabber"></div>
      <div class="sheet__label">SAVE TO COLLECTION</div>
      <div class="sheet__sub">${esc(title)}</div>
      ${S.state.collections.map(c => `
        <div class="sheet-row" data-act="pickCol" data-arg="${c.id}">
          <span><span class="px">${esc(c.name.toUpperCase())}</span>
            <span class="badge-pack">${c.people.length + c.movies.length}</span></span>
          <span class="checkbox${ui.sheetCols.includes(c.id) ? ' is-on' : ''}"></span>
        </div>`).join('')}
      <div class="sheet-row" data-act="newColFromSheet" data-arg="${kind}:${id}">
        <span style="display:flex;align-items:center;gap:10px">${ic('plus')}<span class="px">NEW COLLECTION</span></span>
      </div>
      <div class="sheet__footer">
        <button class="btn btn--primary${any || saved ? '' : ' btn--disabled'}"
                data-act="confirmCols" data-arg="${kind}:${id}">${any || !saved ? 'SAVE' : 'REMOVE FROM SAVED'}</button>
      </div>
    </div>`;
  },

  'collection-menu'(id) {
    return `<div class="menu" style="right:14px;top:110px">
      <button class="is-danger" data-act="deleteCollection" data-arg="${id}">${ic('trash', 'ic ic--sm ic--danger')}DELETE</button>
    </div>`;
  },

  comments(folderId, personId) {
    const f = S.folder(folderId);
    const p = D.byId.person[personId];
    const list = S.commentsOf(c0(f, personId));
    const byId = Object.fromEntries(f.members.map(m => [m.id, m]));
    return `<div class="sheet">
      <div class="sheet__grabber"></div>
      <div class="sheet__label">${esc(p.name)} · КОММЕНТАРИИ</div>
      ${list.length ? list.map(({ id, text }) => `<div class="cmt">
        <div class="cmt__who">${avatar(byId[id] || { name: '?' }, 'ava')}
          <span class="px">${esc((byId[id] || {}).name || id)}</span></div>
        <p class="cmt__text">${esc(text)}</p>
      </div>`).join('') : '<p class="caption" style="padding:16px 0">Пока никто не комментировал.</p>'}
      <div class="sheet__footer">
        <button class="btn btn--primary" data-act="overlay" data-arg="reason:${folderId}:${personId}">
          ${(c0(f, personId).comments || {}).me ? 'ИЗМЕНИТЬ СВОЙ' : 'ДОБАВИТЬ СВОЙ'}</button>
      </div>
    </div>`;
  },

  votes(folderId, personId) {
    const f = S.folder(folderId);
    const p = D.byId.person[personId];
    const { votes } = S.teamScore(f, personId);
    const missing = f.members.filter(m => !votes.some(v => v.member.id === m.id));
    return `<div class="sheet">
      <div class="sheet__grabber"></div>
      <div class="sheet__label">${esc(p.name)}</div>
      ${votes.sort((a, b) => a.pos - b.pos).map(v => `<div class="sheet-row">
        <span style="display:flex;align-items:center;gap:12px">
          ${avatar(v.member, 'ava ava--sm')}<span class="px">${esc(v.member.name)}</span></span>
        <span class="px">#${v.pos}</span>
      </div>`).join('')}
      ${missing.map(m => `<div class="sheet-row" style="opacity:.5">
        <span style="display:flex;align-items:center;gap:12px">
          ${avatar(m, 'ava ava--sm')}<span class="px">${esc(m.name)}</span></span>
        <span class="caption">не голосовал</span>
      </div>`).join('')}
    </div>`;
  },

  share(folderId) {
    const f = S.folder(folderId);
    const shared = S.isShared(f);
    return `<div class="ios-alert">
      <div class="body">
        <h3>Share &laquo;${esc(f.name)}&raquo;?</h3>
        <p>${shared
          ? 'Проект уже общий. Настоящего шеринга в прототипе нет.'
          : 'В прототипе это просто добавит в проект двух участников с их голосами, чтобы появилась вкладка Team picks.'}</p>
      </div>
      <div class="actions">
        <button data-act="closeOverlay">Cancel</button>
        <button data-act="fakeShare" data-arg="${folderId}">${shared ? 'OK' : 'Share'}</button>
      </div>
    </div>`;
  },
};

/* ============================ ДЕЙСТВИЯ ============================ */

const ACTIONS = {
  noop: () => {},   // ручка перетаскивания: по тапу не должна открывать карточку
  go: a => { closeOverlay(); a === 'back' ? history.back() : go(a); },
  toast: a => showToast(a),
  closeOverlay,
  overlay: a => { ui.overlayArg = a.split(':'); ui.overlay = true; renderOverlay(); },
  clearQ: a => { ui.q[a] = ''; ui.searchAll = false; render(); $(`[data-q="${a}"]`)?.focus(); },
  searchAll: () => { ui.searchAll = !ui.searchAll; render(); },

  addTag: () => {
    ui.newName = $('#folder-name').value;
    const v = $('#folder-tag').value.trim().toUpperCase();
    if (v && !ui.newTags.includes(v)) ui.newTags.push(v);
    render();
  },
  dropTag: a => { ui.newName = $('#folder-name').value; ui.newTags.splice(+a, 1); render(); },
  createFolder: () => {
    const name = $('#folder-name').value.trim();
    if (!name) { showToast('Введи название проекта'); return; }
    const f = S.createFolder(name, ui.newTags);
    ui.newName = ''; ui.newTags = [];
    go('f/' + f.id);
  },
  deleteFolder: a => { closeOverlay(); S.deleteFolder(a); showToast('Проект удалён'); go('folders'); },

  addToFolder: a => {
    const [fid, pid] = a.split(':');
    S.addCandidate(fid, pid);
    showToast(`${D.byId.person[pid].name} → ${S.folder(fid).name}`);
  },
  pick: a => {
    if (!S.state.folders.length) { showToast('Сначала создай проект'); go('folder-new'); return; }
    ui.sheetPicked = [];
    ui.overlayArg = ['select-folder', a]; ui.overlay = true; renderOverlay();
  },
  pickFolder: a => {
    const i = ui.sheetPicked.indexOf(a);
    if (i === -1) ui.sheetPicked.push(a); else ui.sheetPicked.splice(i, 1);
    renderOverlay();
  },
  confirmPick: a => {
    if (!ui.sheetPicked.length) return;
    ui.sheetPicked.forEach(fid => S.addCandidate(fid, a));
    const names = ui.sheetPicked.map(fid => S.folder(fid).name).join(', ');
    closeOverlay();
    showToast(`Добавлено в «${names}»`);
  },

  setRole: a => {
    const [fid, pid, role] = a.split(':');
    S.setCandidate(fid, pid, { role: decodeURIComponent(role) });
    closeOverlay();
  },
  addRole: a => {
    const v = $('#role-new').value;
    if (!v.trim()) return;
    ACTIONS.setRole(a + ':' + encodeURIComponent(S.addRole(v)));
  },
  saveReason: a => {
    const [fid, pid] = a.split(':');
    S.setComment(fid, pid, 'me', $('#reason-text').value.trim());
    closeOverlay();
  },
  saveGoal: a => { S.updateFolder(a, { goal: $('#goal-text').value.trim() }); closeOverlay(); },

  togglePicking: a => {
    const f = S.folder(a);
    S.updateFolder(a, { closed: !f.closed });
    showToast(f.closed ? 'Открыт заново' : 'Закрыт — только чтение');
  },

  /* шеринга по-настоящему нет: добавляем участников с голосами,
     чтобы можно было посмотреть, как появляется Team picks */
  fakeShare: a => {
    const f = S.folder(a);
    closeOverlay();
    if (S.isShared(f)) return;
    f.members.push({ id: 'alex', name: 'ALEX', weight: 2, photo: 'u-alex.jpg' });
    f.members.push({ id: 'polina', name: 'POLINA', weight: 1, photo: 'u-polina.jpg' });
    const ids = S.myPicks(f).map(c => c.personId);
    f.ranks.alex = [...ids].reverse();
    f.ranks.polina = ids.slice(0, Math.max(1, ids.length - 1));
    S.commit();
    showToast('Теперь в проекте три участника');
  },

  /* закладка не сохраняет сразу, а спрашивает, в какую подборку */
  toggleSaved: a => {
    const [kind, id] = a.split(':');
    if (!S.state.collections.length) {
      ui.pendingSave = { kind, id };
      showToast('Сначала создай подборку');
      go('collection-new');
      return;
    }
    ui.sheetCols = S.collectionsOf(kind, id);
    ui.overlayArg = ['collections-pick', kind, id]; ui.overlay = true; renderOverlay();
  },
  pickCol: a => {
    const i = ui.sheetCols.indexOf(a);
    if (i === -1) ui.sheetCols.push(a); else ui.sheetCols.splice(i, 1);
    renderOverlay();
  },
  confirmCols: a => {
    const [kind, id] = a.split(':');
    const was = S.isSaved(kind, id);
    if (!ui.sheetCols.length && !was) { showToast('Выбери подборку'); return; }
    S.setCollections(kind, id, ui.sheetCols);
    closeOverlay();
    showToast(ui.sheetCols.length ? 'Сохранено' : 'Убрали из сохранёнок');
  },
  newColFromSheet: a => {
    const [kind, id] = a.split(':');
    ui.pendingSave = { kind, id };
    closeOverlay();
    go('collection-new');
  },
  createCollection: () => {
    const name = $('#col-name').value.trim();
    if (!name) { showToast('Введи название подборки'); return; }
    const c = S.createCollection(name);
    ui.newColName = '';
    if (ui.pendingSave) {
      const { kind, id } = ui.pendingSave;
      ui.pendingSave = null;
      S.setCollections(kind, id, [...S.collectionsOf(kind, id), c.id]);
      showToast(`Сохранено в «${c.name}»`);
      history.back();
      return;
    }
    go('col/' + c.id);
  },
  uncollect: a => {
    const [cid, kind, id] = a.split(':');
    S.removeFromCollection(cid, kind, id);
    showToast('Убрали из подборки');
  },
  deleteCollection: a => { closeOverlay(); S.deleteCollection(a); showToast('Подборка удалена'); go('saved'); },

  saveNote: a => {
    const [pid, nid] = a.split(':');
    const text = $('#note-text').value.trim();
    if (!text) { showToast('Заметка пустая'); return; }
    S.saveNote(pid, nid, text);
    go('notes/' + pid);
  },
  deleteNote: a => { const [pid, nid] = a.split(':'); S.deleteNote(pid, nid); },

  resetDemo: () => { S.reset(); go('folders'); showToast('Демо-данные восстановлены'); },
};

/* ============================ СЛУЖЕБНОЕ ============================ */

function c0(f, personId) { return f.candidates.find(c => c.personId === personId); }

function titleCase(s) { return s.toLowerCase().replace(/(^|[\s-])\S/g, c => c.toUpperCase()); }

let toastTimer;
function showToast(text) {
  const t = $('#toast');
  t.textContent = text;
  t.classList.add('is-open');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-open'), 2200);
}

function closeOverlay() { ui.overlay = null; renderOverlay(); }

/* ============================ РЕНДЕР ============================ */

function render() {
  const r = route();
  let html;
  if (r.name === 'f') html = SCREENS.f(r.a, r.b);
  else if (r.name === 'person') html = SCREENS.person(r.a);
  else if (r.name === 'movie') html = SCREENS.movie(r.a, r.b);
  else if (r.name === 'col') html = SCREENS.col(r.a, r.b);
  else if (r.name === 'notes') html = SCREENS.notes(r.a);
  else if (r.name === 'note') html = SCREENS.note(r.a, r.b);
  else if (SCREENS[r.name]) html = SCREENS[r.name]();
  else html = SCREENS.folders();

  $('#app').innerHTML = bust(`<section class="screen is-active">${html}</section>`);
  // на синей шапке статус-бар светлый
  $('.phone').classList.toggle('on-accent', !!$('#app .phead, #app .person-hero'));
  fitInputs();
  if (r.name === 'search' && ui.lastRoute !== location.hash) $('.sf__input')?.focus();
  ui.lastRoute = location.hash;
  $('#clock').textContent = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
}

/* ---------- поле поиска ----------
   Блочный курсор из макета — отдельный элемент, а настоящий скрыт. Чтобы он
   стоял вплотную к тексту, ширину поля подгоняем под набранное. */
function fitInput(input) {
  const sf = input.closest('.sf');
  if (!sf) return;
  if (!input.value) { input.style.width = ''; sf.classList.add('is-empty'); return; }
  sf.classList.remove('is-empty');
  const m = document.createElement('span');
  m.className = 'sf__measure';
  m.textContent = input.value;
  sf.append(m);
  input.style.width = Math.ceil(m.getBoundingClientRect().width) + 2 + 'px';
  m.remove();
}
function fitInputs() { $$('.sf__input').forEach(fitInput); }
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitInputs);

/* ---------- события ---------- */

document.addEventListener('click', e => {
  if (suppressClick) { e.preventDefault(); e.stopPropagation(); return; }
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const stop = e.target.closest('[data-stop]');
  const target = stop && btn.contains(stop) && stop !== btn ? stop.closest('[data-act]') : btn;
  const fn = ACTIONS[target.dataset.act];
  if (!fn) return;
  e.preventDefault();
  e.stopPropagation();
  fn(target.dataset.arg);
});

document.addEventListener('input', e => {
  const q = e.target.dataset.q;
  if (q === undefined) return;
  ui.q[q] = e.target.value;
  if (q === 'search') ui.searchAll = false;
  const pos = e.target.selectionStart;
  render();
  const again = $(`[data-q="${q}"]`);
  if (again) { again.focus(); again.setSelectionRange(pos, pos); }
});

/* ---------- перетаскивание в my picks ----------
   Не HTML5 drag-and-drop: он даёт рывки и системный «призрак».
   Здесь жест на pointer events, строка поднимается и едет за пальцем,
   соседи расступаются FLIP-анимацией. */

const LIFT = 'cubic-bezier(.2, 0, 0, 1)';
let drag = null;

/* строки живут в карточках по департаментам, поэтому собираем их по всему полотну */
function rowsOf(list) { return [...list.querySelectorAll('.cand')]; }

/* снимаем положения всех строк до перестановки */
function snapshot(rows) {
  const m = new Map();
  rows.forEach(r => m.set(r, r.getBoundingClientRect().top));
  return m;
}

/* после перестановки сдвигаем строки обратно и отпускаем — они доезжают сами */
function flip(rows, before, skip) {
  rows.forEach(r => {
    if (r === skip) return;
    const was = before.get(r);
    if (was === undefined) return;
    const now = r.getBoundingClientRect().top;
    const dy = was - now;
    if (!dy) return;
    r.style.transition = 'none';
    r.style.transform = `translateY(${dy}px)`;
    requestAnimationFrame(() => {
      r.style.transition = `transform .24s ${LIFT}`;
      r.style.transform = '';
    });
  });
}

/* номера #1, #2 внутри департамента — пересчитываем на месте,
   чтобы они менялись сразу, пока строка едет, и не ждать отпускания */
function renumber(list) {
  const seen = {};
  rowsOf(list).forEach(r => {
    const d = deptAbove(r);
    seen[d] = (seen[d] || 0) + 1;
    setRoll(r.querySelector('.roll'), seen[d]);
  });
}

function deptAbove(el) {
  const card = el.closest('.card-group') || el;
  for (let n = card.previousElementSibling; n; n = n.previousElementSibling) {
    if (n.classList.contains('dept-row')) return n.textContent.replace('#', '').trim();
  }
  return null;
}

document.addEventListener('pointerdown', e => {
  const handle = e.target.closest('.cand__drag');
  if (!handle || e.button) return;
  const el = handle.closest('.cand');
  const list = el.closest('.scroll');
  e.preventDefault();
  handle.setPointerCapture(e.pointerId);

  drag = { el, list, handle, startY: e.clientY, dy: 0, moved: false, pointerId: e.pointerId };
  el.classList.add('is-lifting');
  el.style.transition = `transform .18s ${LIFT}`;
  el.style.transform = 'scale(1.03)';
});

document.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.pointerId) return;
  drag.dy = e.clientY - drag.startY;
  if (!drag.moved && Math.abs(drag.dy) < 3) return;
  if (!drag.moved) {
    drag.moved = true;
    drag.el.style.transition = 'none';
  }
  drag.el.style.transform = `translateY(${drag.dy}px) scale(1.03)`;

  /* ищем соседа, через середину которого мы перешли */
  const rect = drag.el.getBoundingClientRect();
  const mid = rect.top + rect.height / 2;
  const others = rowsOf(drag.list).filter(r => r !== drag.el);
  const target = others.find(r => {
    const b = r.getBoundingClientRect();
    const c = b.top + b.height / 2;
    const after = r.compareDocumentPosition(drag.el) & Node.DOCUMENT_POSITION_PRECEDING;
    return after ? mid > c : mid < c;
  });
  if (!target) return;

  const rows = rowsOf(drag.list);
  const before = snapshot(rows);
  const movingDown = target.compareDocumentPosition(drag.el) & Node.DOCUMENT_POSITION_PRECEDING;
  const topWas = drag.el.getBoundingClientRect().top;
  // вставляем внутрь карточки цели — так строка меняет департамент
  target.parentElement.insertBefore(drag.el, movingDown ? target.nextElementSibling : target);
  /* строка переехала в DOM — компенсируем, чтобы она не прыгнула из-под курсора */
  drag.el.style.transition = 'none';
  drag.el.style.transform = `translateY(${drag.dy}px) scale(1.03)`;
  const topNow = drag.el.getBoundingClientRect().top;
  drag.startY += topNow - topWas;
  drag.dy = e.clientY - drag.startY;
  drag.el.style.transform = `translateY(${drag.dy}px) scale(1.03)`;
  flip(rows, before, drag.el);
  renumber(drag.list);
});

document.addEventListener('pointerup', e => {
  if (!drag || e.pointerId !== drag.pointerId) return;
  const { el, list, moved } = drag;
  drag = null;

  el.style.transition = `transform .22s ${LIFT}`;
  el.style.transform = '';
  el.classList.remove('is-lifting');

  if (!moved) return;
  suppressClick = true;
  setTimeout(() => (suppressClick = false), 60);

  // опустевшая карточка и её заголовок уходят
  $$('.card-group', list).forEach(card => {
    if (!card.querySelector('.cand')) {
      const head = card.previousElementSibling;
      if (head && head.classList.contains('dept-row')) head.remove();
      card.remove();
    }
  });

  const fid = route().a;
  S.setMyPicks(fid, rowsOf(list).map(r => ({ personId: r.dataset.cand, dept: deptAbove(r) })));
  renumber(list);
});

/* ---------- сжатие шапки при прокрутке ----------
   scroll не всплывает, поэтому слушаем на фазе перехвата. */
const HEAD_RANGE = 140;
document.addEventListener('scroll', e => {
  const sc = e.target;
  if (!sc.classList || !sc.classList.contains('scroll')) return;
  const head = sc.parentElement.querySelector('.phead');
  if (!head) return;
  const p = Math.min(1, Math.max(0, sc.scrollTop / HEAD_RANGE));
  head.style.setProperty('--p', p.toFixed(3));
}, true);

document.addEventListener('click', e => {
  const sf = e.target.closest('.sf');
  if (sf && !e.target.closest('.sf__clear')) sf.querySelector('input')?.focus();
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOverlay(); });

S.onChange(render);
window.addEventListener('hashchange', () => { closeOverlay(); render(); });
render();
