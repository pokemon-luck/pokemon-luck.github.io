/*
Table des types : matrice 20 × 20 construite depuis data/types/types.json.

Le fichier ne liste que les interactions non neutres (153 sur 400) : toute
combinaison absente vaut ×1, c'est-à-dire aucune couleur ni aucun symbole.
*/

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('typeChart');
    const lang = PokemonUtils.getLang(languageManager);

    PokemonUtils.fetchJson('data/types/types.json')
        .then(data => {
            container.replaceChildren(buildChart(data, lang));
            setupCrosshair(container);
            // La table arrive après le passage de traduction initial : sans ce
            // rappel, le libellé du coin resterait dans sa langue de repli.
            languageManager.retranslatePage();
        })
        .catch(async error => {
            console.error('Error loading the type chart:', error);
            const message = await languageManager.getTranslation('typechart_load_error');
            container.innerHTML = `<p class="chart-error">${message}</p>`;
        });
});

// Abréviation d'en-tête de colonne : les trois premières lettres suffisent à
// distinguer les 20 types, dans les deux langues.
function abbreviate(label) {
    return label.slice(0, 3).toUpperCase();
}

// Symbole et classe d'une case, selon le multiplicateur.
function cellFor(multiplier) {
    if (multiplier === 0) return { text: '0', className: 'x0', key: 'eff_none' };
    if (multiplier === 2) return { text: '2', className: 'x2', key: 'eff_super' };
    if (multiplier === 0.5) return { text: '½', className: 'x05', key: 'eff_weak' };
    return { text: '', className: '', key: 'eff_neutral' };
}

function buildChart(data, lang) {
    const types = Object.keys(data);
    const table = document.createElement('table');
    table.className = 'chart';

    const labels = types.map(type => PokemonUtils.typeLabel(type, lang));
    const slugs = types.map(type => PokemonUtils.typeSlug(type));

    // --- En-tête : le coin, puis un type par colonne ---
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');

    const corner = document.createElement('th');
    corner.className = 'corner';
    corner.setAttribute('data-translate', 'typechart_corner');
    corner.textContent = 'ATQ ╲ DÉF';
    headRow.appendChild(corner);

    types.forEach((type, index) => {
        const cell = document.createElement('th');
        cell.scope = 'col';
        cell.className = 't-' + slugs[index];
        cell.dataset.col = String(index);
        cell.title = labels[index];

        const swatch = document.createElement('span');
        swatch.className = 'swatch';
        cell.appendChild(swatch);
        cell.appendChild(document.createTextNode(abbreviate(labels[index])));

        headRow.appendChild(cell);
    });

    thead.appendChild(headRow);
    table.appendChild(thead);

    // --- Corps : une ligne par type attaquant ---
    const tbody = document.createElement('tbody');

    types.forEach((attacker, row) => {
        const line = document.createElement('tr');

        const header = document.createElement('th');
        header.scope = 'row';
        header.className = 't-' + slugs[row];
        header.dataset.row = String(row);

        const swatch = document.createElement('span');
        swatch.className = 'swatch';
        header.appendChild(swatch);
        header.appendChild(document.createTextNode(labels[row]));
        line.appendChild(header);

        types.forEach((defender, col) => {
            const { text, className, key } = cellFor(data[attacker][defender]);

            const cell = document.createElement('td');
            if (className) cell.className = className;
            cell.dataset.row = String(row);
            cell.dataset.col = String(col);
            cell.textContent = text;
            // Le survol donne la lecture complète, sans avoir à remonter aux
            // en-têtes — utile aussi au clavier et aux lecteurs d'écran.
            cell.title = `${labels[row]} → ${labels[col]}`;
            cell.dataset.effect = key;

            line.appendChild(cell);
        });

        tbody.appendChild(line);
    });

    table.appendChild(tbody);
    return table;
}

/*
Croisée de survol : éclaire la ligne et la colonne de la case pointée.

Fait en JS plutôt qu'en CSS pur : l'ancienne astuce reposait sur un
pseudo-élément géant rogné par `overflow: hidden`, incompatible avec le
conteneur défilant qui rend les en-têtes collants.
*/
function setupCrosshair(container) {
    const table = container.querySelector('table.chart');
    if (!table) return;

    let marked = [];

    function clear() {
        marked.forEach(cell => cell.classList.remove('cross', 'cross-cell'));
        marked = [];
    }

    function highlight(cell) {
        const { row, col } = cell.dataset;
        const targets = table.querySelectorAll(
            `[data-row="${row}"], [data-col="${col}"]`
        );

        targets.forEach(target => target.classList.add('cross'));
        cell.classList.add('cross-cell');
        marked = [...targets, cell];
    }

    table.addEventListener('mouseover', event => {
        const cell = event.target.closest('td[data-row]');
        if (!cell) { clear(); return; }
        if (cell.classList.contains('cross-cell')) return;   // déjà éclairée

        clear();
        highlight(cell);
    });

    table.addEventListener('mouseleave', clear);
}
