// Top bar and Player Mat drawer of the digital tabletop. Pure HTML strings.
import { GYMS_BY_ID, gymsOf } from '../data/gyms.js';
import { dexSpecies, getSpecies } from '../data/pokemon.js';
import { getLegalActions, restHeal } from '../engine/turnEngine.js';
import { currentPlayer, getLead, hasHealthyPokemon } from '../engine/gameState.js';
import { evolutionTarget, evolveBlocker, starCost } from '../engine/evolutionEngine.js';
import { growthEdges, growthReady, growthRules, usesGrowth } from '../engine/growthEngine.js';
import { ITEMS, STONE_IDS } from '../data/items.js';
import { gymHere, gymsEnabled, hasBadge, leagueBadges, leagueHere } from '../engine/gymEngine.js';
import { hasPokeStop, healOnlySpot, pokeStopV2 } from '../engine/pokeStopEngine.js';
import { cureItems, healingItems, itemCount, usableItems } from '../engine/itemEngine.js';
import { canUseBox, usesOakBox } from '../engine/boxEngine.js';
import { atOakLab, usesOakJobs } from '../engine/oakEngine.js';
import { avatarToken, heroToken, playerTokenId, tokenArt } from './tokens.js';
import { actAttr, esc } from '../ui/dom.js';
import { DEX_STATES, STATUS_BADGE, badgeCase, dexState, missionCard, missionMini, plotClockPl, pokemonCard, setClassTable, starTokens, superballSvg, teamDot } from './cards.js';
import { questsEnabled } from '../engine/questEngine.js';
import { placeFatigue } from '../engine/fatigueEngine.js';
import { CHALLENGE_PL, INCIDENT_PL, QUESTBOOK_PL, keyItemIcon, nextStepPl, offerTitlePl, placeName, plotPl, takeBlockPl } from './content-pl.js';
import { incidentsNow } from '../engine/incidentEngine.js';
import { rocketBlocks } from '../engine/rocketEngine.js';
import { bookQuest, nextStep, questOf, takeBlock } from '../engine/questBookEngine.js';
import { rumourList } from '../engine/rumourEngine.js';
import { STATUS_PL, activityKind, fieldQuestIcon, hudCarousel } from './journal.js';
import { entryArt } from './worldArt.js';
import { pokeballSvg } from './dice.js';
import { gi } from './icons.js';
import { itemIc } from './cards.js';
import { DICE_MODE_PL, ITEM_PL, turnsPl } from './i18n.js';
import { huntDef, huntTurnsLeft } from '../engine/huntEngine.js';
import { statusOf, usesCombatMoves } from '../engine/combatMoves.js';
import { flySpec, hasFlyBadge, hasFlyHm, usesFly } from '../engine/flyEngine.js';
import { hasBike, usesBike, usesBike2 } from '../engine/bikeEngine.js';
import { bushAt, cutDone } from '../engine/cutEngine.js';
import { isCampaignQuest, shopClosedByRocket } from '../engine/rocketCampaignEngine.js';
import { heldTms } from '../engine/tmEngine.js';
import { evoOfferMoves } from '../engine/evoMoveEngine.js';
import { sleepPhasePl } from './tableLayer.js';
import { restBonus, traitOf } from '../engine/traitEngine.js';
import { scoreOf, usesVictory } from '../engine/scoreEngine.js';
import { canSurf, surfBlockers, usesSurf } from '../engine/surfEngine.js';
import { usesTms } from '../engine/tmEngine.js';
import { surfBlockerPl } from './content-pl.js';
import { newTms, usesUx } from './tracker.js';
import { badgeArt, hasBadgeArt } from './badgeArt.js';

// BIKE V2: `spend` — the dots a previewed ride will spend (the last ones still on) dim and pulse (main.js ui.ridePreview.cost)
const spendOf = (ui) => ui?.ridePreview?.cost ?? 0;
const dotCls = (i, left, spend) => (i < left ? (i >= left - spend ? 'on spend' : 'on') : '');
function actionMarkers(state, spend = 0) {
  const total = Math.max(state.config.actionsPerTurn, state.turn.actionsRemaining);
  return `<span class="action-markers" aria-label="Akcje: ${state.turn.actionsRemaining} z ${total}">${Array.from({ length: total }, (_, i) => { const c = dotCls(i, state.turn.actionsRemaining, spend); return `<span class="action-marker${c ? ` ${c}` : ''}"></span>`; }).join('')}</span>`;
}

function avatar(player, size = '') {
  return avatarToken(player, size);
}

// Final week after the first Champion (Step 6): everyone else finishes the week.
export function finalWeekBanner(state) {
  if (state.endgame?.status !== 'finalWeek') return '';
  const champs = state.players.filter((p) => p.league?.champion).map((p) => p.name).join(' i ');
  return `<div class="final-week">👑 ${esc(champs)} — Mistrz Ligi! Ostatni tydzień: pozostali gracze kończą swoje tury.</div>`;
}

export function renderTopBar(state, ui) {
  const active = currentPlayer(state);
  const mode = DICE_MODE_PL[state.config.dice?.mode ?? 'digital'];
  const others = state.players.map((p) => `
    <button class="player-chip${p.id === active.id ? ' active' : ''}" data-ui="open-mat" data-player="${p.id}" aria-label="Plansza gracza ${esc(p.name)}">
      ${avatar(p, 'small')}<span class="chip-name">${esc(p.name)}</span>
      <span class="chip-stats">🏅${p.badges?.length ?? 0} · 📕${p.pokedex.caught.length}${p.league?.champion ? ' · 👑' : ''}</span>
    </button>`).join('');
  return `
    <div class="week-box"><span class="week-label">Tydzień</span><b>${state.turn.round}</b></div>
    <div class="turn-box" style="--pc:${active.color}">
      ${avatar(active)}
      <div><div class="turn-name"><small class="turn-label">Teraz gra</small> ${esc(active.name)}${active.controller === 'ai' ? ' <span class="tag">AI</span>' : ''}</div><div class="turn-where">📍 ${esc(placeName(active.location))}</div></div>
      ${state.phase === 'over' ? '' : `<span class="act-box"><small>Akcje</small>${actionMarkers(state, spendOf(ui))}</span>`}
    </div>
    <div class="mode-box" title="${esc(mode.hint)}">🎲 ${esc(mode.name)}</div>
    <div class="chips">${others}</div>
    <button class="icon-btn" data-ui="settings" aria-label="Ustawienia">⚙️</button>
    ${finalWeekBanner(state)}`;
}

// M02-2: this place is searched (1 footprint: tired, 2: exhausted) — on Explore.
function tiredMarks(state, player) {
  const level = placeFatigue(player, player.location, state.config);
  return level ? ` <span class="tired-marks" title="Pokémony tutaj już Cię znają — ruszaj dalej">${'👣'.repeat(level)}</span>` : '';
}

// KEY-1 (rules.keyBag 'v1', a DEV pilot): the player's key items as small pictures under the items — one tap opens „Plecak”
// (what each one does). Nothing in a game without the switch or without a key item. HM-1 (12.11): a TM disc (rules.tms)
// is in the same „Plecak” — one 💿 among the pictures, however many discs.
function keyBagRow(state, player) {
  const on = state.config.rules.keyBag === 'v1';
  const keys = on ? (player.questBook?.keyItems ?? []) : [];
  const discs = on && heldTms(state, player).length > 0;
  if (!keys.length && !discs) return '';
  return `<button class="key-row" data-ui="open-bag" data-player="${esc(player.id)}" aria-label="Przedmioty kluczowe — ${esc(player.name)}"><span class="kr-ic">${keys.map((id) => keyItemIcon(id)).join('')}${discs ? '💿' : ''}</span><span class="kr-label">Przedmioty kluczowe ›</span></button>`;
}

// FLY-2 (rules.fly 'f1', a DEV pilot): the „Lot” button — once the player has something of it (the HM, the Thunder Badge
// or a Pokémon that can fly, in the team or the Box); dimmed until a flight is legal, and a tap says what is missing.
export function flyShown(state, player, legal) {
  if (!usesFly(state.config)) return false;
  if (legal.some((a) => a.type === 'fly')) return true;
  const birds = flySpec(state.config).species;
  return hasFlyHm(player, state.config) || hasFlyBadge(player, state.config) || [...player.team, ...(player.reserve ?? [])].some((m) => birds.includes(m.species));
}

// BIKE-1 (rules.bike 'b1', a DEV pilot): the „Rower” button — once the player has the bicycle; dimmed when no ride is open
// now (a tap says why: no action, no trail here, uphill, a closed road).
// CUT-1 (rules.cut 'c1', a DEV pilot): „Zetnij” — at a bush this player has not cut; dimmed (a tap says why) until the HM,
// the Cascade Badge and a Pokémon that can cut are there.
export const cutShown = (state, player) => { const b = bushAt(state.config, player.location); return Boolean(b) && !cutDone(player).includes(b.id); };
export const bikeShown = (state, player, legal) => usesBike(state.config) && (legal.some((a) => a.type === 'ride') || hasBike(player, state.config));

// TM-3 (rules.tms 't1', a DEV pilot): „Naucz ruchu” — only while the player holds a TM; dimmed when no Pokémon of the team
// can take one now (a tap shows each one and why).
// TM-4 (rules.evoMoves): also while a Pokémon of the team waits with a move its evolution offered.
export const tmShown = (state, player) => heldTms(state, player).length > 0 || player.team.some((m) => evoOfferMoves(m).length > 0);

// The buttons for the active human player's turn actions (Move = tap the map).
function actionDock(state, player, ui) {
  const legal = getLegalActions(state);
  const has = (type) => legal.some((a) => a.type === type);
  const btn = (attrs, label, { primary = false, disabled = false } = {}) => `<button class="dock-btn${primary ? ' primary' : ''}" ${attrs}${disabled ? ' disabled' : ''}>${label}</button>`;
  const items = [];
  // One terrain here: Explore rolls at once; several: pick the terrain first (3A-2.5).
  const explores = legal.filter((a) => a.type === 'explore');
  // Nobody can fight: say what to do instead of a silently greyed button.
  if (!explores.length && state.turn.actionsRemaining > 0 && !hasHealthyPokemon(player)) items.push(`<span class="dock-hint">😵 Drużyna zemdlała — idź do Poké Stopu (P)${itemCount(player, 'revive') ? ' albo użyj 💎 Revive (🎒 Drużyna)' : ''}</span>`);
  else items.push(explores.length === 1 ? btn(actAttr(explores[0]), `🌿 Eksploruj${tiredMarks(state, player)}`, { primary: true }) : btn('data-ui="open-explore"', `🌿 Eksploruj${tiredMarks(state, player)}`, { primary: true, disabled: !explores.length }));
  if (has('fish')) items.push(btn(actAttr({ type: 'fish' }), '🎣 Łów')); // bonus 14.10: the Old Rod at a place with water
  if (flyShown(state, player, legal)) items.push(btn('data-ui="open-fly"', '🪽 Lot')); // FLY-2 (rules.fly)
  if (bikeShown(state, player, legal)) items.push(btn('data-ui="open-bike"', '🚲 Rower')); // BIKE-1 (rules.bike)
  if (cutShown(state, player)) items.push(has('cut') ? btn(actAttr({ type: 'cut' }), '🌳 Zetnij') : btn('data-ui="open-cut"', '🌳 Zetnij')); // CUT-1 (rules.cut)
  if (tmShown(state, player)) items.push(btn('data-ui="open-tm"', '💿 Naucz ruchu')); // TM-3 (rules.tms)
  if (has('rest')) items.push(btn('data-ui="open-rest"', '💤 Odpocznij'));
  items.push(...pokeStopButtons(state, legal, (attrs, label, disabled) => btn(attrs, label, { disabled })));
  for (const a of legal.filter((x) => x.type === 'tradeOpen' || x.type === 'pvpChallenge')) items.push(btn(actAttr(a), `${a.type === 'tradeOpen' ? '🔄 Wymiana' : '⚔️ Pojedynek'} z ${esc(state.players.find((p) => p.id === a.with).name)}`));
  if (gymsEnabled(state) && gymHere(state, player)) items.push(btn('data-ui="open-gym"', `🏟️ Sala${hasBadge(player, gymHere(state, player).id) ? ' ✓' : ''}`));
  if (gymsEnabled(state) && leagueHere(state, player)) items.push(btn('data-ui="open-gym"', '🏆 Liga'));
  if (has('challengeRocket')) items.push(btn('data-ui="open-rocket"', '🎈 Team Rocket'));
  items.push(btn('data-ui="end-turn"', ui.confirmEnd ? 'Na pewno koniec?' : '⏭ Koniec tury', { primary: state.turn.actionsRemaining === 0 }));
  return `<div class="dock">${items.join('')}</div>`;
}

// The Poké Stop here: one visit with the heal (Build 2), or Gameplay P1's two
// actions, 1 each, so it never looks like a free bonus for standing in a city.
function pokeStopButtons(state, legal, make) {
  const player = currentPlayer(state);
  const has = (type) => legal.some((a) => a.type === type);
  // NIGHTSHIFT_015 D / E (DEV pilots): a heal-only place — the Poké Center on Cinnabar, Professor Oak's lab — only Leczenie
  const spot = healOnlySpot(player.location, state.config);
  if (spot) return [make(actAttr({ type: 'pokeStopHeal' }), `${gi('heal')} ${spot === 'oak' ? 'Leczenie u Oaka' : 'Poké Center'} <small>1 akcja</small>`, !has('pokeStopHeal'))];
  if (!hasPokeStop(player.location, state.config)) return [];
  if (!pokeStopV2(state)) return [make(actAttr({ type: 'visitPokeStop' }), '🏪 Poké Stop', !has('visitPokeStop'))];
  return [
    make(actAttr({ type: 'pokeStopHeal' }), `${gi('heal')} Leczenie <small>1 akcja</small>`, !has('pokeStopHeal')),
    // PT009-06 (rules.shopCharge 'transaction'): looking is free — the action comes with the first purchase
    // ROCKET-2 R1.1 'r1s' (the variant for review): a Rocket city's shop is closed — said in its place, healing stays
    shopClosedByRocket(state, player.location) ? make('data-ui="rocket-shop"', '🚩 Sklep zamknięty <small>Team Rocket</small>', true) : make(actAttr({ type: 'pokeStopShop' }), `${gi('shop')} Sklep <small>${state.config.rules.shopCharge === 'transaction' ? 'wejście za darmo' : '1 akcja'}</small>`, !has('pokeStopShop')),
  ];
}

// The classic mat (?hud=legacy): Oak's Box swaps as plain buttons.
function legacyBox(state, player, legal) {
  const ins = legal.filter((a) => a.type === 'boxIn');
  if (!ins.length) return '';
  const name = (uid) => getSpecies([...player.team, ...player.reserve].find((m) => m.uid === uid).species).name;
  return `<div class="row wrap">${gi('box')} Box Oaka: ${ins.map((a) => `<button class="mini" ${actAttr(a)}>${esc(name(a.target))}${a.swap ? ` ↔ ${esc(name(a.swap))}` : ' do drużyny'}</button>`).join('')}</div>`;
}

// A healing item button label (Gameplay P1 has the Super Potion too).
const itemLabel = (item) => `${itemIc(item)} ${ITEM_PL[item]}`;

// Always on the main screen: money and Poké Balls (and badges); the other
// items only when there are some — the board stays the hero (3A-2.5).
function resourceStrip(state, player, ui) {
  const fresh = ui.fresh?.stars?.[player.id] ?? 0;
  const some = (id, icon, title) => (itemCount(player, id) > 0 ? `<span class="res" title="${title}">${icon} <b>${itemCount(player, id)}</b></span>` : '');
  return `
    <span class="res" title="Pieniądze">💰 <b>${player.money}</b></span>
    <span class="res" title="Poké Balle">${pokeballSvg(22)} <b>${player.pokeballs}</b></span>
    ${some('superball', superballSvg(22), 'Great Balle')}${some('potion', itemIc('potion'), 'Potion')}${some('revive', itemIc('revive'), 'Revive')}
    ${usesGrowth(state) ? stoneRes(player) : `<span class="res${fresh ? ' pop' : ''}" title="Gwiazdki ewolucji">⭐ <b>${player.stars ?? 0}</b></span>`}
    ${gymsEnabled(state) ? `<span class="res" title="Odznaki">🏅 <b>${player.badges.length}/${leagueBadges(state.config)}</b></span>` : ''}`;
}

// The Pokédex in four states (3A-2.5): how many of each, with the legend.
export function dexSummary(player, config = null) {
  const counts = Object.fromEntries(DEX_STATES.map((d) => [d.id, 0]));
  for (const s of dexSpecies(config)) counts[dexState(player, s.id)] += 1;
  return `<div class="dex-legend">${DEX_STATES.map((d) => `<span class="dex-state ds-${d.id}" title="${esc(d.text)}"><b>${d.icon} ${d.label}</b><i>${counts[d.id]}</i></span>`).join('')}</div>`;
}

function itemLine(icon, label, n) {
  return `<div class="item-line${n ? '' : ' none'}"><span class="il-icon">${icon}</span><span>${label}</span><b>×${n}</b></div>`;
}

// Growth games: Evolution Stones in the bag (no shared star pool there).
function stoneRes(player) {
  return STONE_IDS.filter((id) => itemCount(player, id) > 0).map((id) => `<span class="res" title="${esc(ITEMS[id].name)}">${itemIc(id)} <b>${itemCount(player, id)}</b></span>`).join('');
}

// The bag's medicine: the healing items always (0 greyed), the Combat 2.1 cures only when the player has one.
const bagItems = (state, player) => [...healingItems(state.config), ...cureItems(state.config).filter((id) => itemCount(player, id) > 0)];

// Buttons under one team card: lead, rest, items, evolve — only legal ones.
function teamActions(state, player, mon, legal, canAct) {
  if (!canAct) return '';
  const find = (pred) => legal.find(pred);
  const parts = [];
  const lead = find((a) => a.type === 'setLead' && a.target === mon.uid);
  if (lead) parts.push(`<button class="mini" ${actAttr(lead)}>Prowadź</button>`);
  const rest = find((a) => a.type === 'rest' && a.target === mon.uid);
  if (rest) parts.push(`<button class="mini" ${actAttr(rest)}>💤 +${restHeal(state.config) + restBonus(state, player)}</button>`);
  for (const item of usableItems(state.config)) {
    const use = find((a) => a.type === 'useItem' && a.item === item && a.target === mon.uid);
    if (use) parts.push(`<button class="mini" ${actAttr(use)}>${itemLabel(item)}</button>`);
  }
  const out = find((a) => a.type === 'boxOut' && a.target === mon.uid);
  if (out) parts.push(`<button class="mini" ${actAttr(out)}>${gi('box')} Do Boxu</button>`);
  const evo = find((a) => a.type === 'evolve' && a.target === mon.uid);
  const from = getSpecies(mon.species);
  const edges = growthEdges(mon, state.config.rules); // bonus 14.10: Eevee's forms (one per stone)
  if (evo?.to) {
    for (const e of legal.filter((a) => a.type === 'evolve' && a.target === mon.uid)) parts.push(`<button class="mini evolve" ${actAttr(e)} title="Ewolucja w: ${esc(getSpecies(e.to).name)}">✨ ${esc(getSpecies(e.to).name)} ${itemIc(edges.find((x) => x.to === e.to).item)}</button>`);
  } else if (evo && usesGrowth(state)) {
    const item = from.evolution.item;
    parts.push(`<button class="mini evolve" ${actAttr(evo)} title="Ewolucja w: ${esc(evolutionTarget(from).name)}">✨ Ewoluuj${item ? ` ${itemIc(item)}` : ''}</button>`);
  } else if (evo) {
    parts.push(`<button class="mini evolve" ${actAttr(evo)}>✨ ${esc(evolutionTarget(from).name)} ⭐${starCost(from, state.config)}</button>`);
  } else if (usesGrowth(state) && state.phase === 'turn' && growthReady(mon, state.config.rules) && mon.hp > 0) {
    // READY but not now: say why (a stone to buy, or the one evolution this turn is used).
    const why = evolveBlocker(state, player, mon) ?? '';
    const items = from.evolution?.item ? [from.evolution.item] : edges.map((e) => e.item).filter(Boolean); // Eevee: any of three stones
    parts.push(`<button class="mini evolve" disabled title="${/Stone/.test(why) ? `Potrzebny ${esc(items.map((i) => ITEMS[i].name).join(' / '))}` : 'Jedna ewolucja na turę'}">${/Stone/.test(why) ? `brak ${items.map(itemIc).join('')}` : 'w nast. turze'}</button>`);
  }
  return parts.join('');
}

export function renderMat(state, player, ui) {
  setClassTable(state.config.rules.exp); // E1: power-class dots
  const active = currentPlayer(state);
  const isActive = player.id === active.id;
  const human = player.controller === 'human';
  const canAct = isActive && human && ['turn', 'league', 'challenge'].includes(state.phase) && !ui.busy;
  const legal = canAct ? getLegalActions(state) : [];
  const lead = getLead(player);
  const team = Array.from({ length: state.config.maxTeamSize }, (_, i) => {
    const mon = player.team[i];
    if (!mon) return '<div class="pcard size-s empty-slot">wolne miejsce</div>';
    return pokemonCard(mon, { size: 's', lead: mon === lead, growth: growthRules(state), family: true, actions: teamActions(state, player, mon, legal, canAct) });
  }).join('');
  const freshStars = ui.fresh?.stars?.[player.id] ?? 0;
  const maxQuests = state.config.quests?.maxActive ?? 2;
  const quests = Array.from({ length: maxQuests }, (_, i) => missionCard(player.quests?.[i], { config: state.config })).join('');
  const toggleLabel = `🎒 Drużyna${isActive ? '' : ` ${esc(player.name)}`}`;
  return `
    <div class="mat-bar" style="--pc:${player.color}">
      <button class="mat-toggle team-btn" data-ui="toggle-mat" aria-expanded="${ui.matOpen}" aria-label="${ui.matOpen ? 'Zamknij' : 'Otwórz'}: drużyna, przedmioty, odznaki, misje i Pokédex — ${esc(player.name)}">${avatar(player)}<span class="tb-label"><b>${toggleLabel}</b><small>${ui.matOpen ? 'zamknij' : 'misje · Pokédex'}</small></span><span class="chev">${ui.matOpen ? '▼' : '▲'}</span></button>
      <button class="team-dots" data-ui="toggle-mat" aria-label="Stan drużyny ${esc(player.name)}">${player.team.map((m) => teamDot(m, { lead: m === lead })).join('')}</button>
      <div class="res-strip">${resourceStrip(state, player, ui)}</div>
      ${isActive && human && state.phase === 'turn' && !ui.busy && !state.growthChoice && !state.battlePrep ? actionDock(state, player, ui) : `<div class="dock-note">${isActive && !human ? `${esc(player.name)} (AI) gra…` : isActive && state.growthChoice ? '⭐ Wybierz, kto dostaje punkt treningu' : isActive && state.battlePrep ? '⚔️ Kto zaczyna walkę?' : isActive ? '' : `Tura: ${esc(active.name)}`}</div>`}
    </div>
    <div class="mat-body"${ui.matOpen ? '' : ' hidden'}>
      <section class="mat-sec team"><h4>👥 Drużyna${isActive ? '' : ` — ${esc(player.name)}`} <span class="muted">${player.team.length}/${state.config.maxTeamSize}${player.reserve.length ? ` · 📦 rezerwa ${player.reserve.length}` : ''}</span>${usesGrowth(state) ? '<span class="hint">⭐ Punkty treningu ma każdy Pokémon na swojej karcie. <b>GOTOWY</b> → ✨ Ewoluuj (jedna ewolucja na turę; czasem potrzebny kamień).</span>' : ''}<button class="ghost mh-close" data-ui="toggle-mat">▼ Zamknij</button></h4>
        <div class="team-row">${team}</div>
        ${legacyBox(state, player, legal)}
      </section>
      <section class="mat-sec items"><h4>🎒 Przedmioty</h4>
        ${itemLine('💰', 'Pieniądze', player.money)}
        ${itemLine(pokeballSvg(22), 'Poké Ball', player.pokeballs)}
        ${itemLine(superballSvg(22), 'Great Ball', itemCount(player, 'superball'))}
        ${bagItems(state, player).map((id) => itemLine(itemIc(id), ITEM_PL[id], itemCount(player, id))).join('')}
        ${usesGrowth(state) ? STONE_IDS.filter((id) => itemCount(player, id) > 0).map((id) => itemLine(itemIc(id), esc(ITEMS[id].name), itemCount(player, id))).join('') : ''}
        ${usesGrowth(state) ? '' : `<div class="star-pool" title="Gwiazdki ewolucji — wspólne dla drużyny">${starTokens(player.stars ?? 0, { fresh: freshStars })}</div>`}
        ${keyBagRow(state, player)}
      </section>
      ${gymsEnabled(state) ? `<section class="mat-sec badges"><h4>🏅 Odznaki <span class="muted">${player.badges.length}/${leagueBadges(state.config)} do Ligi</span></h4>${badgeCase(state, player, { fresh: ui.fresh?.badge?.[player.id] })}</section>` : ''}
      ${questsEnabled(state) ? `<section class="mat-sec missions"><h4>📜 Aktywne misje <span class="count">${player.quests?.length ?? 0}/${maxQuests}</span></h4><div class="mission-row">${quests}</div></section>` : ''}
      <section class="mat-sec dex"><h4>📕 Pokédex</h4>${dexSummary(player, state.config)}<button class="dex-btn" data-ui="open-dex" data-player="${player.id}">📕 Otwórz Pokédex</button></section>
    </div>`;
}

export { avatar };

// ==== P1.5: the overlay HUD — the map is the table, the UI floats over it ===========
// Four widgets over a full-viewport board: the system widget (top-right: week,
// Pokédex, settings, the other players), the active player (bottom-left: a
// fixed-size summary — never grows with the team), the floating actions
// (bottom-right) and the player popup (team 3 × 2, missions, items, badges).
// The legacy top bar / bottom mat above: no table shows them since SYS-27 (16.10) — the tests use them as the list of a player's controls.

const ballIcon = (id) => (id === 'superball' ? superballSvg(16) : pokeballSvg(16));

// EREV UI: the quest book is always one tap away (top right, next to the Pokédex) — a dot
// when something can be done here (take, collect, a challenge); it no longer hides behind
// „•••” among the action chips.
function bookButton(state, active) {
  if (!active.questBook) return '';
  const now = state.phase === 'turn' && getLegalActions(state).some((a) => ['takeQuest', 'takeOffer', 'claimQuest', 'questChallenge', 'questEncounter'].includes(a.type)); // + Living Kanto 2.0: a board card to take
  return `<button class="sq glass book-btn${now ? ' now' : ''}" data-ui="open-book" aria-label="Księga zadań${now ? ' — coś do zrobienia tutaj' : ''}">📜${now ? '<i class="sq-dot" aria-hidden="true"></i>' : ''}</button>`;
}

// PLAYTEST_010 (PT010-06): „⏭ Pomiń turę AI” — in the AI's turn when a human plays too; while it skips: „⏩ Pomijam…”
// (main.js ui.skipAi: the pauses go, the game's logic, dice and save stay)
// PLAYTEST_011 P1: in the AI's hidden turn, a quiet line of who plays (never covering the board)
function aiTurnPill(state, ui) {
  const active = currentPlayer(state);
  if (!ui?.hideAi || state.phase === 'over' || active.controller !== 'ai' || !state.players.some((p) => p.controller !== 'ai')) return '';
  return `<span class="glass ai-turn" style="--pc:${active.color}" aria-live="polite">Teraz gra <b>${esc(active.name)}</b> (AI)…</span>`;
}
function skipAiButton(state, ui) {
  const active = currentPlayer(state);
  if (state.phase === 'over' || active.controller !== 'ai' || !state.players.some((p) => p.controller !== 'ai')) return '';
  return ui.skipAi
    ? `<button class="glass skip-ai on" disabled aria-live="polite">⏩ Pomijam turę ${esc(active.name)}…</button>`
    : `<button class="glass skip-ai" data-ui="skip-ai">⏭ Pomiń turę AI</button>`;
}
export function renderSystemWidget(state, ui) {
  const active = currentPlayer(state);
  const others = state.players.filter((p) => p.id !== active.id)
    .map((p) => `<button class="sq sys-player" style="--pc:${p.color}" data-ui="open-mat" data-player="${p.id}" aria-label="Plansza gracza ${esc(p.name)}"><span class="ct-initial">${esc(p.name[0])}</span>${tokenArt(playerTokenId(p))}${p.league?.champion ? '<i class="crown-mini">👑</i>' : ''}</button>`).join('');
  return `
    <div class="sys">
      <span class="week glass" aria-label="Tydzień ${state.turn.round}">TYDZIEŃ ${state.turn.round}</span>
      <div class="sys-row">
        <button class="sq glass" data-ui="open-dex" data-player="${active.id}" aria-label="Pokédex">📕</button>
        ${bookButton(state, active)}
        ${active.achievements || state.trophies ? '<button class="sq glass" data-ui="open-trophies" aria-label="Osiągnięcia">🏆</button>' : ''}
        ${usesVictory(state.config) ? '<button class="sq glass" data-ui="open-score" aria-label="Punkty">⭐</button>' : ''}
        <button class="sq glass" data-ui="settings" aria-label="Ustawienia">⚙️</button>
        ${others}
      </div>
      ${aiTurnPill(state, ui)}${skipAiButton(state, ui)}
      ${finalWeekBanner(state)}
    </div>`;
}

// One HP bar, no hearts beside it.
function hpBar(mon) {
  const pct = Math.round((Math.max(0, mon.hp) / mon.maxHp) * 100);
  const zone = mon.hp <= 0 ? 'out' : pct > 60 ? 'green' : pct > 30 ? 'yellow' : 'red';
  return `<span class="pw-hp z-${zone}" role="img" aria-label="HP ${mon.hp} z ${mon.maxHp}"><i style="width:${pct}%"></i></span>`;
}

// The player's resources as round coins with an outline (Build 2.4): money and
// balls — the Super Ball only when there is one.
function resCoins(player, state = null) {
  const coin = (icon, n, title) => `<span class="coin" title="${title}"><i>${icon}</i><b>${n}</b></span>`;
  return (state && usesVictory(state.config) ? `<span class="coin score-coin" title="Punkty"><i>⭐</i><b>${scoreOf(state, player).total}</b></span>` : '') + coin('💰', player.money, 'Pieniądze') + coin(ballIcon('pokeball'), player.pokeballs, 'Poké Balle') + (itemCount(player, 'superball') > 0 ? coin(ballIcon('superball'), itemCount(player, 'superball'), 'Great Balle') : '');
}
function actionDots(state, player, spend = 0) {
  const active = currentPlayer(state);
  if (player.id !== active.id || state.phase === 'over') return '';
  const n = Math.max(state.config.actionsPerTurn, state.turn.actionsRemaining);
  return `<span class="pw-acts" aria-label="Akcje: ${state.turn.actionsRemaining}">${Array.from({ length: n }, (_, i) => `<i class="${dotCls(i, state.turn.actionsRemaining, spend)}"></i>`).join('')}</span>`;
}
// A Pokémon as a token (Build 2.4): the round portrait, its name over the
// token's lower edge, the HP bar under the name.
// PT010-09: its status (the engine's — a battle's arena status too) as a coloured dot with the icon; COMBAT 2.1 poison
// was the only one before.
const ownStatus = (state, mon) => (usesCombatMoves(state.config) ? statusOf(state.encounter, mon.uid, mon) : mon.status ?? null);
const ownPhase = (state, mon) => sleepPhasePl(state.config, ownStatus(state, mon)) || null; // COMBAT 2.2: the counted sleep's phase
function monToken(mon, lead, st = mon.status ?? null) {
  const s = getSpecies(mon.species);
  const on = st && mon.hp > 0 ? STATUS_BADGE[st.id] : null;
  return `<span class="mt${lead ? ' lead' : ''}${mon.hp <= 0 ? ' fainted' : ''}${on ? ` has-st st-${st.id}${st.id === 'poison' ? ' poisoned' : ''}` : ''}">${teamDot(mon)}${on ? `<i class="mt-st" title="${on[1]}">${on[0]}</i>` : ''}<b class="mt-name">${esc(s.name)}</b>${hpBar(mon)}</span>`;
}

// The player widget (Build 2.4, Piotr's layout): the hero token is the core —
// the coins (money, balls) above it, the action dots left of it, the name
// beside it — and under it a small plate with every Pokémon as a token. Tap →
// the player popup. In a battle / scene: the hero token and the coins only.
export function playerWidget(state, player, ui, { collapsed = false } = {}) {
  const hero = (size = '') => heroToken(player, size); // the character's portrait token (tokens.js)
  if (collapsed) return `<button class="pw glass collapsed" style="--pc:${player.color}" data-ui="toggle-mat" aria-label="Drużyna i przedmioty: ${esc(player.name)}">${hero('small')}<span class="pw-res">${resCoins(player, state)}</span></button>`;
  const lead = getLead(player);
  return `
    <button class="pw" style="--pc:${player.color}" data-ui="toggle-mat" aria-label="Otwórz planszę gracza: ${esc(player.name)}">
      <span class="pw-res">${resCoins(player, state)}</span>
      <span class="pw-mid">${actionDots(state, player, spendOf(ui))}${hero()}<span class="pw-name"><b>${esc(player.name.toUpperCase())}</b>${player.controller === 'ai' ? '<small class="tag">AI</small>' : ''}</span></span>
      <span class="pw-plate glass${player.team.length > 3 ? ' big-team' : ''}" style="--cols:${Math.min(3, Math.max(1, player.team.length))}">${player.team.map((m) => monToken(m, m === lead, ownStatus(state, m))).join('') || '<small>brak Pokémonów</small>'}</span>
    </button>`;
}

// Contextual actions (max 3 + •••) over 🌿 Eksploruj / ⏭ Koniec.
// PLAYTEST_007 stage 1 (PT007-02 / 03): a quest's action where the player stands is ON the action bar — not only
// inside the 📜 book: „📍 Spotkanie: Scyther”, „⚔️ Wyzwanie: …”, „🎁 Odbierz nagrodę”, a heard rumour's quest to
// take. A quest whose step is here but not now says exactly why (questBookEngine.nextStep / takeBlock — the same
// checks as the legal actions; nothing is decided here).
function questChips(state, active, legal) {
  if (!active.questBook) return [];
  const out = [];
  const title = (id) => QUESTBOOK_PL[id]?.title ?? id;
  // KANTO WORLD DISTRIBUTION (worldDist 'w1', PT014-07): several rewards ready here → one chip collects them all
  const all = legal.find((x) => x.type === 'claimAll');
  if (all) out.push(`<button class="chip glass quest-act" ${actAttr(all)}>🎁 Odbierz nagrody: ${legal.filter((x) => x.type === 'claimQuest').length}</button>`);
  for (const a of active.questBook.active) {
    const q = questOf(a);
    const step = nextStep(state, active, a);
    if (all && step.kind === 'claim') continue; // collected by the chip above
    if (step.action && legal.some((x) => x.type === step.action.type && x.occ === step.action.occ)) {
      const o = q.stages[step.stage]?.objectives.find((x) => x.kind === step.kind && x.place === step.place);
      const label = step.kind === 'claim' ? `🎁 Odbierz nagrodę: ${esc(a.def ? offerTitlePl(a.def.lk) : title(q.id))}`
        : step.kind === 'encounter' ? (o.legend ? `⚡ Legenda: ${esc(getSpecies(o.species).name)} <small>1 akcja · Ultra Ball</small>` : `📍 Spotkanie: ${esc(getSpecies(o.species).name)} <small>1 akcja</small>`)
        : `⚔️ Wyzwanie: ${esc(CHALLENGE_PL[o.name] ?? o.name)} <small>1 akcja</small>`;
      out.push(`<button class="chip glass quest-act" ${actAttr(step.action)}>${label}</button>`);
    } else if (step.block && (step.block.code === 'stepsFirst' || (step.place === active.location && !['goTo', 'busy'].includes(step.block.code)))) {
      out.push(`<span class="chip glass quest-why">📜 ${esc(nextStepPl(step, q))}</span>`);
    }
  }
  // UX-4 (NIGHTSHIFT, 19.10): an epic line to take here is on the bar too (not only inside the 📜 book)
  for (const take of legal.filter((x) => x.type === 'takeQuest' && bookQuest(x.quest)?.epic)) out.push(`<button class="chip glass quest-act" ${actAttr(take)}>📜 Weź zadanie: ${esc(title(take.quest))}</button>`);
  // PLAYTEST_019 PT019-01: an HM / TM quest to take here is on the bar too (the HM Lot was missed inside the Journal)
  for (const take of legal.filter((x) => x.type === 'takeQuest' && isCampaignQuest(state.config, x.quest))) out.push(`<button class="chip glass quest-act" ${actAttr(take)}>🚩 Weź zadanie: ${esc(title(take.quest))}</button>`); // ROCKET-2 R1.1: the city's liberation
  for (const take of legal.filter((x) => x.type === 'takeQuest' && fieldQuestIcon(x.quest))) out.push(`<button class="chip glass quest-act" ${actAttr(take)}>${fieldQuestIcon(take.quest)} Weź zadanie: ${esc(title(take.quest))}</button>`);
  // a heard rumour's quest (or one given up and allowed again) at its start place
  for (const r of rumourList(state, active)) {
    if (r.start !== active.location || !['heard', 'abandoned'].includes(r.phase) || isCampaignQuest(state.config, r.quest)) continue; // ROCKET-2: its own chip above
    const take = legal.find((x) => x.type === 'takeQuest' && x.quest === r.quest);
    if (take) out.push(`<button class="chip glass quest-act" ${actAttr(take)}>📜 Weź zadanie: ${esc(title(r.quest))}</button>`);
    else {
      const why = takeBlockPl(takeBlock(state, active, bookQuest(r.quest)));
      if (why) out.push(`<span class="chip glass quest-why">📜 ${esc(title(r.quest))}: ${esc(why)}</span>`);
    }
  }
  return out;
}

export function floatingActions(state, player, ui) {
  const active = currentPlayer(state);
  if (player.id !== active.id) return '';
  if (active.controller !== 'human') return `<div class="fab"><span class="fab-note glass" style="--pc:${active.color}">${esc(active.name)} (AI) gra…</span></div>`;
  if (state.growthChoice) return `<div class="fab"><span class="fab-note glass">⭐ Wybierz, kto dostaje ${state.config.rules.exp ? 'EXP' : 'punkt treningu'}</span></div>`;
  if (state.boxChoice) return `<div class="fab"><span class="fab-note glass">${gi('box')} Drużyna pełna — do drużyny czy do Oaka?</span></div>`;
  if (state.oakJobDraft) return `<div class="fab"><span class="fab-note glass">${gi('oak.lab')} Wybierz Pokémony do zadania Profesora Oaka</span></div>`;
  if (state.battlePrep) return '<div class="fab"><span class="fab-note glass">⚔️ Kto zaczyna walkę?</span></div>';
  if (state.phase !== 'turn' || ui.busy) return '';
  const legal = getLegalActions(state);
  if (usesUx(state.config)) return floatingActionsUx(state, active, ui, legal); // UX-2211: the four groups
  const has = (type) => legal.some((a) => a.type === type);
  const chips = questChips(state, active, legal); // PLAYTEST_007: the quest's step here comes first
  const canFly = legal.some((a) => a.type === 'fly'); // FLY-2 (rules.fly): a flight possible now — right after the quest's step
  if (canFly) chips.push(`<button class="chip glass" data-ui="open-fly">🪽 Lot <small>cała tura</small></button>`);
  if (has('cut')) chips.push(`<button class="chip glass" ${actAttr({ type: 'cut' })}>🌳 Zetnij <small>1 akcja</small></button>`); // CUT-1 (rules.cut): the bush here
  else if (cutShown(state, active)) chips.push('<button class="chip glass off" data-ui="open-cut">🌳 Zetnij</button>'); // CUT-1: dimmed — a tap says why
  const canRide = has('ride'); // BIKE-1 (rules.bike): a ride open now — 1 action, two places
  if (canRide) chips.push(`<button class="chip glass" data-ui="open-bike">🚲 Rower <small>${usesBike2(state.config) ? '2 akcje' : '1 akcja'}</small></button>`); // BIKE V2: 2 actions
  const canTm = has('useTm') || has('evoMove'); // TM-3 (rules.tms): a TM a Pokémon of the team can take now — free; TM-4: a move at evolution
  if (canTm) chips.push('<button class="chip glass" data-ui="open-tm">💿 Naucz ruchu</button>');
  // PLAYTEST_007 stage 4: back from a place the Journal pointed at
  if (ui.journalReturn) chips.unshift(`<button class="chip glass quest-act" data-ui="journal-open" data-id="${esc(ui.journalReturn)}">📖 Wróć do Dziennika</button>`);
  // Living Kanto 2.0: this city's offer board — how many cards can be taken here (the Journal's „Dostępne” shows them)
  const offers = legal.filter((a) => a.type === 'takeOffer').length;
  if (offers) chips.push(`<button class="chip glass quest-act" data-ui="open-book">📋 ${state.livingKanto?.stops?.[active.location] ? 'Tablica zleceń' : 'Zlecenie w terenie'}: ${offers} do wzięcia</button>`); // E2: a field card here
  // Macro 01: the emergency Poké Ball first (one tap, at any Poké Stop or in
  // Pallet Town), then Professor Oak's lab (the Research Jobs, Pallet Town)
  if (has('oakKit')) chips.push(`<button class="chip glass now" ${actAttr({ type: 'oakKit' })}>${gi('oak.kit')} Awaryjny Poké Ball</button>`);
  if (usesOakJobs(state) && atOakLab(state, active)) chips.push(`<button class="chip glass" data-ui="open-oak">${gi('oak.lab')} Prof. Oak</button>`);
  chips.push(...pokeStopButtons(state, legal, (attrs, label, disabled) => `<button class="chip glass" ${attrs}${disabled ? ' disabled' : ''}>${label}</button>`));
  if (has('fish')) chips.push(`<button class="chip glass" ${actAttr({ type: 'fish' })}>🎣 Łów <small>1 akcja</small></button>`); // bonus 14.10: the Old Rod
  if (!canFly && flyShown(state, active, legal)) chips.push('<button class="chip glass off" data-ui="open-fly">🪽 Lot</button>'); // FLY-2: dimmed — a tap says what is missing
  if (!canRide && bikeShown(state, active, legal)) chips.push('<button class="chip glass off" data-ui="open-bike">🚲 Rower</button>'); // BIKE-1: dimmed — a tap says why
  if (!canTm && tmShown(state, active)) chips.push('<button class="chip glass off" data-ui="open-tm">💿 Naucz ruchu</button>'); // TM-3: dimmed — a tap shows why
  // One Kanto day 14.10: a trade / a duel with another player standing here
  for (const a of legal.filter((x) => x.type === 'tradeOpen' || x.type === 'pvpChallenge')) chips.push(`<button class="chip glass" ${actAttr(a)}>${a.type === 'tradeOpen' ? '🔄 Wymiana' : '⚔️ Pojedynek'} z ${esc(state.players.find((p) => p.id === a.with).name)}</button>`);
  if (gymsEnabled(state) && gymHere(state, active)) chips.push(`<button class="chip glass" data-ui="open-gym">🏟️ Sala${hasBadge(active, gymHere(state, active).id) ? ' ✓' : ''}</button>`);
  if (gymsEnabled(state) && leagueHere(state, active)) chips.push('<button class="chip glass" data-ui="open-gym">🏆 Liga</button>');
  if (state.hunts?.active) {
    // Build 3.3 E4: the rare hunt — with a clue its place, without one its region; the turns left for you
    const h = state.hunts.active;
    const where = active.clues?.includes(h.id) ? placeName(h.place) : huntDef(state.config, h.id).region.map(placeName).join(' / ');
    const left = huntTurnsLeft(state, active);
    chips.push(`<span class="chip glass hunt" title="Polowanie">🎯 ${esc(getSpecies(h.species).name)} — ${esc(where)}${left > 0 ? ` · ${left === 1 ? 'ostatnia tura' : `jeszcze ${left} tury`}` : ' · nie dla Ciebie'}</span>`); // EREV-04: own turns left, this one included
  }
  // EREV UI: the quest book's button lives in the top-right corner (renderSystemWidget), always visible
  if (has('rest')) chips.push('<button class="chip glass" data-ui="open-rest">💤 Odpocznij</button>');
  if (has('challengeRocket')) chips.push('<button class="chip glass" data-ui="open-rocket">🎈 Rocket</button>');
  const shown = ui.moreActions || chips.length <= 3 ? chips : [...chips.slice(0, 3), '<button class="chip glass more" data-ui="more-actions" aria-label="Więcej akcji">•••</button>'];
  const explores = legal.filter((a) => a.type === 'explore');
  const main = !explores.length && state.turn.actionsRemaining > 0 && !hasHealthyPokemon(active)
    ? `<span class="fab-hint glass">😵 Drużyna zemdlała — idź do Poké Stopu (P)${itemCount(active, 'revive') ? ' albo użyj 💎 Revive (dotknij swojego widgetu)' : ''}</span>`
    : explores.length === 1 ? `<button class="fab-main" ${actAttr(explores[0])}>🌿 Eksploruj${tiredMarks(state, active)}</button>` : `<button class="fab-main" data-ui="open-explore"${explores.length ? '' : ' disabled'}>🌿 Eksploruj${tiredMarks(state, active)}</button>`;
  return `
    <div class="fab">
      ${shown.length ? `<div class="fab-chips">${shown.join('')}</div>` : ''}
      <div class="fab-row"><button class="fab-end glass${state.turn.actionsRemaining === 0 ? ' now' : ''}" data-ui="end-turn">${ui.confirmEnd ? 'Na pewno koniec?' : '⏭ Koniec'}</button>${main}</div>
    </div>`;
}

// UX-2211 (ChatGPT 22.11 §4; rules.ux 'u1', a DEV pilot of the table — docs/design/UX_AUDIT_2211.md §4): the action panel in
// FOUR groups — 📍 TUTAJ (this place: the quest steps, the offers, Oak, the shop, the gym, Team Rocket, the bush, fishing, a
// trade / a duel), 🧭 PODRÓŻ (walking in words, the bike, the flight, Surf in words), 👥 DRUŻYNA (the Pokémon, healing, rest,
// the evolutions ready now, the moves to learn), 🎒 PLECAK (the items, the key items and HMs, the 💿 TMs). The SAME buttons
// and legal actions as the older bar (questChips, pokeStopButtons …) — only sorted; „🌿 Eksploruj” and „⏭ Koniec” stay one
// tap. A number on a group: something waits there (a quest step here, an evolution, a move, a new TM); the group with a quest
// step here opens by itself (nothing important hides behind „•••”). One group open at a time (ui.uxGroup, main.js).
const UX_GROUPS = Object.freeze([
  { key: 'here', icon: '📍', label: 'Tutaj' },
  { key: 'travel', icon: '🧭', label: 'Podróż' },
  { key: 'team', icon: '👥', label: 'Drużyna' },
  { key: 'bag', icon: '🎒', label: 'Plecak' },
]);
const UX_EMPTY = Object.freeze({ here: 'Tutaj nic więcej — eksploruj albo idź dalej.', travel: '', team: '', bag: '' });
function uxGroupsOf(state, active, ui, legal) {
  const has = (type) => legal.some((a) => a.type === type);
  const chip = (attrs, label, cls = '') => `<button class="chip glass${cls ? ` ${cls}` : ''}" ${attrs}>${label}</button>`;
  const note = (text) => `<span class="ux-note">${text}</span>`;
  const [stopA, stopB] = pokeStopButtons(state, legal, (attrs, label, disabled) => `<button class="chip glass" ${attrs}${disabled ? ' disabled' : ''}>${label}</button>`);
  const v2 = pokeStopV2(state) && !healOnlySpot(active.location, state.config); // heal + shop: the heal goes to DRUŻYNA
  // 📍 TUTAJ
  const quest = questChips(state, active, legal);
  const here = [...quest];
  if (ui.journalReturn) here.unshift(`<button class="chip glass quest-act" data-ui="journal-open" data-id="${esc(ui.journalReturn)}">📖 Wróć do Dziennika</button>`);
  const offers = legal.filter((a) => a.type === 'takeOffer').length;
  if (offers) here.push(chip('data-ui="open-book"', `📋 ${state.livingKanto?.stops?.[active.location] ? 'Tablica zleceń' : 'Zlecenie w terenie'}: ${offers} do wzięcia`, 'quest-act'));
  if (has('oakKit')) here.push(chip(actAttr({ type: 'oakKit' }), `${gi('oak.kit')} Awaryjny Poké Ball`, 'now'));
  if (usesOakJobs(state) && atOakLab(state, active)) here.push(chip('data-ui="open-oak"', `${gi('oak.lab')} Prof. Oak`));
  if (v2 && stopB) here.push(stopB); // the shop (or „Sklep zamknięty — Team Rocket”)
  if (!v2 && stopA && !healOnlySpot(active.location, state.config)) here.push(stopA); // Build 2's one Poké Stop visit
  if (gymsEnabled(state) && gymHere(state, active)) here.push(chip('data-ui="open-gym"', `🏟️ Sala${hasBadge(active, gymHere(state, active).id) ? ' ✓' : ''}`));
  if (gymsEnabled(state) && leagueHere(state, active)) here.push(chip('data-ui="open-gym"', '🏆 Liga'));
  if (has('challengeRocket')) here.push(chip('data-ui="open-rocket"', '🎈 Team Rocket'));
  if (has('cut')) here.push(chip(actAttr({ type: 'cut' }), '🌳 Zetnij <small>1 akcja</small>'));
  else if (cutShown(state, active)) here.push(chip('data-ui="open-cut"', '🌳 Zetnij', 'off'));
  if (has('fish')) here.push(chip(actAttr({ type: 'fish' }), '🎣 Łów <small>1 akcja</small>'));
  for (const a of legal.filter((x) => x.type === 'tradeOpen' || x.type === 'pvpChallenge')) here.push(chip(actAttr(a), `${a.type === 'tradeOpen' ? '🔄 Wymiana' : '⚔️ Pojedynek'} z ${esc(state.players.find((p) => p.id === a.with).name)}`));
  if (state.hunts?.active) {
    const h = state.hunts.active;
    const where = active.clues?.includes(h.id) ? placeName(h.place) : huntDef(state.config, h.id).region.map(placeName).join(' / ');
    const left = huntTurnsLeft(state, active);
    here.push(`<span class="chip glass hunt" title="Polowanie">🎯 ${esc(getSpecies(h.species).name)} — ${esc(where)}${left > 0 ? ` · ${left === 1 ? 'ostatnia tura' : `jeszcze ${left} tury`}` : ' · nie dla Ciebie'}</span>`);
  }
  // 🧭 PODRÓŻ
  const canRide = has('ride');
  const canFly = legal.some((a) => a.type === 'fly');
  const travel = [note(legal.some((a) => a.type === 'move') ? '👣 Idź: dotknij świecące pole na mapie <small>1 akcja</small>' : '👣 Teraz nie pójdziesz dalej')];
  if (canRide) travel.push(chip('data-ui="open-bike"', `🚲 Rower <small>${usesBike2(state.config) ? '2 akcje' : '1 akcja'}</small>`)); // BIKE V2: 2 actions
  else if (bikeShown(state, active, legal)) travel.push(chip('data-ui="open-bike"', '🚲 Rower', 'off'));
  if (canFly) travel.push(chip('data-ui="open-fly"', '🪽 Lot <small>cała tura</small>'));
  else if (flyShown(state, active, legal)) travel.push(chip('data-ui="open-fly"', '🪽 Lot', 'off'));
  if (usesSurf(state.config)) travel.push(note(canSurf(active, state.config) ? '🌊 Surf: trasy wodne otwarte — płyniesz jak idziesz' : `🌊 Surf: ${esc(surfBlockerPl(surfBlockers(active, state.config)[0]) ?? 'jeszcze nie')}`));
  // 👥 DRUŻYNA
  const evolves = legal.filter((a) => a.type === 'evolve');
  const canTm = has('useTm') || has('evoMove');
  const team = [chip('data-ui="toggle-mat"', '👥 Pokémony')];
  if (v2 && stopA) team.push(stopA); // Leczenie in the Poké Stop
  if (healOnlySpot(active.location, state.config) && stopA) team.push(stopA); // the Poké Center / Oak's heal
  if (has('rest')) team.push(chip('data-ui="open-rest"', '💤 Odpocznij'));
  for (const e of evolves) {
    const mon = active.team.find((m) => m.uid === e.target);
    const to = e.to ? getSpecies(e.to) : evolutionTarget(getSpecies(mon.species));
    team.push(chip(actAttr(e), `✨ ${esc(getSpecies(mon.species).name)} → ${esc(to.name)}`, 'quest-act'));
  }
  if (canTm) team.push(chip('data-ui="open-tm"', '💿 Trening i ruchy'));
  else if (tmShown(state, active)) team.push(chip('data-ui="open-tm"', '💿 Trening i ruchy', 'off'));
  // 🎒 PLECAK
  const fresh = newTms(state, active).length;
  const bag = [chip(`data-ui="open-bag" data-player="${esc(active.id)}" data-tab="items"`, '🎒 Przedmioty'), chip(`data-ui="open-bag" data-player="${esc(active.id)}" data-tab="keys"`, '🗝️ Kluczowe i HM')];
  if (usesTms(state.config)) bag.push(chip(`data-ui="open-bag" data-player="${esc(active.id)}" data-tab="tm"`, `💿 TM${fresh ? ` <small>nowe: ${fresh}</small>` : ''}`, fresh ? 'quest-act' : ''));
  const now = quest.filter((h) => h.includes('quest-act')).length;
  return {
    items: { here, travel, team, bag },
    counts: { here: now, travel: canRide || canFly ? '•' : 0, team: evolves.length + (canTm ? 1 : 0), bag: fresh },
    now,
  };
}
function floatingActionsUx(state, active, ui, legal) {
  const { items, counts, now } = uxGroupsOf(state, active, ui, legal);
  const turn = `${state.turn.round}.${state.turn.playerIndex}`;
  const open = ui.uxGroup?.turn === turn ? ui.uxGroup.key : now ? 'here' : 'none';
  const g = UX_GROUPS.find((x) => x.key === open);
  const list = g ? items[g.key] : [];
  const panel = g ? `<div class="ux-panel glass-strong" role="group" aria-label="${esc(g.label)}"><div class="ux-head">${g.icon} ${esc(g.label.toUpperCase())}</div><div class="ux-items">${list.length ? list.join('') : `<span class="ux-note">${UX_EMPTY[g.key] || 'Nic tu teraz.'}</span>`}</div></div>` : '';
  const groups = UX_GROUPS.map((x) => {
    const n = counts[x.key];
    return `<button class="ux-group glass${open === x.key ? ' on' : ''}" data-ui="ux-group" data-group="${x.key}" data-open="${open === x.key ? 1 : 0}" aria-expanded="${open === x.key}" aria-label="${esc(x.label)}${n ? ` — coś czeka` : ''}"><span class="ug-ic" aria-hidden="true">${x.icon}</span><span class="ug-l">${esc(x.label)}</span>${n ? `<i class="ug-n${n === '•' ? ' dot' : ''}">${n === '•' ? '' : n}</i>` : ''}</button>`;
  }).join('');
  const explores = legal.filter((a) => a.type === 'explore');
  const main = !explores.length && state.turn.actionsRemaining > 0 && !hasHealthyPokemon(active)
    ? `<span class="fab-hint glass">😵 Drużyna zemdlała — idź do Poké Stopu (P)${itemCount(active, 'revive') ? ' albo użyj 💎 Revive (👥 Drużyna)' : ''}</span>`
    : explores.length === 1 ? `<button class="fab-main" ${actAttr(explores[0])}>🌿 Eksploruj${tiredMarks(state, active)}</button>` : `<button class="fab-main" data-ui="open-explore"${explores.length ? '' : ' disabled'}>🌿 Eksploruj${tiredMarks(state, active)}</button>`;
  return `
    <div class="fab ux">
      ${panel}
      <div class="ux-groups">${groups}</div>
      <div class="fab-row"><button class="fab-end glass${state.turn.actionsRemaining === 0 ? ' now' : ''}" data-ui="end-turn">${ui.confirmEnd ? 'Na pewno koniec?' : '⏭ Koniec'}</button>${main}</div>
    </div>`;
}

// The quick actions of the Pokémon detail (P1.5b, tap a card): only the legal
// ones, only for the player whose turn it is; ✏️ Kadr always.
export function detailActions(state, mon, { busy = false } = {}) {
  const player = state.players.find((p) => p.team.includes(mon) || p.reserve.includes(mon));
  const active = currentPlayer(state);
  const s = getSpecies(mon.species);
  const canAct = Boolean(player) && player.id === active.id && player.controller === 'human' && ['turn', 'league', 'challenge'].includes(state.phase) && !busy;
  const legal = canAct ? getLegalActions(state) : [];
  const find = (pred) => legal.find(pred);
  const acts = [];
  // Gameplay P1: a Pokémon in Oak's Box comes back to the team in a Poké Stop city.
  if (player?.reserve.includes(mon)) {
    if (!usesOakBox(state)) return '';
    const ins = legal.filter((a) => a.type === 'boxIn' && a.target === mon.uid);
    if (!ins.length) return canAct || player.id === active.id ? `<p class="small muted">${gi('box')} Box Oaka: do drużyny w mieście z Poké Stopem.</p>` : '';
    if (!ins[0].swap) return `<button class="primary" ${actAttr(ins[0])}>${gi('box')} Do drużyny</button>`;
    return `<p class="small">${gi('box')} Do drużyny — kto jedzie do Boxu Oaka?</p>${ins.map((a) => `<button ${actAttr(a)}>${esc(getSpecies(player.team.find((m) => m.uid === a.swap).species).name)}</button>`).join('')}`;
  }
  if (canAct) {
    const evos = legal.filter((a) => a.type === 'evolve' && a.target === mon.uid);
    const edges = growthEdges(mon, state.config.rules);
    for (const evo of evos) {
      // bonus 14.10: a branching species shows one button per form („✨ Ewoluuj → Vaporeon 💧”)
      const to = evo.to ? getSpecies(evo.to) : evolutionTarget(s);
      const item = evo.to ? edges.find((x) => x.to === evo.to)?.item : usesGrowth(state) ? s.evolution?.item : null;
      acts.push(`<button class="primary" ${actAttr(evo)}>✨ Ewoluuj → ${esc(to.name)}${item ? ` ${itemIc(item)}` : ''}</button>`);
    }
    for (const item of usableItems(state.config)) {
      const use = find((a) => a.type === 'useItem' && a.item === item && a.target === mon.uid);
      if (use) acts.push(`<button ${actAttr(use)}>${itemLabel(item)}</button>`);
    }
    const rest = find((a) => a.type === 'rest' && a.target === mon.uid);
    if (rest) acts.push(`<button ${actAttr(rest)}>💤 Odpocznij +${restHeal(state.config) + restBonus(state, player)} <small>(1 akcja)</small></button>`);
    const out = find((a) => a.type === 'boxOut' && a.target === mon.uid);
    if (out) acts.push(`<button ${actAttr(out)}>${gi('box')} Do Boxu Oaka</button>`);
    // PT019-02: READY but fainted — the evolution waits for a heal (said, never a silent missing button)
    if (!evos.length && usesGrowth(state) && state.phase === 'turn' && growthReady(mon, state.config.rules) && mon.hp === 0) acts.push('<button disabled>✨ gotowy, ale zemdlał — najpierw wylecz (Poké Stop albo Revive)</button>');
    if (!evos.length && usesGrowth(state) && state.phase === 'turn' && growthReady(mon, state.config.rules) && mon.hp > 0) {
      const why = evolveBlocker(state, player, mon) ?? '';
      // bonus 2: an Eevee needs any of its three stones
      const items = s.evolution?.item ? [s.evolution.item] : edges.map((e) => e.item).filter(Boolean);
      acts.push(`<button disabled>${/Stone/.test(why) ? `✨ potrzebny ${items.map((i) => `${itemIc(i)} ${esc(ITEMS[i].name)}`).join(' / ')}` : '✨ ewolucja w następnej turze'}</button>`);
    }
  }
  return acts.join('');
}

// The player popup (Build 2.4, Piotr's layout): the big hero token in the top
// left corner and the board unfolding under it — the team as cards (empty slots
// show what is missing; the active Pokémon has the gold frame and AKTYWNY; drag
// a card to change the order, tap it for the detail) — missions beside it,
// items under the missions. No counters, no money / badge pills in the header.
// PLAYTEST_009 (PT009-08): a game with the Trainer Journal shows its missions ONLY in the Journal — the popup keeps a
// button to it, not a second (older) list of the mission cards.
export function playerPopup(state, player, ui) {
  const active = currentPlayer(state);
  const isActive = player.id === active.id;
  const lead = getLead(player);
  const canOrder = isActive && player.controller === 'human' && ['turn', 'league', 'challenge'].includes(state.phase) && !ui.busy && player.team.length > 1;
  const cells = Array.from({ length: state.config.maxTeamSize }, (_, i) => {
    const mon = player.team[i];
    if (!mon) return '<div class="tg-cell empty" aria-label="wolne miejsce"></div>';
    return `<div class="tg-cell${mon === lead ? ' lead' : ''}" data-uid="${esc(mon.uid)}" data-slot="${i}"${canOrder ? ' data-drag-mon' : ''}>${mon === lead ? '<span class="tg-active">AKTYWNY</span>' : ''}${pokemonCard(mon, { size: 'm', lead: mon === lead, growth: growthRules(state), family: true, edit: true, status: ownStatus(state, mon), statusPhase: ownPhase(state, mon) })}</div>`;
  }).join('');
  const maxQuests = state.config.quests?.maxActive ?? 2;
  const items = [['💰', 'Pieniądze', player.money], [ballIcon('pokeball'), 'Poké Ball', player.pokeballs], [ballIcon('superball'), 'Great Ball', itemCount(player, 'superball')],
    ...bagItems(state, player).map((id) => [itemIc(id), ITEM_PL[id], itemCount(player, id)]),
    ...(usesGrowth(state) ? STONE_IDS.filter((id) => itemCount(player, id) > 0).map((id) => [itemIc(id), ITEMS[id].name, itemCount(player, id)]) : []),
    ...(player.reserve.length && !usesOakBox(state) ? [['📦', 'Rezerwa', player.reserve.length]] : [])];
  // Gameplay P1 (DQ-95): Oak's Box — tap a Pokémon (its detail has „Do drużyny” in a Poké Stop city).
  const box = usesOakBox(state) && player.reserve.length
    ? `<section class="pop-box box"><h4>${gi('box')} BOX OAKA</h4><div class="box-row">${player.reserve.map((m) => `<button class="box-mon" data-inspect="${esc(m.uid)}" aria-label="${esc(getSpecies(m.species).name)} w Boxie Oaka">${monToken(m, false)}</button>`).join('')}</div>
      <p class="small">${isActive && canUseBox(state, player) ? 'Dotknij Pokémona, żeby zabrać go do drużyny.' : `Zamiana z drużyną w mieście z Poké Stopem${usesOakJobs(state) ? ' albo u Profesora Oaka w Pallet Town' : ''}.`}</p></section>`
    : '';
  // Macro 01: Pokémon away on Professor Oak's Research Job, and when they come back.
  const job = player.oakJob;
  const away = job
    ? `<section class="pop-box oak-away"><h4>${gi('oak.lab')} U PROFESORA OAKA</h4><div class="box-row">${job.pokemon.map((m) => `<span class="box-mon">${monToken(m, false)}</span>`).join('')}</div>
      <p class="small">${gi('oak.away')} Wracają za ${turnsPl(job.turnsLeft)} z nagrodą.</p></section>`
    : '';
  return `
    <div class="pop-scrim" data-ui="toggle-mat" aria-hidden="true"></div>
    <div class="popup glass-strong" style="--pc:${player.color}" role="dialog" aria-label="Plansza gracza ${esc(player.name)}">
      <header>${heroToken(player, 'big')}${actionDots(state, player, spendOf(ui))}<div><b class="pn">${esc(player.name)}</b>${isActive ? '' : ' <span class="tag">podgląd</span>'}<small>📍 ${esc(placeName(player.location))}${player.capabilities?.canTravelWater ? ' · 🌊' : ''}</small></div>
        <button class="x" data-ui="toggle-mat" aria-label="Zamknij">✕</button></header>
      <div class="pop-body">
        <section class="pop-team"><div class="team-grid">${cells}</div></section>
        <aside>
          ${questsEnabled(state) && !player.questBook ? `<section class="pop-box"><h4>MISJE</h4><div class="mq-col">${Array.from({ length: maxQuests }, (_, i) => missionMini(player.quests?.[i], { config: state.config })).join('')}</div></section>` : ''}
          ${player.questBook && isActive ? '<section class="pop-box"><button class="pop-journal" data-ui="open-book">📖 Dziennik Trenera <small>misje, wyprawy, plotki</small></button></section>' : ''}
          <section class="pop-box"><h4>PRZEDMIOTY</h4><div class="it-grid">${items.map(([icon, name, n]) => `<div class="it${n ? '' : ' zero'}" title="${esc(name)}"><span>${icon}</span><b>${n}</b></div>`).join('')}</div>
            ${usesGrowth(state) ? '' : `<div class="star-pool" title="Gwiazdki ewolucji">${starTokens(player.stars ?? 0)}</div>`}${keyBagRow(state, player)}</section>
          ${gymsEnabled(state) ? popupBadges(player, state.config) : ''}
          ${traitOf(player, state.config) ? `<section class="pop-box"><h4>CECHA</h4><p class="small"><b>${esc(traitOf(player, state.config).pl)}</b> — ${esc(traitOf(player, state.config).text)}</p></section>` : ''}
          ${away}
          ${box}
        </aside>
      </div>
    </div>`;
}

// Build 2.5.1 (Piotr: „nie mogę sprawdzić, jakie mam odznaki”): every gym's
// badge in the popup — the earned ones in the gym's type colour; a tap on the
// row names them (one big touch target, the slots are small).
function popupBadges(player, config) {
  const slots = gymsOf(config).map((g) => { // NIGHTSHIFT 18.10: the game's gyms
    const has = player.badges.includes(g.id);
    const art = hasBadgeArt(g.id); // BADGE-ART (22.11): the badge itself — grey and faint until earned
    return `<span class="badge-slot${has ? ' earned' : ''}${art ? ' has-art' : ''}" title="${esc(g.badge)}">${art ? badgeArt(g.id, { earned: has, label: g.badge }) : has ? gi(`type.${g.type}`) : ''}</span>`;
  }).join('');
  const extra = `${player.league?.ribbon ? `<span class="ribbon" title="Wstęga Elitarnej Czwórki">${gi('ribbon')}</span>` : ''}${player.league?.champion ? `<span class="crown" title="Mistrz Ligi">${gi('champion')}</span>` : ''}`;
  return `<section class="pop-box badges"><h4>ODZNAKI <small>${player.badges.length}/${gymsOf(config).length}</small></h4><button class="badge-case" data-ui="badge-info" data-player="${esc(player.id)}" aria-label="Odznaki: ${player.badges.length} z ${gymsOf(config).length}">${slots}${extra}</button></section>`;
}

// PLAYTEST_007 stage 4: small activity cards next to the profile — what runs now (the Journal's projection), the ones
// with an action here first; a tap opens the activity in the Journal. Never over the map during a battle / a scene.
// PLAYTEST_010 (PT010-08): every active activity, no limit — three at a time, ‹ › / a swipe scroll (ui.hudActStart; main.js),
// (PLAYTEST_011: no „1–3 / 5” counter any more); the rumours heard and not taken come last, marked USŁYSZANA. Each kind its colour: the frame, the
// label, a light tint (journal.ACTIVITY_KINDS — the Journal tile's).
export const HUD_WINDOW = 3;
export const hudWindowStart = (n, start = 0) => Math.max(0, Math.min(start ?? 0, n - HUD_WINDOW));
function activityCard(e) {
  const kind = activityKind(e); // PLAYTEST_008: the kind as on its Journal tile (icon, frame colour)
  const art = entryArt(e, { icon: kind.icon, cls: kind.cls }); // PT010-03: a board card — its archetype's picture / placeholder
  const pic = art.url ? `<img class="ac-art" src="${esc(art.url)}" alt="" draggable="false">` : `<span class="ac-art fallback${art.cls.startsWith('a-') ? ` ph-${art.cls}` : ''}" aria-hidden="true">${art.icon}</span>`;
  const where = e.destination && e.destination !== 'pokeStop' ? ` · 📍 ${esc(placeName(e.destination))}` : '';
  const stage = e.stages > 1 ? `etap ${e.currentStage}/${e.stages} · ` : '';
  const heard = e.completionStatus === 'heard';
  const line = heard ? `${STATUS_PL.heard}${where}` : e.completionStatus === 'ready' ? '🎁 odbierz nagrodę' : `${stage}${e.progress.done}/${e.progress.total}${where}`;
  return `<button class="act-card glass k-${kind.cls}${e.availableActions.some((a) => a.type !== 'abandonQuest') ? ' now' : ''}${heard ? ' heard' : ''}" data-ui="journal-open" data-id="${esc(e.activityId)}" aria-label="${esc(kind.label)}${heard ? ` (${STATUS_PL.heard.toLowerCase()})` : ''}: ${esc(e.title)} — Dziennik Trenera">${pic}<span class="ac-text"><i class="ac-kind">${esc(kind.label)}${e.tag ? ` · ${esc(e.tag)}` : ''}</i><b>${esc(e.title)}</b><small>${line}</small></span></button>`;
}
function activityStrip(state, player, ui) {
  if (!player.questBook || player.controller === 'ai') return '';
  const acts = hudCarousel(state, player);
  if (!acts.length) return '';
  const start = hudWindowStart(acts.length, ui?.hudActStart);
  const shown = acts.slice(start, start + HUD_WINDOW);
  // PLAYTEST_011 P2 (Piotr): no „1–3 / 4” above the cards — the arrows and the swipe say there is more
  const nav = acts.length > HUD_WINDOW
    ? `<div class="hud-acts-nav glass"><button class="hn-btn" data-ui="hud-acts-prev" aria-label="Poprzednie zadania"${start === 0 ? ' disabled' : ''}>‹</button><button class="hn-btn" data-ui="hud-acts-next" aria-label="Następne zadania"${start + HUD_WINDOW >= acts.length ? ' disabled' : ''}>›</button></div>`
    : '';
  return `<div class="hud-acts-wrap" data-swipe="hud-acts">${nav}<div class="hud-acts">${shown.map(activityCard).join('')}</div></div>`;
}

// PLAYTEST_011 P1: `hudPlayer` — in the AI's hidden turn the widget and the missions are the human's own (never the AI's
// hearts, coins or catches), not collapsed by the AI's unseen battle; the right corner still says „… (AI) gra…”
export function renderHud(state, player, ui, { sceneOpen = false, hudPlayer = null } = {}) {
  const active = currentPlayer(state);
  const shown = hudPlayer ?? active;
  const collapsed = (state.phase === 'encounter' && !hudPlayer) || sceneOpen;
  return `
    <div class="hud-bl">${collapsed ? '' : activityStrip(state, shown, ui)}${playerWidget(state, shown, ui, { collapsed })}</div>
    <div class="hud-br">${sceneOpen ? '' : floatingActions(state, active, ui)}</div>
    ${ui.matOpen ? playerPopup(state, player, ui) : ''}`;
}

// NIGHTSHIFT D (pilot): this week's incidents of the living world — one small pill under Team Rocket's, icon + name
// (+ until which week); nothing without the pilot.
export function worldPill(state) {
  const list = incidentsNow(state, rocketBlocks(state)).filter((x) => !x.held);
  if (!list.length) return '';
  // UX-2211 (rules.ux): each incident a button — a tap opens its card (what, where, until when, what helps: mapInfo.js)
  if (usesUx(state.config)) return `<div class="rocket glass world-pill ux" aria-label="Świat Kanto"><span class="rk-icon">🌍</span><span class="wp-list">${list.map((x) => `<button class="wp-item" data-ui="world-info" data-id="${esc(x.id)}">${INCIDENT_PL[x.id].icon} ${esc(INCIDENT_PL[x.id].name)}${x.gym ? ` <small>${esc(placeName(GYMS_BY_ID[x.gym].city))}</small>` : ''}${x.to ? ` <small>do tyg. ${x.to - 1}</small>` : ''}</button>`).join('')}</span></div>`;
  const items = list.map((x) => `<span class="wp-item">${INCIDENT_PL[x.id].icon} ${esc(INCIDENT_PL[x.id].name)}${x.gym ? ` <small>${esc(placeName(GYMS_BY_ID[x.gym].city))}</small>` : ''}${x.to ? ` <small>do tyg. ${x.to - 1}</small>` : ''}</span>`).join('');
  return `<div class="rocket glass world-pill" aria-label="Świat Kanto: ${esc(list.map((x) => INCIDENT_PL[x.id].name).join(', '))}"><span class="rk-icon">🌍</span><span class="wp-list">${items}</span></div>`;
}

// The Team Rocket plot as a small pill in the map's right strip — the full card opens on tap.
export function rocketPill(state) {
  const active = state.rocket?.active;
  if (!active) return '';
  const card = plotPl(active.plotId);
  const loot = active.loot.length ? ` · łupy ${active.loot.length}` : '';
  // 3A-4: how long it stays, in two words
  const clock = plotClockPl(state, { short: true });
  return `<button class="rocket glass" data-ui="open-rocket" aria-label="Karta spisku Team Rocket: ${esc(card.title)}${clock ? ` — ${esc(plotClockPl(state))}` : ''}"><span class="rk-icon">${gi('rocket')}</span><span><b>Team Rocket</b><small>📍 ${esc(placeName(active.location))}${loot}${clock ? ` · ${gi('rocket.clock')} ${esc(clock)}` : ''}</small></span></button>`;
}
