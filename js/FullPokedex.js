/*
Grille complète du Pokédex, avec filtrage par type.

Toutes les données nécessaires à la grille (nom + types) sont présentes dans
national.json : une seule requête suffit, et l'ordre du dex est conservé
nativement. Les cartes sont assemblées dans un DocumentFragment puis insérées
en une fois.

Le filtre est en OU : sans sélection tout est affiché, sinon on garde les
Pokémon possédant au moins un des types cochés. Les cartes ne sont jamais
reconstruites, on se contente de les masquer. La sélection est reflétée dans
l'URL (?types=fire,ghost) pour qu'un filtre soit partageable et survive à un
changement de langue, qui recharge la page.
*/

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('dexGrid');
    const chipContainer = document.getElementById('typeChips');
    const resetButton = document.getElementById('resetFilters');
    const visibleLabel = document.getElementById('dexVisible');
    const totalLabel = document.getElementById('dexTotal');
    const emptyNotice = document.getElementById('dexEmpty');

    // Les 18 types officiels dans l'ordre de PokemonUtils, puis les deux
    // types propres à Pokémon Luck.
    const FILTER_TYPES = [...Object.keys(PokemonUtils.TYPE_FR), 'undead', 'celestial'];

    // Types sélectionnés, en anglais comme dans national.json.
    const selectedTypes = new Set(readTypesFromUrl());

    // Une entrée par carte : { element, types } — évite de relire le DOM à
    // chaque clic sur un filtre.
    const cards = [];

    function readTypesFromUrl() {
        const raw = new URLSearchParams(window.location.search).get('types');
        if (!raw) return [];
        return raw
            .split(',')
            .map(type => type.trim().toLowerCase())
            .filter(type => FILTER_TYPES.includes(type));
    }

    // Garde l'URL synchronisée sans recharger la page ni toucher aux autres
    // paramètres, `lang` en particulier.
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

        visibleLabel.textContent = String(visible);
        totalLabel.textContent = String(cards.length);
        emptyNotice.hidden = visible > 0;
        resetButton.hidden = selectedTypes.size === 0;

        updateUrl();
    }

    function buildTypeChips(lang) {
        const fragment = document.createDocumentFragment();

        for (const type of FILTER_TYPES) {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'type-chip t-' + PokemonUtils.typeSlug(type);
            chip.setAttribute('aria-pressed', String(selectedTypes.has(type)));
            chip.textContent = PokemonUtils.typeLabel(type, lang);

            chip.addEventListener('click', () => {
                if (selectedTypes.has(type)) {
                    selectedTypes.delete(type);
                } else {
                    selectedTypes.add(type);
                }
                chip.setAttribute('aria-pressed', String(selectedTypes.has(type)));
                applyFilters();
            });

            fragment.appendChild(chip);
        }

        chipContainer.replaceChildren(fragment);
    }

    // Une carte = un lien. Un <div> cliquable ne se focalise pas au clavier et
    // interdit l'ouverture dans un nouvel onglet.
    function buildCard(pokemon, dexNumber, lang) {
        const card = document.createElement('a');
        card.className = 'poke-slot';
        card.href = `PokemonSearch.html?pokemon=${pokemon.dbSymbol}&lang=${lang}`;

        if (PokemonUtils.hasType(pokemon.type1)) {
            card.classList.add('t-' + PokemonUtils.typeSlug(pokemon.type1));
        }

        const bar = document.createElement('span');
        bar.className = 'poke-slot-bar';
        bar.textContent = 'N°' + String(dexNumber).padStart(3, '0');

        const stage = document.createElement('span');
        stage.className = 'poke-slot-stage';

        const sprite = document.createElement('img');
        sprite.src = `data/pokefront/${pokemon.dbSymbol}.png`;
        sprite.alt = '';               // le nom juste en dessous suffit
        sprite.loading = 'lazy';
        sprite.decoding = 'async';
        stage.appendChild(sprite);

        const name = document.createElement('span');
        name.className = 'poke-slot-name';
        name.textContent = pokemon.names[lang] || pokemon.dbSymbol;

        const types = document.createElement('span');
        types.className = 'poke-slot-types';
        [pokemon.type1, pokemon.type2]
            .map(type => type && PokemonUtils.createTypePill(type, lang))
            .filter(Boolean)
            .forEach(pill => types.appendChild(pill));

        card.append(bar, stage, name, types);
        return card;
    }

    resetButton.addEventListener('click', () => {
        selectedTypes.clear();
        chipContainer.querySelectorAll('.type-chip').forEach(chip => {
            chip.setAttribute('aria-pressed', 'false');
        });
        applyFilters();
    });

    try {
        const data = await PokemonUtils.fetchJson('data/national.json');
        const lang = PokemonUtils.getLang(languageManager);

        buildTypeChips(lang);

        const fragment = document.createDocumentFragment();

        data.creatures.forEach((pokemon, index) => {
            const card = buildCard(pokemon, index + 1, lang);

            // Types bruts, en anglais, conservés pour le filtrage.
            const types = new Set();
            if (PokemonUtils.hasType(pokemon.type1)) types.add(pokemon.type1.toLowerCase());
            if (PokemonUtils.hasType(pokemon.type2)) types.add(pokemon.type2.toLowerCase());

            cards.push({ element: card, types });
            fragment.appendChild(card);
        });

        grid.appendChild(fragment);
        applyFilters();

    } catch (error) {
        console.error('Error loading full Pokédex:', error);
        const message = await languageManager.getTranslation('dex_load_error');
        grid.innerHTML = `<p class="dex-error">${message}</p>`;
    }
});
