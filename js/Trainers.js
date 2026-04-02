document.addEventListener('DOMContentLoaded', async () => {
    const pokedexGrid = document.getElementById('pokedexGrid');

    try {
        const response = await fetch('data/trainers.json');
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        const data = await response.json();

        const langIndex = this.languageManager.getLangIndex();
        const languages = ['en', 'fr', 'it', 'de', 'es', 'ko'];
        const lang = languages[langIndex] || 'en';

        // 👇 This is the key change
        for (const trainer of data) {
            const trainerCard = document.createElement('div');
            trainerCard.classList.add('pokemon-card');

            const spritePath = `data/trainers/${trainer.image}`;

            const sprite = document.createElement('img');
            sprite.src = spritePath;
            sprite.alt = trainer.names[lang];
            sprite.classList.add('pokemon-sprite');

            const name = document.createElement('p');
            name.textContent = trainer.names[lang];
            name.classList.add('pokemon-name');

            const description = document.createElement('p');
            description.textContent = trainer.description[lang];
            description.classList.add('pokemon-name');
            description.style.cssText = 'color: #8e99ab; font-size: 0.8em';

            trainerCard.appendChild(sprite);
            trainerCard.appendChild(name);
            trainerCard.appendChild(description);

            pokedexGrid.appendChild(trainerCard);
        }

    } catch (error) {
        console.error('Error loading trainers:', error);
        pokedexGrid.innerHTML = '<p>Failed to load trainers data. Please try again later.</p>';
    }
});