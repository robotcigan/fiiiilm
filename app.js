/* FIIILM — навигация прототипа.
   data-go="screenId"   — перейти на экран
   data-open="overlayId"— открыть шит / меню / диалог
   data-close           — закрыть текущий оверлей
   data-toast="текст"   — показать тост */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function showScreen(id) {
  const next = document.getElementById(id);
  if (!next || !next.classList.contains('screen')) return;
  $$('.screen').forEach(s => s.classList.remove('is-active'));
  next.classList.add('is-active');
  $$('.scroll', next).forEach(el => (el.scrollTop = 0));
  $('#clock').textContent = next.dataset.time || '10:24';
  $$('.nav a').forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
  if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
}

function closeOverlays() {
  $$('.overlay').forEach(o => o.classList.remove('is-open'));
}

function openOverlay(id) {
  closeOverlays();
  document.getElementById(id)?.classList.add('is-open');
}

let toastTimer;
function showToast(text) {
  const t = $('#toast');
  t.textContent = text;
  t.classList.add('is-open');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-open'), 2200);
}

document.addEventListener('click', e => {
  const closer = e.target.closest('[data-close]');
  const opener = e.target.closest('[data-open]');
  const goer   = e.target.closest('[data-go]');
  const toast  = e.target.closest('[data-toast]');

  if (closer) closeOverlays();
  if (toast)  showToast(toast.dataset.toast);
  if (opener) { e.preventDefault(); openOverlay(opener.dataset.open); return; }
  if (goer)   { e.preventDefault(); closeOverlays(); showScreen(goer.dataset.go); return; }

  const link = e.target.closest('.nav a[href^="#"]');
  if (link && link.getAttribute('href').length > 1) {
    e.preventDefault();
    closeOverlays();
    showScreen(link.getAttribute('href').slice(1));
  }
});

/* чипы-фильтры переключаются — экранов фильтра в скриншотах нет,
   но для проработки состояний переключение полезно */
document.addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (chip && !chip.closest('[data-go],[data-open],[data-toast],#var-pick')) chip.classList.toggle('is-on');
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeOverlays();
});

window.addEventListener('hashchange', () => {
  closeOverlays();
  showScreen(location.hash.slice(1) || 'entry');
});

showScreen(location.hash.slice(1) || 'entry');

/* ============ живые поля ввода ============
   В скриншотах поля статичные. Чтобы по прототипу можно было щёлкать
   по-настоящему, они заменены на <input>, а списки фильтруются по вводу. */

function rowText(el) {
  return (el.innerText || '').toUpperCase();
}

function applyFilter(input) {
  const sel = input.dataset.filter;
  if (!sel) return;
  // запрос со скриншота («Oddyssey») — не подстрока имён, поиск в приложении нечёткий.
  // Пока в поле стоит исходный запрос, список показываем целиком, как на скриншоте.
  const baseline = input.value.trim().toUpperCase() === input.dataset.initial.trim().toUpperCase();
  const q = baseline ? '' : input.value.trim().toUpperCase();
  $$(sel).forEach(r => (r.dataset.hitSearch = q === '' || rowText(r).includes(q) ? '1' : '0'));
  refreshList(input.closest('.screen'));
}

/* поиск и чипы-фильтры прячут строки независимо — здесь они сводятся вместе */
function refreshList(screen) {
  if (!screen) return;
  const rows = $$('.row, .cand-row', screen);
  const filtered = $$('.chip.is-on', screen).length > 0;
  const searching = rows.some(r => r.dataset.hitSearch === '0');
  rows.forEach(r => r.classList.toggle('is-hidden',
    r.dataset.hitSearch === '0' || r.dataset.hitChip === '0'));
  screen.classList.toggle('is-filtered', filtered);

  $$('.section-head, .dept-head', screen).forEach(head => {
    let n = 0;
    for (let el = head.nextElementSibling; el; el = el.nextElementSibling) {
      if (el.classList.contains('section-head') || el.classList.contains('dept-head')) break;
      if ((el.classList.contains('row') || el.classList.contains('cand-row')) && !el.classList.contains('is-hidden')) n++;
    }
    head.classList.toggle('is-hidden', n === 0 && (filtered || searching));
    const counter = $('.h2', head);
    if (counter) {
      // в скриншоте счётчик показывает весь бэкенд (1219), а не строки на экране —
      // возвращаем исходное число, когда фильтров нет
      if (counter.dataset.total === undefined) {
        counter.dataset.total = (counter.textContent.match(/\((\d+)\)/) || [, ''])[1];
      }
      const shown = (filtered || searching) ? n : counter.dataset.total;
      counter.textContent = counter.textContent.replace(/\(\d+\)/, `(${shown})`);
    }
  });

  const list = rows[0] ? rows[0].parentElement : null;
  if (list) {
    let msg = $('.no-results', list);
    const nothing = rows.length > 0 && rows.every(r => r.classList.contains('is-hidden'));
    if (nothing && !msg) {
      msg = document.createElement('div');
      msg.className = 'no-results';
      msg.textContent = 'Ничего не найдено';
      list.append(msg);
    }
    if (msg) msg.style.display = nothing ? '' : 'none';
  }
}

/* запрос с пустого экрана поиска уводит на тот экран результатов,
   который снят на скриншотах */
function runSearch(input) {
  const q = input.value.trim().toLowerCase();
  if (!q) return;
  const dest = /nol/.test(q) ? 'search-nolan' : /od[dy]/.test(q) ? 'search-odyssey' : null;
  if (!dest) { showToast('Результатов для этого запроса в скриншотах нет'); return; }
  showScreen(dest);
  const target = $(`#${dest} .search-field__input`);
  target.value = input.value;
  applyFilter(target);
}

document.addEventListener('input', e => {
  const input = e.target.closest('.search-field__input');
  if (input) applyFilter(input);
});

document.addEventListener('keydown', e => {
  const input = e.target.closest('.search-field__input');
  if (!input || e.key !== 'Enter') return;
  e.preventDefault();
  if (input.dataset.search === 'entry' || input.dataset.search === 'focus') runSearch(input);
  else input.blur();
});

document.addEventListener('click', e => {
  const clear = e.target.closest('[data-clear]');
  if (!clear) return;
  const input = $('.search-field__input', clear.parentElement);
  input.value = '';
  applyFilter(input);
  input.focus();
});

/* поле на стартовом экране ведёт на экран с клавиатурой */
$('[data-search="entry"]')?.addEventListener('focus', () => {
  const from = $('[data-search="entry"]').value;
  showScreen('search-focus');
  const to = $('[data-search="focus"]');
  to.value = from;
  to.focus();
});

/* ============ экранная клавиатура ============ */
const KB_SPECIAL = { '⌫': 'back', '⇧': null, '123': null, '☺': null, '🌐': null, '🎤': null };

document.addEventListener('mousedown', e => {
  const key = e.target.closest('.kb-key');
  if (!key) return;
  const input = document.activeElement;
  if (!input || !/^(INPUT|TEXTAREA)$/.test(input.tagName)) return;
  e.preventDefault(); // не терять фокус поля
  const label = key.textContent.trim();
  if (label === '⌫') input.value = input.value.slice(0, -1);
  else if (/^(space|Пробел)$/i.test(label)) input.value += ' ';
  else if (label === 'return' && input.tagName === 'TEXTAREA') input.value += '\n';
  else if (/^(done|return|Найти|go)$/i.test(label)) {
    if (input.dataset.search === 'entry' || input.dataset.search === 'focus') runSearch(input);
    else input.blur();
    return;
  }
  else if (label in KB_SPECIAL) return;
  else if (label.length === 1) input.value += label;
  else return;
  applyFilter(input);
});

/* ============ папки ============ */
const folderTags = ['ACTION'];

function renderFolderTags() {
  const box = $('#folder-tags');
  if (!box) return;
  box.innerHTML = folderTags
    .map((t, i) => `<span class="chip chip--outline chip--removable" data-tag="${i}">${t} ×</span>`)
    .join('');
}

$('#folder-tag-add')?.addEventListener('click', () => {
  const input = $('#folder-tag');
  const v = input.value.trim().toUpperCase();
  if (!v) return;
  if (!folderTags.includes(v)) folderTags.push(v);
  input.value = '';
  renderFolderTags();
});

$('#folder-tags')?.addEventListener('click', e => {
  const chip = e.target.closest('[data-tag]');
  if (!chip) return;
  folderTags.splice(+chip.dataset.tag, 1);
  renderFolderTags();
});

let folderSeq = 0;

function createFolder(name, tags) {
  const id = 'roster-new-' + (++folderSeq);

  const screen = $('#roster').cloneNode(true);
  screen.id = id;
  screen.classList.remove('is-active');
  $('.title', screen).textContent = name;
  $('.caption', screen).textContent = tags.map(t => `[${t}]`).join(' ');
  const scroll = $('.scroll', screen);
  scroll.classList.remove('pad');
  scroll.style.display = 'flex';
  scroll.innerHTML =
    '<div class="empty"><p class="display">NOBODY HERE<br>YET</p></div>';
  $('#roster').after(screen);

  const row = document.createElement('div');
  row.className = 'folder-row';
  row.dataset.go = id;
  row.innerHTML = `<div><span class="title">${name}</span>` +
    (tags.length
      ? `<div class="meta">${tags.map(t => `<span class="caption" style="color:var(--text-primary)">[${t}]</span>`).join('')}</div>`
      : '') +
    `</div><button data-open="ov-row-menu"><svg class="ic"><use href="#i-more"/></svg></button>`;
  $('#folders .scroll').prepend(row);

  // пункт в сайдбаре прототипа, чтобы экран не терялся
  const link = document.createElement('a');
  link.href = '#' + id;
  link.textContent = 'Папка ' + name;
  $('.nav a[href="#roster-bjjkkk"]').after(link);

  return id;
}

$('#new-folder .btn--primary')?.addEventListener('click', () => {
  const name = $('#folder-name').value.trim();
  if (!name) { showToast('Введи название папки'); return; }
  const id = createFolder(name, folderTags.slice());
  showScreen(id);
  $('#folder-name').value = '';
  folderTags.length = 0;
  renderFolderTags();
});

/* удаление папки из меню строки */
let menuRow = null;
document.addEventListener('click', e => {
  const opener = e.target.closest('[data-open="ov-row-menu"]');
  if (opener) menuRow = opener.closest('.folder-row');
}, true);

$$('#ov-row-menu .is-danger').forEach(btn => btn.addEventListener('click', () => {
  if (!menuRow) { showToast('Удаление доступно в списке папок'); return; }
  const id = menuRow.dataset.go;
  menuRow.remove();
  $(`.nav a[href="#${id}"]`)?.remove();
  menuRow = null;
  showToast('Папка удалена');
  showScreen('folders');
}));

renderFolderTags();

/* ============ заметки ============ */
let editingNote = null;

document.addEventListener('click', e => {
  const item = e.target.closest('.note-item');
  if (item && !e.target.closest('button')) {
    editingNote = item;
    $('#note-text').value = $('.text', item).textContent;
    return;
  }
  if (e.target.closest('#notes .footer-bar [data-go="note-editor"]')) {
    editingNote = null;
    $('#note-text').value = '';
  }
}, true);

$('#note-editor .navbar button:last-child')?.addEventListener('click', () => {
  const text = $('#note-text').value.trim();
  if (!text) { showToast('Заметка пустая'); return; }
  const time = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  if (editingNote) {
    $('.text', editingNote).textContent = text;
    $('.time', editingNote).textContent = time;
  } else {
    const item = document.createElement('div');
    item.className = 'note-item';
    item.innerHTML = `<div class="bar"></div><div class="body">` +
      `<div class="text"></div><div class="time">${time}</div></div>` +
      `<button data-open="ov-fav-menu"><svg class="ic ic--sm ic--muted"><use href="#i-more"/></svg></button>`;
    $('.text', item).textContent = text;
    $('#notes .scroll').prepend(item);
  }
  editingNote = null;
  showToast('Заметка сохранена');
});

/* ============ комментарий к кандидату (диалог Reason) ============ */
let reasonRow = null;

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-open="ov-reason"]');
  if (!btn) return;
  reasonRow = btn.closest('.cand-row');
  const saved = reasonRow?.dataset.reason || '';
  $('#reason-text').value = saved;
  const who = $('.row__name', reasonRow);
  if (who) $('#ov-reason p').textContent =
    `Why you ranked ${who.textContent} like this — visible to all participants.`;
}, true);

$('#reason-save')?.addEventListener('click', () => {
  const text = $('#reason-text').value.trim();
  closeOverlays();
  if (!reasonRow) return;
  reasonRow.dataset.reason = text;
  const btn = $('.cand-row__comment', reasonRow);
  btn.lastChild.textContent = text || 'ADD COMMENT';
  btn.style.color = text ? 'var(--text-primary)' : '';
  reasonRow = null;
});

/* ============ шит SELECT FOLDER ============ */
let sheetSource = null;

function renderSheetFolders() {
  const sheet = $('#ov-select-folder .sheet');
  const newRow = $('[data-go="new-folder"]', sheet);
  $$('.sheet-row', sheet).forEach(r => { if (r !== newRow) r.remove(); });
  $$('#folders .folder-row').forEach(f => {
    const row = document.createElement('div');
    row.className = 'sheet-row';
    row.dataset.folder = f.dataset.go;
    const pack = $('.meta .caption:last-child', f);
    row.innerHTML = `<span><span class="px">${$('.title', f).textContent.toUpperCase()}</span>` +
      (pack && pack.textContent === 'PACKAGING' ? ' <span class="badge-pack">Packaging</span>' : '') +
      `</span><span class="checkbox"></span>`;
    newRow.before(row);
  });
}

document.addEventListener('click', e => {
  const opener = e.target.closest('[data-open="ov-select-folder"]');
  if (opener) { sheetSource = opener.closest('.row'); renderSheetFolders(); }
}, true);

$('#ov-select-folder')?.addEventListener('click', e => {
  const row = e.target.closest('[data-folder]');
  if (!row) return;
  $('.checkbox', row).classList.toggle('is-on');
  const any = $$('#ov-select-folder .checkbox.is-on').length > 0;
  $('#sheet-add').classList.toggle('btn--disabled', !any);
});

function addToFolder(screenId, source) {
  const scroll = $(`#${screenId} .scroll`);
  if ($('.empty', scroll)) { scroll.innerHTML = ''; scroll.classList.add('pad'); scroll.style.display = ''; }
  const tag = ($('.row__tag', source)?.textContent || '[ACTING]').replace(/[\[\]]/g, '');
  let head = $$('.dept-head', scroll).find(h => h.textContent === tag);
  if (!head) {
    head = document.createElement('div');
    head.className = 'dept-head';
    head.textContent = tag;
    scroll.append(head);
  }
  const photo = $('.row__photo', source).cloneNode(true);
  const row = document.createElement('div');
  row.className = 'row';
  row.style.alignItems = 'center';
  row.dataset.go = source.dataset.go || 'person-damon';
  row.append(photo);
  const body = document.createElement('div');
  body.className = 'row__body';
  body.innerHTML = `<div class="row__name"></div><div class="row__tag" style="margin-top:8px">[${tag}]</div>`;
  $('.row__name', body).textContent = $('.row__name', source).textContent;
  row.append(body);
  const actions = document.createElement('div');
  actions.className = 'row__actions row__actions--stack';
  actions.innerHTML = `<button data-open="ov-row-menu"><svg class="ic ic--muted"><use href="#i-more"/></svg></button>` +
    `<button data-open="ov-role"><svg class="ic ic--muted"><use href="#i-tag"/></svg></button>`;
  row.append(actions);
  head.after(row);
}

$('#sheet-add')?.addEventListener('click', () => {
  const picked = $$('#ov-select-folder [data-folder]').filter(r => $('.checkbox', r).classList.contains('is-on'));
  if (!picked.length || !sheetSource) { closeOverlays(); return; }
  picked.forEach(r => addToFolder(r.dataset.folder, sheetSource));
  picked.forEach(r => $('.checkbox', r).classList.remove('is-on'));
  $('#sheet-add').classList.add('btn--disabled');
  closeOverlays();
  showToast(picked.length === 1
    ? `Добавлено в «${$('.px', picked[0]).textContent}»`
    : `Добавлено в ${picked.length} папки`);
  sheetSource = null;
});

/* ============ роли ============ */
const ROLES = ['DIRECTOR', 'FIRST ASSISTANT DIRECTOR', 'PRODUCER', 'DOP', 'LEAD', 'SUPPORTING'];
let roleRow = null;

function roleOf(row) { return row.dataset.role || ''; }

function setRole(row, role) {
  row.dataset.role = role;
  const name = $('.row__name', row);
  let label = $('.row__role', row);
  if (!role) { label?.remove(); return; }
  if (!label) {
    label = document.createElement('span');
    label.className = 'row__role';
    name.after(label);
  }
  label.textContent = role;
}

function renderRoleList() {
  const box = $('#role-list');
  const current = roleRow ? roleOf(roleRow) : '';
  box.innerHTML = ['', ...ROLES].map(r => `
    <button class="role-row${r === current ? ' is-on' : ''}" data-role="${r}">
      <svg class="ic"><use href="#i-check"/></svg>
      <span>${r || 'No role'}</span>
    </button>`).join('');
}

document.addEventListener('click', e => {
  const opener = e.target.closest('[data-open="ov-role"]');
  if (!opener) return;
  roleRow = opener.closest('.row, .cand-row');
  $('#role-who').textContent = $('.row__name', roleRow)?.textContent || '';
  renderRoleList();
}, true);

$('#role-list')?.addEventListener('click', e => {
  const btn = e.target.closest('[data-role]');
  if (!btn || !roleRow) return;
  setRole(roleRow, btn.dataset.role);
  closeOverlays();
  showToast(btn.dataset.role ? `Роль: ${btn.dataset.role}` : 'Роль снята');
});

$('#role-add')?.addEventListener('click', () => {
  const input = $('#role-new');
  const v = input.value.trim().toUpperCase();
  if (!v) return;
  if (!ROLES.includes(v)) ROLES.push(v);
  input.value = '';
  if (roleRow) setRole(roleRow, v);
  renderRoleList();
});

/* ============ сортировка списка ============ */
let rowSeq = 0;
function stamp(row) { if (!row.dataset.seq) row.dataset.seq = ++rowSeq; return +row.dataset.seq; }

/* группа = заголовок департамента и идущие за ним строки */
function groupsOf(list) {
  const groups = [];
  let cur = null;
  [...list.children].forEach(el => {
    if (el.classList.contains('dept-head')) { cur = { head: el, rows: [] }; groups.push(cur); }
    else if (cur && (el.classList.contains('row') || el.classList.contains('cand-row'))) cur.rows.push(el);
  });
  return groups;
}

const SORTS = {
  'role-az':    (a, b) => a.head.textContent.localeCompare(b.head.textContent),
  'role-za':    (a, b) => b.head.textContent.localeCompare(a.head.textContent),
  'count-desc': (a, b) => b.rows.length - a.rows.length,
  'count-asc':  (a, b) => a.rows.length - b.rows.length,
  'recent':     (a, b) => Math.max(...b.rows.map(stamp), 0) - Math.max(...a.rows.map(stamp), 0),
};

$$('#ov-sort-menu [data-sort]').forEach(btn => btn.addEventListener('click', () => {
  const list = $('.screen.is-active .scroll');
  if (!list) return;
  const groups = groupsOf(list);
  if (!groups.length) { showToast('Здесь нечего сортировать'); return; }
  groups.forEach(g => g.rows.forEach(stamp));
  groups.sort(SORTS[btn.dataset.sort]);
  groups.forEach(g => { list.append(g.head); g.rows.forEach(r => list.append(r)); });
  $$('#ov-sort-menu [data-sort]').forEach(b => b.classList.toggle('is-on', b === btn));
  showToast('Отсортировано: ' + btn.textContent);
}));

/* ============ чипы-фильтры ============ */
function tagsOf(row) {
  const head = (function () {
    for (let el = row.previousElementSibling; el; el = el.previousElementSibling)
      if (el.classList.contains('dept-head')) return el.textContent;
    return '';
  })();
  return [$('.row__tag', row)?.textContent || '', roleOf(row), head]
    .join(' ').replace(/[\[\]]/g, '').toUpperCase();
}

function applyChips(screen) {
  const on = $$('.chip.is-on', screen).map(c => c.textContent.replace(/[\[\]]/g, '').trim().toUpperCase());
  $$('.row, .cand-row', screen).forEach(r =>
    (r.dataset.hitChip = on.length === 0 || on.some(t => tagsOf(r).includes(t)) ? '1' : '0'));
  refreshList(screen);
}

document.addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip || chip.closest('[data-go],[data-open],[data-toast],#folder-tags,#var-pick')) return;
  applyChips(chip.closest('.screen'));
});

/* ============ паккейджинг ============ */

/* START PACKAGING: флажки и перенос ростера */
$$('#ov-start-packaging .dialog__opt').forEach(opt =>
  opt.addEventListener('click', () => $('.checkbox', opt).classList.toggle('is-on')));

$('#pack-start')?.addEventListener('click', () => {
  const importRoster = $('#ov-start-packaging .dialog__opt .checkbox').classList.contains('is-on');
  const list = $('#packaging-list .scroll');
  closeOverlays();
  if (importRoster) {
    // переносим ростер той папки, из которой запустили: цвета и роли сохраняются
    $$('.dept-head, .cand-row', list).forEach(el => el.remove());
    groupsOf($('#roster .scroll')).forEach(g => {
      const head = document.createElement('div');
      head.className = 'dept-head';
      head.textContent = g.head.textContent;
      list.append(head);
      g.rows.forEach(src => list.append(candidateFrom(src)));
    });
  }
  showScreen('packaging-list');
  showToast(importRoster ? 'Ростер перенесён в паккейджинг' : 'Паккейджинг запущен');
});

function candidateFrom(source) {
  const row = document.createElement('div');
  row.className = 'cand-row';
  row.dataset.go = source.dataset.go || 'person-damon';
  const photo = $('.row__photo', source).cloneNode(true);
  photo.classList.add('row__photo--xs');
  row.append(photo);
  const body = document.createElement('div');
  body.className = 'cand-row__body';
  body.innerHTML = '<div class="row__name"></div>' +
    '<button class="cand-row__comment" data-open="ov-reason">' +
    '<svg class="ic ic--sm ic--muted"><use href="#i-pencil"/></svg>ADD COMMENT</button>';
  $('.row__name', body).textContent = $('.row__name', source).textContent;
  row.append(body);
  row.insertAdjacentHTML('beforeend',
    '<button data-open="ov-role"><svg class="ic ic--muted"><use href="#i-tag"/></svg></button>' +
    '<button class="drag-handle" draggable="true"><svg class="ic ic--muted"><use href="#i-drag"/></svg></button>');
  if (roleOf(source)) setRole(row, roleOf(source));
  return row;
}

/* цель */
function autoGrow(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
const goal = $('#goal-text');
goal?.addEventListener('input', () => autoGrow(goal));
$('#goal-edit')?.addEventListener('click', () => { goal.focus(); autoGrow(goal); });

/* закрытие и открытие заново */
$('#pack-close')?.addEventListener('click', () => {
  const screen = $('#packaging-list');
  if (screen.classList.contains('is-closed')) {
    screen.classList.remove('is-closed');
    $('#pack-close').textContent = '[CLOSE PACKAGING]';
    $('#pack-close').classList.replace('reopen', 'danger');
    showToast('Паккейджинг открыт заново');
  } else {
    openOverlay('ov-close-pack');
  }
});

$('#pack-close-confirm')?.addEventListener('click', () => {
  closeOverlays();
  $('#packaging-list').classList.add('is-closed');
  $('#pack-close').textContent = '[REOPEN PACKAGING]';
  $('#pack-close').classList.replace('danger', 'reopen');
  showToast('Паккейджинг закрыт — только чтение');
});

/* ============ перетаскивание кандидатов ============ */
let dragRow = null;
const dropLine = document.createElement('div');
dropLine.className = 'drop-line';

document.addEventListener('dragstart', e => {
  const handle = e.target.closest('.drag-handle');
  if (!handle) { e.preventDefault(); return; }
  dragRow = handle.closest('.cand-row');
  dragRow.classList.add('is-dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setDragImage(dragRow, 20, 20);
});

document.addEventListener('dragover', e => {
  if (!dragRow) return;
  e.preventDefault();
  const over = e.target.closest('.cand-row, .dept-head');
  if (!over || over === dragRow) return;
  const mid = over.getBoundingClientRect().top + over.offsetHeight / 2;
  over[e.clientY < mid ? 'before' : 'after'](dropLine);
});

document.addEventListener('drop', e => {
  if (!dragRow) return;
  e.preventDefault();
  if (dropLine.parentElement) dropLine.replaceWith(dragRow);
  dragRow.classList.remove('is-dragging');
  // департамент определяется ближайшим заголовком сверху — как в спеке
  let head = null;
  for (let el = dragRow.previousElementSibling; el; el = el.previousElementSibling)
    if (el.classList.contains('dept-head')) { head = el; break; }
  if (head) showToast(`${$('.row__name', dragRow).textContent} → ${head.textContent}`);
  // опустевший департамент убираем — пустых заголовков в списке не бывает
  groupsOf(dragRow.parentElement).forEach(g => { if (!g.rows.length) g.head.remove(); });
  dragRow = null;
});

document.addEventListener('dragend', () => {
  dropLine.remove();
  dragRow?.classList.remove('is-dragging');
  dragRow = null;
});

/* ============ варианты показа разброса голосов ============
   Данные выдуманные: пяти участников и их голосов в скриншотах нет. */
const PARTICIPANTS = [
  { id: 'A', name: 'ARSENIY', me: true },
  { id: 'S', name: 'SERGEY' },
  { id: 'M', name: 'MASHA' },
  { id: 'L', name: 'LEV' },
  { id: 'D', name: 'DANIIL' },
];
const MAX_POS = 5;

const CANDIDATES = [
  { name: 'TANIA NOLAN',    photo: 'tania.jpg',   votes: { A: 1, S: 1, M: 1, L: 1, D: 2 } },
  { name: 'TOM HOLLAND',    photo: 'holland.jpg', votes: { A: 2, S: 2, M: 2, L: 2, D: 3 } },
  { name: 'ANNE HATHAWAY',  photo: '',            votes: { A: 1, S: 1, M: 3, L: 4, D: 4 } },
  { name: 'MATT DAMON',     photo: 'damon.jpg',   votes: { A: 1 } },
];

const VARIANTS = {
  A: {
    title: 'A · ШКАЛА С НАКОПЛЕНИЕМ',
    note: 'Та же шкала, что в наброске, но засечка толстеет от числа голосов на позиции. Компактно, но «сколько людей» читается только по толщине.',
    render: c => {
      const by = countByPos(c);
      return scale(Object.entries(by).map(([p, ids]) => {
        const mine = ids.includes('A');
        return `<span class="v-tick${mine ? ' is-mine' : ''}" style="left:${x(p)}%;width:${2 + ids.length * 2}px"></span>`;
      }).join(''));
    },
  },
  B: {
    title: 'B · СТОЛБИКИ ИЗ ТОЧЕК',
    note: 'По точке на участника, точки на одной позиции встают в столбик. Видно и разброс, и сколько людей за ним стоит. Занимает больше высоты.',
    render: c => {
      const by = countByPos(c);
      return scale(Object.entries(by).map(([p, ids]) =>
        ids.map((id, i) =>
          `<span class="v-dot${id === 'A' ? ' is-mine' : ''}" style="left:${x(p)}%;bottom:${6 + i * 7}px"></span>`
        ).join('')).join(''), 46);
    },
  },
  C: {
    title: 'C · ДИАПАЗОН',
    note: 'Отрезок от самой высокой до самой низкой позиции, метка — средневзвешенное. Самый тихий вариант: спор читается как длина. Кто именно где — не видно совсем.',
    render: c => {
      const ps = Object.values(c.votes);
      if (!ps.length) return scale('');
      const lo = Math.min(...ps), hi = Math.max(...ps);
      const avg = ps.reduce((a, b) => a + b, 0) / ps.length;
      return scale(
        `<span class="v-range" style="left:${x(lo)}%;width:${x(hi) - x(lo)}%"></span>` +
        `<span class="v-avg" style="left:${x(avg)}%"></span>`);
    },
  },
  D: {
    title: 'D · ИНИЦИАЛЫ УЧАСТНИКОВ',
    note: 'Вместо абстрактных засечек — кто проголосовал. Сразу видно, что спорят именно продюсер с режиссёром. Шумнее всех и упрётся в ширину на большой команде.',
    render: c => {
      const by = countByPos(c);
      return scale(Object.entries(by).map(([p, ids]) =>
        ids.map((id, i) =>
          `<span class="v-ini${id === 'A' ? ' is-mine' : ''}" style="left:${x(p)}%;bottom:${4 + i * 15}px">${id}</span>`
        ).join('')).join(''), 56);
    },
  },
};

function x(p) { return ((p - 1) / (MAX_POS - 1)) * 100; }

function countByPos(c) {
  const by = {};
  PARTICIPANTS.forEach(p => {
    const v = c.votes[p.id];
    if (v) (by[v] = by[v] || []).push(p.id);
  });
  return by;
}

function scale(inner, h = 24) {
  return `<div class="v-scale" style="height:${h}px"><div class="v-axis"></div>${inner}</div>`;
}

function verdict(c) {
  const ps = Object.values(c.votes);
  if (ps.length < 2) return ['argue', 'МАЛО ГОЛОСОВ'];
  const span = Math.max(...ps) - Math.min(...ps);
  return span <= 1 ? ['agree', 'СОГЛАСИЕ'] : ['argue', 'СПОР'];
}

function renderVariant(key) {
  const v = VARIANTS[key];
  $('#var-note').textContent = v.note;
  $('#var-list').innerHTML = CANDIDATES.map((c, i) => {
    const [cls, word] = verdict(c);
    const voted = Object.keys(c.votes).length;
    const photo = c.photo
      ? `<img class="agg-row__photo" src="assets/${c.photo}" alt="">`
      : '<div class="agg-row__photo"></div>';
    return `<div class="agg-row">
      <div class="agg-row__pos">${i + 1}</div>${photo}
      <div class="agg-row__body">
        <div class="row__name">${c.name}</div>
        ${v.render(c)}
        <div class="agg-row__meta">
          <span class="${cls}">${word}</span><span>·</span>
          <span>ПРОГОЛОСОВАЛИ ${voted} ИЗ ${PARTICIPANTS.length}</span>
        </div>
      </div>
    </div>`;
  }).join('');
  $$('#var-pick .chip').forEach(b => b.classList.toggle('is-on', b.dataset.variant === key));
}

if ($('#var-pick')) {
  $('#var-pick').innerHTML = Object.entries(VARIANTS)
    .map(([k, v]) => `<span class="chip chip--outline" data-variant="${k}">${v.title}</span>`).join('');
  $('#var-pick').addEventListener('click', e => {
    const b = e.target.closest('[data-variant]');
    if (b) renderVariant(b.dataset.variant);
  });
  renderVariant('A');
}

/* ============ AGGREGATE: четыре компоновки экрана ============
   Участники, голоса и комментарии выдуманы — в скриншотах их нет. */
const AGG = {
  people: [
    { id: 'A', name: 'ARSENIY', weight: 2, me: true },
    { id: 'S', name: 'SERGEY',  weight: 2 },
    { id: 'M', name: 'MASHA',   weight: 1 },
    { id: 'L', name: 'LEV',     weight: 1 },
    { id: 'D', name: 'DANIIL',  weight: 1 },
  ],
  cands: [
    { name: 'TANIA NOLAN', dept: 'ACTING', photo: 'tania.jpg',
      votes: { A: 1, S: 1, M: 1, L: 1, D: 2 },
      comments: [{ who: 'SERGEY', text: 'Лучшая проба из всех, вопросов нет' }] },
    { name: 'TOM HOLLAND', dept: 'ACTING', photo: 'holland.jpg',
      votes: { A: 2, S: 2, M: 2, L: 2, D: 3 },
      comments: [{ who: 'MASHA', text: 'Сильно, но занят до мая' }] },
    { name: 'ANNE HATHAWAY', dept: 'ACTING', photo: '',
      votes: { A: 1, S: 1, M: 3, L: 4, D: 4 },
      comments: [
        { who: 'ARSENIY', text: 'Держит сцену одна, это наш случай' },
        { who: 'LEV', text: 'Не тот типаж, и гонорар съест половину блока' },
      ] },
    { name: 'MATT DAMON', dept: 'ACTING', photo: 'damon.jpg',
      votes: { A: 1 }, comments: [] },
    { name: 'CHRISTOPHER NOLAN', dept: 'DIRECTING', photo: 'nolan.jpg',
      votes: { A: 1, S: 1, M: 2, L: 1, D: 1 },
      comments: [{ who: 'DANIIL', text: 'Если согласится — вопрос закрыт' }] },
    { name: 'MARK-MASON ROBLEDO', dept: 'DIRECTING', photo: '',
      votes: { A: 2, S: 2, M: 1, L: 2, D: 2 }, comments: [] },
  ],
};

const TOTAL_W = AGG.people.reduce((s, p) => s + p.weight, 0);

/* формула из спеки: score = avg + (1 − coverage) × 1000 */
function scoreOf(c) {
  let wsum = 0, wpos = 0;
  AGG.people.forEach(p => {
    const v = c.votes[p.id];
    if (!v) return;
    wsum += p.weight;
    wpos += p.weight * v;
  });
  if (!wsum) return { score: Infinity, avg: null, coverage: 0, voted: 0 };
  const avg = wpos / wsum;
  const coverage = wsum / TOTAL_W;
  return { score: avg + (1 - coverage) * 1000, avg, coverage, voted: Object.keys(c.votes).length };
}

function spanOf(c) {
  const ps = Object.values(c.votes);
  return ps.length < 2 ? 0 : Math.max(...ps) - Math.min(...ps);
}

function byDept() {
  const map = {};
  AGG.cands.forEach(c => (map[c.dept] = map[c.dept] || []).push(c));
  Object.values(map).forEach(list => list.sort((a, b) => scoreOf(a).score - scoreOf(b).score));
  return map;
}

function photoTag(c, cls) {
  return c.photo ? `<img class="${cls}" src="assets/${c.photo}" alt="">` : `<div class="${cls}"></div>`;
}

const CONCEPTS = {
  1: {
    title: '1 · СПИСОК',
    note: 'Ранжированный список по департаментам, как в спеке. Отвечает на «кто первый». Разброс голосов — точками под именем.',
    render() {
      const map = byDept();
      return Object.entries(map).map(([dept, list]) => `
        <div class="dept-head">${dept}</div>
        ${list.map((c, i) => {
          const s = scoreOf(c);
          const by = {};
          AGG.people.forEach(p => { const v = c.votes[p.id]; if (v) (by[v] = by[v] || []).push(p.id); });
          const dots = Object.entries(by).map(([p, ids]) => ids.map((id, k) =>
            `<span class="v-dot${id === 'A' ? ' is-mine' : ''}" style="left:${x(+p)}%;bottom:${6 + k * 7}px"></span>`).join('')).join('');
          return `<div class="agg-row">
            <div class="agg-row__pos">${s.score === Infinity ? '—' : i + 1}</div>
            ${photoTag(c, 'agg-row__photo')}
            <div class="agg-row__body">
              <div class="row__name">${c.name}</div>
              <div class="v-scale" style="height:46px"><div class="v-axis"></div>${dots}</div>
              <div class="agg-row__meta">
                <span>ПРОГОЛОСОВАЛИ ${s.voted} ИЗ ${AGG.people.length}</span>
                ${c.comments.length ? `<span class="agg-row__note"><svg class="ic ic--sm"><use href="#i-note"/></svg>${c.comments.length}</span>` : ''}
              </div>
            </div>
          </div>`;
        }).join('')}`).join('');
    },
  },

  2: {
    title: '2 · ТАБЛИЦА',
    note: 'Кандидаты × участники, в клетке — позиция. Твоя колонка подсвечена. Плотно и аналитично: неровная строка = спор, пустая клетка = человек не голосовал.',
    render() {
      const map = byDept();
      const head = AGG.people.map(p =>
        `<div class="tbl__h${p.me ? ' is-mine' : ''}">${p.name.slice(0, 2)}</div>`).join('');
      return `<div class="tbl">
        <div class="tbl__row tbl__row--head"><div class="tbl__name"></div>${head}</div>
        ${Object.entries(map).map(([dept, list]) => `
          <div class="tbl__dept">${dept}</div>
          ${list.map(c => `
            <div class="tbl__row">
              <div class="tbl__name">${c.name}</div>
              ${AGG.people.map(p => {
                const v = c.votes[p.id];
                return `<div class="tbl__c${p.me ? ' is-mine' : ''}${v ? ` lv${Math.min(v, 4)}` : ' is-empty'}">${v || '·'}</div>`;
              }).join('')}
            </div>`).join('')}`).join('')}
      </div>`;
    },
  },

  3: {
    title: '3 · СПОРЫ',
    note: 'Сортировка не по рейтингу, а по разногласию. Сверху свёрнуто то, о чём договорились; раскрыты только спорные, с обеими позициями и репликами. Экран про разговор, а не про таблицу.',
    render() {
      const sorted = [...AGG.cands].sort((a, b) => spanOf(b) - spanOf(a));
      const argued = sorted.filter(c => spanOf(c) >= 2);
      const agreed = sorted.filter(c => spanOf(c) < 2 && scoreOf(c).voted > 1);
      const thin = sorted.filter(c => scoreOf(c).voted <= 1);
      const sides = c => {
        const lo = Math.min(...Object.values(c.votes)), hi = Math.max(...Object.values(c.votes));
        const nameOf = id => AGG.people.find(p => p.id === id).name;
        const who = pos => Object.entries(c.votes).filter(([, v]) => v === pos).map(([id]) => nameOf(id));
        const quote = names => c.comments.find(k => names.includes(k.who));
        return [[lo, who(lo)], [hi, who(hi)]].map(([pos, names]) => {
          const q = quote(names);
          return `<div class="dis__side">
            <div class="dis__pos">#${pos}</div>
            <div>
              <div class="dis__who">${names.join(', ')}</div>
              ${q ? `<div class="dis__quote">«${q.text}»</div>` : '<div class="dis__quote dis__quote--none">без комментария</div>'}
            </div>
          </div>`;
        }).join('<div class="dis__vs">против</div>');
      };
      return `
        <div class="pad">
          <div class="fold">
            <span>ДОГОВОРИЛИСЬ — ${agreed.length}</span>
            <span class="fold__names">${agreed.map(c => c.name).join(' · ')}</span>
          </div>
          <div class="dis-label">СПОРЫ — ${argued.length}</div>
          ${argued.map(c => `
            <div class="dis">
              <div class="dis__head">${photoTag(c, 'dis__photo')}
                <div><div class="row__name">${c.name}</div>
                <div class="agg-row__meta"><span>${c.dept}</span></div></div>
              </div>
              ${sides(c)}
            </div>`).join('')}
          ${thin.length ? `<div class="dis-label">ПОЧТИ НЕ ОБСУЖДАЛИ — ${thin.length}</div>
            ${thin.map(c => `<div class="fold"><span>${c.name}</span>
              <span class="fold__names">голосовал ${scoreOf(c).voted} из ${AGG.people.length}</span></div>`).join('')}` : ''}
        </div>`;
    },
  },

  4: {
    title: '4 · КАРТОЧКИ',
    note: 'По кандидату на карточку, листаешь вертикально. Максимум контекста на одного человека: кто как поставил — лицами, и реплика целиком. Медленный просмотр, обзора списка нет.',
    render() {
      const map = byDept();
      return Object.entries(map).map(([dept, list]) => `
        <div class="dept-head" style="padding-left:var(--gutter);padding-right:var(--gutter)">${dept}</div>
        ${list.map((c, i) => {
          const s = scoreOf(c);
          return `<div class="card">
            <div class="card__top">
              ${photoTag(c, 'card__photo')}
              <div>
                <div class="card__pos">${s.score === Infinity ? '—' : '#' + (i + 1)}</div>
                <div class="row__name">${c.name}</div>
                <div class="agg-row__meta"><span>ПРОГОЛОСОВАЛИ ${s.voted} ИЗ ${AGG.people.length}</span></div>
              </div>
            </div>
            <div class="card__votes">
              ${AGG.people.map(p => {
                const v = c.votes[p.id];
                return `<div class="card__voter${p.me ? ' is-mine' : ''}">
                  <div class="card__badge${v ? '' : ' is-empty'}">${v || '–'}</div>
                  <div class="card__who">${p.name.slice(0, 2)}</div>
                </div>`;
              }).join('')}
            </div>
            ${c.comments.length ? c.comments.map(k =>
              `<div class="card__quote"><b>${k.who}</b> «${k.text}»</div>`).join('')
              : '<div class="card__quote card__quote--none">комментариев нет</div>'}
          </div>`;
        }).join('')}`).join('');
    },
  },
};

function renderConcept(key) {
  $('#con-note').textContent = CONCEPTS[key].note;
  const body = $('#con-body');
  body.className = 'scroll con-' + key;
  body.innerHTML = CONCEPTS[key].render();
  $$('#con-pick .chip').forEach(b => b.classList.toggle('is-on', b.dataset.concept === key));
}

if ($('#con-pick')) {
  $('#con-pick').innerHTML = Object.entries(CONCEPTS)
    .map(([k, v]) => `<span class="chip chip--outline" data-concept="${k}">${v.title}</span>`).join('');
  $('#con-pick').addEventListener('click', e => {
    const b = e.target.closest('[data-concept]');
    if (b) renderConcept(b.dataset.concept);
  });
  renderConcept('1');
}
 
