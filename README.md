# Cleric in a Box

**Cleric in a Box** is a mobile-first multiplayer tracker for a homebrew D&D 5e **Unique Artifact**. It tracks party HP, healing-potion rolls, exact-level cleric scroll charges, resource use, and the current adventuring-day history.

## Live site

https://cbw29512.github.io/healingbox/

## Table workflow

1. The DM opens the live site and selects **Create Party**.
2. Choose the 2014 or 2024 rules and the party's average level from 1–20.
3. Add each character and their current and maximum HP.
4. Share the generated room link or six-character room code.
5. Players open the link on their phones.
6. Keep the DM browser open while the party is connected.

The DM's browser is the authoritative host. Current campaign state is saved in that browser's local storage. Connected player phones synchronize through an encrypted peer-to-peer WebRTC room.

## Resource rules

Every normal cleric spell slot becomes one exact-level divine charge. Each charge may be spent as its associated real healing potion **or** as one cleric scroll of that exact spell level.

| Charge level | Potion option |
| --- | --- |
| 1st | Potion of Healing — `2d4 + 2` |
| 2nd–3rd | Greater Healing Potion — `4d4 + 4` |
| 4th–6th | Superior Healing Potion — `8d4 + 8` |
| 7th–9th | Supreme Healing Potion — `10d4 + 20` |

There is no upcasting and no higher-level charge substitution. Using a potion spends the lowest available charge that produces that potion tier, preserving higher-level scroll access where possible.

Area healing must come from an eligible cleric scroll. The semi-sentient box produces and reads its scroll automatically as a free action.

## Unique Artifact

The box cannot be stolen, lost, destroyed, suppressed, banished, dispelled, restrained, copied, or separated from its chosen party by mortal, immortal, planar, artifact-level, or divine force. Only the specific deity that granted it—controlled by the Dungeon Master—can affect it.

## Hosting

The site is a single self-contained `index.html` hosted from the repository root through GitHub Pages. It uses PeerJS for browser-to-browser room signaling and WebRTC connections. No Firebase project or database is required for the current release.

## Privacy and practical limits

This version is designed for a private gaming table, not hostile public rooms. Anyone with the room code may attempt to join, and the DM host must remain online. Some tightly restricted networks or unusual NAT configurations may prevent peer-to-peer connections.
