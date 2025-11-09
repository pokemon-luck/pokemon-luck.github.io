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