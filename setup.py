import os
import shutil
import json
import csv
from PIL import Image

# --- Configuration ---
# You need to set these paths according to your environment.
# FANGAME_ROOT_FOLDER: The root directory of your RPG Maker XP PSDK project.
# WEB_PROJECT_ROOT_FOLDER: The root directory of your web Pokédex project.

FANGAME_ROOT_FOLDER = r'D:\PokemonFangames\PokemonLuck' # e.g., r'C:\Users\YourUser\Documents\RPG XP Projects\MyPokemonGame'
WEB_PROJECT_ROOT_FOLDER = r'D:\wamp64\www\pokemon-luck.github.io' # e.g., r'C:\Users\YourUser\Documents\GitHub\my-pokedex-web'

# Output directory within the web project for processed assets
OUTPUT_DATA_FOLDER = os.path.join(WEB_PROJECT_ROOT_FOLDER, 'data')

# Source paths relative to FANGAME_ROOT_FOLDER
PSDK_NATIONAL_DEX_PATH = os.path.join(FANGAME_ROOT_FOLDER, r'Data\Studio\dex\regional.json')
PSDK_CSV_DIALOGS_PATH = os.path.join(FANGAME_ROOT_FOLDER, r'Data\Text\Dialogs')
PSDK_POKEMON_JSONS_FOLDER = os.path.join(FANGAME_ROOT_FOLDER, r'Data\Studio\pokemon')
PSDK_MOVES_JSONS_FOLDER = os.path.join(FANGAME_ROOT_FOLDER, r'Data\Studio\moves')
PSDK_ITEMS_JSONS_FOLDER = os.path.join(FANGAME_ROOT_FOLDER, r'Data\Studio\items')
PSDK_ABILITIES_JSONS_FOLDER = os.path.join(FANGAME_ROOT_FOLDER, r'Data\Studio\abilities')
PSDK_TYPES_JSONS_FOLDER = os.path.join(FANGAME_ROOT_FOLDER, r'Data\Studio\types')
PSDK_POKEFRONT_SPRITES_FOLDER = os.path.join(FANGAME_ROOT_FOLDER, r'graphics\pokedex\pokefront')
PSDK_SHINY_SPRITES_FOLDER = os.path.join(FANGAME_ROOT_FOLDER, r'graphics\pokedex\pokefrontshiny')

# Destination paths relative to WEB_PROJECT_ROOT_FOLDER (or OUTPUT_DATA_FOLDER)
WEB_NATIONAL_DEX_PATH = os.path.join(OUTPUT_DATA_FOLDER, 'national.json')
WEB_TRANSLATIONS_FOLDER = os.path.join(OUTPUT_DATA_FOLDER, 'translations')
WEB_POKEMON_CONSOLIDATED_FOLDER = os.path.join(OUTPUT_DATA_FOLDER, 'pokemon_consolidated')
WEB_TYPES_CONSOLIDATED_FOLDER = os.path.join(OUTPUT_DATA_FOLDER, 'types')
WEB_POKEFRONT_UPSCALED_FOLDER = os.path.join(OUTPUT_DATA_FOLDER, 'pokefront') # Now inside the data folder
WEB_SHINY_UPSCALED_FOLDER = os.path.join(OUTPUT_DATA_FOLDER, 'shiny')
WEB_FUNC_JSON_FOLDER = os.path.join(OUTPUT_DATA_FOLDER, 'func')

# CSV File IDs and their roles
CSV_POKEMON_NAMES_ID = '100000'
CSV_ABILITIES_NAMES_ID = '100004'
CSV_ABILITIES_DESCRIPTIONS_ID = '100005'
CSV_MOVES_NAMES_ID = '100006'
CSV_ITEMS_NAMES_ID = '100012'
CSV_POKEMON_DESCRIPTIONS_ID = '100002'

# Language mapping for CSVs (assuming standard PSDK order)
# Based on previous context: ['en', 'fr', 'it', 'de', 'es', 'ko', 'kana']
LANGUAGES = ['en', 'fr', 'it', 'de', 'es', 'ko'] # Assuming 'kana' is not for UI translations

# --- Helper Functions ---

def ensure_directory_exists(path):
    """Ensures that a directory exists, creating it if necessary."""
    os.makedirs(path, exist_ok=True)

def load_csv_as_dict(file_path):
    """Loads a CSV file into a dictionary where row index (from 1) maps to a list of column values."""
    data = {}
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            # PSDK CSVs are often 1-indexed for text IDs
            data[i] = row
    return data

def get_translated_text_from_csv(csv_data, text_id, lang_index):
    """Retrieves translated text from loaded CSV data."""
    if text_id is None:
        return "Unknown" # Handle cases where textId isn't found
    row = csv_data.get(text_id)
    if row and len(row) > lang_index:
        # PSDK CSVs often have quotes around entries. Remove them.
        return row[lang_index].strip('"')
    return "Translation Not Found"

# --- Main Script Logic ---

def run_setup():
    print("Starting Pokédex Web Setup Script...")

    # 1. Prepare output directories
    ensure_directory_exists(OUTPUT_DATA_FOLDER)
    ensure_directory_exists(WEB_TRANSLATIONS_FOLDER)
    ensure_directory_exists(WEB_POKEMON_CONSOLIDATED_FOLDER)
    ensure_directory_exists(WEB_POKEFRONT_UPSCALED_FOLDER)

    # 2. Copy national.json
    print(f"Copying national.json from {PSDK_NATIONAL_DEX_PATH} to {WEB_NATIONAL_DEX_PATH}...")
    shutil.copy(PSDK_NATIONAL_DEX_PATH, WEB_NATIONAL_DEX_PATH)

    # 3. Load CSV data for translations
    print("Loading CSV translation files...")
    pokemon_names_csv = load_csv_as_dict(os.path.join(PSDK_CSV_DIALOGS_PATH, f'{CSV_POKEMON_NAMES_ID}.csv'))
    pokemon_descriptions_csv = load_csv_as_dict(os.path.join(PSDK_CSV_DIALOGS_PATH, f'{CSV_POKEMON_DESCRIPTIONS_ID}.csv'))
    abilities_names_csv = load_csv_as_dict(os.path.join(PSDK_CSV_DIALOGS_PATH, f'{CSV_ABILITIES_NAMES_ID}.csv'))
    abilities_descriptions_csv = load_csv_as_dict(os.path.join(PSDK_CSV_DIALOGS_PATH, f'{CSV_ABILITIES_DESCRIPTIONS_ID}.csv'))
    moves_names_csv = load_csv_as_dict(os.path.join(PSDK_CSV_DIALOGS_PATH, f'{CSV_MOVES_NAMES_ID}.csv'))
    items_names_csv = load_csv_as_dict(os.path.join(PSDK_CSV_DIALOGS_PATH, f'{CSV_ITEMS_NAMES_ID}.csv'))

    # 4. Upscale and copy Pokémon front sprites
    print("Upscaling and copying Pokémon front sprites...")
    for filename in os.listdir(PSDK_POKEFRONT_SPRITES_FOLDER):
        if filename.endswith('.png'):
            src_path = os.path.join(PSDK_POKEFRONT_SPRITES_FOLDER, filename)
            dest_path = os.path.join(WEB_POKEFRONT_UPSCALED_FOLDER, filename.lower())
            try:
                with Image.open(src_path) as img:
                    # Upscale by 4 times
                    new_size = (img.width * 4, img.height * 4)
                    upscaled_img = img.resize(new_size, Image.Resampling.NEAREST) # NEAREST for pixel art
                    upscaled_img.save(dest_path)
            except Exception as e:
                print(f"Error processing sprite {filename}: {e}")
    print("Sprite upscaling complete.")

    print("Upscaling and copying Pokémon shiny sprites...")
    for filename in os.listdir(PSDK_SHINY_SPRITES_FOLDER):
        if filename.endswith('.png'):
            src_path = os.path.join(PSDK_SHINY_SPRITES_FOLDER, filename)
            dest_path = os.path.join(WEB_SHINY_UPSCALED_FOLDER, filename.lower())
            try:
                with Image.open(src_path) as img:
                    # Upscale by 4 times
                    new_size = (img.width * 4, img.height * 4)
                    upscaled_img = img.resize(new_size, Image.Resampling.NEAREST) # NEAREST for pixel art
                    upscaled_img.save(dest_path)
            except Exception as e:
                print(f"Error processing sprite {filename}: {e}")
    print("Sprite upscaling complete.")

    # 5. Process national.json to consolidate Pokémon data
    print("Consolidating Pokémon data based on national.json...")
    try:
        with open(WEB_NATIONAL_DEX_PATH, 'r', encoding='utf-8') as f:
            national_dex_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: national.json not found at {WEB_NATIONAL_DEX_PATH}. Make sure it's copied.")
        return

    pokemon_symbols_to_process = [creature['dbSymbol'] for creature in national_dex_data['creatures']]

    for pokemon_symbol in pokemon_symbols_to_process:
        print(f"Processing {pokemon_symbol}...")
        try:
            # Load base Pokémon JSON
            pokemon_json_path = os.path.join(PSDK_POKEMON_JSONS_FOLDER, f'{pokemon_symbol}.json')
            with open(pokemon_json_path, 'r', encoding='utf-8') as f:
                pokemon_data = json.load(f)

            # Assuming there's only one form or we process the first one
            if not pokemon_data.get('forms'):
                print(f"Warning: No forms found for {pokemon_symbol}, skipping consolidation.")
                continue
            
            form = pokemon_data['forms'][0] # Get the first form for processing

            # Consolidate Name
            translated_names = {}
            text_id = pokemon_data['id']
            for i, lang in enumerate(LANGUAGES):
                translated_names[lang] = get_translated_text_from_csv(pokemon_names_csv, text_id + 1, i)
            form['names'] = translated_names

            # Consilidate description
            translated_descriptions = {}
            text_id = pokemon_data['id']
            for i, lang in enumerate(LANGUAGES):
                translated_descriptions[lang] = get_translated_text_from_csv(pokemon_descriptions_csv, text_id + 1, i)
            form['descriptions'] = translated_descriptions

            # Consolidate Evolutions
            for i, evolution in enumerate(form.get('evolutions', [])):
                for j, condition in enumerate(evolution.get('conditions', [])):
                    if condition['type'] == 'itemHold' or condition['type'] == 'stone':
                        item_json_path = os.path.join(PSDK_ITEMS_JSONS_FOLDER, f'{condition['value']}.json')
                        with open(item_json_path, 'r', encoding='utf-8') as f:
                            item_data = json.load(f)
                        translated_items = {}
                        for k, lang in enumerate(LANGUAGES):
                            translated_items[lang] = get_translated_text_from_csv(items_names_csv, item_data['id'] + 1, k)
                        form['evolutions'][i]['conditions'][j]['names'] = translated_items
                    if condition['type'] == 'func':
                        func_json_path = os.path.join(WEB_FUNC_JSON_FOLDER, f'func.json')
                        with open(func_json_path, 'r', encoding='utf-8') as f:
                            func_data = json.load(f)
                        form['evolutions'][i]['conditions'][j]['names'] = func_data[condition['value']]
                    if condition['type'] == 'skill1':
                        move_json_path = os.path.join(PSDK_MOVES_JSONS_FOLDER, f'{condition['value']}.json')
                        with open(move_json_path, 'r', encoding='utf-8') as f:
                            move_details = json.load(f)
                        translated_moves = {}
                        for k, lang in enumerate(LANGUAGES):
                            translated_moves[lang] = get_translated_text_from_csv(moves_names_csv, move_details['id'] + 1, k)
                        form['evolutions'][i]['conditions'][j]['names'] = translated_moves
                    if condition['type'] == 'gender':
                        if condition['value'] == 1:
                            translated_gender = {
                                'en': 'Male',
                                'fr': 'Mâle'
                            }
                        else:
                            translated_gender = {
                                'en': 'Female',
                                'fr': 'Femelle'
                            }
                        form['evolutions'][i]['conditions'][j]['names'] = translated_gender

            # Consolidate Abilities
            consolidated_abilities = []
            processed_ability_symbols = set() # To avoid processing duplicate abilities within a form
            for ability_symbol in form.get('abilities', []):
                if ability_symbol in processed_ability_symbols:
                    continue
                processed_ability_symbols.add(ability_symbol)

                ability_json_path = os.path.join(PSDK_ABILITIES_JSONS_FOLDER, f'{ability_symbol}.json')
                try:
                    with open(ability_json_path, 'r', encoding='utf-8') as f:
                        ability_details = json.load(f)
                    
                    text_id = ability_details.get('textId')
                    
                    translated_names = {}
                    translated_descriptions = {}
                    for i, lang in enumerate(LANGUAGES):
                        translated_names[lang] = get_translated_text_from_csv(abilities_names_csv, text_id + 1, i)
                        # PSDK ability descriptions often use textId directly as CSV row index
                        translated_descriptions[lang] = get_translated_text_from_csv(abilities_descriptions_csv, text_id + 1, i)
                    
                    consolidated_abilities.append({
                        'symbol': ability_symbol,
                        'textId': text_id,
                        'names': translated_names,
                        'descriptions': translated_descriptions
                    })
                except FileNotFoundError:
                    print(f"Warning: Ability JSON not found for {ability_symbol}.")
                    consolidated_abilities.append({
                        'symbol': ability_symbol,
                        'names': {'en': ability_symbol},
                        'descriptions': {'en': 'Description not found.'}
                    })
                except Exception as e:
                    print(f"Error processing ability {ability_symbol}: {e}")
                    consolidated_abilities.append({
                        'symbol': ability_symbol,
                        'names': {'en': ability_symbol},
                        'descriptions': {'en': 'Error loading description.'}
                    })
            form['abilities_data'] = consolidated_abilities # Add consolidated data

            # Consolidate Moves
            consolidated_moves = []
            processed_move_symbols = set() # To avoid processing duplicate moves within a form's moveset
            for move_entry in form.get('moveSet', []):
                move_symbol = move_entry.get('move')
                if not move_symbol or move_symbol in processed_move_symbols:
                    continue
                processed_move_symbols.add(move_symbol)

                move_json_path = os.path.join(PSDK_MOVES_JSONS_FOLDER, f'{move_symbol}.json')
                try:
                    with open(move_json_path, 'r', encoding='utf-8') as f:
                        move_details = json.load(f)
                    
                    move_id = move_details.get('id') # PSDK move ID, used for CSV lookup
                    
                    translated_names = {}
                    for i, lang in enumerate(LANGUAGES):
                        translated_names[lang] = get_translated_text_from_csv(moves_names_csv, move_id + 1, i)
                    
                    consolidated_moves.append({
                        'symbol': move_symbol,
                        'id': move_id,
                        'klass': move_entry.get('klass'), # LevelLearnableMove, TutorLearnableMove etc.
                        'level': move_entry.get('level'), # Only for LevelLearnableMove
                        'names': translated_names,
                        'category': move_details.get('category'),
                        'type': move_details.get('type'),
                        'pp': move_details.get('pp'),
                        'power': move_details.get('power'),
                        'accuracy': move_details.get('accuracy')
                    })
                except FileNotFoundError:
                    print(f"Warning: Move JSON not found for {move_symbol}.")
                    consolidated_moves.append({
                        'symbol': move_symbol,
                        'names': {'en': move_symbol},
                        'category': 'unknown', 'type': 'unknown', 'pp': 0, 'power': 0, 'accuracy': 0
                    })
                except Exception as e:
                    print(f"Error processing move {move_symbol}: {e}")
                    consolidated_moves.append({
                        'symbol': move_symbol,
                        'names': {'en': move_symbol},
                        'category': 'unknown', 'type': 'unknown', 'pp': 0, 'power': 0, 'accuracy': 0
                    })
            form['moves_data'] = consolidated_moves # Add consolidated data
            
            # Remove original moveSet and abilities if desired to avoid redundancy,
            # or keep them if client-side code still references them.
            # del form['moveSet']
            # del form['abilities']

            # Save consolidated Pokémon JSON
            output_pokemon_path = os.path.join(WEB_POKEMON_CONSOLIDATED_FOLDER, f'{pokemon_symbol}.json')
            with open(output_pokemon_path, 'w', encoding='utf-8') as f:
                json.dump(pokemon_data, f, indent=2, ensure_ascii=False)
            print(f"Successfully consolidated data for {pokemon_symbol}.")

        except FileNotFoundError:
            print(f"Error: Pokémon JSON not found for {pokemon_symbol} at {pokemon_json_path}. Skipping.")
        except Exception as e:
            print(f"An unexpected error occurred while processing {pokemon_symbol}: {e}")
    
    #6 Process types for the type chart
    consolidated_types = {}
    for type in [
        'normal',
        'fire',
        'water',
        'electric',
        'grass',
        'ice',
        'fighting',
        'poison',
        'ground',
        'flying',
        'psychic',
        'bug',
        'rock',
        'ghost',
        'dragon',
        'dark',
        'steel',
        'fairy',
        'undead'
    ]:
        type_json_path = os.path.join(PSDK_TYPES_JSONS_FOLDER, f'{type}.json')
        with open(type_json_path, 'r', encoding='utf-8') as f:
            type_data = json.load(f)
        
        consolidated_types[type] = {}
        for defensive in type_data['damageTo']:
            consolidated_types[type][defensive['defensiveType']] = defensive['factor']

    output_type_path = os.path.join(WEB_TYPES_CONSOLIDATED_FOLDER, f'types.json')
    with open(output_type_path, 'w', encoding='utf-8') as f:
        json.dump(consolidated_types, f, indent=2, ensure_ascii=False)

    print("Setup script finished.")

if __name__ == '__main__':
    print("This script prepares PSDK assets for the web Pokédex.")
    print("Please ensure you have Pillow (pip install Pillow) installed.")
    print("\n--- IMPORTANT ---")
    print("BEFORE RUNNING, EDIT THE 'FANGAME_ROOT_FOLDER' AND 'WEB_PROJECT_ROOT_FOLDER' VARIABLES")
    print(f"IN THIS SCRIPT ({os.path.basename(__file__)}) TO YOUR ACTUAL PATHS.")
    print("-----------------\n")

    # Ask for user confirmation before running
    confirmation = input("Do you want to run the setup script now? (yes/no): ").lower()
    if confirmation == 'yes':
        run_setup()
    else:
        print("Setup script aborted by user.")