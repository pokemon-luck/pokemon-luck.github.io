/*
Classe principale pour la recherche et l'affichage des Pokémon
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
        await this.loadPokemonList();
        this.setupSearchInput();
        this.fetchAndDisplayPokemon();
    }

    async loadPokemonList() {
        try {
            const langIndex = this.languageManager.getLangIndex();
            const languages = ['en', 'fr', 'it', 'de', 'es', 'ko'];
            const lang = languages[langIndex] || 'en';

            const response = await fetch('data/national.json');
            const data = await response.json();
            this.pokemonList = data.creatures.map(creature => {
                return {
                    dbSymbol: creature.dbSymbol,
                    search: creature.names.en + ',' + creature.names.fr + ',' + this.removeAccents(creature.names.fr),
                    name: creature.names[lang]
                };
            });
        } catch (error) {
            console.error('Error fetching Pokémon list:', error);
        }
    }

    setupSearchInput() {
        this.uiManager.setupSearchInput(() => {
            const query = this.uiManager.getSearchQuery();
            this.uiManager.clearSuggestions();
            
            if (query) {
                const filteredPokemons = this.pokemonList.filter(pokemon => 
                    pokemon.search.toLowerCase().includes(query)
                );
                
                filteredPokemons.forEach(pokemon => {
                    this.uiManager.addSuggestion(
                        pokemon, 
                        this.languageManager.getCurrentLanguage(),
                        this.navigateToPokemon.bind(this)
                    );
                });
            }
        });
    }

    navigateToPokemon(pokemon, currentLanguage) {
        console.log(pokemon);
        const url = new URL(window.location.href);
        url.searchParams.set('pokemon', pokemon.dbSymbol);
        url.searchParams.set('lang', currentLanguage);
        window.location.href = url.href;
    }

    fetchAndDisplayPokemon() {
        const urlParams = new URLSearchParams(window.location.search);
        const pokemonName = urlParams.get('pokemon');
        if (pokemonName) {
            this.fetchPokemonData(pokemonName);
        }
    }

    async fetchPokemonData(pokemonName) {
        try {
            const response = await fetch(`./data/pokemon_consolidated/${pokemonName}.json`);
            const data = await response.json();
            await this.displayPokemonData(data, pokemonName);
        } catch (error) {
            console.error('Error fetching Pokemon data:', error);
            this.uiManager.showPokemonNotFound();
        }
    }

    async displayPokemonData(data, pokemonName) {
        const processedData = await this.dataProcessor.processData(data);
        const html = await this.renderer.renderPokemon(processedData, pokemonName);
        this.uiManager.displayPokemonData(html);
    }

    removeAccents(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
}