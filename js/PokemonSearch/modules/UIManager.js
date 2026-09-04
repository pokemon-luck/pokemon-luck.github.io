/*
Interface de la page : champ de recherche, suggestions, zone de fiche.
*/

const MAX_SUGGESTIONS = 8;

export class UIManager {
    constructor() {
        this.searchBar = document.getElementById('searchBar');
        this.suggestions = document.getElementById('suggestions');
        this.pokemonData = document.getElementById('pokemonData');
        this.activeIndex = -1;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Un clic hors du champ et de la liste referme les suggestions.
        document.addEventListener('click', (event) => {
            if (!this.searchBar.contains(event.target) && !this.suggestions.contains(event.target)) {
                this.hideSuggestions();
            }
        });

        // Navigation au clavier dans la liste.
        this.searchBar.addEventListener('keydown', (event) => {
            const items = [...this.suggestions.querySelectorAll('li')];
            if (items.length === 0) return;

            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const step = event.key === 'ArrowDown' ? 1 : -1;
                this.activeIndex = (this.activeIndex + step + items.length) % items.length;
                items.forEach((item, i) => item.classList.toggle('on', i === this.activeIndex));
                items[this.activeIndex].scrollIntoView({ block: 'nearest' });
            } else if (event.key === 'Enter' && this.activeIndex >= 0) {
                event.preventDefault();
                items[this.activeIndex].click();
            } else if (event.key === 'Escape') {
                this.hideSuggestions();
            }
        });
    }

    hideSuggestions() {
        this.suggestions.hidden = true;
        this.activeIndex = -1;
    }

    clearSuggestions() {
        this.suggestions.replaceChildren();
        this.activeIndex = -1;
    }

    // `entries` : [{ dbSymbol, name, dexNumber }]
    showSuggestions(entries, onPick) {
        this.clearSuggestions();

        if (entries.length === 0) {
            this.suggestions.hidden = true;
            return;
        }

        const fragment = document.createDocumentFragment();

        for (const entry of entries.slice(0, MAX_SUGGESTIONS)) {
            const item = document.createElement('li');
            item.tabIndex = -1;

            const sprite = document.createElement('img');
            sprite.src = `data/pokefront/${entry.dbSymbol}.png`;
            sprite.alt = '';
            sprite.loading = 'lazy';

            const name = document.createElement('span');
            name.textContent = entry.name;

            const number = document.createElement('span');
            number.className = 'no';
            number.textContent = String(entry.dexNumber).padStart(3, '0');

            item.append(sprite, name, number);
            item.addEventListener('click', () => onPick(entry));
            fragment.appendChild(item);
        }

        this.suggestions.appendChild(fragment);
        this.suggestions.hidden = false;
    }

    getSearchQuery() {
        return this.searchBar.value.trim().toLowerCase();
    }

    setupSearchInput(onInput) {
        this.searchBar.addEventListener('input', onInput);
    }

    setPlaceholder(text) {
        this.searchBar.placeholder = text;
    }

    showMessage(text) {
        this.pokemonData.innerHTML = `<p class="pk-empty pk-empty-page">${text}</p>`;
    }

    displayPokemonData(html) {
        this.pokemonData.innerHTML = html;
        this.setupSpriteToggle();
        this.setupMoveTabs();
    }

    // Bascule sprite normal / chromatique.
    setupSpriteToggle() {
        const toggle = this.pokemonData.querySelector('.pk-sprite-toggle');
        const sprite = this.pokemonData.querySelector('#pkSprite');
        if (!toggle || !sprite) return;

        const symbol = sprite.getAttribute('src').split('/').pop();

        toggle.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-sprite]');
            if (!button) return;

            toggle.querySelectorAll('button').forEach(b => b.classList.remove('on'));
            button.classList.add('on');
            sprite.src = `data/${button.dataset.sprite}/${symbol}`;
        });
    }

    // Onglets des capacités.
    setupMoveTabs() {
        const tablist = this.pokemonData.querySelector('.pk-tabs');
        if (!tablist) return;

        tablist.addEventListener('click', (event) => {
            const tab = event.target.closest('.pk-tab');
            if (!tab) return;

            tablist.querySelectorAll('.pk-tab').forEach(t => {
                const selected = t === tab;
                t.setAttribute('aria-selected', String(selected));
                const panel = document.getElementById(t.getAttribute('aria-controls'));
                if (panel) panel.hidden = !selected;
            });
        });
    }
}
