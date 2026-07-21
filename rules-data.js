export const SLOTS = Object.freeze({
  1:[2],2:[3],3:[4,2],4:[4,3],5:[4,3,2],6:[4,3,3],7:[4,3,3,1],8:[4,3,3,2],9:[4,3,3,3,1],10:[4,3,3,3,2],
  11:[4,3,3,3,2,1],12:[4,3,3,3,2,1],13:[4,3,3,3,2,1,1],14:[4,3,3,3,2,1,1],15:[4,3,3,3,2,1,1,1],
  16:[4,3,3,3,2,1,1,1],17:[4,3,3,3,2,1,1,1,1],18:[4,3,3,3,3,1,1,1,1],19:[4,3,3,3,3,2,1,1,1],20:[4,3,3,3,3,2,2,1,1]
});

export const POTIONS = Object.freeze({
  healing:{name:'Potion of Healing',formula:'2d4+2'},
  greater:{name:'Greater Healing Potion',formula:'4d4+4'},
  superior:{name:'Superior Healing Potion',formula:'8d4+8'},
  supreme:{name:'Supreme Healing Potion',formula:'10d4+20'}
});

const SHARED = {
  1:['Bane','Bless','Command','Create or Destroy Water','Cure Wounds','Detect Evil and Good','Detect Magic','Detect Poison and Disease','Guiding Bolt','Healing Word','Inflict Wounds','Protection from Evil and Good','Purify Food and Drink','Sanctuary','Shield of Faith'],
  2:['Aid','Augury','Blindness/Deafness','Calm Emotions','Continual Flame','Enhance Ability','Find Traps','Gentle Repose','Hold Person','Lesser Restoration','Locate Object','Prayer of Healing','Protection from Poison','Silence','Spiritual Weapon','Warding Bond','Zone of Truth'],
  3:['Animate Dead','Beacon of Hope','Bestow Curse','Clairvoyance','Create Food and Water','Daylight','Dispel Magic','Glyph of Warding','Magic Circle','Mass Healing Word','Meld into Stone','Protection from Energy','Remove Curse','Revivify','Sending','Speak with Dead','Spirit Guardians','Tongues','Water Walk'],
  5:['Commune','Contagion','Dispel Evil and Good','Flame Strike','Geas','Greater Restoration','Hallow','Insect Plague','Legend Lore','Mass Cure Wounds','Planar Binding','Raise Dead','Scrying'],
  7:['Conjure Celestial','Divine Word','Etherealness','Fire Storm','Plane Shift','Regenerate','Resurrection','Symbol'],
  9:['Astral Projection','Gate','Mass Heal','True Resurrection']
};

export const SPELLS = Object.freeze({
  2014:Object.freeze({
    1:SHARED[1],2:SHARED[2],3:SHARED[3],
    4:['Banishment','Control Water','Death Ward','Divination','Freedom of Movement','Guardian of Faith','Locate Creature','Stone Shape'],
    5:SHARED[5],
    6:['Blade Barrier','Create Undead','Find the Path','Forbiddance','Harm','Heal','Heroes’ Feast','Planar Ally','True Seeing','Word of Recall'],
    7:SHARED[7],
    8:['Antimagic Field','Control Weather','Earthquake','Holy Aura'],
    9:SHARED[9]
  }),
  2024:Object.freeze({
    1:SHARED[1],2:SHARED[2],3:SHARED[3],
    4:['Aura of Life','Banishment','Control Water','Death Ward','Divination','Freedom of Movement','Guardian of Faith','Locate Creature','Stone Shape'],
    5:SHARED[5],
    6:['Blade Barrier','Create Undead','Find the Path','Forbiddance','Harm','Heal','Heroes’ Feast','Planar Ally','Sunbeam','True Seeing','Word of Recall'],
    7:SHARED[7],
    8:['Antimagic Field','Control Weather','Earthquake','Holy Aura','Sunburst'],
    9:SHARED[9]
  })
});

// Automatic rolls are base-slot results only because the artifact forbids upcasting.
// Notes preserve the minimum edition-specific information needed to interpret the roll.
export const EFFECTS = Object.freeze({
  'Cure Wounds':{
    kind:'healing',f2014:'1d8+WIS',f2024:'2d8+WIS',
    note2014:'healing to one touched creature; no effect on Undead or Constructs',
    note2024:'healing to one touched creature'
  },
  'Healing Word':{
    kind:'healing',f2014:'1d4+WIS',f2024:'2d4+WIS',
    note2014:'healing to one visible creature; no effect on Undead or Constructs',
    note2024:'healing to one visible creature'
  },
  'Guiding Bolt':{
    kind:'damage',formula:'4d6',note:'Radiant damage on a hit; the next attack roll against the target before the end of your next turn has Advantage',resolution:'ranged spell attack'
  },
  'Inflict Wounds':{
    kind:'damage',f2014:'3d10',f2024:'2d10',
    note2014:'Necrotic damage on a hit',note2024:'Necrotic damage on a failed save; half on a successful save',
    resolution2014:'melee spell attack',resolution2024:'Constitution saving throw'
  },
  'Aid':{
    kind:'fixed',amount:5,note:'current and maximum HP increase for each of up to three targets for 8 hours'
  },
  'Prayer of Healing':{
    kind:'healing',f2014:'2d8+WIS',f2024:'2d8',
    note2014:'healing to up to six creatures after a 10-minute casting; no effect on Undead or Constructs',
    note2024:'healing to up to five creatures after a 10-minute casting; each also gains the benefits of a Short Rest and cannot benefit again until a Long Rest'
  },
  'Spiritual Weapon':{
    kind:'damage',formula:'1d8+WIS',note2014:'Force damage on a hit; no Concentration',note2024:'Force damage on a hit; Concentration, up to 1 minute',
    resolution:'melee spell attack',concentration2014:false,concentration2024:true
  },
  'Glyph of Warding':{
    kind:'damage',formula:'5d8',note:'Acid, Cold, Fire, Lightning, or Thunder damage for an explosive rune; half on a successful save',resolution:'Dexterity saving throw'
  },
  'Mass Healing Word':{
    kind:'healing',f2014:'1d4+WIS',f2024:'2d4+WIS',
    note2014:'healing to up to six visible creatures; no effect on Undead or Constructs',note2024:'healing to up to six visible creatures'
  },
  'Revivify':{
    kind:'fixed',amount:1,note:'HP restored to a creature that died within the spell’s time limit; material component and body restrictions still apply'
  },
  'Spirit Guardians':{
    kind:'damage',formula:'3d8',
    note2014:'Radiant or Necrotic damage on a failed Wisdom save, half on success; triggers the first time a creature enters the area on a turn or starts its turn there; Concentration',
    note2024:'Radiant or Necrotic damage on a failed Wisdom save, half on success; triggers when the emanation enters a creature’s space, a creature enters it, or a creature ends its turn there, no more than once per turn; Concentration',
    resolution:'Wisdom saving throw',concentration:true
  },
  'Guardian of Faith':{
    kind:'fixed',amount:20,note:'Radiant damage on a failed Dexterity save, 10 on a successful save; the guardian vanishes after dealing 60 total damage',resolution:'Dexterity saving throw'
  },
  'Flame Strike':{
    kind:'damage',f2014:'8d6',f2024:'10d6',
    note2014:'4d6 Fire plus 4d6 Radiant damage on a failed save, half on success',
    note2024:'5d6 Fire plus 5d6 Radiant damage on a failed save, half on success',
    resolution:'Dexterity saving throw'
  },
  'Insect Plague':{
    kind:'damage',formula:'4d10',note:'Piercing damage on a failed Constitution save, half on success; the area is difficult terrain and lightly obscured; Concentration',resolution:'Constitution saving throw',concentration:true
  },
  'Mass Cure Wounds':{
    kind:'healing',f2014:'3d8+WIS',f2024:'5d8+WIS',
    note2014:'healing to up to six creatures in the area; no effect on Undead or Constructs',note2024:'healing to up to six creatures in the area'
  },
  'Raise Dead':{
    kind:'fixed',amount:1,note:'HP restored; the 1-hour casting, 10-day limit, material component, body restrictions, and post-resurrection penalties still apply'
  },
  'Blade Barrier':{
    kind:'damage',formula:'6d10',
    note2014:'Slashing damage on a failed Dexterity save, half on success; triggers when a creature first enters on a turn or starts its turn there; Concentration',
    note2024:'Force damage on a failed Dexterity save, half on success; triggers in the wall, on entry, or when ending a turn there, no more than once per turn; Concentration',
    resolution:'Dexterity saving throw',concentration:true
  },
  'Harm':{
    kind:'damage',formula:'14d6',note:'Necrotic damage on a failed Constitution save, half on success; on a failure the target’s Hit Point maximum is reduced by the damage taken, to a minimum of 1',resolution:'Constitution saving throw'
  },
  'Heal':{
    kind:'fixed',amount:70,note2014:'HP restored; also ends blindness, deafness, and disease',note2024:'HP restored; also ends the Blinded, Deafened, and Poisoned conditions'
  },
  'Sunbeam':{
    kind:'damage',formula:'6d8',note:'Radiant damage on a failed Constitution save, half on success; failure also causes Blinded until the start of your next turn; Concentration',resolution:'Constitution saving throw',concentration:true
  },
  'Fire Storm':{
    kind:'damage',formula:'7d10',note2014:'Fire damage on a failed Dexterity save, half on success; the caster may spare plant life',note2024:'Fire damage on a failed Dexterity save, half on success; flammable unattended objects ignite',resolution:'Dexterity saving throw'
  },
  'Regenerate':{
    kind:'healing',formula:'4d8+15',note:'initial healing; the target also regains 1 HP at the start of each turn for the duration and severed body parts can regrow'
  },
  'Resurrection':{
    kind:'full',note:'target returns with all HP; the 1-hour casting, century limit, material component, soul requirements, post-resurrection penalties, and caster strain still apply'
  },
  'Sunburst':{
    kind:'damage',formula:'12d6',note2014:'Radiant damage on a failed Constitution save, half on success; failure also causes Blinded for 1 minute, with repeat saves; Undead and Oozes have Disadvantage on the initial save',note2024:'Radiant damage on a failed Constitution save, half on success; failure also causes Blinded for 1 minute, with repeat saves',resolution:'Constitution saving throw'
  },
  'Mass Heal':{
    kind:'fixed',amount:700,note2014:'HP divided among visible creatures; also cures diseases and effects causing blindness or deafness; no effect on Undead or Constructs',note2024:'HP divided among visible creatures; also removes Blinded, Deafened, and Poisoned'
  },
  'True Resurrection':{
    kind:'full',note:'target returns with all HP; the 1-hour casting, 200-year limit, material component, cause-of-death restriction, and soul requirements still apply'
  }
});

export const RULES_METADATA = Object.freeze({
  2014:{label:'5e (2014) Basic Rules',verified:'2026-07-21',source:'https://www.dndbeyond.com/sources/dnd/basic-rules-2014/spells'},
  2024:{label:'5.5e (2024) Free Rules',verified:'2026-07-21',source:'https://www.dndbeyond.com/sources/dnd/br-2024/spell-descriptions'}
});
