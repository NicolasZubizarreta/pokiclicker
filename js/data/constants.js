// --- CONSTANTS ---
const ITEMS = {
    // Consommables
    pokeball: { name: "Pokéball", price: 200, desc: "Capture des Pokémon (Faible chance)", type: "consumable", zone: 0, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png", invKey: "balls" },
    superball: { name: "Superball", price: 600, desc: "Capture des Pokémon (Moyenne chance x2)", type: "consumable", zone: 6, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png", invKey: "superballs" },
    hyperball: { name: "Hyperball", price: 1500, desc: "Capture des Pokémon (Haute chance x4)", type: "consumable", zone: 9, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png", invKey: "hyperballs" },
    candy: { name: "Bonbon", price: 5000, desc: "Fait monter un Pokémon de niveau", type: "consumable", zone: 8, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png", invKey: "candy" },
    masterball: { name: "Master Ball", price: 150000, desc: "Capture à coup sûr (100%)", type: "consumable", zone: 16, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png", invKey: "masterball" },
    repel: { name: "Repousse", price: 2000, desc: "Empêche les Pokémon communs d'apparaître pendant 30s", type: "consumable", zone: 4, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/repel.png", invKey: "repel" },    
    xAttack: { name: "Attaque +", price: 7500, desc: "Dégâts/clic +50% (30s)", type: "consumable", zone: 8, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/x-attack.png", invKey: "xAttack" },
    xSpecial: { name: "Attaque Spé +", price: 10000, desc: "DPS Équipe +50% (30s)", type: "consumable", zone: 12, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/x-sp-atk.png", invKey: "xSpecial" },
    superRepel: { name: "Superepousse", price: 12000, desc: "Bloque Communs/Peu Communs (30s)", type: "consumable", zone: 13, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/super-repel.png", invKey: "superRepel" },
    pokeDoll: { name: "Poké Poupée", price: 5000, desc: "Invoque le Boss (Si déjà vaincu)", type: "consumable", zone: 15, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-doll.png", invKey: "pokeDoll" },
    everstone: { name: "Pierre Stase", price: 10000, desc: "Bloque l'évolution. Dégâts +25% (Base & Évolutif uniquement)", type: "consumable", zone: 10, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/everstone.png", invKey: "everstone" },
    // Améliorations
    runningShoes: { name: "Chaussures Sport", price: 2000, desc: "Divise le temps d'apparition des ennemis par 1.5", type: "upgrade", zone: 1, icon: "sprint", iconColor: "text-orange-400" },
    amuletCoin: { name: "Pièce Rune", price: 4000, desc: "Gains d'argent +30%", type: "upgrade", zone: 2, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/amulet-coin.png" },
    protein: { name: "Protéine", price: 7500, desc: "Augmente les dégâts du clic de +50%", type: "upgrade", zone: 3, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/protein.png" },
    expShare: { name: "Multi Exp", price: 12000, desc: "XP gagnée +50%", type: "upgrade", zone: 4, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/exp-share.png" },
    hardStone: { name: "Pierre Dure", price: 15000, desc: "Augmente les dégâts du clic de +30%", type: "upgrade", zone: 6, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/hard-stone.png" },
    bicycle: { name: "Bicyclette", price: 30000, desc: "Vitesse de spawn x3 (Remplace Chaussures)", type: "upgrade", zone: 7, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/bicycle.png" },
    luckyEgg: { name: "Oeuf Chance", price: 75000, desc: "XP gagnée +50%", type: "upgrade", zone: 10, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lucky-egg.png" },
    pokeradar: { name: "Poké-Radar", price: 45000, desc: "Affiche les Pokémon trouvables dans la zone actuelle.", type: "upgrade", zone: 8, icon: "radar", iconColor: "text-green-400" },
    leftovers: { name: "Restes", price: 150000, desc: "Auto-click 9 clics/sec", type: "upgrade", zone: 14, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/leftovers.png" },
    falseSwipe: { name: "CT Fauchage", price: 100000, desc: "Compétence : Empêche le Pokémon sauvage de mourir (1 PV min). Recharge 30s.", type: "upgrade", zone: 12, icon: "content_cut", iconColor: "text-red-400" },
    shinyCharm: { name: "Charme Chroma", price: 0, desc: "Chances de Shiny x3 (Passif)", type: "upgrade", zone: 99, img: "img/kanto/icones/CharmeChroma.png" },
    diploma: { name: "Diplôme Kanto", price: 0, desc: "Preuve de complétion du Pokédex", type: "upgrade", zone: 99, img: "img/kanto/icones/Diplôme.png" }
};
const EVOLUTIONS = {
    1:{id:2,lvl:16,name:"Herbizarre"}, 2:{id:3,lvl:32,name:"Florizarre"},
    4:{id:5,lvl:16,name:"Reptincel"}, 5:{id:6,lvl:36,name:"Dracaufeu"},
    7:{id:8,lvl:16,name:"Carabaffe"}, 8:{id:9,lvl:36,name:"Tortank"},
    10:{id:11,lvl:7,name:"Chrysacier"}, 11:{id:12,lvl:10,name:"Papilusion"},
    13:{id:14,lvl:7,name:"Coconfort"}, 14:{id:15,lvl:10,name:"Dardargnan"},
    16:{id:17,lvl:18,name:"Roucoups"}, 17:{id:18,lvl:36,name:"Roucarnage"},
    19:{id:20,lvl:20,name:"Rattatac"},
    21:{id:22,lvl:20,name:"Rapasdepic"},
    23:{id:24,lvl:22,name:"Arbok"},
    25:{id:26,lvl:22,name:"Raichu"},
    27:{id:28,lvl:22,name:"Sablaireau"},
    29:{id:30,lvl:16,name:"Nidorina"}, 30:{id:31,lvl:36,name:"Nidoqueen"},
    32:{id:33,lvl:16,name:"Nidorino"}, 33:{id:34,lvl:36,name:"Nidoking"},
    35:{id:36,lvl:25,name:"Mélodelfe"},
    37:{id:38,lvl:25,name:"Feunard"},
    39:{id:40,lvl:25,name:"Grodoudou"},
    41:{id:42,lvl:22,name:"Nosferalto"},
    43:{id:44,lvl:21,name:"Ortide"}, 44:{id:45,lvl:32,name:"Rafflesia"}, // Rafflesia requires Stone usually
    46:{id:47,lvl:24,name:"Parasect"},
    48:{id:49,lvl:31,name:"Aéromite"},
    50:{id:51,lvl:26,name:"Triopikeur"},
    52:{id:53,lvl:28,name:"Persian"},
    54:{id:55,lvl:33,name:"Akwakwak"},
    56:{id:57,lvl:28,name:"Colossinge"},
    58:{id:59,lvl:25,name:"Arcanin"},
    60:{id:61,lvl:25,name:"Têtarte"}, 61:{id:62,lvl:35,name:"Tartard"},
    63:{id:64,lvl:16,name:"Kadabra"}, 64:{id:65,lvl:36,name:"Alakazam"}, // Trade logic ignored for clicker
    66:{id:67,lvl:28,name:"Machopeur"}, 67:{id:68,lvl:40,name:"Mackogneur"},
    69:{id:70,lvl:21,name:"Boustiflor"}, 70:{id:71,lvl:32,name:"Empiflor"},
    72:{id:73,lvl:30,name:"Tentacruel"},
    74:{id:75,lvl:25,name:"Gravalanch"}, 75:{id:76,lvl:36,name:"Grolem"},
    77:{id:78,lvl:40,name:"Galopa"},
    79:{id:80,lvl:37,name:"Flagadoss"},
    81:{id:82,lvl:30,name:"Magnéton"},
    84:{id:85,lvl:31,name:"Dodrio"},
    86:{id:87,lvl:34,name:"Lamantine"},
    88:{id:89,lvl:38,name:"Grotadmorv"},
    90:{id:91,lvl:30,name:"Crustabri"},
    92:{id:93,lvl:25,name:"Spectrum"}, 93:{id:94,lvl:40,name:"Ectoplasma"},
    96:{id:97,lvl:26,name:"Hypnomade"},
    98:{id:99,lvl:28,name:"Krabboss"},
    100:{id:101,lvl:30,name:"Électrode"},
    102:{id:103,lvl:30,name:"Noadkoko"},
    104:{id:105,lvl:28,name:"Ossatueur"},
    109:{id:110,lvl:35,name:"Smogogo"},
    111:{id:112,lvl:42,name:"Rhinoféros"},
    116:{id:117,lvl:32,name:"Hypocéan"},
    118:{id:119,lvl:33,name:"Poissoroy"},
    120:{id:121,lvl:30,name:"Staross"},
    129:{id:130,lvl:20,name:"Léviator"},
    133:{id:[134,135,136],lvl:20,name:["Aquali","Voltali","Pyroli"]},
    138:{id:139,lvl:40,name:"Amonistar"},
    140:{id:141,lvl:40,name:"Kabutops"},
    147:{id:148,lvl:30,name:"Draco"}, 148:{id:149,lvl:55,name:"Dracolosse"}
};

const BASE_STATS = {
    // --- STARTERS (Gros Buff) ---
    "1": 79,  "2": 101, "3": 131,  // Bulbizarre
    "4": 77,  "5": 101, "6": 133,  // Salamèche (Dracaufeu puissant)
    "7": 78,  "8": 101, "9": 132,  // Carapuce

    // --- INSECTES & DÉBUT DE JEU ---
    "10": 48, "11": 51, "12": 98,  // Papilusion
    "13": 48, "14": 51, "15": 98,  // Dardargnan
    "16": 62, "17": 87, "18": 119, // Roucarnage
    "19": 63, "20": 103,           // Rattatac
    "21": 65, "22": 110,           // Rapasdepic
    "23": 72, "24": 112,           // Arbok
    "25": 80, "26": 121,           // Pikachu / Raichu

    // --- SOL / FÉE / POISON ---
    "27": 75, "28": 112,           // Sablaireau
    "29": 68, "30": 91, "31": 126, // Nidoqueen
    "32": 68, "33": 91, "34": 126, // Nidoking
    "35": 80, "36": 120,           // Melodelfe
    "37": 74, "38": 126,           // Feunard
    "39": 67, "40": 108,           // Grodoudou
    "41": 61, "42": 113,           // Nosferalto
    "43": 80, "44": 98, "45": 122, // Rafflesia
    "46": 71, "47": 101,           // Parasect
    "48": 76, "49": 118,           // Aeromite
    "50": 66, "51": 101,           // Triopikeur

    // --- CHATS / PSY / COMBAT ---
    "52": 72, "53": 110,           // Persian
    "54": 80, "55": 125,           // Akwakwak
    "56": 76, "57": 113,           // Colossinge
    "58": 87, "59": 138,           // Arcanin
    "60": 75, "61": 96, "62": 127, // Tartard
    "63": 77, "64": 100, "65": 125,// Alakazam
    "66": 76, "67": 101, "68": 126,// Mackogneur
    "69": 75, "70": 97, "71": 122, // Empiflor
    "72": 83, "73": 128,           // Tentacruel

    // --- ROCHE / FEU / EAU / TANK ---
    "74": 75, "75": 97, "76": 123, // Grolem
    "77": 102, "78": 125,          // Galopa
    "79": 78, "80": 122,           // Flagadoss
    "81": 81, "82": 116,           // Magneton
    "83": 77, "84": 92, "85": 117, // Dodrio
    "86": 81, "87": 118,           // Lamantine
    "88": 81, "89": 125,           // Grotadmorv
    "90": 76, "91": 131,           // Crustabri
    "92": 77, "93": 101, "94": 125,// Ectoplasma
    "95": 96,                      // Onix (Buffé)

    // --- PSY / ELECTRIK / EXOTIQUE ---
    "96": 82, "97": 120,           // Hypnomade
    "98": 81, "99": 118,           // Krabboss
    "100": 82, "101": 120,         // Electrode
    "102": 81, "103": 130,         // Noadkoko
    "104": 80, "105": 106,         // Ossatueur
    "106": 113,                    // Kicklee
    "107": 113,                    // Tygnon
    "108": 96,                     // Excelangue
    "109": 85, "110": 122,         // Smogogo
    "111": 86, "112": 121,         // Rhinoferos
    "113": 112,                    // Leveinard (Buffé)
    "114": 108,                    // Saquedeneu
    "115": 122,                    // Kangourex

    // --- EAU / INSECTE / NORMAL ---
    "116": 73, "117": 135,         // Hypocean
    "118": 80, "119": 112,         // Poissoroy
    "120": 85, "121": 130,         // Staross
    "122": 115,                    // M. Mime
    "123": 125,                    // Insecateur
    "124": 113,                    // Lippoutou
    "125": 122,                    // Elektek
    "126": 123,                    // Magmar
    "127": 125,                    // Scarabrute
    "128": 122,                    // Tauros

    // --- SPÉCIAUX ---
    "129": 5, "130": 135,          // Léviator
    "131": 133,                    // Lokhlass
    "132": 72,                     // Metamorph
    "133": 81, "134": 131, "135": 131, "136": 131, // Evoli et évolutions

    // --- FOSSILES / RONFLEX ---
    "137": 98,                     // Porygon
    "138": 88, "139": 123,         // Amonistar
    "140": 88, "141": 123,         // Kabutops
    "142": 128,                    // Ptera
    "143": 135,                    // Ronflex

    // --- LÉGENDAIRES & MYTHIQUES ---
    "144": 145,                    // Artikodin
    "145": 145,                    // Electhor
    "146": 145,                    // Sulfura
    "147": 75, "148": 105, "149": 150, // Dracolosse
    "150": 170,                    // Mewtwo
    "151": 150                     // Mew
};

const BASE_HP = {
    // --- STARTERS ---
    "1": 53,  "2": 68, "3": 88,  // Bulbizarre
    "4": 51,  "5": 66, "6": 85,  // Salamèche
    "7": 53,  "8": 70, "9": 95,  // Carapuce (Le plus tanky)

    // --- INSECTES ---
    "10": 33, "11": 37, "12": 60,  // Papilusion
    "13": 32, "14": 35, "15": 60,  // Dardargnan

    // --- OISEAUX / RONGEURS ---
    "16": 42, "17": 58, "18": 77,  // Roucarnage
    "19": 38, "20": 67,            // Rattatac
    "21": 42, "22": 72,            // Rapasdepic
    "23": 50, "24": 73,            // Arbok
    "25": 40, "26": 68,            // Pikachu / Raichu

    // --- SOL / FÉE / POISON ---
    "27": 58, "28": 87,            // Sablaireau
    "29": 58, "30": 74, "31": 97,  // Nidoqueen
    "32": 53, "33": 70, "34": 97,  // Nidoking
    "35": 62, "36": 90,            // Melodelfe
    "37": 63, "38": 97,            // Feunard
    "39": 72, "40": 92,            // Grodoudou (Nerfé)
    "41": 43, "42": 77,            // Nosferalto
    "43": 57, "44": 72, "45": 92,  // Rafflesia
    "46": 52, "47": 77,            // Parasect
    "48": 57, "49": 78,            // Aeromite
    "50": 32, "51": 57,            // Triopikeur

    // --- CHATS / PSY / COMBAT ---
    "52": 52, "53": 73,            // Persian
    "54": 60, "55": 87,            // Akwakwak
    "56": 48, "57": 72,            // Colossinge
    "58": 67, "59": 90,            // Arcanin
    "60": 55, "61": 70, "62": 92,  // Tartard
    "63": 38, "64": 55, "65": 65,  // Alakazam (Fragile)
    "66": 58, "67": 72, "68": 88,  // Mackogneur
    "69": 50, "70": 67, "71": 87,  // Empiflor
    "72": 72, "73": 100,           // Tentacruel

    // --- ROCHE / FEU / EAU ---
    "74": 58, "75": 72, "76": 92,  // Grolem
    "77": 60, "78": 77,            // Galopa
    "79": 78, "80": 98,            // Flagadoss
    "81": 57, "82": 78,            // Magneton
    "83": 48, "84": 62, "85": 72,  // Dodrio
    "86": 72, "87": 98,            // Lamantine
    "88": 72, "89": 98,            // Grotadmorv
    "90": 58, "91": 92,            // Crustabri (Buffé)
    "92": 45, "93": 60, "94": 75,  // Ectoplasma
    "95": 80,                      // Onix (Gros Buff)

    // --- DIVERS ---
    "96": 77, "97": 100,           // Hypnomade
    "98": 62, "99": 82,            // Krabboss
    "100": 55, "101": 73,          // Electrode
    "102": 67, "103": 92,          // Noadkoko
    "104": 68, "105": 83,          // Ossatueur
    "106": 70, "107": 78,          // Hitmons
    "108": 72,                     // Excelangue
    "109": 62, "110": 83,          // Smogogo
    "111": 63, "112": 88,          // Rhinoferos
    "113": 120,                    // Leveinard (Équilibré)
    "114": 82,                     // Saquedeneu
    "115": 92,                     // Kangourex

    // --- EAU / INSECTE / NORMAL ---
    "116": 50, "117": 92,          // Hypocean
    "118": 60, "119": 80,          // Poissoroy
    "120": 57, "121": 82,          // Staross
    "122": 80,                     // M. Mime
    "123": 75,                     // Insecateur
    "124": 68,                     // Lippoutou
    "125": 70,                     // Elektek
    "126": 72,                     // Magmar
    "127": 82,                     // Scarabrute
    "128": 82,                     // Tauros

    // --- SPÉCIAUX ---
    "129": 20, "130": 95,          // Léviator
    "131": 102,                    // Lokhlass
    "132": 48,                     // Metamorph
    "133": 55, "134": 97, "135": 78, "136": 82, // Evoli line

    // --- FOSSILES / RONFLEX ---
    "137": 70,                     // Porygon
    "138": 82, "139": 98,          // Amonistar
    "140": 68, "141": 80,          // Kabutops
    "142": 72,                     // Ptera
    "143": 112,                    // Ronflex

    // --- LÉGENDAIRES ---
    "144": 105,                    // Artikodin
    "145": 95,                     // Electhor
    "146": 95,                     // Sulfura
    "147": 55, "148": 78, "149": 103, // Dracolosse
    "150": 95,                     // Mewtwo
    "151": 100                     // Mew
};

const ZONE_MULT = [1, 1, 1.5, 2.2, 3.5, 6];

const TYPES = {
    NORMAL:"Normal", FIRE:"Fire", WATER:"Water", GRASS:"Grass", ELECTRIC:"Electric", ICE:"Ice", 
    FIGHTING:"Fighting", POISON:"Poison", GROUND:"Ground", FLYING:"Flying", PSYCHIC:"Psychic", 
    BUG:"Bug", ROCK:"Rock", GHOST:"Ghost", DRAGON:"Dragon", STEEL:"Steel", DARK:"Dark", FAIRY:"Fairy"
};

const TYPE_CHART = {
    Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
    Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
    Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
    Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
    Electric: { Water: 2, Grass: 0.5, Electric: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
    Ice: { Fire: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
    Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
    Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
    Ground: { Fire: 2, Grass: 0.5, Electric: 2, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
    Flying: { Grass: 2, Electric: 0.5, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
    Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
    Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
    Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
    Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
    Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
    Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
    Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
    Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 }
};

const PKMN_TYPES = {
    1: ["Grass", "Poison"], 2: ["Grass", "Poison"], 3: ["Grass", "Poison"],
    4: ["Fire"], 5: ["Fire"], 6: ["Fire", "Flying"],
    7: ["Water"], 8: ["Water"], 9: ["Water"],
    10: ["Bug"], 11: ["Bug"], 12: ["Bug", "Flying"],
    13: ["Bug", "Poison"], 14: ["Bug", "Poison"], 15: ["Bug", "Poison"],
    16: ["Normal", "Flying"], 17: ["Normal", "Flying"], 18: ["Normal", "Flying"],
    19: ["Normal"], 20: ["Normal"],
    21: ["Normal", "Flying"], 22: ["Normal", "Flying"],
    23: ["Poison"], 24: ["Poison"],
    25: ["Electric"], 26: ["Electric"],
    27: ["Ground"], 28: ["Ground"],
    29: ["Poison"], 30: ["Poison"], 31: ["Poison", "Ground"],
    32: ["Poison"], 33: ["Poison"], 34: ["Poison", "Ground"],
    35: ["Fairy"], 36: ["Fairy"], // Retcon Fée
    37: ["Fire"], 38: ["Fire"],
    39: ["Normal", "Fairy"], 40: ["Normal", "Fairy"], // Retcon Fée
    41: ["Poison", "Flying"], 42: ["Poison", "Flying"],
    43: ["Grass", "Poison"], 44: ["Grass", "Poison"], 45: ["Grass", "Poison"],
    46: ["Bug", "Grass"], 47: ["Bug", "Grass"],
    48: ["Bug", "Poison"], 49: ["Bug", "Poison"],
    50: ["Ground"], 51: ["Ground"],
    52: ["Normal"], 53: ["Normal"],
    54: ["Water"], 55: ["Water"],
    56: ["Fighting"], 57: ["Fighting"],
    58: ["Fire"], 59: ["Fire"],
    60: ["Water"], 61: ["Water"], 62: ["Water", "Fighting"],
    63: ["Psychic"], 64: ["Psychic"], 65: ["Psychic"],
    66: ["Fighting"], 67: ["Fighting"], 68: ["Fighting"],
    69: ["Grass", "Poison"], 70: ["Grass", "Poison"], 71: ["Grass", "Poison"],
    72: ["Water", "Poison"], 73: ["Water", "Poison"],
    74: ["Rock", "Ground"], 75: ["Rock", "Ground"], 76: ["Rock", "Ground"],
    77: ["Fire"], 78: ["Fire"],
    79: ["Water", "Psychic"], 80: ["Water", "Psychic"],
    81: ["Electric", "Steel"], 82: ["Electric", "Steel"], // Retcon Acier
    83: ["Normal", "Flying"], 84: ["Normal", "Flying"], 85: ["Normal", "Flying"],
    86: ["Water"], 87: ["Water", "Ice"],
    88: ["Poison"], 89: ["Poison"],
    90: ["Water"], 91: ["Water", "Ice"],
    92: ["Ghost", "Poison"], 93: ["Ghost", "Poison"], 94: ["Ghost", "Poison"],
    95: ["Rock", "Ground"],
    96: ["Psychic"], 97: ["Psychic"],
    98: ["Water"], 99: ["Water"],
    100: ["Electric"], 101: ["Electric"],
    102: ["Grass", "Psychic"], 103: ["Grass", "Psychic"],
    104: ["Ground"], 105: ["Ground"],
    106: ["Fighting"], 107: ["Fighting"],
    108: ["Normal"],
    109: ["Poison"], 110: ["Poison"],
    111: ["Ground", "Rock"], 112: ["Ground", "Rock"],
    113: ["Normal"],
    114: ["Grass"],
    115: ["Normal"],
    116: ["Water"], 117: ["Water"],
    118: ["Water"], 119: ["Water"],
    120: ["Water"], 121: ["Water", "Psychic"],
    122: ["Psychic", "Fairy"], // Retcon Fée
    123: ["Bug", "Flying"],
    124: ["Ice", "Psychic"],
    125: ["Electric"],
    126: ["Fire"],
    127: ["Bug"],
    128: ["Normal"],
    129: ["Water"], 130: ["Water", "Flying"],
    131: ["Water", "Ice"],
    132: ["Normal"],
    133: ["Normal"],
    134: ["Water"],
    135: ["Electric"],
    136: ["Fire"],
    137: ["Normal"],
    138: ["Rock", "Water"], 139: ["Rock", "Water"],
    140: ["Rock", "Water"], 141: ["Rock", "Water"],
    142: ["Rock", "Flying"],
    143: ["Normal"],
    144: ["Ice", "Flying"],
    145: ["Electric", "Flying"],
    146: ["Fire", "Flying"],
    147: ["Dragon"], 148: ["Dragon"], 149: ["Dragon", "Flying"],
    150: ["Psychic"], 151: ["Psychic"]
};

const TYPE_COLORS = {
    Normal: "#A8A77A", Fire: "#EE8130", Water: "#6390F0", Electric: "#F7D02C", Grass: "#7AC74C",
    Ice: "#96D9D6", Fighting: "#C22E28", Poison: "#A33EA1", Ground: "#E2BF65", Flying: "#A98FF3",
    Psychic: "#F95587", Bug: "#A6B91A", Rock: "#B6A136", Ghost: "#735797", Dragon: "#6F35FC",
    Steel: "#B7B7CE", Dark: "#705746", Fairy: "#D685AD"
};

const MILESTONES = [
    {count:10, title:"Débutant", desc:"Dégâts Clic x2"},
    {count:20, title:"Amateur", desc:"+2,500 $P"},
    {count:30, title:"Collectionneur", desc:"DPS Équipe +50%"},
    {count:40, title:"Dresseur", desc:"Omni Exp (XP +100%)"},
    {count:50, title:"Expert", desc:"Spawn +20%"},
    {count:70, title:"Champion", desc:"Shop -15%"},
    {count:90, title:"Maître", desc:"Dégâts Totaux +50%"},
    {count:110, title:"Légende", desc:"Jeton Brillant"},
    {count:130, title:"Mythique", desc:"Master Ball + 10 Bonbons"},
    {count:151, title:"Kanto Master", desc:"Charme Chroma (Shiny x3)"}
];

// Map names to IDs manually for older entries, but preferred to put ID in ZONE data
const ID_MAP_FALLBACK = {
    "Rattata":19,"Roucool":16,"Rattatac":20,"Roucoups":17,"Bulbizarre":1,"Chenipan":10,"Aspicot":13,"Chrysacier":11,"Coconfort":14,
    "Pikachu":25,"Salamèche":4,"Papilusion":12,"Racaillou":74,"Sabelette":27,"Nidoran♀":29,"Nidoran♂":32,"Onix":95,"Carapuce":7,
    "Nosferapti":41,"Paras":46,"Mélofée":35,"Rondoudou":39,"Leveinard":113,"Mélodelfe":36,"Mystherbe":43,"Chétiflor":69,"Abra":63,
    "Mimitoss":48,"Mew":151,"Roucarnage":18
};


const INTRO_DIALOGS = [
    "Salutations ! Bienvenue dans le monde merveilleux des Pokémon !",
    "Mon nom est Chen. Les gens m'appellent souvent le Professeur Pokémon.",
    "Ce monde est peuplé de créatures appelées Pokémon. Pour certains, ce sont des animaux domestiques, pour d'autres, des partenaires de combat.",
    "Pour les apprivoiser il ne suffit pas de les regarder... Il faut les capturer ! Tiens, voici 5 Pokéballs pour te lancer.",
    "Quant à moi... J'étudie les Pokémon comme profession. Mais je suis trop vieux maintenant. J'ai besoin de toi pour compléter le Pokédex !",
    "Le monde est vaste. Pour t'aider à te repérer entre les différentes zones, je te confie aussi cette Carte de la Région.",
    "Mais c'est dangereux de partir dans les hautes herbes sans protection ! J'ai ici trois Pokémon rares. Choisis-en un, il t'accompagnera dans ton voyage."
];
const ENDING_DIALOGS = [
    "Incroyable... Je n'en crois pas mes yeux !",
    "Ton Pokédex... Il est complet ! Tu as attrapé les 151 Pokémon de Kanto !",
    "C'était mon rêve depuis toujours. Tu l'as réalisé pour moi.",
    "Tu es officiellement le plus grand Collectionneur Pokémon de la région !",
    "En guise de reconnaissance, voici ton Diplôme officiel.",
    "Félicitations !",
    "Prends aussi ceci : le Charme Chroma. Les Pokémon Shinies apparaîtront beaucoup plus souvent !",
    "Qui sait peut être qu'un jour tu attraperas tous les pokémons du monde... L'aventure continue !"
];
const PANTHEON_DIALOGS = [
    "Splendide ! Simplement splendide !",
    "Tu as vaincu le Conseil des 4 et le Maître actuel. Tu es le nouveau Maître de la Ligue de Kanto !",
    "Mais tu n'as pas gagné seul. Viens avec moi, allons enregistrer tes partenaires au Panthéon."
];
const JOHTO_INTRO_DIALOGS = [
    "Ah, te voilà de retour au Bourg Palette ! Maître de la Ligue... Ça sonne bien, n'est-ce pas ?",
    "Tout Kanto parle de tes exploits. Tu as prouvé ta valeur en tant que dresseur d'élite.",
    "Cependant, la quête du savoir ne s'arrête jamais. Il reste encore des Pokémon rares cachés ici.",
    "Mais si tu as soif de nouveaux horizons... J'ai reçu un appel de mon collègue, le Professeur Orme.",
    "Il habite à Johto, une région voisine. Il paraît qu'on y trouve des espèces totalement inconnues !",
    "J'ai mis à jour ton Passe. Tu peux désormais voyager vers Johto depuis le port du Bourg Palette."
];
const GENDERLESS_IDS = [81, 82, 100, 101, 120, 121, 132, 137, 144, 145, 146, 150, 151];
const ALWAYS_FEMALE_IDS = [29, 30, 31, 113, 115, 124];
const ALWAYS_MALE_IDS = [32, 33, 34, 106, 107, 128];



