/*
Utilitaires partagés par toutes les pages du site.
Chargé en script classique : expose un objet global `PokemonUtils`.
Accessible aussi bien depuis les scripts classiques que depuis les modules ES6.
*/

(function (global) {
    // Ordre des langues tel qu'utilisé dans les JSON consolidés et les CSV PSDK.
    const LANGUAGES = ['en', 'fr', 'it', 'de', 'es', 'ko'];

    // Table de traduction des types officiels vers le français (accents gérés à part).
    const TYPE_FR = {
        normal: 'normal', fire: 'feu', water: 'eau', electric: 'électrique',
        grass: 'plante', ice: 'glace', fighting: 'combat', poison: 'poison',
        ground: 'sol', flying: 'vol', psychic: 'psy', bug: 'insecte',
        rock: 'roche', ghost: 'spectre', dragon: 'dragon', dark: 'ténèbres',
        steel: 'acier', fairy: 'fée'
    };

    // Plage des diacritiques combinants (U+0300 à U+036F), identique à /[̀-ͯ]/.
    const COMBINING_MARKS = new RegExp(
        '[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']',
        'g'
    );

    function removeAccents(str) {
        return str.normalize("NFD").replace(COMBINING_MARKS, "");
    }

    function translateTypeToFrench(type) {
        return TYPE_FR[type.toLowerCase()] || type;
    }

    // Résout le code langue courant à partir du LanguageManager.
    // Reproduit exactement l'ancien comportement : un index hors de LANGUAGES
    // (ex. 'kana' -> 6, ou langue inconnue -> -1) retombe sur 'en'.
    function getLang(languageManager) {
        return LANGUAGES[languageManager.getLangIndex()] || 'en';
    }

    // Cache de fetch JSON mémoïsé par URL absolue.
    // Les données du site sont statiques : un même fichier (national.json,
    // fiche consolidée...) n'est ainsi téléchargé qu'une seule fois par page.
    // Un échec n'est pas mémorisé, pour laisser une nouvelle tentative possible.
    const _jsonCache = new Map();
    function fetchJson(url) {
        const key = new URL(url, document.baseURI).href;
        if (!_jsonCache.has(key)) {
            const promise = fetch(url)
                .then(response => response.json())
                .catch(error => {
                    _jsonCache.delete(key);
                    throw error;
                });
            _jsonCache.set(key, promise);
        }
        return _jsonCache.get(key);
    }

    global.PokemonUtils = {
        LANGUAGES,
        TYPE_FR,
        removeAccents,
        translateTypeToFrench,
        getLang,
        fetchJson
    };
})(window);
