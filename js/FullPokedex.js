/*
Grille complète du Pokédex.

Toutes les données nécessaires à la grille (nom + types) sont désormais
présentes dans national.json (enrichi par setup.py). On ne télécharge donc
plus une fiche consolidée par Pokémon : une seule requête suffit, et l'ordre
du dex est conservé nativement (on parcourt data.creatures dans l'ordre).
Les cartes sont assemblées dans un DocumentFragment puis insérées en une fois.
*/

document.addEventListener('DOMContentLoaded', async () => {
    const pokedexGrid = document.getElementById('pokedexGrid');

    try {
        const data = await PokemonUtils.fetchJson('data/national.json');
        const pokemonList = data.creatures;

        const lang = PokemonUtils.getLang(this.languageManager);

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

            // type1 est toujours présent dans national.json enrichi ; le garde
            // évite juste un crash si le fichier n'a pas encore été régénéré.
            const type1French = pokemon.type1
                ? PokemonUtils.removeAccents(PokemonUtils.translateTypeToFrench(pokemon.type1))
                : null;
            const type2French = pokemon.type2 && pokemon.type2 !== "__undef__"
                ? PokemonUtils.removeAccents(PokemonUtils.translateTypeToFrench(pokemon.type2))
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

            fragment.appendChild(pokemonCard);
        }

        pokedexGrid.appendChild(fragment);

    } catch (error) {
        console.error('Error loading full Pokédex:', error);
        pokedexGrid.innerHTML = '<p>Failed to load Pokémon data. Please try again later.</p>';
    }
});
