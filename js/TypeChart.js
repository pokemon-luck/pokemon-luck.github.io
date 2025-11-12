document.addEventListener('DOMContentLoaded', () => {
    const typeGrid = document.getElementById('typeGrid');

    fetch('data/types/types.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const allTypes = Object.keys(data)

            const table = document.createElement('table');
            table.classList.add('table-bordered');

            const header = document.createElement('tr');

            const firstColumn = document.createElement('th');
            firstColumn.textContent = 'Types';
            header.appendChild(firstColumn);

            for (const type in data) {
                const column = document.createElement('th');
                column.classList.add(type);
                column.textContent = this.translateType(type);

                header.appendChild(column);
            }
            table.appendChild(header);

            for (const type in data) {
                const line = document.createElement('tr');

                const column = document.createElement('th');
                column.classList.add(type);
                column.textContent = this.translateType(type);
                line.appendChild(column);

                for (const matchup in allTypes) {
                    const column = document.createElement('td');

                    let display = '';
                    let interaction = 'null';
                    if (data[type][allTypes[matchup]] == 0) {
                        display = 'X';
                        interaction = 'ineffective';
                    } else if ([0.5, 2].includes(data[type][allTypes[matchup]])) {
                        display = data[type][allTypes[matchup]];
                        interaction = display == 2 ? 'strong' : 'weak';
                    }

                    column.classList.add(interaction);
                    column.textContent = display;
                    
                    line.appendChild(column);
                }

                table.appendChild(line);
            }

            typeGrid.appendChild(table);
        });
});

function translateType(type) {
    const langIndex = this.languageManager.getLangIndex();
    const languages = ['en', 'fr', 'it', 'de', 'es', 'ko'];
    const lang = languages[langIndex] || 'en';

    const translations = {
        normal: 'normal', fire: 'feu', water: 'eau', electric: 'électrique',
        grass: 'plante', ice: 'glace', fighting: 'combat', poison: 'poison',
        ground: 'sol', flying: 'vol', psychic: 'psy', bug: 'insecte',
        rock: 'roche', ghost: 'spectre', dragon: 'dragon', dark: 'ténèbres',
        steel: 'acier', fairy: 'fée', undead: 'zombie'
    };
    const result = lang == 'en' ? type : (translations[type.toLowerCase()] || type);
    return result.charAt(0).toUpperCase() + result.slice(1);
}

function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}