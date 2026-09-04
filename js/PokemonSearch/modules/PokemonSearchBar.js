/*
Recherche d'un Pokémon et affichage de sa fiche.
*/

import { PokemonDataProcessor } from './PokemonDataProcessor.js';
import { PokemonRenderer } from './PokemonRenderer.js';

export class PokemonSearchBar {
    constructor(languageManager, uiManager) {
        this.languageManager = languageManager;
        this.uiManager = uiManager;
        this.dataProcessor = new PokemonDataProcessor(languageManager);
        this.renderer = new PokemonRenderer(languageManager);
        this.pokemonList = [];
    }

    async init() {
        this.uiManager.setPlaceholder(await this.languageManager.getTranslation('search_placeholder'));
        await this.loadPokemonList();
        this.setupSearchInput();
        await this.showRequestedPokemon();
    }

    async loadPokemonList() {
        try {
            const lang = PokemonUtils.getLang(this.languageManager);
            const data = await PokemonUtils.fetchJson('data/national.json');

            // `search` regroupe les deux langues et la version sans accent, pour
            // que « tenebres » trouve « Ténèbres ».
            this.pokemonList = data.creatures.map((creature, index) => ({
                dbSymbol: creature.dbSymbol,
                name: creature.names[lang] || creature.dbSymbol,
                dexNumber: index + 1,
                search: [
                    creature.names.en,
                    creature.names.fr,
                    PokemonUtils.removeAccents(creature.names.fr)
                ].join(',').toLowerCase()
            }));
        } catch (error) {
            console.error('Error fetching Pokémon list:', error);
        }
    }

    setupSearchInput() {
        this.uiManager.setupSearchInput(() => {
            const query = this.uiManager.getSearchQuery();

            if (!query) {
                this.uiManager.hideSuggestions();
                return;
            }

            const matches = this.pokemonList.filter(pokemon => pokemon.search.includes(query));
            this.uiManager.showSuggestions(matches, entry => this.navigateToPokemon(entry));
        });
    }

    navigateToPokemon(entry) {
        const url = new URL(window.location.href);
        url.searchParams.set('pokemon', entry.dbSymbol);
        url.searchParams.set('lang', this.languageManager.getCurrentLanguage());
        window.location.href = url.href;
    }

    async showRequestedPokemon() {
        const requested = new URLSearchParams(window.location.search).get('pokemon');

        if (!requested) {
            this.uiManager.showMessage(await this.languageManager.getTranslation('search_empty'));
            return;
        }

        try {
            const data = await PokemonUtils.fetchJson(`data/pokemon_consolidated/${requested}.json`);
            const processed = await this.dataProcessor.processData(data);

            this.uiManager.displayPokemonData(await this.renderer.renderPokemon(processed));

            // La fiche arrive après la passe de traduction initiale.
            this.languageManager.retranslatePage();

            // Après la retraduction : celle-ci réécrit le <title> depuis sa clé
            // et écraserait le nom du Pokémon si on le posait avant.
            document.title = `${processed.name} — Pokémon Luck`;
        } catch (error) {
            console.error('Error fetching Pokemon data:', error);
            this.uiManager.showMessage(await this.languageManager.getTranslation('pokemon_not_found'));
        }
    }
}
