/*
Thème clair / sombre.

À charger dans <head>, en script bloquant : le thème doit être posé sur <html>
avant le premier rendu, sinon la page clignote en clair avant de passer en sombre.

Une page déclare `data-themable` sur <html> pour proposer la bascule. Les pages
pas encore refondues ne la déclarent pas : elles restent en sombre et le bouton
est masqué (css/styles_navbar.css), car leur mise en page ne supporte pas encore
le thème clair. À retirer une fois toutes les pages reprises.
*/

(function () {
    const STORAGE_KEY = 'theme';
    const root = document.documentElement;

    function systemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function isThemable() {
        return root.hasAttribute('data-themable');
    }

    function currentTheme() {
        return root.getAttribute('data-theme') || systemTheme();
    }

    function apply(theme) {
        root.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
    }

    // Choix mémorisé, sinon préférence du système. Le thème est toujours résolu
    // explicitement : les règles en :not([data-theme="dark"]) gardent ainsi le
    // sens « clair » même quand l'utilisateur n'a jamais choisi.
    let stored = null;
    try {
        stored = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        // Navigation privée ou stockage refusé : on se rabat sur le système.
    }
    apply(isThemable() ? (stored || systemTheme()) : 'dark');

    // Délégation : le bouton arrive avec la navbar, injectée plus tard.
    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-theme-toggle]');
        if (!button || !isThemable()) return;

        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        apply(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch (error) {
            // Sans stockage, le choix ne vaut que pour la page en cours.
        }
    });

    window.themeManager = { apply, currentTheme };
})();
