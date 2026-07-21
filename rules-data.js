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

export const EFFECTS = Object.freeze({
  'Cure Wounds':{kind:'healing',f2014:'1d8+WIS',f2024:'2d8+WIS',note:'healing'},
  'Healing Word':{kind:'healing',f2014:'1d4+WIS',f2024:'2d4+WIS',note:'healing'},
  'Guiding Bolt':{kind:'damage',formula:'4d6',note:'radiant damage on a hit',resolution:'spell attack'},
  'Inflict Wounds':{kind:'damage',f2014:'3d10',f2024:'2d10',note2014:'necrotic damage on a melee spell attack',note2024:'necrotic damage on a failed Constitution save; half on success'},
  'Aid':{kind:'fixed',amount:5,note:'current and maximum HP increase for each target'},
  'Prayer of Healing':{kind:'healing',f2014:'2d8+WIS',f2024:'2d8',note2014:'healing to each eligible target',note2024:'healing to each eligible target, plus the spell’s Short Rest benefit'},
  'Spiritual Weapon':{kind:'damage',formula:'1d8+WIS',note:'force damage on a hit',resolution:'spell attack'},
  'Glyph of Warding':{kind:'damage',formula:'5d8',note:'damage for an explosive rune'},
  'Mass Healing Word':{kind:'healing',f2014:'1d4+WIS',f2024:'2d4+WIS',note:'healing to each eligible target'},
  'Revivify':{kind:'fixed',amount:1,note:'HP restored'},
  'Spirit Guardians':{kind:'damage',formula:'3d8',note:'damage when the spell affects a creature'},
  'Guardian of Faith':{kind:'fixed',amount:20,note:'radiant damage per failed save'},
  'Flame Strike':{kind:'damage',formula:'8d6',note:'combined fire and radiant damage'},
  'Insect Plague':{kind:'damage',formula:'4d10',note:'piercing damage per failed save'},
  'Mass Cure Wounds':{kind:'healing',f2014:'3d8+WIS',f2024:'5d8+WIS',note:'healing to each eligible target'},
  'Raise Dead':{kind:'fixed',amount:1,note:'HP restored'},
  'Blade Barrier':{kind:'damage',formula:'6d10',note:'slashing damage per failed save'},
  'Harm':{kind:'damage',formula:'14d6',note:'necrotic damage; apply the spell’s normal limits'},
  'Heal':{kind:'fixed',amount:70,note:'HP restored'},
  'Sunbeam':{kind:'damage',formula:'6d8',note:'radiant damage per failed save'},
  'Fire Storm':{kind:'damage',formula:'7d10',note:'fire damage per failed save'},
  'Regenerate':{kind:'healing',formula:'4d8+15',note:'initial healing; ongoing healing follows the spell'},
  'Resurrection':{kind:'full',note:'target returns with full HP'},
  'Sunburst':{kind:'damage',formula:'12d6',note:'radiant damage per failed save'},
  'Mass Heal':{kind:'fixed',amount:700,note:'HP distributed among eligible creatures'},
  'True Resurrection':{kind:'full',note:'target returns with full HP'}
});

export const RULES_METADATA = Object.freeze({
  2014:{label:'2014 Basic Rules',verified:'2026-07-22'},
  2024:{label:'2024 Free Rules',verified:'2026-07-22'}
});
