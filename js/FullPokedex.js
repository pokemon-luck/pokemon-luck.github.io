document.addEventListener('DOMContentLoaded', () => {
    const pokedexGrid = document.getElementById('pokedexGrid');

    fetch('data/national.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const pokemonList = data.creatures;

            const langIndex = this.languageManager.getLangIndex();
            const languages = ['en', 'fr', 'it', 'de', 'es', 'ko'];
            const lang = languages[langIndex] || 'en';

            pokemonList.forEach(pokemon => {
                fetch(`./data/pokemon_consolidated/${pokemon.dbSymbol}.json`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok ' + response.statusText);
                        }
                        return response.json();
                    })
                    .then(data => {
                        const pokemonCard = document.createElement('div');
                        pokemonCard.classList.add('pokemon-card');

                        const spritePath = `data/pokefront/${pokemon.dbSymbol}.png`;

                        const pokemonSprite = document.createElement('img');
                        pokemonSprite.src = spritePath;
                        pokemonSprite.alt = pokemon.dbSymbol;
                        pokemonSprite.classList.add('pokemon-sprite');

                        const pokemonName = document.createElement('p');
                        // Capitalize first letter of the dbSymbol for display
                        pokemonName.textContent = data.forms[0].names[lang]
                        // pokemonName.textContent = pokemon.dbSymbol.charAt(0).toUpperCase() + pokemon.dbSymbol.slice(1);
                        pokemonName.classList.add('pokemon-name');

                        pokemonCard.appendChild(pokemonSprite);
                        pokemonCard.appendChild(pokemonName);
                        pokemonCard.appendChild(document.createElement('br'));

                        const type1French = this.removeAccents(this.translateTypeToFrench(data.forms[0].type1));
                        const type2French = data.forms[0].type2 !== "__undef__" ? 
                            this.removeAccents(this.translateTypeToFrench(data.forms[0].type2)) : null;

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

                        // Make the card clickable
                        pokemonCard.addEventListener('click', () => {
                            window.location.href = `PokemonSearch.html?pokemon=${pokemon.dbSymbol}`;
                        });

                        pokedexGrid.appendChild(pokemonCard);
                    });
            });
        })
        .catch(error => {
            console.error('Error loading full Pokédex:', error);
            pokedexGrid.innerHTML = '<p>Failed to load Pokémon data. Please try again later.</p>';
        });
});

function translateTypeToFrench(type) {
    const translations = {
        normal: 'normal', fire: 'feu', water: 'eau', electric: 'électrique',
        grass: 'plante', ice: 'glace', fighting: 'combat', poison: 'poison',
        ground: 'sol', flying: 'vol', psychic: 'psy', bug: 'insecte',
        rock: 'roche', ghost: 'spectre', dragon: 'dragon', dark: 'ténèbres',
        steel: 'acier', fairy: 'fée'
    };
    return translations[type.toLowerCase()] || type;
}

function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}