// UX-2211 (ChatGPT 22.11 §6; rules.ux 'u1' — a DEV pilot of the table): every mechanical mark of the map, and the world's
// pill at the top, says what it is — one card: the name, a short description, what it changes in the game now and, when
// the player can do something about it, how. Words only: no move, no action, the game state untouched. Nothing hidden is
// told (a hunt without a clue: its region only; an incident's next week is never said). Without the pilot the map keeps
// its toasts (board.js).
// A card: { icon, title, text, effect, how, buttons: [{ ui, label, data }] }.
import { GYMS_BY_ID, gymInCity } from '../data/gyms.js';
import { hasBadge } from '../engine/gymEngine.js';
import { incidentDef, incidentsNow } from '../engine/incidentEngine.js';
import { rocketBlocks } from '../engine/rocketEngine.js';
import { currentPlayer } from '../engine/gameState.js';
import { hasPokeStop, healOnlySpot } from '../engine/pokeStopEngine.js';
import { questLocations } from '../engine/questEngine.js';
import { rumourList } from '../engine/rumourEngine.js';
import { esc } from '../ui/dom.js';
import { INCIDENT_PL, QUESTBOOK_PL, placeName, questPl } from './content-pl.js';
import { journal } from './journal.js';
import { trackedEntry, trackable } from './tracker.js';

const btnOf = (ui, label, data = {}) => ({ ui, label, data });
const locate = (place) => btnOf('locate-place', `📍 ${placeName(place)}`, { place });

// The Journal's entry of a quest for this player (taken, heard or a hint) — „📖 Misja” and „📌 Śledź” on a card.
function questButtons(state, player, questId) {
  if (!player || player.controller === 'ai') return [];
  const e = journal(state, player).entries.find((x) => x.questId === questId && trackable(x));
  if (!e) return [];
  const on = trackedEntry(state, player)?.activityId === e.activityId;
  return [btnOf('journal-open', '📖 Misja', { id: e.activityId }), on ? btnOf('track-off', '📌 Śledzisz ✓', { player: player.id }) : btnOf('track', '📌 Śledź', { player: player.id, id: e.activityId })];
}

const untilPl = (x) => (x.to ? `do tygodnia ${x.to - 1}` : '');
const edgesPl = (def) => def.edges.map(([a, b]) => `${placeName(a)} ↔ ${placeName(b)}`).join(', ');

// An incident of the living world (the pill at the top, its mark on the map): what, where, until when, what helps.
export function incidentInfo(state, id) {
  const player = currentPlayer(state);
  const x = incidentsNow(state, rocketBlocks(state)).find((i) => i.id === id && !i.held);
  const def = incidentDef(id);
  const pl = INCIDENT_PL[id];
  if (!x || !def || !pl) return null;
  const card = { icon: pl.icon, title: pl.name, text: pl.text, effect: '', how: '', buttons: [] };
  if (id === 'snorlax') {
    card.effect = `Blokuje przejście: ${edgesPl(def)}. Do Lavender i na trasę 12 dojdziesz inną drogą (trasą 8 albo 13).`;
    card.how = 'Pan Fuji w Lavender Town może pomóc: misja „Śpiący Snorlax” — Wieża Pokémon, Team Rocket, Poké Flute.';
    card.buttons = [...questButtons(state, player, 'epic-snorlax'), locate('lavender-town')];
    return card;
  }
  if (def.kind === 'closeEdges') card.effect = `Zamknięte: ${edgesPl(def)}${untilPl(x) ? ` — ${untilPl(x)}` : ''}.`;
  if (def.kind === 'swarm') card.effect = `Eksploracja na: ${def.places.map(placeName).join(', ')}${untilPl(x) ? ` — ${untilPl(x)}` : ''}.`;
  if (def.kind === 'closeGym' && x.gym) {
    const g = GYMS_BY_ID[x.gym];
    card.effect = `Sala w ${placeName(g.city)} zamknięta${untilPl(x) ? ` ${untilPl(x)}` : ''} — miasto i Poké Stop działają.`;
    card.how = 'Wróć do tej sali później albo idź do innej.';
  }
  if (id === 'downpour' || id === 'landslide') card.how = 'Idź inną drogą — to minie samo.';
  return card;
}

// The world's pill (top): one card per incident shown in it — the first one's card; the pill names them all.
export const worldPillIds = (state) => incidentsNow(state, rocketBlocks(state)).filter((x) => !x.held).map((x) => x.id);

// The marks of a place (board.js `data-mark`): a rumour to take, a mission card's target, the tracked quest's place, a gym,
// the Poké Stop.
export function placeMarkInfo(state, kind, place) {
  const player = currentPlayer(state);
  if (kind === 'rumour') {
    const list = rumourList(state, player).filter((r) => r.status === 'go' && r.start === place);
    const titles = list.map((r) => `„${QUESTBOOK_PL[r.quest]?.title ?? r.quest}”`).join(', ');
    return { icon: '📜', title: 'Plotka', text: `${placeName(place)}: tutaj można wziąć misję ${titles}.`, effect: '', how: place === player.location ? 'Weź ją w Dzienniku albo na pasku akcji.' : 'Idź tam i weź ją na miejscu.', buttons: [...(list[0] ? questButtons(state, player, list[0].quest) : []), locate(place)] };
  }
  if (kind === 'target') {
    const cards = (player.quests ?? []).filter((m) => questLocations(m, state.config).includes(place));
    return { icon: '🎯', title: 'Cel karty misji', text: cards.map((m) => `„${questPl(m.questId).title}” — ${questPl(m.questId).text ?? ''}`).join(' '), effect: '', how: '', buttons: [locate(place)] };
  }
  if (kind === 'track') {
    const e = trackedEntry(state, player);
    return e ? { icon: '📌', title: `Śledzona misja: ${e.title}`, text: e.nextStep, effect: '', how: '', buttons: [btnOf('journal-open', '📖 Misja', { id: e.activityId }), btnOf('track-off', 'Przestań śledzić', { player: player.id })] } : null;
  }
  if (kind === 'gym') {
    const g = gymInCity(place, state.config);
    if (!g) return null;
    const shut = incidentsNow(state, rocketBlocks(state)).find((x) => x.gym === g.id && !x.held);
    return { icon: '🏟️', title: `Sala: ${placeName(place)}`, text: `Odznaka: ${g.badge}${hasBadge(player, g.id) ? ' — masz ją ✓' : ''}.`, effect: shut ? `Zamknięta${untilPl(shut) ? ` ${untilPl(shut)}` : ''}.` : '', how: '', buttons: [locate(place)] };
  }
  if (kind === 'stop') {
    const heal = healOnlySpot(place, state.config);
    if (!hasPokeStop(place, state.config) && !heal) return null;
    return { icon: heal ? '♥' : 'P', title: heal ? (heal === 'oak' ? 'Leczenie u Profesora Oaka' : 'Poké Center') : 'Poké Stop', text: heal ? 'Tu wyleczysz drużynę (1 akcja). Sklepu tu nie ma.' : 'Tu wyleczysz drużynę i zrobisz zakupy.', effect: '', how: '', buttons: [] };
  }
  if (kind === 'downhill') return { icon: '🚲', title: 'Cycling Road', text: state.config.rules.bike === 'b2' ? 'Zjazd tylko w dół (strzałki pokazują kierunek). Rowerem z górki jedziesz szybciej: Route 16 → 18 to jedno pole.' : 'Zjazd tylko w dół (strzałki pokazują kierunek).', effect: '', how: '', buttons: [] }; // BIKE V2: CR-1
  return null;
}

// The card (in the notice layer, like an important notice — it stays until OK).
export function mapInfoCard(c) {
  const line = (cls, label, t) => (t ? `<p class="${cls}">${label ? `<b>${label}</b> ` : ''}${esc(t)}</p>` : '');
  const data = (d) => Object.entries(d).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
  const buttons = c.buttons.map((b) => `<button class="mi-btn" data-ui="${b.ui}"${data(b.data)}>${esc(b.label)}</button>`).join('');
  return `<div class="notice-card map-info"><div class="n-icon">${esc(c.icon)}</div><h2>${esc(c.title)}</h2>${line('mi-text', '', c.text)}${line('mi-effect', 'Teraz:', c.effect)}${line('mi-how', 'Jak pomóc:', c.how)}${buttons ? `<div class="row center mi-btns">${buttons}</div>` : ''}<button data-ui="map-info-ok">OK</button></div>`;
}
