# Prompts pour générer des cartes de Kanto (ChatGPT)

Chaque génération : joindre `reference-carte-v1.png` (la disposition à respecter), et rien d'autre. Demander une image 16:9, la plus grande taille possible.

## Bloc POSITIONS (à coller dans chaque prompt)
Place these locations at these exact positions, given as percentage of the image width (x, from the left) and height (y, from the top). Everything else (coast, relief, forests, rivers, sea) is up to you but must make geographic sense.
- Pallet Town 17 / 75 (south-west, small village)
- Route 1: a path from Pallet Town north to Viridian City, 17 / 67
- Viridian City 17 / 58
- Viridian Forest 17 / 47 (dense forest, north of Viridian)
- Pewter City 17 / 36 (rocky town, north)
- Indigo Plateau 11 / 31 and Victory Road 11 / 36 (far north-west, mountain pass leading to the League building)
- Mt. Moon 33 / 31 (mountain with caves, east of Pewter)
- Cerulean City 48.5 / 31 (water city on a river), Nugget Bridge 48.5 / 25 (bridge just north), Cerulean Cave 49 / 15 (isolated cave, far north)
- Rock Tunnel 61 / 31 (rocky pass, east of Cerulean) and Power Plant 61 / 36 (industrial building, east coast)
- Celadon City 39 / 47 (big city, west of Saffron)
- Saffron City 48.5 / 47 (largest city, the centre of the region, with a tall office tower, the Silph Co. building)
- Lavender Town 62 / 48.5 (small town with a tall tower, east coast)
- Vermilion City 48.5 / 64 (harbour city, south of Saffron) and Diglett's Cave 51.5 / 64 (small cave entrance next to it)
- Fuchsia City 42 / 81 (southern coastal town, safari park nearby)
- Cinnabar Island 17 / 92 (volcanic island, south of Pallet Town) and Seafoam Islands 30 / 92 (small rocky islands between Cinnabar and Fuchsia)
Roads: Pallet to Viridian to Pewter along the west side; Pewter east to Mt. Moon to Cerulean; Cerulean south to Saffron to Vermilion; Saffron west to Celadon and east to Lavender; Cerulean east to Rock Tunnel then south to Lavender; Lavender south to Vermilion then south-west to Fuchsia; sea routes from Fuchsia to Seafoam Islands to Cinnabar. Geography follows the Pokémon games and the anime: Kanto is a landmass with its west coast on the left, a big bay in the middle south (between Celadon and Fuchsia), the open sea to the east and south.

## Prompt 2 : réaliste illustré (une seule image jointe : `reference-carte-v1.png`)
Create a detailed, realistic hand-illustrated map of the Pokémon region of Kanto, top-down view, 16:9 landscape. Style: painterly illustration with fine ink outlines, rich natural colours, like a detailed fantasy atlas. Keep the layout of the attached reference map and the positions listed below. The land fills the left two thirds, the right third is open sea with a few waves. Most of the land is nature: dense forests, rolling hills, fields, rocky mountains, rivers, lakes, sandy beaches and cliffs. Settlements are small: villages and country towns with a handful of houses each, harbours with tiny boats for the coastal towns; only Saffron City is a larger town, still modest, with a few streets and one tall office tower. NO industrial districts, NO giant city, NO stadium, NO crater, NO big volcano (only Cinnabar Island has a small volcano). Lots of fine detail: individual trees, cliffs, bridges, farmland, a visible dirt road network between towns. No text, no labels, no title, no frame, no user interface, no icons, no watermark. Bright daylight, saturated colours, readable on a dark interface. [coller ici le bloc POSITIONS]

## Prompt 3 : diorama stylisé en relief
Create a polished stylized top-down diorama map of the Pokémon region of Kanto, 16:9 landscape, in the look of a modern Pokémon game world map: soft lighting, rounded low-poly terrain, tiny detailed 3D buildings in each town, clusters of round trees, glossy blue water with a light foam line along the coast, small cliffs, winding roads in warm sand colour. Keep the layout of the attached reference map and the positions listed below. The land fills the left two thirds, the right third is open sea. No text, no labels, no title, no frame, no user interface, no icons, no watermark. [coller ici le bloc POSITIONS]

## Ensuite
Envoie-moi les images : je les recadre en 16:9, je les teste sur la vraie page avec ?carte=<nom> et je corrige les positions des zones si besoin.
