# Cleric in a Box

**Cleric in a Box** is a mobile-first multiplayer tracker for a homebrew D&D 5e **Unique Artifact**. It does **not** track character hit points. Players track their own HP normally.

The site tracks only the artifact's shared resources:

- Exact-level divine charges
- Healing-potion uses and secure random healing rolls
- Exact-level cleric scroll uses
- Random healing or damage rolls for supported spells
- A shared adventuring-day history
- Long-rest restoration

## Live site

https://cbw29512.github.io/healingbox/

## Table workflow

1. The DM opens the live site and selects **Create Party**.
2. Choose the 2014 or 2024 rules and the party's average level from 1–20.
3. Set the artifact's Wisdom modifier, spell save DC, and spell attack bonus. These are explicit DM-controlled homebrew values rather than values inferred from party level.
4. Share the generated player link or six-character room code.
5. Each available divine charge appears as its own card.
6. A player chooses **Roll Healing** or **Choose Scroll**.
7. The box rolls any supported healing or damage, displays the result, and greys out that charge.
8. Keep the DM browser open while the party is connected.

The DM's browser is the authoritative host. Current campaign state is saved in that browser's local storage. Connected player phones synchronize through a peer-to-peer WebRTC room.

## Host permissions

Administrative authority belongs to the hosting browser—not to a display name. A player may call themselves "DM," but remote clients still cannot:

- Reset the box after a long rest
- Undo a charge use
- Change artifact spellcasting settings

Only the hosting DM browser can perform those actions.

## Versioned rules data

The application stores separate 2014 and 2024 base Cleric spell lists in `rules-data.js`.

Notable edition differences currently enforced include:

- 2024 adds **Aura of Life**, **Sunbeam**, and **Sunburst** to the base Cleric list.
- **Inflict Wounds** uses `3d10` under 2014 rules and `2d10` under 2024 rules.
- **Prayer of Healing** uses `2d8 + Wisdom` under 2014 rules and `2d8` under 2024 rules.
- **Cure Wounds**, **Healing Word**, **Mass Healing Word**, and **Mass Cure Wounds** use their edition-specific formulas.

The rules-data audit was last verified on 2026-07-22 against the official 2014 Basic Rules and 2024 Free Rules listings.

Existing version-2 rooms migrate automatically to version 3. Preserved rooms receive editable default artifact values of Wisdom `+5`, save DC `17`, and spell attack `+9` until the DM changes them.

## Resource rules

Every normal cleric spell slot becomes one exact-level divine charge. Each charge may be spent as its associated healing potion **or** as one cleric scroll of that exact spell level.

| Charge level | Potion option |
| --- | --- |
| 1st | Potion of Healing — `2d4 + 2` |
| 2nd–3rd | Greater Healing Potion — `4d4 + 4` |
| 4th–6th | Superior Healing Potion — `8d4 + 8` |
| 7th–9th | Supreme Healing Potion — `10d4 + 20` |

There is no upcasting and no higher- or lower-level charge substitution. The player chooses the individual divine charge being spent.

Area healing must come from an eligible cleric scroll. The semi-sentient box produces and reads its scroll automatically as a free action. The website reports the roll; players apply healing, damage, saves, resistance, and other effects at the table.

Utility spells that do not directly roll healing or damage are recorded and grey out the charge, but are resolved using their normal spell effect.

## Unique Artifact

The box cannot be stolen, lost, destroyed, suppressed, banished, dispelled, restrained, copied, or separated from its chosen party by mortal, immortal, planar, artifact-level, or divine force. Only the specific deity that granted it—controlled by the Dungeon Master—can affect it.

## Testing

Run the zero-dependency safety and rules tests with:

```bash
npm test
```

The test suite checks:

- Host-only administrative authorization
- Player action payloads
- JavaScript syntax
- Local application assets
- Full-caster slot progression
- 2014/2024 spell-list separation
- Edition-specific supported formulas

GitHub Actions runs the same suite on every push and pull request.

## Hosting

The site is hosted from GitHub Pages. PeerJS supplies browser-to-browser room signaling and WebRTC connections. No Firebase project or database is required for the current release.
