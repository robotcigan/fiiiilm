/* FIIILM — каталог.
   Заменяет бэкенд: в приложении поиск идёт по базе фильмов, здесь — по этому файлу.
   Фото есть только у тех, кого я нарезал из скриншотов; у остальных плейсхолдер,
   как и в самом приложении. Цифры вроде «1219 результатов» подделывать не стал —
   счётчики считаются по этому каталогу честно. */

const DEPARTMENTS = [
  'DIRECTING', 'ACTING', 'PRODUCTION', 'WRITING', 'CAMERA',
  'ART', 'SOUND', 'EDITING', 'COSTUME', 'VISUAL EFFECTS',
];

/* [id, имя, департамент, известен по, год, фото] */
const PEOPLE = [
  ['nolan',      'CHRISTOPHER NOLAN',   'DIRECTING',      'The Odyssey',                  2026, 'nolan.jpg'],
  ['damon',      'MATT DAMON',          'ACTING',         'Untitled Daniels Event Film',  2027, 'damon.jpg'],
  ['holland',    'TOM HOLLAND',         'ACTING',         'The Odyssey',                  2026, 'holland.jpg'],
  ['hoyte',      'HOYTE VAN HOYTEMA',   'CAMERA',         'The Odyssey',                  2026, 'hoyte.jpg'],
  ['otero',      'NILO OTERO',          'DIRECTING',      'The Odyssey',                  2026, 'otero.jpg'],
  ['tania',      'TANIA NOLAN',         'ACTING',         'The Convert',                  2024, 'tania.jpg'],
  ['rory',       'RORY NOLAN',          'ACTING',         'Dare to Be Wild',              2015, 'rory.jpg'],
  ['winters',    'NOLAN WINTERS',       'ACTING',         'Dermatophagia',                2025, 'winters.jpg'],
  ['holloway',   'TOM HOLLOWAY',        'VISUAL EFFECTS', 'Toy Story',                    1995, 'holloway.jpg'],
  ['robledo',    'MARK-MASON ROBLEDO',  'DIRECTING',      '2099: A Strange Odd-yssey',    2024, ''],
  ['yvette',     'YVETTE NOLAN',        'ACTING',         'A Common Experience',          2013, ''],
  ['hathaway',   'ANNE HATHAWAY',       'ACTING',         'The Idea of You',              2024, 'hathaway.jpg'],
  ['zendaya',    'ZENDAYA',             'ACTING',         'Challengers',                  2024, 'zendaya.jpg'],
  ['pattinson',  'ROBERT PATTINSON',    'ACTING',         'Mickey 17',                    2025, 'pattinson.jpg'],
  ['charlotte',  'CHARLOTTE RILEY',     'ACTING',         'The Odyssey',                  2026, ''],
  ['jon',        'JON BERNTHAL',        'ACTING',         'The Odyssey',                  2026, ''],
  ['lupita',     'LUPITA NYONG’O',  'ACTING',        'A Quiet Place: Day One',       2024, ''],
  ['elliot',     'ELLIOT PAGE',         'ACTING',         'Inception',                    2010, ''],
  ['cillian',    'CILLIAN MURPHY',      'ACTING',         'Oppenheimer',                  2023, ''],
  ['florence',   'FLORENCE PUGH',       'ACTING',         'Oppenheimer',                  2023, ''],
  ['zack',       'ZACK SMITH',          'DIRECTING',      'The Odyssey',                  2026, ''],
  ['yann',       'YANN MARI FAGET',     'DIRECTING',      'The Odyssey',                  2026, ''],
  ['eric',       'ERIC GLASSER',        'DIRECTING',      'The Odyssey',                  2026, ''],
  ['gareth',     'GARETH WINGROVE',     'VISUAL EFFECTS', 'The Odyssey',                  2026, ''],
  ['emma',       'EMMA THOMAS',         'PRODUCTION',     'The Odyssey',                  2026, ''],
  ['thomasH',    'THOMAS HAYSLIP',      'PRODUCTION',     'Tenet',                        2020, ''],
  ['andy',       'ANDY THOMPSON',       'PRODUCTION',     'Sinners',                      2025, ''],
  ['jonathan',   'JONATHAN NOLAN',      'WRITING',        'Westworld',                    2016, ''],
  ['jordan',     'JORDAN GOLDBERG',     'WRITING',        'Memento',                      2000, ''],
  ['ruth',       'RUTH DE JONG',        'ART',            'Oppenheimer',                  2023, ''],
  ['nathan',     'NATHAN CROWLEY',      'ART',            'Interstellar',                 2014, ''],
  ['claire',     'CLAIRE SIMPSON',      'EDITING',        'Platoon',                      1986, ''],
  ['jennifer',   'JENNIFER LAME',       'EDITING',        'Oppenheimer',                  2023, ''],
  ['richard',    'RICHARD KING',        'SOUND',          'Dunkirk',                      2017, ''],
  ['gary',       'GARY RIZZO',          'SOUND',          'Tenet',                        2020, ''],
  ['ellen',      'ELLEN MIROJNICK',     'COSTUME',        'Oppenheimer',                  2023, ''],
  ['jeffrey',    'JEFFREY KURLAND',     'COSTUME',        'Inception',                    2010, ''],
  ['wally',      'WALLY PFISTER',       'CAMERA',         'The Dark Knight',              2008, ''],
  ['greig',      'GREIG FRASER',        'CAMERA',         'Dune',                         2021, ''],
  ['tomH',       'TOM HOLLYMAN',        'CAMERA',         'Lord of the Flies',            1963, ''],
  ['odissey',    'ODISSEY DIMITRIADI',  'ACTING',         'On the Same Planet',           1966, ''],
  ['denis',      'DENIS VILLENEUVE',    'DIRECTING',      'Dune: Part Two',               2024, ''],
  ['greta',      'GRETA GERWIG',        'DIRECTING',      'Barbie',                       2023, ''],
  ['ryan',       'RYAN COOGLER',        'DIRECTING',      'Sinners',                      2025, ''],
  ['ludwig',     'LUDWIG GÖRANSSON', 'SOUND',        'Oppenheimer',                  2023, ''],
  ['stone',      'EMMA STONE',          'ACTING',         'Poor Things',                  2023, 'stone.jpg'],
  ['tarantino',  'QUENTIN TARANTINO',   'DIRECTING',      'Pulp Fiction',                 1994, 'tarantino.jpg'],
  ['charlize',   'CHARLIZE THERON',     'ACTING',         'Mad Max: Fury Road',           2015, 'charlize.jpg'],
  ['travis',     'TRAVIS SCOTT',        'SOUND',          'Utopia',                       2023, 'travis.jpg'],
  ['hoyte2',     'ERIK MESSERSCHMIDT',  'CAMERA',         'Mank',                         2020, ''],
  ['linus',      'LINUS SANDGREN',      'CAMERA',         'La La Land',                   2016, ''],
  ['rodrigo',    'RODRIGO PRIETO',      'CAMERA',         'Barbie',                       2023, ''],
  ['darius',     'DARIUS KHONDJI',      'CAMERA',         'Uncut Gems',                   2019, ''],
  ['renata',     'RENATA KURBANOVA',    'CAMERA',         'On the Same Planet',           1966, ''],
  ['skip',       'SKIP LIEVSAY',        'SOUND',          'No Country for Old Men',       2007, ''],
  ['nina',       'NINA HARTSTONE',      'SOUND',          'Bohemian Rhapsody',            2018, ''],
  ['donald',     'DONALD SYLVESTER',    'SOUND',          'Ford v Ferrari',               2019, ''],
  ['paul',       'PAUL MASSEY',         'SOUND',          'Ford v Ferrari',               2019, ''],
];

/* [id, название, год, жанры, постер, съёмочная группа, актёрский состав] */
const MOVIES = [
  ['odyssey', 'The Odyssey', 2026, ['ADVENTURE', 'ACTION', 'FANTASY'], 'poster-odyssey.jpg',
    [['nolan', 'DIRECTOR'], ['otero', 'FIRST ASSISTANT DIRECTOR'], ['zack', 'SECOND ASSISTANT DIRECTOR'],
     ['yann', 'FIRST ASSISTANT DIRECTOR'], ['eric', 'FIRST ASSISTANT DIRECTOR'],
     ['gareth', 'SPECIAL EFFECTS SUPERVISOR'], ['hoyte', 'DIRECTOR OF PHOTOGRAPHY'],
     ['emma', 'PRODUCER'], ['jennifer', 'EDITOR'], ['ruth', 'PRODUCTION DESIGN']],
    [['damon', 'ODYSSEUS'], ['holland', 'TELEMACHUS'], ['hathaway', 'PENELOPE'],
     ['charlotte', 'CALYPSO'], ['jon', 'EURYLOCHUS'], ['zendaya', 'ATHENA'],
     ['pattinson', 'ANTINOUS'], ['lupita', 'CIRCE']],
    '80%', 'R', '2h 53m', 'United Kingdom', 'Defy the gods.'],

  ['making', 'The Odyssey: The Making of an Epic', 2026, ['DOCUMENTARY'], 'poster-making.jpg',
    [['nolan', 'SELF'], ['hoyte', 'SELF']], [['damon', 'SELF'], ['holland', 'SELF']],
    '72%', 'PG', '1h 12m', 'United Kingdom', ''],

  ['m2099', '2099: A Strange Odd-yssey', 2024, ['ANIMATION', 'SCIENCE FICTION'], '',
    [['robledo', 'DIRECTOR'], ['jordan', 'WRITER']],
    [['winters', 'VOICE'], ['tania', 'VOICE']],
    '41%', 'PG-13', '1h 38m', 'United States', ''],

  ['sinners',  'Sinners', 2025, ['HORROR', 'THRILLER'], 'poster-sinners.jpg',
    [['ryan', 'DIRECTOR'], ['andy', 'PRODUCER'], ['ludwig', 'ORIGINAL MUSIC COMPOSER']],
    [['pattinson', 'SMOKE'], ['zendaya', 'ANNIE']],
    '87%', 'R', '2h 17m', 'United States', ''],

  ['oppenheimer', 'Oppenheimer', 2023, ['DRAMA', 'HISTORY'], '',
    [['nolan', 'DIRECTOR'], ['hoyte', 'DIRECTOR OF PHOTOGRAPHY'], ['jennifer', 'EDITOR'],
     ['ruth', 'PRODUCTION DESIGN'], ['ellen', 'COSTUME DESIGN'], ['ludwig', 'ORIGINAL MUSIC COMPOSER']],
    [['cillian', 'J. ROBERT OPPENHEIMER'], ['damon', 'LESLIE GROVES'], ['florence', 'JEAN TATLOCK']],
    '81%', 'R', '3h 0m', 'United States', ''],

  ['tenet', 'Tenet', 2020, ['ACTION', 'THRILLER'], '',
    [['nolan', 'DIRECTOR'], ['hoyte', 'DIRECTOR OF PHOTOGRAPHY'], ['gary', 'SOUND RE-RECORDING MIXER'],
     ['thomasH', 'PRODUCER']],
    [['pattinson', 'NEIL'], ['elliot', 'CAMEO']],
    '72%', 'PG-13', '2h 30m', 'United Kingdom', ''],

  ['interstellar', 'Interstellar', 2014, ['ADVENTURE', 'DRAMA', 'SCIENCE FICTION'], '',
    [['nolan', 'DIRECTOR'], ['hoyte', 'DIRECTOR OF PHOTOGRAPHY'], ['nathan', 'PRODUCTION DESIGN']],
    [['damon', 'DR. MANN'], ['hathaway', 'AMELIA BRAND']],
    '85%', 'PG-13', '2h 49m', 'United States', ''],

  ['inception', 'Inception', 2010, ['ACTION', 'SCIENCE FICTION'], '',
    [['nolan', 'DIRECTOR'], ['wally', 'DIRECTOR OF PHOTOGRAPHY'], ['jeffrey', 'COSTUME DESIGN']],
    [['elliot', 'ARIADNE'], ['cillian', 'ROBERT FISCHER']],
    '84%', 'PG-13', '2h 28m', 'United States', ''],

  ['dunkirk', 'Dunkirk', 2017, ['WAR', 'DRAMA'], '',
    [['nolan', 'DIRECTOR'], ['hoyte', 'DIRECTOR OF PHOTOGRAPHY'], ['richard', 'SOUND DESIGNER']],
    [['cillian', 'SHIVERING SOLDIER'], ['holland', 'EXTRA']],
    '78%', 'PG-13', '1h 46m', 'United Kingdom', ''],

  ['convert', 'The Convert', 2024, ['DRAMA', 'HISTORY'], '',
    [['denis', 'DIRECTOR']], [['tania', 'RANGIMAI']],
    '66%', 'R', '1h 59m', 'New Zealand', ''],

  ['dare', 'Dare to Be Wild', 2015, ['DRAMA', 'ROMANCE'], '',
    [['greta', 'DIRECTOR']], [['rory', 'CHRISTY']],
    '58%', 'PG', '1h 40m', 'Ireland', ''],

  ['dermato', 'Dermatophagia', 2025, ['HORROR'], '',
    [['robledo', 'DIRECTOR']], [['winters', 'LEAD']],
    '49%', 'R', '1h 28m', 'United States', ''],

  ['common', 'A Common Experience', 2013, ['DRAMA'], '',
    [['greta', 'DIRECTOR']], [['yvette', 'MOTHER']],
    '61%', 'PG', '1h 35m', 'Canada', ''],

  ['toystory', 'Toy Story', 1995, ['ANIMATION', 'FAMILY'], '',
    [['holloway', 'VISUAL EFFECTS SUPERVISOR']], [['damon', 'VOICE']],
    '92%', 'G', '1h 21m', 'United States', ''],

  ['planet', 'On the Same Planet', 1966, ['DRAMA'], '',
    [['denis', 'DIRECTOR']], [['odissey', 'LENIN']],
    '55%', 'PG', '1h 20m', 'Soviet Union', ''],

  ['dune2', 'Dune: Part Two', 2024, ['SCIENCE FICTION', 'ADVENTURE'], '',
    [['denis', 'DIRECTOR'], ['greig', 'DIRECTOR OF PHOTOGRAPHY']],
    [['zendaya', 'CHANI'], ['florence', 'PRINCESS IRULAN'], ['pattinson', 'EXTRA']],
    '88%', 'PG-13', '2h 46m', 'United States', ''],

  ['barbie', 'Barbie', 2023, ['COMEDY', 'ADVENTURE'], '',
    [['greta', 'DIRECTOR']], [['hathaway', 'CAMEO']],
    '75%', 'PG-13', '1h 54m', 'United States', ''],

  ['challengers', 'Challengers', 2024, ['DRAMA', 'ROMANCE'], '',
    [['ryan', 'DIRECTOR']], [['zendaya', 'TASHI']],
    '73%', 'R', '2h 11m', 'United States', ''],

  ['mickey', 'Mickey 17', 2025, ['SCIENCE FICTION', 'COMEDY'], '',
    [['denis', 'DIRECTOR']], [['pattinson', 'MICKEY'], ['florence', 'NASHA']],
    '70%', 'R', '2h 17m', 'United States', ''],

  ['poorthings', 'Poor Things', 2023, ['DRAMA', 'COMEDY'], '',
    [['greta', 'DIRECTOR']], [['stone', 'BELLA BAXTER'], ['pattinson', 'DUNCAN']],
    '79%', 'R', '2h 21m', 'Ireland', ''],

  ['pulp', 'Pulp Fiction', 1994, ['CRIME', 'DRAMA'], '',
    [['tarantino', 'DIRECTOR'], ['claire', 'EDITOR']], [['tarantino', 'JIMMIE']],
    '89%', 'R', '2h 34m', 'United States', ''],

  ['lalaland', 'La La Land', 2016, ['DRAMA', 'ROMANCE', 'MUSIC'], '',
    [['greta', 'DIRECTOR'], ['greig', 'DIRECTOR OF PHOTOGRAPHY']],
    [['stone', 'MIA'], ['elliot', 'EXTRA']],
    '79%', 'PG-13', '2h 8m', 'United States', ''],

  ['madmax', 'Mad Max: Fury Road', 2015, ['ACTION', 'ADVENTURE'], '',
    [['denis', 'DIRECTOR'], ['darius', 'DIRECTOR OF PHOTOGRAPHY'], ['skip', 'SOUND DESIGNER']],
    [['charlize', 'FURIOSA'], ['pattinson', 'EXTRA']],
    '90%', 'R', '2h 0m', 'Australia', ''],

  ['utopia', 'Utopia', 2023, ['DOCUMENTARY', 'MUSIC'], '',
    [['travis', 'ORIGINAL MUSIC COMPOSER'], ['nina', 'SOUND RE-RECORDING MIXER']],
    [['travis', 'SELF'], ['zendaya', 'SELF']],
    '64%', 'PG-13', '1h 30m', 'United States', ''],

  ['ferrari', 'Ford v Ferrari', 2019, ['DRAMA', 'ACTION'], '',
    [['ryan', 'DIRECTOR'], ['donald', 'SOUND EDITOR'], ['paul', 'SOUND RE-RECORDING MIXER'],
     ['linus', 'DIRECTOR OF PHOTOGRAPHY']],
    [['damon', 'CARROLL SHELBY'], ['charlize', 'EXTRA']],
    '81%', 'PG-13', '2h 32m', 'United States', ''],

  ['mank', 'Mank', 2020, ['DRAMA', 'HISTORY'], '',
    [['greta', 'DIRECTOR'], ['hoyte2', 'DIRECTOR OF PHOTOGRAPHY'], ['nina', 'SOUND EDITOR']],
    [['charlize', 'MARION DAVIES']],
    '69%', 'R', '2h 11m', 'United States', ''],

  ['memento', 'Memento', 2000, ['THRILLER', 'MYSTERY'], '',
    [['nolan', 'DIRECTOR'], ['jordan', 'WRITER'], ['wally', 'DIRECTOR OF PHOTOGRAPHY']],
    [['elliot', 'EXTRA']],
    '83%', 'R', '1h 53m', 'United States', ''],
];

const BIOS = {
  nolan: 'Christopher Nolan (born 30 July 1970) is a British and American filmmaker. Known for his Hollywood blockbusters with complex storytelling, he is considered a leading filmmaker of the 21st century.',
  damon: 'Matthew Paige Damon (born October 8, 1970) is an American actor, film producer and screenwriter. He is ranked among Forbes magazine’s most bankable stars.',
  robledo: 'Mark-Mason Robledo is an animation director working between Los Angeles and Mexico City.',
  stone: 'Emily Jean \u201cEmma\u201d Stone (born November 6, 1988) is an American actress. She is the recipient of two Academy Awards and a BAFTA.',
  tarantino: 'Quentin Jerome Tarantino (born March 27, 1963) is an American filmmaker. His films are characterized by nonlinear storylines and stylized violence.',
  holland: 'Thomas Stanley Holland (born 1 June 1996) is an English actor. His accolades include a British Academy Film Award and three Saturn Awards.',
};

/* ---------- производные индексы ---------- */
const people = PEOPLE.map(([id, name, dept, known, year, photo]) =>
  ({ id, name, dept, known, year, photo, bio: BIOS[id] || '' }));

const movies = MOVIES.map(([id, title, year, genres, poster, crew, cast, tmdb, rated, runtime, country, tagline]) =>
  ({ id, title, year, genres, poster, crew, cast, tmdb, rated, runtime, country, tagline }));

const byId = {
  person: Object.fromEntries(people.map(p => [p.id, p])),
  movie: Object.fromEntries(movies.map(m => [m.id, m])),
};

/* фильмография человека — собирается из фильмов, а не дублируется руками */
function creditsOf(personId) {
  return movies
    .filter(m => m.crew.some(c => c[0] === personId) || m.cast.some(c => c[0] === personId))
    .sort((a, b) => b.year - a.year)
    .map(m => {
      const role = (m.crew.find(c => c[0] === personId) || m.cast.find(c => c[0] === personId))[1];
      return { movie: m, role };
    });
}

function searchPeople(q) {
  const s = q.trim().toUpperCase();
  if (!s) return [];
  return people.filter(p => p.name.includes(s) || p.known.toUpperCase().includes(s) || p.dept.includes(s));
}

function searchMovies(q) {
  const s = q.trim().toUpperCase();
  if (!s) return [];
  return movies.filter(m =>
    m.title.toUpperCase().includes(s) || m.genres.some(g => g.includes(s)) || String(m.year) === s);
}

window.FIIILM_DATA = { DEPARTMENTS, people, movies, byId, creditsOf, searchPeople, searchMovies };
