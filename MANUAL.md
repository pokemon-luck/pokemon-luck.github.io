# Pokédex Web Setup Guide

This guide details the setup process for the web Pokédex, focusing on how the necessary game assets are prepared and integrated.

## Data Sourcing and Preparation

The `setup.py` script automates the extraction and processing of data from your RPG Maker XP PSDK project. It copies specific files and folders, then performs transformations to optimize them for web display. All generated assets are written inside the web project's `data/` folder.

### Copied Assets:

The following files and directories are sourced from your PSDK project (`FANGAME_ROOT_FOLDER`):

* **National Pokédex Data:**
    * **Source:** `Data\Studio\dex\regional.json`
    * **Output:** `data\national.json`
    * **Note:** This web Pokédex handles a single Pokédex source. The script reads the project's `regional.json` and saves it as `national.json`; it then enriches this file with the translated Pokémon names.

* **Per-Pokémon / Move / Ability / Item / Type Data:**
    * **Location:** `Data\Studio\pokemon`, `Data\Studio\moves`, `Data\Studio\abilities`, `Data\Studio\items`, `Data\Studio\types`
    * **Purpose:** Individual JSON files, read per Pokémon listed in the Pokédex to build the consolidated files (see below).

* **Translation CSV Files:**
    * **Location:** `Data\Text\Dialogs`
    * **Files:**
        * `100000.csv` — Pokémon names
        * `100002.csv` — Pokémon descriptions
        * `100004.csv` — ability names
        * `100005.csv` — ability descriptions
        * `100006.csv` — move names
        * `100012.csv` — item names
    * **Purpose:** These CSV files hold the localized names and descriptions merged into the consolidated data. Languages are read in PSDK order (`en`, `fr`, `it`, `de`, `es`, `ko`).

* **Pokémon Sprites:**
    * **Location:** `graphics\pokedex\pokefront` (regular) and `graphics\pokedex\pokefrontshiny` (shiny)
    * **Output:** `data\pokefront` and `data\shiny`
    * **Purpose:** These are the visual assets (images) for each Pokémon.

### Data Processing Steps:

After copying, the `setup.py` script performs the following processing steps to optimize performance for the web:

1.  **Sprite Upscaling:**
    * Both regular and shiny front sprites are upscaled by a factor of 4, using nearest-neighbour resampling to preserve the pixel-art look on high-resolution displays. Each sprite is then renamed after its Pokémon's `dbSymbol`.

2.  **Pokémon Data Consolidation:**
    * For each Pokémon listed in `national.json`, the script locates its individual JSON data file (e.g., `pokemon/pikachu.json`).
    * It then **generates a consolidated JSON file per Pokémon** in `data\pokemon_consolidated`. This file contains *all necessary data* for that Pokémon: base stats, evolution chain (with translated evolution conditions), and the complete details (translated names, descriptions, types, power, PP, accuracy, etc.) for **all its moves and abilities**.
        * **Context:** The original PSDK data structure uses separate JSON files for each individual move and ability, alongside multiple CSV files for names and their translations.
    * This consolidation drastically reduces the number of HTTP requests needed to display a Pokémon's full data on GitHub Pages, optimizing loading times for the end-user.

3.  **Type Chart Generation:**
    * The script reads each type JSON (including the custom `undead` and `celestial` types) and builds `data\types\types.json`, a compact table of every type's damage factors used by the Type Chart page.
