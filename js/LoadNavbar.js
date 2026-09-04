document.addEventListener('DOMContentLoaded', () => {
    fetch('Navbar.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.text();
        })
        .then(html => {
            document.getElementById('navbar-placeholder').innerHTML = html;
            markCurrentPage();
            if (window.languageManager) {
                window.languageManager.setupLanguageButtons();
                window.languageManager.retranslatePage();
            }
        })
        .catch(error => {
            console.error('Error loading navbar:', error);
            document.getElementById('navbar-placeholder').innerHTML = '<p>Error loading navbar</p>';
        });
});

// Souligne l'entrée correspondant à la page affichée. PokemonSearch.html sert
// aussi de fiche détaillée : elle reste donc sous « Recherche ».
function markCurrentPage() {
    const path = window.location.pathname;
    const page = (path.substring(path.lastIndexOf('/') + 1) || 'index.html').toLowerCase();

    document.querySelectorAll('.navbar-links a').forEach(link => {
        if (link.getAttribute('href').toLowerCase() === page) {
            link.setAttribute('aria-current', 'page');
        }
    });
}