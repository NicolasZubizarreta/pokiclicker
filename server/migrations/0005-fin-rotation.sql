-- L'historique de rotation n'est plus écrit et aucune route ne le lisait : on libère l'espace.
DELETE FROM versions WHERE origine = 'rotation';
