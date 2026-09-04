/*
Page Dresseurs.

Le champ `description` de data/trainers.json porte l'affiliation (Team Shine,
Team Core) et non une description libre : il sert donc de clé de regroupement
plutôt que de sous-titre répété sous chaque carte.
*/

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('teamList');
    const counter = document.getElementById('trainerCount');
    const lang = PokemonUtils.getLang(languageManager);

    PokemonUtils.fetchJson('data/trainers.json')
        .then(trainers => {
            if (counter) counter.textContent = String(trainers.length);

            const byTeam = groupByTeam(trainers, lang);
            const fragment = document.createDocumentFragment();

            byTeam.forEach((members, team) => fragment.appendChild(buildTeam(team, members, lang)));
            container.replaceChildren(fragment);

            // Les panneaux arrivent après la passe de traduction initiale.
            languageManager.retranslatePage();
        })
        .catch(async error => {
            console.error('Error loading trainers:', error);
            const message = await languageManager.getTranslation('trainers_load_error');
            container.innerHTML = `<p class="trainers-error">${message}</p>`;
        });
});

// Map conserve l'ordre d'insertion : les équipes s'affichent dans l'ordre du JSON.
function groupByTeam(trainers, lang) {
    const teams = new Map();

    for (const trainer of trainers) {
        const team = (trainer.description && trainer.description[lang]) || '—';
        if (!teams.has(team)) teams.set(team, []);
        teams.get(team).push(trainer);
    }

    return teams;
}

function buildTeam(team, members, lang) {
    const panel = document.createElement('section');
    panel.className = 'frame team';

    const head = document.createElement('div');
    head.className = 'panel-head';

    const title = document.createElement('span');
    title.textContent = team;

    const count = document.createElement('span');
    count.className = 'count';
    count.textContent = String(members.length).padStart(2, '0');

    head.append(title, count);

    const grid = document.createElement('div');
    grid.className = 'team-grid';
    members.forEach(member => grid.appendChild(buildCard(member, lang)));

    panel.append(head, grid);
    return panel;
}

function buildCard(trainer, lang) {
    const name = (trainer.names && trainer.names[lang]) || trainer.image;

    const card = document.createElement('article');
    card.className = 'trainer-card';

    const stage = document.createElement('span');
    stage.className = 'trainer-stage';

    const sprite = document.createElement('img');
    sprite.src = `data/trainers/${trainer.image}`;
    sprite.alt = name;
    sprite.loading = 'lazy';
    sprite.decoding = 'async';
    stage.appendChild(sprite);

    const label = document.createElement('span');
    label.className = 'trainer-name';
    label.textContent = name;

    card.append(stage, label);
    return card;
}
