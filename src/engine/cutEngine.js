// CUT-1 — HM Cut and the bushes (rules.cut 'c1', a DEV pilot; data/cut.js, Piotr's OWNER GO 18.11.2026: K1 „Krzaczki”). One
// field ability, the shape of Surf (engine/surfEngine.js): the HM Cut (a key item), the Cascade Badge and an awake capable
// Pokémon in the active team let the player cut the bush at their place — ONE action — and take the small bonus behind it.
//
// K1 never touches the travel graph: no bush closes an edge, a gym, the League or a quest step (graphEngine.worldBlocks is
// not asked and never changes). Each player may cut each bush once (C2 „osobno”): `player.cutBushes` (the bush ids this
// player has cut — saved with the player; an older save has none). The reward is paid once per player per bush: no farming.
//
// The AI never gets the HM (its quest is `family` — questBookEngine.takeBlock never offers it to an AI player) and is never
// offered a cut: an AI-only game plays the same with the switch ON or OFF (AI v2e's code untouched).
import { CUT } from '../data/cut.js';
import { getLocation } from '../data/locations.js';
import { getSpecies } from '../data/pokemon.js';
import { pickVersion } from '../rules.js';
import { log } from './log.js';
import { addItem } from './itemEngine.js';

export const usesCut = (config) => config?.rules?.cut === 'c1';
export const cutSpec = (config) => pickVersion(CUT, config.rules.cut, 'Cut rules');
export const isCutQuest = (id) => Object.values(CUT).some((v) => v.hmFrom === id);

export const hasCutHm = (player, config) => Boolean(player.questBook?.keyItems.includes(cutSpec(config).hm));
export const hasCutBadge = (player, config) => (player.badges ?? []).includes(cutSpec(config).badge);
const canCut = (config, mon) => cutSpec(config).species.includes(mon.species);
// the capable Pokémon that can cut now — awake, in the active team, in team order (the first one cuts)
export const cutters = (player, config) => (player.team ?? []).filter((m) => m.hp > 0 && canCut(config, m));
export const cutDone = (player) => player.cutBushes ?? [];
// the bush at this place (one per place), or null
export const bushAt = (config, place) => (usesCut(config) ? cutSpec(config).bushes.find((b) => b.place === place) ?? null : null);

// What stands between this player and the bush here, in a fixed order (the table says it in Polish):
//   'off'      this game has no Cut
//   'here'     no bush at this place
//   'done'     this player has cut this bush already (the stump)
//   'phase'    another step first (a battle, a choice, the shop)
//   'hm'       no HM Cut
//   'badge'    no Cascade Badge
//   'pokemon'  no capable Pokémon awake in the team — `fainted` / `boxed`: one is, but fainted / in the Box
//   'actions'  no action left this turn
export function cutBlockers(state, player) {
  if (!usesCut(state.config)) return [{ code: 'off' }];
  const bush = bushAt(state.config, player.location);
  if (!bush) return [{ code: 'here' }];
  if (cutDone(player).includes(bush.id)) return [{ code: 'done', bush: bush.id }];
  const out = [];
  const busy = state.phase !== 'turn' || state.growthChoice || state.boxChoice || state.oakJobDraft || state.trade || state.pvp || state.battlePrep;
  if (busy) out.push({ code: 'phase' });
  if (!hasCutHm(player, state.config)) out.push({ code: 'hm' });
  out.push(...cutAbilityBlockers(player, state.config));
  if (state.turn.actionsRemaining <= 0) out.push({ code: 'actions' });
  return out;
}

// The ability's own requirements besides the HM (the „Plecak” tile says the first one): 'badge', 'pokemon'
export function cutAbilityBlockers(player, config) {
  const out = [];
  if (!hasCutBadge(player, config)) out.push({ code: 'badge' });
  if (!cutters(player, config).length) {
    const fainted = (player.team ?? []).filter((m) => canCut(config, m)).map((m) => m.species);
    const boxed = (player.reserve ?? []).filter((m) => canCut(config, m)).map((m) => m.species);
    out.push({ code: 'pokemon', fainted, boxed });
  }
  return out;
}

// The cut open now — [{ type: 'cut' }] (a legal action) or []. Never for an AI player (it has no HM anyway).
export function cutActions(state, player) {
  if (!usesCut(state.config) || player.controller === 'ai' || cutBlockers(state, player).length) return [];
  return [{ type: 'cut' }];
}

// The cut (a legal action — turnEngine checked it): one action, the bush marked for this player, its bonus paid.
export function cut(state, player) {
  const bush = bushAt(state.config, player.location);
  const by = cutters(player, state.config)[0];
  state.turn.actionsRemaining -= 1;
  (player.cutBushes ??= []).push(bush.id);
  for (const r of bush.reward) {
    if (r.type === 'money') player.money += r.amount;
    else addItem(player, r.type === 'pokeballs' ? 'pokeball' : r.type, r.amount);
  }
  log(state, 'action', `🌳 ${player.name}'s ${getSpecies(by.species).name} cuts the bush at ${getLocation(bush.place).name} — behind it: ${bush.reward.map((r) => `${r.amount}× ${r.type}`).join(', ')} (HM Cut: 1 action)`, { cut: { player: player.id, bush: bush.id, place: bush.place, species: by.species, reward: bush.reward } });
}

// explainIllegal (English, as the engine's other answers)
const BLOCKER_EN = {
  off: 'This game has no Cut',
  here: 'There is no bush to cut here',
  done: 'You have cut this bush already',
  phase: 'Finish the current step first',
  hm: 'Cut needs the HM Cut (the S.S. Anne captain in Vermilion)',
  badge: 'Cut needs the Cascade Badge',
  pokemon: 'Cut needs an awake Pokémon that can cut in the active team (not in the Box)',
  actions: 'No action left this turn',
};
export const cutIllegalText = (state, player) => cutBlockers(state, player).map((b) => BLOCKER_EN[b.code]).join('; ') || 'Cutting is not possible now';
