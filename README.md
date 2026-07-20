# Cleric in a Box

A single-page reference site for a homebrew D&D 5e magic item: a box that
gives your party healing on tap so no one has to babysit the healer role.
Switch between 2014 and 2024 rules; pick the party's average level; the
page recalculates the box's daily healing allowance live.

No build step — it's plain HTML, CSS, and JS. Any static host works,
including GitHub Pages for free.

## Files

- `index.html` — the page structure and item stat block text
- `style.css` — the parchment/booklet visual styling
- `script.js` — the spell-slot table and healing math (edit
  `ASSUMPTIONS` at the top to change the modifier, slot progression,
  or scroll-cost rule to match your table)

## Publish it on GitHub Pages

1. **Create a repository.** On github.com, click the **+** in the top
   right → **New repository**. Name it whatever you like (e.g.
   `cleric-in-a-box`). Leave it Public (Pages needs a public repo unless
   you're on a paid plan). Don't add a README from GitHub's side since
   you already have one — just click **Create repository**.

2. **Upload these files.** On the empty repo page, click
   **uploading an existing file**, drag in `index.html`, `style.css`,
   `script.js`, and this `README.md`, then click **Commit changes**.

   *(Or, from a terminal, if you have git installed:)*
   ```bash
   cd cleric-in-a-box
   git init
   git add .
   git commit -m "Cleric in a Box"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/cleric-in-a-box.git
   git push -u origin main
   ```

3. **Turn on Pages.** In your repo, go to **Settings** → **Pages**
   (left sidebar). Under **Build and deployment**, set **Source** to
   **Deploy from a branch**, set **Branch** to `main` and the folder to
   `/ (root)`, then click **Save**.

4. **Wait a minute, then find your link.** Reload the Pages settings
   page — a banner will show your live URL, something like:
   `https://YOUR-USERNAME.github.io/cleric-in-a-box/`
   That's the link to share with your table.

## Tuning the box for your table

Everything a DM would want to adjust lives in the `ASSUMPTIONS` object
at the top of `script.js`:

- `modByLevel` — the spellcasting modifier assumed at each tier
- `slotTable` — the cleric spell-slot progression per level
- `cureWoundsDiceAtSlot1` — dice count per edition (this is where the
  2014 vs. 2024 doubling lives)
- `healBase` / `healPerSlotAboveSix` — the flat Heal-spell numbers used
  for 6th-level slots and up
- The scroll-cost rule (spell level = potions spent) lives in
  `scrollCostNote()` in `script.js` and the matching text in
  `index.html` — change both if you want a different conversion.
