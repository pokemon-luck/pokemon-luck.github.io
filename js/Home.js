/*
Page d'accueil : cartes des starters et compteur du lien vers le Pokédex.

Le compteur est calculé depuis data/national.json plutôt que codé en dur :
il suit automatiquement les ajouts de fakémon au projet.
*/

document.addEventListener('DOMContentLoaded', () => {
    const lang = PokemonUtils.getLang(languageManager);

    // Icônes d'état venues du jeu : leur libellé est gravé dans l'image.
    const decayIcon = document.getElementById('decay-icon');
    if (decayIcon) decayIcon.src = `resources/icons/decay_${lang}.png`;

    const grid = document.getElementById('starterGrid');
    const counter = document.getElementById('dexCount');
    const STARTERS = ['marmousse', 'tremplume', 'cramin'];

    PokemonUtils.fetchJson('data/national.json')
        .then(data => {
            const creatures = data.creatures || [];

            if (counter) {
                counter.textContent = String(creatures.length);
            }

            const bySymbol = new Map(creatures.map(creature => [creature.dbSymbol, creature]));
            const fragment = document.createDocumentFragment();

            STARTERS.forEach((symbol, index) => {
                const creature = bySymbol.get(symbol);
                if (!creature) return;
                fragment.appendChild(buildSlot(creature, index, lang));
            });

            grid.replaceChildren(fragment);
        })
        .catch(async error => {
            console.error('Error loading the national dex:', error);
            const message = await languageManager.getTranslation('starters_load_error');
            grid.innerHTML = `<p class="load-error">${message}</p>`;
        });
});

// Une carte de starter, identique aux cartes du Pokédex.
function buildSlot(creature, index, lang) {
    const slot = document.createElement('a');
    slot.className = 'poke-slot';
    slot.href = `PokemonSearch.html?pokemon=${creature.dbSymbol}&lang=${lang}`;

    // La couleur du type principal habille la carte (bordure au survol, repère).
    if (PokemonUtils.hasType(creature.type1)) {
        slot.classList.add('t-' + PokemonUtils.typeSlug(creature.type1));
    }

    const bar = document.createElement('span');
    bar.className = 'poke-slot-bar';
    // Les starters ouvrent le Pokédex : leurs numéros sont 1, 4 et 7.
    bar.textContent = 'N°' + String(index * 3 + 1).padStart(3, '0');

    const stage = document.createElement('span');
    stage.className = 'poke-slot-stage';

    const sprite = document.createElement('img');
    sprite.src = `data/pokefront/${creature.dbSymbol}.png`;
    sprite.alt = creature.names[lang] || creature.dbSymbol;
    sprite.loading = 'lazy';
    sprite.decoding = 'async';
    stage.appendChild(sprite);

    const name = document.createElement('span');
    name.className = 'poke-slot-name';
    name.textContent = creature.names[lang] || creature.dbSymbol;

    const types = document.createElement('span');
    types.className = 'poke-slot-types';
    [creature.type1, creature.type2]
        .map(type => type && PokemonUtils.createTypePill(type, lang))
        .filter(Boolean)
        .forEach(pill => types.appendChild(pill));

    slot.append(bar, stage, name, types);
    return slot;
}
