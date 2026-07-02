/*
Traitement et transformation des données Pokémon
*/

export class PokemonDataProcessor {
    constructor(languageManager) {
        this.languageManager = languageManager;
    }

    async processData(data) {
        const form = data.forms[0];
        
        return {
            form,
            name: this.processName(form),
            description: this.processDescription(form),
            stats: await this.processStats(form),
            abilities: this.processAbilities(form),
            moves: await this.processMoves(form),
            evolutions: await this.processEvolutions(form),
            breeding: await this.processBreeding(form),
            types: this.processTypes(form),
            navigation: await this.processNavigation(data),
        };
    }

    processName(form) {
        const lang = PokemonUtils.getLang(this.languageManager);

        return form['names'][lang];
    }

    processDescription(form) {
        const lang = PokemonUtils.getLang(this.languageManager);

        return form['descriptions'][lang];
    }

    async processStats(form) {
        const statLabels = await Promise.all([
            this.languageManager.getTranslation('HP'),
            this.languageManager.getTranslation('Attack'),
            this.languageManager.getTranslation('Defense'),
            this.languageManager.getTranslation('Speed'),
            this.languageManager.getTranslation('Special Attack'),
            this.languageManager.getTranslation('Special Defense')
        ]);

        return [
            { name: statLabels[0], value: form.baseHp },
            { name: statLabels[1], value: form.baseAtk },
            { name: statLabels[2], value: form.baseDfe },
            { name: statLabels[3], value: form.baseSpd },
            { name: statLabels[4], value: form.baseAts },
            { name: statLabels[5], value: form.baseDfs }
        ];
    }

    processAbilities(form) {
        const displayedAbilities = new Set();
        return form.abilities.map(abilitySymbol => {
            if (!displayedAbilities.has(abilitySymbol)) {
                displayedAbilities.add(abilitySymbol);
                return this.getAbilityData(abilitySymbol, form.abilities_data);
            }
            return null;
        }).filter(Boolean);
    }

    getAbilityData(abilitySymbol, abilitiesData) {
        const ability = abilitiesData.find(a => a.symbol === abilitySymbol);
        if (!ability) return { name: abilitySymbol, description: "Data not found" };
        
        const lang = PokemonUtils.getLang(this.languageManager);
        
        return {
            name: ability.names[lang] || ability.names.en || abilitySymbol,
            description: ability.descriptions[lang] || ability.descriptions.en || "Description not found"
        };
    }

    async processMoves(form) {
        const movesByType = {
            level: new Set(),
            tutor: new Set(),
            tech: new Set(),
            breed: new Set()
        };

        const processedMoves = {
            level: [],
            tutor: [],
            tech: [],
            breed: []
        };

        for (const moveInfo of form.moveSet) {
            const moveData = this.getMoveData(moveInfo.move, form.moves_data);
            if (!moveData) continue;

            const categoryImage = await this.getCategoryImage(moveData.category);
            const typeFrench = PokemonUtils.removeAccents(PokemonUtils.translateTypeToFrench(moveData.type));
            const typeImage = `resources/icons/types/${typeFrench}.png`;

            const processedMove = {
                level: moveInfo.level || '',
                name: moveData.name,
                typeImage,
                categoryImage,
                pp: moveData.pp,
                power: moveData.power,
                accuracy: moveData.accuracy,
                type: typeFrench,
                category: moveData.category
            };

            const moveType = this.getMoveType(moveInfo.klass);
            if (moveType && !movesByType[moveType].has(moveInfo.move)) {
                movesByType[moveType].add(moveInfo.move);
                processedMoves[moveType].push(processedMove);
            }
        }

        return processedMoves;
    }

    getMoveType(klass) {
        const typeMap = {
            'LevelLearnableMove': 'level',
            'TutorLearnableMove': 'tutor',
            'TechLearnableMove': 'tech',
            'BreedLearnableMove': 'breed'
        };
        return typeMap[klass];
    }

    getMoveData(moveSymbol, movesData) {
        const move = movesData.find(m => m.symbol === moveSymbol);
        if (!move) return null;
        
        const lang = PokemonUtils.getLang(this.languageManager);
        
        return {
            name: move.names[lang] || move.names.en || moveSymbol,
            category: move.category,
            type: move.type,
            pp: move.pp,
            power: move.power,
            accuracy: move.accuracy
        };
    }

    async getCategoryImage(category) {
        const imageMap = {
            'physical': 'physique.png',
            'status': 'statut.png',
            'special': 'special.png'
        };
        return `resources/icons/types/${imageMap[category] || 'placeholder.png'}`;
    }

    async processEvolutions(form) {
        const lang = PokemonUtils.getLang(this.languageManager);

        let evolutions = [];
        for (let index = 0; index < form.evolutions.length; index++) {
            const evo = form.evolutions[index];

            const data = await PokemonUtils.fetchJson(`./data/pokemon_consolidated/${evo.dbSymbol}.json`);

            evolutions[index] = {
                dbSymbol: evo.dbSymbol,
                name: data.forms[0].names[lang],
                conditions: evo.conditions
            }
        }
        return evolutions;
    }

    async processBreeding(form) {
        const lang = PokemonUtils.getLang(this.languageManager);

        let groups = [];
        for (let index = 0; index < form.breedGroups.filter((value, index, array) => array.indexOf(value) === index).length; index++) {
            const group = form.breedGroups[index];

            groups[index] = await this.languageManager.getTranslation("breed_" + group);
        }

        const data = await PokemonUtils.fetchJson(`./data/pokemon_consolidated/${form.babyDbSymbol}.json`);

        return {
            breedGroups: groups,
            hatchSteps: form.hatchSteps,
            babyForm: data.forms[0].names[lang]
        };
    }

    processTypes(form) {
        const type1French = PokemonUtils.removeAccents(PokemonUtils.translateTypeToFrench(form.type1));
        const type2French = form.type2 !== "__undef__" ?
            PokemonUtils.removeAccents(PokemonUtils.translateTypeToFrench(form.type2)) : null;
        
        return { type1French, type2French };
    }

    async processNavigation(pokemon) {
        const lang = PokemonUtils.getLang(this.languageManager);

        const data = await PokemonUtils.fetchJson(`./data/national.json`);

        const index = data.creatures.findIndex(pk => pk.dbSymbol == pokemon.dbSymbol);

        let previous = null;
        let next = null;

        if (index > 0) {
            const pk = await PokemonUtils.fetchJson(`./data/pokemon_consolidated/${data.creatures[index - 1].dbSymbol}.json`);

            previous = {
                name: pk.forms[0].names[lang],
                dbSymbol: pk.dbSymbol
            };
        }

        if (index < data.creatures.length - 1) {
            const pk = await PokemonUtils.fetchJson(`./data/pokemon_consolidated/${data.creatures[index + 1].dbSymbol}.json`);

            next = {
                name: pk.forms[0].names[lang],
                dbSymbol: pk.dbSymbol
            };
        }

        return {
            "previous": previous,
            "next": next
        }
    }
}