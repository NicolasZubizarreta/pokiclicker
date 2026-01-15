const BADGES = [
    {id:1, zoneIdx:3, name:"Roche", desc:"Dégâts Clic +50%"},
    {id:2, zoneIdx:5, name:"Cascade", desc:"DPS Équipe +30%"},
    {id:3, zoneIdx:7, name:"Foudre", desc:"Dégâts Totaux +20%"},
    {id:4, zoneIdx:11, name:"Prisme", desc:"Or gagné +20%"},
    {id:5, zoneIdx:13, name:"Âme", desc:"XP gagnée +50%"},
    {id:6, zoneIdx:15, name:"Marais", desc:"Taux Capture +30%"},
    {id:7, zoneIdx:17, name:"Volcan", desc:"Dégâts Totaux +50%"},
    {id:8, zoneIdx:18, name:"Terre", desc:"Vitesse de spawn +20%"}
];

const MAP_DATA = [
    { type: "rect", coords: [300,694,359,762], name: "Route 1", zoneId: 1, color: "orange" },
    { type: "rect", coords: [308,486,352,533], name: "Forêt de Jade", zoneId: 2, color: "blue" },
    { type: "circle", coords: [331,391,37], name: "Arène d'Argenta", zoneId: 3, color: "red" },
    { type: "polygon", coords: [607,307,652,307,652,353,607,353], name: "Mont Sélénite", zoneId: 4, color: "blue" },
    { type: "circle", coords: [931,331,38], name: "Arène d'Azuria", zoneId: 5, color: "red" },
    { type: "rect", coords: [900,248,961,287], name: "Pont Pépite", zoneId: 6, color: "orange" },
    { type: "circle", coords: [931,690,38], name: "Arène de Carmin", zoneId: 7, color: "red" },
    { type: "rect", coords: [968,666,1013,713], name: "Cave Taupiqueur", zoneId: 8, color: "blue" },
    { type: "rect", coords: [1147,307,1193,353], name: "Tunnel Rocheux", zoneId: 9, color: "blue" },
    { type: "circle", coords: [1171,511,38], name: "Lavanville", zoneId: null, color: "gray" }, // Non jouable
    { type: "rect", coords: [1163,502,1209,548], name: "Tour Pokémon", zoneId: 10, color: "blue" },
    { type: "circle", coords: [751,510,38], name: "Céladopole", zoneId: 11, color: "red" },
    { type: "rect", coords: [1147,367,1193,413], name: "Centrale", zoneId: 12, color: "blue" },
    { type: "circle", coords: [810,870,38], name: "Arène de Parmanie", zoneId: 13, color: "red" },
    { type: "rect", coords: [923,503,969,548], name: "Sylphe SARL", zoneId: 14, color: "blue" },
    { type: "circle", coords: [931,509,37], name: "Arène de Safrania", zoneId: 15, color: "red" },
    { type: "rect", coords: [547,967,593,1013], name: "Îles Écume", zoneId: 16, color: "blue" },
    { type: "circle", coords: [331,992,37], name: "Arène Cramois'Île", zoneId: 17, color: "red" },
    { type: "circle", coords: [331,630,37], name: "Arène de Jadielle", zoneId: 18, color: "red" },
    { type: "polygon", coords: [917,180,917,153,927,153,927,146,956,145,956,152,966,152,966,180,956,180,950,167,934,166,927,180], name: "Caverne Azurée", zoneId: 19, color: "cyan" },
    { type: "rect", coords: [186,368,232,412], name: "Route Victoire", zoneId: 20, color: "blue" },
    { type: "circle", coords: [210,331,37], name: "Ligue Pokémon", zoneId: 21, color: "red" },
    { type: "circle", coords: [331,811,35], name: "Bourg Palette", zoneId: 0, color: "purple" },
    { type: "rect", coords: [308,428,352,474], name: "Daran Ass", zoneId: null, color: "gray" }
];

// ZONE CONFIGURATION (Updated with explicit IDs)
const ZONES = [
  // --- DÉBUT DE L'AVENTURE ---
  {id:0, name:"Bourg Palette", bg:"img/kanto/background/Zone 0.png", minLevel:0, maxLevel:0,
   pokemons:[], boss:{name:"", id:0, level:0, catchRate:0}},

  {id:1, name:"Route 1", bg:"img/kanto/background/Zone 1.png", minLevel:2, maxLevel:5,
   pokemons:[
     {name:"Rattata", id:19, rarity:"Commun", spawnRate:0.3, catchRate:255},
     {name:"Roucool", id:16, rarity:"Commun", spawnRate:0.3, catchRate:255},
     {name:"Piafabec", id:21, rarity:"Commun", spawnRate:0.2, catchRate:255}, // NOUVEAU
     {name:"Rattatac", id:20, rarity:"Peu Commun", spawnRate:0.1, catchRate:127},
     {name:"Roucoups", id:17, rarity:"Peu Commun", spawnRate:0.05, catchRate:120},
     {name:"Bulbizarre", id:1, rarity:"Très Rare", spawnRate:0.05, catchRate:45}
   ], boss:{name:"Rattata (Géant)", id:19, level:6, catchRate:0}},
  
  {id:2, name:"Forêt de Jade", bg:"img/kanto/background/Zone 2.png", minLevel:5, maxLevel:8,
   pokemons:[
     {name:"Chenipan", id:10, rarity:"Commun", spawnRate:0.25, catchRate:255},
     {name:"Aspicot", id:13, rarity:"Commun", spawnRate:0.25, catchRate:255},
     {name:"Chrysacier", id:11, rarity:"Peu Commun", spawnRate:0.15, catchRate:120},
     {name:"Coconfort", id:14, rarity:"Peu Commun", spawnRate:0.15, catchRate:120},
     {name:"Pikachu", id:25, rarity:"Rare", spawnRate:0.15, catchRate:190},
     {name:"Salamèche", id:4, rarity:"Très Rare", spawnRate:0.05, catchRate:45}
   ], boss:{name:"Papilusion", id:12, level:10, catchRate:0}},

  // BADGE 1 : ROCHE
  {id:3, name:"Arène d'Argenta", bg:"img/kanto/background/Zone 3.png", minLevel:9, maxLevel:12,
   pokemons:[
     {name:"Racaillou", id:74, rarity:"Commun", spawnRate:0.3, catchRate:255},
     {name:"Sabelette", id:27, rarity:"Commun", spawnRate:0.25, catchRate:255},
     {name:"Nidoran?", id:29, rarity:"Peu Commun", spawnRate:0.15, catchRate:235},
     {name:"Nidoran?", id:32, rarity:"Peu Commun", spawnRate:0.15, catchRate:235},
     {name:"Onix", id:95, rarity:"Rare", spawnRate:0.1, catchRate:45},
     {name:"Carapuce", id:7, rarity:"Très Rare", spawnRate:0.05, catchRate:45}
   ], boss:{name:"Pierre (Onix)", id:95, level:14, catchRate:0, badge:"Roche"}},

  {id:4, name:"Mont Sélénite", bg:"img/kanto/background/Zone 4.png", minLevel:12, maxLevel:15,
   pokemons:[
     {name:"Nosferapti", id:41, rarity:"Commun", spawnRate:0.4, catchRate:255},
     {name:"Paras", id:46, rarity:"Commun", spawnRate:0.2, catchRate:190},
     {name:"Magicarpe", id:129, rarity:"Commun", spawnRate:0.2, catchRate:255}, // NOUVEAU (Le fameux vendeur)
     {name:"Mélofée", id:35, rarity:"Rare", spawnRate:0.1, catchRate:150},
     {name:"Rondoudou", id:39, rarity:"Rare", spawnRate:0.05, catchRate:170},
     {name:"Leveinard", id:113, rarity:"Très Rare", spawnRate:0.05, catchRate:30}
   ], boss:{name:"Mélodelfe", id:36, level:16, catchRate:0}},

  // BADGE 2 : CASCADE
  {id:5, name:"Arène d'Azuria", bg:"img/kanto/background/Zone 5.png", minLevel:15, maxLevel:18,
   pokemons:[
     {name:"Mystherbe", id:43, rarity:"Commun", spawnRate:0.21, catchRate:255},
     {name:"Chétiflor", id:69, rarity:"Commun", spawnRate:0.21, catchRate:255},
     {name:"Ptitard", id:60, rarity:"Peu Commun", spawnRate:0.18, catchRate:255}, // NOUVEAU
     {name:"Stari", id:120, rarity:"Peu Commun", spawnRate:0.15, catchRate:225},
     {name:"Poissirène", id:118, rarity:"Peu Commun", spawnRate:0.1, catchRate:225},
     {name:"Psykokwak", id:54, rarity:"Rare", spawnRate:0.1, catchRate:190},
     {name:"Lippoutou", id:124, rarity:"Très Rare", spawnRate:0.05, catchRate:45},
   ], boss:{name:"Ondine (Staross)", id:121, level:21, catchRate:0, badge:"Cascade"}},

  // ZONE SPÉCIALE MEW
  {id:6, name:"Pont Pépite", bg:"img/kanto/background/Zone 6.png", minLevel:17, maxLevel:20,
   pokemons:[
     {name:"Abra", id:63, rarity:"Commun", spawnRate:0.3, catchRate:200},
     {name:"Roucoups", id:17, rarity:"Commun", spawnRate:0.2, catchRate:120},
     {name:"Mimitoss", id:48, rarity:"Peu Commun", spawnRate:0.2, catchRate:190},
     {name:"Ramoloss", id:79, rarity:"Peu Commun", spawnRate:0.15, catchRate:190},
     {name:"Rapasdepic", id:22, rarity:"Rare", spawnRate:0.14, catchRate:90}, // NOUVEAU (Le "Shield" anti-Mew)
     {name:"Mew", id:151, rarity:"Légendaire", spawnRate:0.01, catchRate:45}
   ], boss:{name:"Rival (Roucarnage)", id:18, level:23, catchRate:0}},

  // BADGE 3 : FOUDRE
  {id:7, name:"Arène de Carmin", bg:"img/kanto/background/Zone 7.png", minLevel:20, maxLevel:25,
   pokemons:[
     {name:"Voltorbe", id:100, rarity:"Commun", spawnRate:0.3, catchRate:190},
     {name:"Magnéti", id:81, rarity:"Commun", spawnRate:0.3, catchRate:190},
     {name:"Miaouss", id:52, rarity:"Peu Commun", spawnRate:0.2, catchRate:255},
     {name:"Canarticho", id:83, rarity:"Rare", spawnRate:0.1, catchRate:45},
     {name:"Pikachu", id:25, rarity:"Rare", spawnRate:0.1, catchRate:190}
   ], boss:{name:"Major Bob (Raichu)", id:26, level:26, catchRate:0, badge:"Foudre"}},

  {id:8, name:"Cave Taupiqueur", bg:"img/kanto/background/Zone 8.png", minLevel:23, maxLevel:27,
   pokemons:[
     {name:"Taupiqueur", id:50, rarity:"Commun", spawnRate:0.8, catchRate:255},
     {name:"Osselait", id:104, rarity:"Rare", spawnRate:0.1, catchRate:190},
     {name:"Triopikeur", id:51, rarity:"Très Rare", spawnRate:0.1, catchRate:50}
   ], boss:{name:"Triopikeur", id:51, level:29, catchRate:0}},

  {id:9, name:"Tunnel Rocheux", bg:"img/kanto/background/Zone 9.png", minLevel:25, maxLevel:30,
   pokemons:[
     {name:"Machoc", id:66, rarity:"Commun", spawnRate:0.35, catchRate:180},
     {name:"Férosinge", id:56, rarity:"Commun", spawnRate:0.35, catchRate:190},
     {name:"Gravalanch", id:75, rarity:"Rare", spawnRate:0.2, catchRate:120},
     {name:"Onix", id:95, rarity:"Très Rare", spawnRate:0.1, catchRate:45}
   ], boss:{name:"Grolem", id:76, level:33, catchRate:0}},

  {id:10, name:"Tour Pokémon", bg:"img/kanto/background/Zone 10.png", minLevel:28, maxLevel:33,
   pokemons:[
     {name:"Fantominus", id:92, rarity:"Commun", spawnRate:0.5, catchRate:190},
     {name:"Spectrum", id:93, rarity:"Peu Commun", spawnRate:0.25, catchRate:90},
     {name:"Têtarte", id:61, rarity:"Peu Commun", spawnRate:0.15, catchRate:120}, // NOUVEAU (Pour faire évoluer en Tartard)
     {name:"Soporifik", id:96, rarity:"Rare", spawnRate:0.05, catchRate:190},
     {name:"Ossatueur", id:105, rarity:"Très Rare", spawnRate:0.05, catchRate:75}
   ], boss:{name:"Ectoplasma", id:94, level:36, catchRate:0}},

  // BADGE 4 : PRISME
  {id:11, name:"Arène de Céladopole", bg:"img/kanto/background/Zone 11.png", minLevel:30, maxLevel:35,
   pokemons:[
     {name:"Goupix", id:37, rarity:"Commun", spawnRate:0.25, catchRate:190},
     {name:"Caninos", id:58, rarity:"Commun", spawnRate:0.25, catchRate:190},
     {name:"Noeunoeuf", id:102, rarity:"Peu Commun", spawnRate:0.2, catchRate:90}, // NOUVEAU
     {name:"Ortide", id:44, rarity:"Peu Commun", spawnRate:0.1, catchRate:120},
     {name:"Boustiflor", id:70, rarity:"Peu Commun", spawnRate:0.1, catchRate:120},
     {name:"Évoli", id:133, rarity:"Rare", spawnRate:0.1, catchRate:45}
   ], boss:{name:"Erika (Empiflor)", id:71, level:39, catchRate:0, badge:"Prisme"}},

  // ZONE LÉGENDAIRE 1
  {id:12, name:"Centrale", bg:"img/kanto/background/Zone 12.png", minLevel:32, maxLevel:38,
   pokemons:[
     {name:"Voltorbe", id:100, rarity:"Commun", spawnRate:0.3, catchRate:190},
     {name:"Magnéti", id:81, rarity:"Commun", spawnRate:0.3, catchRate:190},
     {name:"Élektek", id:125, rarity:"Rare", spawnRate:0.2, catchRate:45}, // Sert de shield Rare
     {name:"Électrode", id:101, rarity:"Peu Commun", spawnRate:0.13, catchRate:60},
     {name:"Ronflex", id:143, rarity:"Très Rare", spawnRate:0.05, catchRate:25}, // NOUVEAU (Shield Très Rare)
     {name:"Électhor", id:145, rarity:"Légendaire", spawnRate:0.02, catchRate:3}
   ], boss:{name:"Électhor", id:145, level:45, catchRate:0}},

  // BADGE 5 : ÂME (Mix Parmanie + Safari pour tout avoir)
  {id:13, name:"Arène de Parmanie", bg:"img/kanto/background/Zone 13.png", minLevel:35, maxLevel:40,
   pokemons:[
     {name:"Nidorino", id:33, rarity:"Commun", spawnRate:0.12, catchRate:120},
     {name:"Nidorina", id:30, rarity:"Commun", spawnRate:0.12, catchRate:120},
     {name:"Doduo", id:84, rarity:"Peu Commun", spawnRate:0.12, catchRate:190},
     {name:"Tentacool", id:72, rarity:"Peu Commun", spawnRate:0.12, catchRate:190},
     // Les Rares du Safari
     {name:"Kangourex", id:115, rarity:"Rare", spawnRate:0.08, catchRate:45},
     {name:"Insécateur", id:123, rarity:"Rare", spawnRate:0.08, catchRate:45},
     {name:"Scarabrute", id:127, rarity:"Rare", spawnRate:0.08, catchRate:45},
     {name:"Tauros", id:128, rarity:"Rare", spawnRate:0.08, catchRate:45},
     {name:"Saquedeneu", id:114, rarity:"Rare", spawnRate:0.1, catchRate:45},
     // Le Très Rare
     {name:"Minidraco", id:147, rarity:"Très Rare", spawnRate:0.1, catchRate:45}
   ], boss:{name:"Koga (Smogogo)", id:110, level:45, catchRate:0, badge:"Âme"}},

  {id:14, name:"Sylphe SARL", bg:"img/kanto/background/Zone 14.png", minLevel:38, maxLevel:43,
   pokemons:[
     {name:"Abo", id:23, rarity:"Commun", spawnRate:0.2, catchRate:255},
     {name:"Smogo", id:109, rarity:"Commun", spawnRate:0.2, catchRate:190},
     {name:"Tadmorv", id:88, rarity:"Peu Commun", spawnRate:0.2, catchRate:190},
     {name:"Porygon", id:137, rarity:"Rare", spawnRate:0.2, catchRate:45}, // Passé en Rare
     {name:"Métamorph", id:132, rarity:"Très Rare", spawnRate:0.1, catchRate:35}, // NOUVEAU (Le clone raté)
     {name:"Lokhlass", id:131, rarity:"Très Rare", spawnRate:0.1, catchRate:45}
   ], boss:{name:"Giovanni (Persian)", id:53, level:47, catchRate:0}},

  // BADGE 6 : MARAIS
  {id:15, name:"Arène de Safrania", bg:"img/kanto/background/Zone 15.png", minLevel:40, maxLevel:45,
   pokemons:[
     {name:"Abra", id:63, rarity:"Commun", spawnRate:0.3, catchRate:200},
     {name:"Kadabra", id:64, rarity:"Peu Commun", spawnRate:0.2, catchRate:100},
     {name:"M. Mime", id:122, rarity:"Rare", spawnRate:0.15, catchRate:45},
     {name:"Kicklee", id:106, rarity:"Rare", spawnRate:0.1, catchRate:45},
     {name:"Tygnon", id:107, rarity:"Rare", spawnRate:0.1, catchRate:45},
     {name:"Excelangue", id:108, rarity:"Rare", spawnRate:0.15, catchRate:45}
   ], boss:{name:"Sabrina (Alakazam)", id:65, level:48, catchRate:0, badge:"Marais"}},

  // ZONE LÉGENDAIRE 2
  {id:16, name:"Îles Écume", bg:"img/kanto/background/Zone 16.png", minLevel:43, maxLevel:48,
   pokemons:[
     // Les Communs 
     {name:"Otaria", id:86, rarity:"Commun", spawnRate:0.2, catchRate:190},
     {name:"Kokiyas", id:90, rarity:"Commun", spawnRate:0.2, catchRate:190},
     
     // Les Peu Communs
     {name:"Krabby", id:98, rarity:"Peu Commun", spawnRate:0.15, catchRate:225},
     {name:"Hypotrempe", id:116, rarity:"Peu Commun", spawnRate:0.15, catchRate:190},
     {name:"Tentacruel", id:73, rarity:"Rare", spawnRate:0.15, catchRate:60},
     {name:"Lamantine", id:87, rarity:"Très Rare", spawnRate:0.1, catchRate:75},
     
     // Le Boss Légendaire
     {name:"Artikodin", id:144, rarity:"Légendaire", spawnRate:0.05, catchRate:3}
   ], boss:{name:"Artikodin", id:144, level:50, catchRate:0}},

  // BADGE 7 : VOLCAN
  {id:17, name:"Arène de Cramois'Île", bg:"img/kanto/background/Zone 17.png", minLevel:45, maxLevel:50,
   pokemons:[
     {name:"Ponyta", id:77, rarity:"Commun", spawnRate:0.2, catchRate:190},
     {name:"Goupix", id:37, rarity:"Commun", spawnRate:0.2, catchRate:190},
     {name:"Magmar", id:126, rarity:"Rare", spawnRate:0.15, catchRate:45},
     {name:"Amonita", id:138, rarity:"Très Rare", spawnRate:0.15, catchRate:45},
     {name:"Kabuto", id:140, rarity:"Très Rare", spawnRate:0.15, catchRate:45},
     {name:"Ptéra", id:142, rarity:"Très Rare", spawnRate:0.15, catchRate:45}
   ], boss:{name:"Blaine (Arcanin)", id:59, level:54, catchRate:0, badge:"Volcan"}},

  // BADGE 8 : TERRE (Jadielle déplacée avant Azurée)
  {id:18, name:"Arène de Jadielle", bg:"img/kanto/background/Zone 18.png", minLevel:50, maxLevel:58,
   pokemons:[
     {name:"Nidorino", id:33, rarity:"Commun", spawnRate:0.25, catchRate:120},
     {name:"Nidorina", id:30, rarity:"Commun", spawnRate:0.25, catchRate:120},
     {name:"Rhinocorne", id:111, rarity:"Peu Commun", spawnRate:0.2, catchRate:120},
     {name:"Triopikeur", id:51, rarity:"Rare", spawnRate:0.15, catchRate:50},
     {name:"Rhinoféros", id:112, rarity:"Rare", spawnRate:0.15, catchRate:60}
   ], boss:{name:"Giovanni (Rhinoféros)", id:112, level:60, catchRate:0, badge:"Terre"}},

  // ZONE LÉGENDAIRE 3 + MEWTWO (Votre demande spécifique)
  {id:19, name:"Caverne Azurée", bg:"img/kanto/background/Zone 19.png", minLevel:55, maxLevel:65,
   pokemons:[
     {name:"Parasect", id:47, rarity:"Commun", spawnRate:0.2, catchRate:75},
     {name:"Kadabra", id:64, rarity:"Commun", spawnRate:0.2, catchRate:100},
     {name:"Raichu", id:26, rarity:"Rare", spawnRate:0.25, catchRate:75}, // Shield Rare
     {name:"Draco", id:148, rarity:"Très Rare", spawnRate:0.3, catchRate:45}, // Shield Très Rare (Haut taux pour compenser Mewtwo)
     {name:"Mewtwo", id:150, rarity:"Légendaire", spawnRate:0.05, catchRate:3}
   ], boss:{name:"Mewtwo", id:150, level:70, catchRate:0}},

  // ROUTE VICTOIRE
  {id:20, name:"Route Victoire", bg:"img/kanto/background/Zone 20.png", minLevel:60, maxLevel:70,
   pokemons:[
     {name:"Machopeur", id:67, rarity:"Commun", spawnRate:0.3, catchRate:90},
     {name:"Gravalanch", id:75, rarity:"Peu Commun", spawnRate:0.3, catchRate:120},
     {name:"Nosferalto", id:42, rarity:"Rare", spawnRate:0.25, catchRate:90}, // Shield Rare
     {name:"Dracolosse", id:149, rarity:"Très Rare", spawnRate:0.1, catchRate:45}, // Shield Très Rare
     {name:"Sulfura", id:146, rarity:"Légendaire", spawnRate:0.05, catchRate:3}
   ], boss:{name:"Sulfura", id:146, level:80, catchRate:0}},

  // LA LIGUE (Final Boss)
  {id:21, name:"Ligue Pokémon", bg:"img/kanto/background/Zone 21.png", minLevel:70, maxLevel:90,
   pokemons:[
     // OLGA (Glace/Eau)
     {name:"Olga (Lokhlass)", id:131, rarity:"Conseil 4", level:74, catchRate:0},
     {name:"Olga (Lippoutou)", id:124, rarity:"Conseil 4", level:76, catchRate:0},
     
     // ALDO (Combat/Roche)
     {name:"Aldo (Mackogneur)", id:68, rarity:"Conseil 4", level:78, catchRate:0},
     {name:"Aldo (Onix)", id:95, rarity:"Conseil 4", level:80, catchRate:0},
     
     // AGATHA (Spectre/Poison)
     {name:"Agatha (Ectoplasma)", id:94, rarity:"Conseil 4", level:82, catchRate:0},
     {name:"Agatha (Arbok)", id:24, rarity:"Conseil 4", level:84, catchRate:0},
     
     // PETER (Dragon)
     {name:"Peter (Dracolosse)", id:149, rarity:"Conseil 4", level:86, catchRate:0},
     {name:"Peter (Léviator)", id:130, rarity:"Conseil 4", level:88, catchRate:0},

     // MAÎTRE BLUE (Son 1er Pokémon)
     {name:"Maître Blue (Roucarnage)", id:18, rarity:"Maître", level:92, catchRate:0}
   ], 
   // Le Boss est défini dynamiquement
   boss:{name:"Maître Blue", id:9, level:100, catchRate:0}}
];

ZONES[-4] = {id:-4, name:"Chez Maman", bg:"img/kanto/background/Chez Maman.png", minLevel:0, maxLevel:0, pokemons:[], boss:{name:"", id:0, level:0, catchRate:0}};
ZONES[-3] = {id:-3, name:"Chez Blue", bg:"img/kanto/background/Chez Blue.png", minLevel:0, maxLevel:0, pokemons:[], boss:{name:"", id:0, level:0, catchRate:0}};
ZONES[-2] = {id:-2, name:"Labo Pokémon du Prof. Chen", bg:"img/kanto/background/LaboPokemon.png", minLevel:0, maxLevel:0, pokemons:[], boss:{name:"", id:0, level:0, catchRate:0}};
ZONES[-5] = {id:-5, name:"Panthéon Pokémon", bg:"img/kanto/background/Pantheon.png", minLevel:0, maxLevel:0, pokemons:[], boss:{name:"", id:0, level:0, catchRate:0}};
ZONES[-1] = {id:-1, name:"Pension Pokémon", bg:"img/kanto/background/Pension.png", minLevel:0, maxLevel:0, pokemons:[], boss:{name:"", id:0, level:0, catchRate:0}};
ZONES[-6] = {id:-6, name:"Centre Commercial", bg:"img/kanto/background/CentreCommercial.png", minLevel:0, maxLevel:0, pokemons:[], boss:{name:"", id:0, level:0, catchRate:0}};
ZONES[-7] = {id:-7, name:"Casino", bg:"img/kanto/background/Casino.png", minLevel:0, maxLevel:0, pokemons:[], boss:{name:"", id:0, level:0, catchRate:0}};








