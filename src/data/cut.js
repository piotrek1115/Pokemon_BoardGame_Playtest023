// CUT-1 — HM Cut („Cięcie”) and the bushes (rules.cut 'c1', a DEV pilot, OFF in every set; ?dev=cut). Piotr's OWNER GO
// 18.11.2026 (ChatGPT „SNORLAX C / BIKE W2+W3 / CUT K1 / ROCKET R1 / OBTAIN151” §3) on docs/design/CUT_1_DESIGN.md: K1 „Krzaczki”
// — no tree ever closes a road, a gym, the League or a quest step (DEC-06: the canonical 45 places and their edges unchanged).
// One field ability, the shape of Fly and Surf (data/fly.js, data/surf.js) — never a battle move (Combat 2.2 frozen), no move
// slot:
//   hm       the key item (data/questBook.js QUEST_BOOK_KEY_ITEMS — lasting)
//   badge    …and the Cascade Badge (the gym `cerulean`), checked when cutting — never the gym `grants` mechanism
//   species  the Pokémon that can cut — awake (HP > 0) and in the active team (the Box does not count). VERIFIED 21.11.2026
//            against the canon (Red / Blue HM01 learners, serebii.net attackdex-rby/cut): the 26 of 18.11 were all right, the
//            canon adds Kabutops (a fossil of the obtain151 pilot) — 27; Mew canon too, left out (HOLD, never obtainable — as
//            Fly / Surf leave it out); Diglett / Dugtrio learn it only in Yellow — not added (Piotr's call)
//   bushes   K1: five places, each a small hidden bonus behind a bush — every player may cut each bush ONCE (C2 „osobno”):
//            the reward is that player's, the bush stays for the others. PROVISIONAL rewards (CUT_1_DESIGN §4); Route 16's
//            link to the HM Fly house (the design's idea) is NOT built — a variant for Piotr (it would change the Fly quest)
//   hmFrom   the quest that gives the HM (data/questBook.js CUT_QUESTS) — the S.S. Anne's captain in Vermilion (canon)
export const CUT = {
  c1: Object.freeze({
    hm: 'hmCut',
    badge: 'cerulean',
    species: Object.freeze(['bulbasaur', 'ivysaur', 'venusaur', 'charmander', 'charmeleon', 'charizard', 'oddish', 'gloom', 'vileplume', 'bellsprout', 'weepinbell', 'victreebel', 'paras', 'parasect', 'sandshrew', 'sandslash', 'krabby', 'kingler', 'tentacool', 'tentacruel', 'beedrill', 'farfetchd', 'lickitung', 'tangela', 'scyther', 'pinsir', 'kabutops']),
    bushes: Object.freeze([
      Object.freeze({ id: 'forest-glade', place: 'route-2', reward: Object.freeze([{ type: 'superball', amount: 1 }]) }), // Viridian Forest's glade
      Object.freeze({ id: 'river-path', place: 'cerulean-city', reward: Object.freeze([{ type: 'superpotion', amount: 1 }]) }), // the path to Route 9
      Object.freeze({ id: 'gym-gate', place: 'vermilion-city', reward: Object.freeze([{ type: 'pokeballs', amount: 2 }]) }), // Lt. Surge's back gate (the gym is open as always)
      Object.freeze({ id: 'erika-garden', place: 'celadon-city', reward: Object.freeze([{ type: 'superpotion', amount: 1 }]) }), // Erika's garden
      Object.freeze({ id: 'route16-thicket', place: 'route-16', reward: Object.freeze([{ type: 'potion', amount: 1 }, { type: 'money', amount: 2 }]) }), // the thicket by the HM Fly house
    ]),
    hmFrom: 'cut-captain',
  }),
};
