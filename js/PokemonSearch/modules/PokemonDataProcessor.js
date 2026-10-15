/*
Traitement et transformation des données Pokémon.

Les noms des Pokémon voisins (précédent, suivant, évolutions, forme bébé) sont
lus dans national.json, déjà chargé et mis en cache, plutôt qu'en téléchargeant
leur fiche consolidée complète — une fiche pèse 41 Ko en moyenne, jusqu'à 183 Ko,
et n'était ouverte que pour y prendre une chaîne de caractères.
*/

export class PokemonDataProcessor {
    constructor(languageManager) {
        this.languageManager = languageManager;
    }

    get lang() {
        return PokemonUtils.getLang(this.languageManager);
    }

    // Index dbSymbol -> { name, position } construit une fois par page.
    async getDexIndex() {
        if (!this._dexIndex) {
            const data = await PokemonUtils.fetchJson('data/national.json');
            this._dexList = data.creatures;
            this._dexIndex = new Map(
                data.creatures.map((creature, position) => [
                    creature.dbSymbol,
                    { name: creature.names[this.lang] || creature.dbSymbol, position }
                ])
            );
        }
        return this._dexIndex;
    }

    async nameOf(dbSymbol) {
        const index = await this.getDexIndex();
        return index.get(dbSymbol)?.name || dbSymbol;
    }

    async processData(data) {
        const form = data.forms[0];
        await this.getDexIndex();

        return {
            form,
            dbSymbol: data.dbSymbol,
            dexNumber: (this._dexIndex.get(data.dbSymbol)?.position ?? -1) + 1,
            name: form.names[this.lang],
            nameEn: form.names.en,
            description: form.descriptions[this.lang],
            stats: await this.processStats(form),
            abilities: this.processAbilities(form),
            moves: await this.processMoves(form, data.dbSymbol),
            evolutionChain: await this.processEvolutionChain(data.dbSymbol, data),
            breeding: await this.processBreeding(form),
            types: this.processTypes(form),
            navigation: await this.processNavigation(data),
        };
    }

    async processStats(form) {
        const labels = await Promise.all([
            this.languageManager.getTranslation('HP'),
            this.languageManager.getTranslation('Attack'),
            this.languageManager.getTranslation('Defense'),
            this.languageManager.getTranslation('Special Attack'),
            this.languageManager.getTranslation('Special Defense'),
            this.languageManager.getTranslation('Speed')
        ]);

        // Ordre d'affichage des jeux officiels : la vitesse en dernier.
        // `key` désigne la variable de couleur (--st-*) de css/styles_types.css.
        return [
            { key: 'hp', name: labels[0], value: form.baseHp },
            { key: 'atk', name: labels[1], value: form.baseAtk },
            { key: 'def', name: labels[2], value: form.baseDfe },
            { key: 'ats', name: labels[3], value: form.baseAts },
            { key: 'dfs', name: labels[4], value: form.baseDfs },
            { key: 'spd', name: labels[5], value: form.baseSpd }
        ];
    }

    processAbilities(form) {
        const seen = new Set();

        return form.abilities
            .filter(symbol => {
                if (seen.has(symbol)) return false;
                seen.add(symbol);
                return true;
            })
            .map((symbol, index) => {
                const ability = form.abilities_data.find(a => a.symbol === symbol);
                // Dans les données PSDK, la troisième entrée est le talent caché.
                const hidden = form.abilities.indexOf(symbol) === 2;

                if (!ability) return { name: symbol, description: '', hidden };

                return {
                    name: ability.names[this.lang] || ability.names.en || symbol,
                    description: ability.descriptions[this.lang] || ability.descriptions.en || '',
                    hidden
                };
            });
    }

    async processMoves(form, dbSymbol) {
        const groups = this.collectMoves(form);

        // Les capacités de reproduction ne sont définies que sur la base de la
        // lignée : on va les y chercher pour les évolutions, au prix d'une
        // requête supplémentaire dans ce seul cas.
        const base = form.babyDbSymbol;
        if (groups.breed.length === 0 && base && base !== dbSymbol) {
            const baseForm = await this.loadBaseForm(base);
            if (baseForm) groups.breed = this.collectMoves(baseForm).breed;
        }

        return groups;
    }

    async loadBaseForm(dbSymbol) {
        try {
            const data = await PokemonUtils.fetchJson(`data/pokemon_consolidated/${dbSymbol}.json`);
            return data.forms[0] || null;
        } catch {
            return null;
        }
    }

    collectMoves(form) {
        const KLASS_TO_GROUP = {
            LevelLearnableMove: 'level',
            TutorLearnableMove: 'tutor',
            TechLearnableMove: 'tech',
            BreedLearnableMove: 'breed'
        };
        const CATEGORY_CLASS = { physical: 'c-phy', special: 'c-spe', status: 'c-sta' };

        const groups = { level: [], tutor: [], tech: [], breed: [] };
        const seen = { level: new Set(), tutor: new Set(), tech: new Set(), breed: new Set() };

        for (const entry of form.moveSet) {
            const group = KLASS_TO_GROUP[entry.klass];
            if (!group || seen[group].has(entry.move)) continue;

            const move = form.moves_data.find(m => m.symbol === entry.move);
            if (!move) continue;

            seen[group].add(entry.move);
            groups[group].push({
                level: entry.level || null,
                name: move.names[this.lang] || move.names.en || entry.move,
                type: move.type,
                typeSlug: PokemonUtils.typeSlug(move.type),
                typeLabel: PokemonUtils.typeLabel(move.type, this.lang),
                categoryClass: CATEGORY_CLASS[move.category] || 'c-sta',
                category: move.category,
                pp: move.pp,
                power: move.power,
                accuracy: move.accuracy
            });
        }

        return groups;
    }

    async readConditions(rawConditions) {
        const KNOWN = ['minLevel', 'minLoyalty', 'skill1', 'stone', 'itemHold', 'func', 'gender'];
        const conditions = [];

        for (const condition of rawConditions || []) {
            if (!KNOWN.includes(condition.type)) continue;
            conditions.push({
                label: await this.languageManager.getTranslation(condition.type),
                value: condition.names ? condition.names[this.lang] : condition.value
            });
        }

        return conditions;
    }

    /*
    Chaîne d'évolution complète, ancêtres compris.

    `babyDbSymbol` désigne la racine de la chaîne — pas seulement la forme bébé
    d'un œuf : pour Griffonde il vaut « tremplume ». On repart donc de la racine
    et on descend, ce qui permet d'afficher la lignée entière plutôt que les
    seules évolutions restantes.

    Chaque palier est un tableau : neuf Pokémon du jeu se ramifient en plusieurs
    évolutions possibles. La profondeur est bornée par sécurité, et un Pokémon
    déjà vu n'est jamais réintroduit — une donnée circulaire boucherait sinon.
    */
    async processEvolutionChain(currentSymbol, currentData) {
        const MAX_DEPTH = 5;
        const form = currentData.forms[0];
        const baby = form.babyDbSymbol;
        const root = (baby && baby !== '__undef__') ? baby : currentSymbol;

        const readForm = async (symbol) => {
            if (symbol === currentSymbol) return form;
            const data = await PokemonUtils.fetchJson(`data/pokemon_consolidated/${symbol}.json`);
            return data.forms[0];
        };

        const chain = [];
        const seen = new Set();
        let pending = [{ dbSymbol: root, conditions: [] }];

        for (let depth = 0; depth < MAX_DEPTH && pending.length > 0; depth++) {
            const stage = [];
            const next = [];

            for (const entry of pending) {
                if (seen.has(entry.dbSymbol)) continue;
                seen.add(entry.dbSymbol);

                let stageForm;
                try {
                    stageForm = await readForm(entry.dbSymbol);
                } catch (error) {
                    console.warn('Evolution chain: missing entry', entry.dbSymbol);
                    continue;
                }

                stage.push({
                    dbSymbol: entry.dbSymbol,
                    name: await this.nameOf(entry.dbSymbol),
                    dexNumber: (this._dexIndex.get(entry.dbSymbol)?.position ?? -1) + 1,
                    current: entry.dbSymbol === currentSymbol,
                    conditions: entry.conditions
                });

                for (const evo of stageForm.evolutions || []) {
                    next.push({ dbSymbol: evo.dbSymbol, conditions: await this.readConditions(evo.conditions) });
                }
            }

            if (stage.length > 0) chain.push(stage);
            pending = next;
        }

        // Une chaîne d'un seul maillon n'est pas une chaîne.
        return chain.length > 1 ? chain : [];
    }

    async processBreeding(form) {
        // Déduplique la liste elle-même : l'ancienne version comptait les
        // groupes uniques mais relisait le tableau brut, ce qui pouvait afficher
        // deux fois le même groupe et en escamoter un autre.
        const uniqueGroups = [...new Set(form.breedGroups)];

        const breedGroups = await Promise.all(
            uniqueGroups.map(group => this.languageManager.getTranslation('breed_' + group))
        );

        return {
            breedGroups,
            hatchSteps: form.hatchSteps,
            babyForm: form.babyDbSymbol ? await this.nameOf(form.babyDbSymbol) : null
        };
    }

    processTypes(form) {
        return [form.type1, form.type2]
            .filter(type => PokemonUtils.hasType(type))
            .map(type => ({
                slug: PokemonUtils.typeSlug(type),
                label: PokemonUtils.typeLabel(type, this.lang)
            }));
    }

    async processNavigation(pokemon) {
        const index = await this.getDexIndex();
        const position = index.get(pokemon.dbSymbol)?.position ?? -1;
        if (position === -1) return { previous: null, next: null };

        const at = (offset) => {
            const creature = this._dexList[position + offset];
            if (!creature) return null;
            return {
                dbSymbol: creature.dbSymbol,
                name: creature.names[this.lang] || creature.dbSymbol,
                dexNumber: position + offset + 1
            };
        };

        return { previous: at(-1), next: at(1) };
    }
}
