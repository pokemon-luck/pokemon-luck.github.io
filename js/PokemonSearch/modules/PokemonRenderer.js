/*
Rendu de la fiche Pokémon.

Mise en page : colonne d'identité fixe à gauche (sprite, nom, types, fiche
technique) pendant que la colonne de droite défile. Les libellés sont résolus
en amont pour que le rendu reste synchrone.
*/

const STAT_MAX = 255;   // borne des statistiques de base, pour la jauge

export class PokemonRenderer {
    constructor(languageManager) {
        this.languageManager = languageManager;
    }

    // Échappe le texte issu des données avant insertion en HTML.
    esc(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    async labels() {
        const keys = [
            'Stats', 'stat_total', 'Abilities', 'Evolution', 'Moves', 'spec_sheet',
            'Height', 'Weight', 'Base Experience', 'Experience Type',
            'Egg Groups', 'Hatch Steps', 'Baby form',
            'sprite_normal', 'sprite_shiny', 'sprite_label',
            'ability_hidden', 'ability_normal',
            'tab_level', 'tab_tutor', 'tab_tech', 'tab_breed',
            'Level', 'Name', 'Type', 'Category', 'PP', 'Power', 'Accuracy',
            'evolution_none', 'moves_none', 'nav_previous', 'nav_next'
        ];
        const values = await Promise.all(keys.map(k => this.languageManager.getTranslation(k)));

        // Tables résolues une fois, consultées ensuite ligne par ligne.
        const expKeys = [0, 1, 2, 3, 4, 5];
        const expValues = await Promise.all(expKeys.map(i => this.languageManager.getTranslation('exp_' + i)));
        this.experienceLabels = Object.fromEntries(expKeys.map((i, n) => [i, expValues[n]]));

        const catKeys = ['physical', 'special', 'status'];
        const catValues = await Promise.all(catKeys.map(c => this.languageManager.getTranslation('cat_' + c)));
        this.categoryLabels = Object.fromEntries(catKeys.map((c, n) => [c, catValues[n]]));

        return Object.fromEntries(keys.map((k, i) => [k, values[i]]));
    }

    async renderPokemon(data) {
        const t = await this.labels();

        return `
            ${this.renderNavigation(data.navigation, t)}
            <div class="pk-layout">
                <aside class="pk-aside">
                    ${this.renderScreen(data, t)}
                    ${this.renderIdentity(data)}
                    ${this.renderSpecSheet(data, t)}
                </aside>
                <div class="pk-main">
                    ${this.renderFlavor(data)}
                    <div class="pk-cols">
                        ${this.renderStats(data, t)}
                        ${this.renderAbilities(data, t)}
                    </div>
                    ${this.renderEvolutions(data, t)}
                    ${this.renderMoves(data, t)}
                </div>
            </div>
        `;
    }

    /* ------------------------------------------------------------ NAVIGATION */

    renderNavigation(navigation, t) {
        const side = (entry, direction) => {
            if (!entry) return '<span></span>';

            const number = `<span class="no">N°${String(entry.dexNumber).padStart(3, '0')}</span>`;
            const name = `<span class="n2">${this.esc(entry.name)}</span>`;
            const sprite = `<img src="data/pokefront/${this.esc(entry.dbSymbol)}.png" alt="" loading="lazy">`;
            const arrow = `<span class="arw" aria-hidden="true">${direction === 'prev' ? '&lt;&lt;' : '&gt;&gt;'}</span>`;
            const label = direction === 'prev' ? t.nav_previous : t.nav_next;
            const text = `<span class="txt">${number}${name}</span>`;

            return `<a href="PokemonSearch.html?pokemon=${this.esc(entry.dbSymbol)}" aria-label="${this.esc(label)} : ${this.esc(entry.name)}">
                ${direction === 'prev' ? arrow + sprite + text : text + sprite + arrow}
            </a>`;
        };

        return `<nav class="pk-nav">${side(navigation.previous, 'prev')}${side(navigation.next, 'next')}</nav>`;
    }

    /* ---------------------------------------------------------------- ÉCRAN */

    renderScreen(data, t) {
        const number = `N°${String(data.dexNumber).padStart(3, '0')}`;

        return `
            <div class="frame ticks pk-screen">
                <div class="pk-view">
                    <span class="osd">${number} · ${this.esc(t.sprite_label)}</span>
                    <img id="pkSprite" src="data/pokefront/${this.esc(data.dbSymbol)}.png" alt="${this.esc(data.name)}">
                </div>
                <div class="pk-sprite-toggle" role="group">
                    <button type="button" class="on" data-sprite="pokefront">${this.esc(t.sprite_normal)}</button>
                    <button type="button" data-sprite="shiny">${this.esc(t.sprite_shiny)}</button>
                </div>
            </div>
        `;
    }

    renderIdentity(data) {
        const types = data.types
            .map(type => `<span class="tp t-${type.slug}">${this.esc(type.label)}</span>`)
            .join('');

        return `
            <div class="frame pk-id">
                <div class="line1">
                    <span class="dexno">N°${String(data.dexNumber).padStart(3, '0')}</span>
                    <h1>${this.esc(data.name)}</h1>
                </div>
                <div class="alt">${this.esc(data.nameEn)} · <code>${this.esc(data.dbSymbol)}</code></div>
                <div class="types">${types}</div>
            </div>
        `;
    }

    /* -------------------------------------------------- FICHE SIGNALÉTIQUE */

    specRow(label, value, mono = true) {
        if (value === null || value === undefined || value === '') return '';
        return `<div class="r">
            <span class="k">${this.esc(label)}</span>
            <span class="lead"></span>
            <span class="v${mono ? '' : ' txt'}">${this.esc(value)}</span>
        </div>`;
    }

    renderSpecSheet(data, t) {
        const form = data.form;
        const breeding = data.breeding;

        return `
            <div class="frame">
                <div class="panel-head"><span>${this.esc(t.spec_sheet)}</span></div>
                <div class="panel-body">
                    <div class="pk-spec">
                        ${this.specRow(t.Height, `${form.height} m`)}
                        ${this.specRow(t.Weight, `${form.weight} kg`)}
                        ${this.specRow(t['Base Experience'], form.baseExperience)}
                        ${this.specRow(t['Experience Type'], this.experienceLabel(form.experienceType), false)}
                        ${this.specRow(t['Egg Groups'], breeding.breedGroups.join(', '), false)}
                        ${this.specRow(t['Hatch Steps'], breeding.hatchSteps)}
                        ${this.specRow(t['Baby form'], breeding.babyForm, false)}
                    </div>
                </div>
            </div>
        `;
    }

    // Résolu en amont par le SearchBar : simple lecture ici.
    experienceLabel(type) {
        return this.experienceLabels?.[type] ?? type;
    }

    /* ------------------------------------------------------------ CONTENU */

    renderFlavor(data) {
        if (!data.description) return '';
        return `<p class="pk-flavor">${this.esc(data.description)}</p>`;
    }

    renderStats(data, t) {
        const total = data.stats.reduce((sum, stat) => sum + stat.value, 0);

        const rows = data.stats.map(stat => `
            <div class="pk-stat">
                <span class="k">${this.esc(stat.name)}</span>
                <span class="v">${String(stat.value).padStart(3, '0')}</span>
                <span class="bar"><i style="width:${(stat.value / STAT_MAX * 100).toFixed(1)}%;background:var(--st-${stat.key})"></i></span>
            </div>
        `).join('');

        return `
            <section class="frame">
                <div class="panel-head"><span>${this.esc(t.Stats)}</span><span class="idx">01</span></div>
                <div class="panel-body">
                    ${rows}
                    <div class="pk-stat-total"><span>${this.esc(t.stat_total)}</span><b>${total}</b></div>
                </div>
            </section>
        `;
    }

    renderAbilities(data, t) {
        const items = data.abilities.map(ability => `
            <div class="pk-ability">
                <h3>${this.esc(ability.name)}
                    <span class="tagx${ability.hidden ? ' hid' : ''}">${this.esc(ability.hidden ? t.ability_hidden : t.ability_normal)}</span>
                </h3>
                <p>${this.esc(ability.description)}</p>
            </div>
        `).join('');

        return `
            <section class="frame">
                <div class="panel-head"><span>${this.esc(t.Abilities)}</span><span class="idx">02</span></div>
                <div class="panel-body">${items}</div>
            </section>
        `;
    }

    /*
    Chaîne d'évolution horizontale : la lignée entière se lit de gauche à
    droite, le Pokémon consulté surligné. Les conditions se placent sur le
    séparateur quand le palier suivant n'a qu'une forme, et sous chaque carte
    quand la chaîne se ramifie — sinon on ne saurait pas laquelle mène où.
    */
    renderEvolutions(data, t) {
        const chain = data.evolutionChain;

        if (chain.length === 0) {
            return `
                <section class="frame">
                    <div class="panel-head"><span>${this.esc(t.Evolution)}</span><span class="idx">03</span></div>
                    <div class="panel-body"><p class="pk-empty">${this.esc(t.evolution_none)}</p></div>
                </section>
            `;
        }

        const condBadges = (conditions) => conditions
            .map(c => `<span class="cond">${this.esc(c.label)} ${this.esc(c.value)}</span>`)
            .join('');

        const card = (entry, showConditions) => `
            <a class="pk-evo-node${entry.current ? ' cur' : ''}"
               href="PokemonSearch.html?pokemon=${this.esc(entry.dbSymbol)}"
               ${entry.current ? 'aria-current="page"' : ''}>
                <img src="data/pokefront/${this.esc(entry.dbSymbol)}.png" alt="" loading="lazy">
                <span class="nm">${this.esc(entry.name)}</span>
                <span class="no">N°${String(entry.dexNumber).padStart(3, '0')}</span>
                ${showConditions ? `<span class="conds">${condBadges(entry.conditions)}</span>` : ''}
            </a>
        `;

        const parts = chain.map((stage, index) => {
            const branching = stage.length > 1;
            // Au-delà de trois branches, le palier se répartit en grille : dix
            // évolutions empilées feraient une colonne interminable.
            const dense = stage.length > 3 ? ' data-branches="many"' : '';
            const column = `<div class="pk-evo-stage"${dense}>${stage.map(entry => card(entry, branching)).join('')}</div>`;

            if (index === 0) return column;

            // Palier unique : la condition va sur le séparateur, comme une étape.
            const conditions = branching ? '' : condBadges(stage[0].conditions);
            const separator = `<div class="pk-evo-step">
                ${conditions}
                <span class="chev" aria-hidden="true">&gt;&gt;</span>
            </div>`;

            return separator + column;
        }).join('');

        return `
            <section class="frame">
                <div class="panel-head"><span>${this.esc(t.Evolution)}</span><span class="idx">03</span></div>
                <div class="panel-body"><div class="pk-evo-chain">${parts}</div></div>
            </section>
        `;
    }

    /* ---------------------------------------------------------- CAPACITÉS */

    renderMoves(data, t) {
        const groups = [
            { id: 'level', label: t.tab_level, moves: data.moves.level, showLevel: true },
            { id: 'tutor', label: t.tab_tutor, moves: data.moves.tutor, showLevel: false },
            { id: 'tech', label: t.tab_tech, moves: data.moves.tech, showLevel: false },
            { id: 'breed', label: t.tab_breed, moves: data.moves.breed, showLevel: false }
        ].filter(group => group.moves.length > 0);

        if (groups.length === 0) {
            return `
                <section class="frame">
                    <div class="panel-head"><span>${this.esc(t.Moves)}</span><span class="idx">04</span></div>
                    <div class="panel-body"><p class="pk-empty">${this.esc(t.moves_none)}</p></div>
                </section>
            `;
        }

        const tabs = groups.map((group, index) => `
            <button type="button" class="pk-tab" role="tab"
                    aria-selected="${index === 0}" aria-controls="moves-${group.id}" id="tab-${group.id}">
                ${this.esc(group.label)}<span class="c">${String(group.moves.length).padStart(2, '0')}</span>
            </button>
        `).join('');

        const panels = groups.map((group, index) => `
            <div class="pk-moves-panel" id="moves-${group.id}" role="tabpanel"
                 aria-labelledby="tab-${group.id}"${index === 0 ? '' : ' hidden'}>
                ${this.renderMoveTable(group, t)}
            </div>
        `).join('');

        return `
            <section class="frame">
                <div class="panel-head"><span>${this.esc(t.Moves)}</span><span class="idx">04</span></div>
                <div class="pk-tabs" role="tablist">${tabs}</div>
                ${panels}
            </section>
        `;
    }

    renderMoveTable(group, t) {
        const dash = '—';

        const rows = group.moves.map(move => `
            <tr>
                ${group.showLevel ? `<td class="lv">${move.level ? String(move.level).padStart(2, '0') : dash}</td>` : ''}
                <td class="nm">${this.esc(move.name)}</td>
                <td><span class="tp t-${move.typeSlug}">${this.esc(move.typeLabel)}</span></td>
                <td><span class="tp ${move.categoryClass}">${this.esc(this.categoryLabels?.[move.category] ?? move.category)}</span></td>
                <td class="n">${move.pp ?? dash}</td>
                <td class="n">${move.power ? move.power : dash}</td>
                <td class="n">${move.accuracy ? move.accuracy : dash}</td>
            </tr>
        `).join('');

        return `
            <div class="pk-table-scroll">
                <table class="pk-moves">
                    <thead>
                        <tr>
                            ${group.showLevel ? `<th>${this.esc(t.Level)}</th>` : ''}
                            <th>${this.esc(t.Name)}</th>
                            <th>${this.esc(t.Type)}</th>
                            <th>${this.esc(t.Category)}</th>
                            <th class="n">${this.esc(t.PP)}</th>
                            <th class="n">${this.esc(t.Power)}</th>
                            <th class="n">${this.esc(t.Accuracy)}</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }
}
