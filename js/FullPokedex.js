/*
Grille complète du Pokédex, avec filtrage par type.

Toutes les données nécessaires à la grille (nom + types) sont désormais
présentes dans national.json (enrichi par setup.py). On ne télécharge donc
plus une fiche consolidée par Pokémon : une seule requête suffit, et l'ordre
du dex est conservé nativement (on parcourt data.creatures dans l'ordre).
Les cartes sont assemblées dans un DocumentFragment puis insérées en une fois.

Le filtre est en OU : sans sélection tout est affiché, sinon on garde les
Pokémon possédant au moins un des types cochés. Les cartes ne sont jamais
reconstruites, on se contente de les masquer. La sélection est reflétée dans
l'URL (?types=fire,ghost) pour qu'un filtre soit partageable et survive à un
changement de langue (qui recharge la page).
*/

document.addEventListener('DOMContentLoaded', async () => {
    const pokedexGrid = document.getElementById('pokedexGrid');
    const typeFilters = document.getElementById('typeFilters');
    const resetButton = document.getElementById('resetTypeFilters');
    const countLabel = document.getElementById('pokedexCount');
    const noResults = document.getElementById('noPokemonFound');

    // Types filtrables : les 18 officiels (dans l'ordre de PokemonUtils) puis
    // les deux types propres à Pokémon Luck.
    const FILTER_TYPES = [...Object.keys(PokemonUtils.TYPE_FR), 'undead', 'celestial'];

    // Noms français des types absents de la table officielle (mêmes libellés
    // que la table des types).
    const EXTRA_TYPE_FR = { undead: 'zombie', celestial: 'céleste' };

    // Types sélectionnés, en anglais comme dans national.json.
    const selectedTypes = new Set(readTypesFromUrl());

    // Une entrée par carte : { element, types } — évite de relire le DOM à
    // chaque clic sur un filtre.
    const cards = [];

    // Slug utilisé pour les classes CSS et les noms d'icônes ('fire' -> 'feu').
    function typeSlug(type) {
        return PokemonUtils.removeAccents(PokemonUtils.translateTypeToFrench(type));
    }

    function typeLabel(type, lang) {
        const name = lang === 'en'
            ? type
            : (EXTRA_TYPE_FR[type] || PokemonUtils.translateTypeToFrench(type));
        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    function readTypesFromUrl() {
        const raw = new URLSearchParams(window.location.search).get('types');
        if (!raw) return [];
        return raw
            .split(',')
            .map(type => type.trim().toLowerCase())
            .filter(type => FILTER_TYPES.includes(type));
    }

    // Garde l'URL synchronisée sans recharger la page ni toucher aux autres
    // paramètres (notamment `lang`).
    function updateUrl() {
        const url = new URL(window.location.href);
        if (selectedTypes.size > 0) {
            url.searchParams.set('types', [...selectedTypes].join(','));
        } else {
            url.searchParams.delete('types');
        }
        window.history.replaceState({}, '', url.toString());
    }

    function applyFilters() {
        let visible = 0;

        for (const card of cards) {
            const matches = selectedTypes.size === 0
                || [...selectedTypes].some(type => card.types.has(type));

            card.element.hidden = !matches;
            if (matches) visible++;
        }

        countLabel.textContent = `${visible} / ${cards.length} Pokémon`;
        noResults.hidden = visible > 0;
        resetButton.hidden = selectedTypes.size === 0;

        updateUrl();
    }

    function buildTypeButtons(lang) {
        const fragment = document.createDocumentFragment();

        for (const type of FILTER_TYPES) {
            const slug = typeSlug(type);

            const button = document.createElement('button');
            button.type = 'button';
            button.classList.add('type-filter', slug);
            button.setAttribute('aria-pressed', String(selectedTypes.has(type)));
            button.title = typeLabel(type, lang);

            const icon = document.createElement('img');
            icon.src = `resources/icons/types/${slug}.png`;
            icon.alt = typeLabel(type, lang);
            icon.loading = 'lazy';
            button.appendChild(icon);

            button.addEventListener('click', () => {
                if (selectedTypes.has(type)) {
                    selectedTypes.delete(type);
                } else {
                    selectedTypes.add(type);
                }
                button.setAttribute('aria-pressed', String(selectedTypes.has(type)));
                applyFilters();
            });

            fragment.appendChild(button);
        }

        typeFilters.appendChild(fragment);
    }

    resetButton.addEventListener('click', () => {
        selectedTypes.clear();
        typeFilters.querySelectorAll('.type-filter').forEach(button => {
            button.setAttribute('aria-pressed', 'false');
        });
        applyFilters();
    });

    try {
        const data = await PokemonUtils.fetchJson('data/national.json');
        const pokemonList = data.creatures;

        const lang = PokemonUtils.getLang(this.languageManager);

        buildTypeButtons(lang);

        const fragment = document.createDocumentFragment();

        for (const pokemon of pokemonList) {
            const pokemonCard = document.createElement('div');
            pokemonCard.classList.add('pokemon-card');

            const pokemonSprite = document.createElement('img');
            pokemonSprite.src = `data/pokefront/${pokemon.dbSymbol}.png`;
            pokemonSprite.alt = pokemon.dbSymbol;
            pokemonSprite.classList.add('pokemon-sprite');
            pokemonSprite.loading = 'lazy';
            pokemonSprite.decoding = 'async';

            const pokemonName = document.createElement('p');
            pokemonName.textContent = pokemon.names[lang];
            pokemonName.classList.add('pokemon-name');

            pokemonCard.appendChild(pokemonSprite);
            pokemonCard.appendChild(pokemonName);
            pokemonCard.appendChild(document.createElement('br'));

            // Types bruts (anglais) conservés pour le filtrage.
            const cardTypes = new Set();
            if (pokemon.type1) cardTypes.add(pokemon.type1.toLowerCase());
            if (pokemon.type2 && pokemon.type2 !== "__undef__") cardTypes.add(pokemon.type2.toLowerCase());

            // type1 est toujours présent dans national.json enrichi ; le garde
            // évite juste un crash si le fichier n'a pas encore été régénéré.
            const type1French = pokemon.type1 ? typeSlug(pokemon.type1) : null;
            const type2French = pokemon.type2 && pokemon.type2 !== "__undef__"
                ? typeSlug(pokemon.type2)
                : null;

            if (type1French) {
                pokemonCard.classList.add(type1French);

                const typesDiv = document.createElement('div');
                typesDiv.style.cssText = 'display:flex;justify-content:center;gap:10px;';

                const type1Image = document.createElement('img');
                type1Image.src = `resources/icons/types/${type1French}.png`;
                type1Image.style.cssText = 'width:50px;';
                typesDiv.appendChild(type1Image);

                if (type2French) {
                    const type2Image = document.createElement('img');
                    type2Image.src = `resources/icons/types/${type2French}.png`;
                    type2Image.style.cssText = 'width:50px;';
                    typesDiv.appendChild(type2Image);
                }

                pokemonCard.appendChild(typesDiv);
            }

            pokemonCard.addEventListener('click', () => {
                window.location.href = `PokemonSearch.html?pokemon=${pokemon.dbSymbol}`;
            });

            cards.push({ element: pokemonCard, types: cardTypes });
            fragment.appendChild(pokemonCard);
        }

        pokedexGrid.appendChild(fragment);

        applyFilters();

    } catch (error) {
        console.error('Error loading full Pokédex:', error);
        pokedexGrid.innerHTML = '<p>Failed to load Pokémon data. Please try again later.</p>';
    }
});
