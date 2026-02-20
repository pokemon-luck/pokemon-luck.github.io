document.addEventListener('DOMContentLoaded', async () => {
    const pokedexGrid = document.getElementById('pokedexGrid');

    try {
        const response = await fetch('data/national.json');
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        const data = await response.json();
        const pokemonList = data.creatures;

        const langIndex = this.languageManager.getLangIndex();
        const languages = ['en', 'fr', 'it', 'de', 'es', 'ko'];
        const lang = languages[langIndex] || 'en';

        // 👇 This is the key change
        for (const pokemon of pokemonList) {

            const pokeResponse = await fetch(`./data/pokemon_consolidated/${pokemon.dbSymbol}.json`);
            if (!pokeResponse.ok) {
                throw new Error('Network response was not ok ' + pokeResponse.statusText);
            }

            const pokeData = await pokeResponse.json();

            const pokemonCard = document.createElement('div');
            pokemonCard.classList.add('pokemon-card');

            const spritePath = `data/pokefront/${pokemon.dbSymbol}.png`;

            const pokemonSprite = document.createElement('img');
            pokemonSprite.src = spritePath;
            pokemonSprite.alt = pokemon.dbSymbol;
            pokemonSprite.classList.add('pokemon-sprite');

            const pokemonName = document.createElement('p');
            pokemonName.textContent = pokeData.forms[0].names[lang];
            pokemonName.classList.add('pokemon-name');

            pokemonCard.appendChild(pokemonSprite);
            pokemonCard.appendChild(pokemonName);
            pokemonCard.appendChild(document.createElement('br'));

            const type1French = removeAccents(translateTypeToFrench(pokeData.forms[0].type1));
            const type2French = pokeData.forms[0].type2 !== "__undef__"
                ? removeAccents(translateTypeToFrench(pokeData.forms[0].type2))
                : null;

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

            pokemonCard.addEventListener('click', () => {
                window.location.href = `PokemonSearch.html?pokemon=${pokemon.dbSymbol}`;
            });

            pokedexGrid.appendChild(pokemonCard);
        }

    } catch (error) {
        console.error('Error loading full Pokédex:', error);
        pokedexGrid.innerHTML = '<p>Failed to load Pokémon data. Please try again later.</p>';
    }
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