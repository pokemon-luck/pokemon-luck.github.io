/*
Rendu HTML des données Pokémon
*/

export class PokemonRenderer {
    constructor(languageManager) {
        this.languageManager = languageManager;
    }

    async renderPokemon(processedData, pokemonName) {
        const { form, name, stats, abilities, moves, evolutions, breeding, types, navigation } = processedData;
        
        const sections = await Promise.all([
            this.renderNavigation(navigation),
            this.renderMainInfo(pokemonName, name, types),
            this.renderStats(stats),
            this.renderDetails(form),
            this.renderEvolution(evolutions),
            this.renderExperience(form),
            this.renderBreeding(breeding),
            this.renderAbilities(abilities),
            this.renderMoves(moves)
        ]);

        return sections.join('');
    }

    async renderNavigation(navigation) {
        let nav = [];
        if (navigation.previous) {
            nav[0] = `
            <a style="width:100%;color:white;text-decoration:none;" href="PokemonSearch.html?pokemon=${navigation.previous.dbSymbol}">
                <div class="grid-item grid-item-large" style="display:flex;justify-content:start;align-items:center;gap:10px;min-height:0px;height:25px;">
                    <h2><span>&#11207;</span></h2>
                    <img src="data/pokefront/${navigation.previous.dbSymbol}.png" alt="${navigation.previous.dbSymbol}" style="width:50px;height:50px;position:relative;bottom:10px;">
                    <p>${navigation.previous.name}</p>
                </div>
            </a>
            `;
        } else {
            nav[0] = '<div style="width:100%"></div>'
        }
        if (navigation.next) {
            nav[1] = `
            <a style="width:100%;color:white;text-decoration:none;" href="PokemonSearch.html?pokemon=${navigation.next.dbSymbol}">
                <div class="grid-item grid-item-large" style="display:flex;justify-content:end;align-items:center;gap:10px;min-height:0px;height:25px;">
                    <p>${navigation.next.name}</p>
                    <img src="data/pokefront/${navigation.next.dbSymbol}.png" alt="${navigation.next.dbSymbol}" style="width:50px;height:50px;position:relative;bottom:10px;">
                    <h2><span>&#11208;</span></h2>
                </div>
            </a>
            `;
        } else {
            nav[1] = '<div style="width:100%"></div>'
        }

        return `
        <div class="grid-container-layer1">
            ${nav.join('')}
        </div>
        `;
    }

    async renderMainInfo(pokemonName, name, types) {
        const typesImages = this.renderTypeImages(types);
        
        return `
        <div class="grid-container-layer1">
            <div class="grid-item grid-item-large">
                <h2>${name}</h2>
                <img src="data/pokefront/${pokemonName}.png" alt="${pokemonName}">
                ${typesImages}
            </div>
        `;
    }

    async renderStats(stats) {
        const statsData = stats.map(stat => {
            const color = this.calculateColor(stat.value);
            const width = (stat.value / 255) * 100;
            return `
                <tr>
                    <td><span>${stat.name}:</span> ${stat.value}</td>
                    <td>
                        <div class="stat-bar-container">
                            <div class="stat-bar" style="background-color: ${color}; width: ${width}%;"></div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div class="grid-item grid-item-large">
                <h2>${await this.languageManager.getTranslation('Stats')}</h2>
                <table>
                    ${statsData}
                </table>
            </div>
        </div>`;
    }

    async renderDetails(form) {
        return `
        <div class="grid-container-layer2">
            <div class="grid-item">
                <h2>${await this.languageManager.getTranslation("Height & Weight")}</h2>
                <p><span>${await this.languageManager.getTranslation('Height')}:</span> ${form.height} m</p>
                <p><span>${await this.languageManager.getTranslation('Weight')}:</span> ${form.weight} kg</p>
            </div>
        `;
    }

    async renderEvolution(evolutions) {
        let evolutionsData = [];
        for (let i = 0; i < evolutions.length; i++) {
            const evo = evolutions[i];

            let conditions = []
            for (let j = 0; j < evo.conditions.length; j++) {
                const cond = evo.conditions[j];
                
                if (["minLevel","minLoyalty","skill1","stone","itemHold","func"].includes(cond.type)) {
                    conditions[j] = `<div style="font-size:11px;color:#8e99ab;">${await this.languageManager.getTranslation(cond.type)}: <span>${cond.value}</span></div>`;
                }
            }

            evolutionsData[i] = `
                <a href="PokemonSearch.html?pokemon=${evo.dbSymbol}&lang=${this.languageManager.getCurrentLanguage()}" 
                class="evolution-item" style="text-decoration: none; color: inherit; display: block; pointer-events: auto !important; position: relative; z-index: 999; margin:0">
                    <img src="data/pokefront/${evo.dbSymbol}.png" alt="${this.capitalizeFirstLetter(evo.dbSymbol)}">
                    <p>${evo.name}</p>
                    <div style="margin-top:10px;">
                        ${conditions.join('')}
                    </div>
                </a>
            `;
        }

        return `
            <div class="grid-item" style="min-height:0px;height:auto">
                <h2>${await this.languageManager.getTranslation('Evolution')}</h2>
                <div class="grid-container-layer3" style="flex-wrap: wrap;">
                    ${evolutionsData.join('')}
                </div>
            </div>
        `;
    }

    async renderExperience(form) {
        return `
            <div class="grid-item">
                <h2>${await this.languageManager.getTranslation('Experience')}</h2>
                <p><span>${await this.languageManager.getTranslation("Base Experience")}:</span> ${form.baseExperience}</p>
                <p><span>${await this.languageManager.getTranslation("Experience Type")}:</span> ${await this.languageManager.getTranslation("exp_" + form.experienceType)}</p>
            </div>
        `;
    }

    async renderBreeding(breeding) {
        return `
            <div class="grid-item">
                <h2>${await this.languageManager.getTranslation("Breeding Info")}</h2>
                <p><span>${await this.languageManager.getTranslation("Egg Groups")}:</span> ${breeding.breedGroups.join(', ')}</p>
                <p><p>
                <p><span>${await this.languageManager.getTranslation("Hatch Steps")}:</span> ${breeding.hatchSteps}</p>
                <p><span>${await this.languageManager.getTranslation("Baby form")}:</span> ${breeding.babyForm}</p>
            </div>
        </div>`;
    }

    async renderAbilities(abilities) {
        const abilitiesData = abilities.map(ability => 
            `<span>${ability.name}</span>: ${ability.description}`
        ).join('<br><br>');

        return `
        <div class="grid-container-layer3">
            <div class="grid-item">
                <h2>${await this.languageManager.getTranslation('Abilities')}</h2>
                <p>${abilitiesData}</p>
            </div>
        </div>`;
    }

    async renderMoves(moves) {
        const sections = await Promise.all([
            this.renderMoveSection('Level Learnable Moves', moves.level),
            this.renderMoveSection('Tutor Learnable Moves', moves.tutor),
            this.renderMoveSection('Tech Learnable Moves', moves.tech),
            this.renderMoveSection('Breed Learnable Moves', moves.breed)
        ]);

        return `
        <div class="grid-container-layer4">
            <div class="grid-item-large">
                <h2>Moves</h2>
                ${sections.join('')}
            </div>
        </div>`;
    }

    async renderMoveSection(titleKey, movesData) {
        const movesHtml = movesData.map(move => `
            <tr>
                <td>${move.level}</td>
                <td><strong>${move.name}</strong></td>
                <td><img src="${move.typeImage}" alt="${move.type}"></td>
                <td><img src="${move.categoryImage}" alt="${move.category}"></td>
                <td>${move.pp}</td>
                <td>${move.power}</td>
                <td>${move.accuracy}</td>
            </tr>
        `).join('');

        return `
            <h2>${await this.languageManager.getTranslation(titleKey)}</h2>
            <table>
                <tr>
                    <th>${await this.languageManager.getTranslation('Level')}</th>
                    <th>${await this.languageManager.getTranslation('Name')}</th>
                    <th>${await this.languageManager.getTranslation('Type')}</th>
                    <th>${await this.languageManager.getTranslation('Category')}</th>
                    <th>${await this.languageManager.getTranslation('PP')}</th>
                    <th>${await this.languageManager.getTranslation('Power')}</th>
                    <th>${await this.languageManager.getTranslation('Accuracy')}</th>
                </tr>
                ${movesHtml}
            </table>
        `;
    }

    renderTypeImages(types) {
        const { type1French, type2French } = types;
        return `
            <br>
            <img src="resources/icons/types/${type1French}.png" alt="${type1French}" class="img-pokemon-types-layer1">
            ${type2French ? `<img src="resources/icons/types/${type2French}.png" alt="${type2French}" class="img-pokemon-types-layer1">` : ''}
        `;
    }

    calculateColor(value) {
        let r, g, b;

        if (value <= 50) {
            r = 255;
            g = Math.floor((value / 50) * 50);
            b = Math.floor((value / 50) * 50);
        } else if (value <= 90) {
            r = 255;
            g = 255;
            b = Math.floor(((value - 50) / 50) * 50);
        } else if (value <= 190) {
            r = Math.floor(((value - 100) / 100) * 50);
            g = 255;
            b = Math.floor(((value - 100) / 100) * 50);
        } else {
            r = Math.floor(((value - 200) / 55) * 50);
            g = Math.floor(((value - 200) / 55) * 50);
            b = 255;
        }

        return `rgb(${r}, ${g}, ${b})`;
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}