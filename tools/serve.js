/*
Serveur statique local pour prévisualiser le site.

Le site charge ses données par fetch() : ouvrir index.html directement en
file:// est bloqué par le navigateur. Il faut donc le servir en HTTP.

Lancement : `node tools/serve.js` — ou double-clic sur preview.bat.
*/

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PORTS = [8080, 8081, 8082, 8123, 3000];

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ogg': 'audio/ogg',
    '.mp3': 'audio/mpeg',
};

const server = http.createServer((req, res) => {
    let rel;
    try {
        rel = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    } catch {
        res.writeHead(400).end('Requête invalide');
        return;
    }
    if (rel === '/' || rel === '') rel = '/index.html';

    const file = path.resolve(ROOT, '.' + rel);

    // Empêche de sortir du dossier du site via ../
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
        res.writeHead(403).end('Accès refusé');
        return;
    }

    fs.readFile(file, (err, buffer) => {
        if (err) {
            console.log('  404  ' + rel);
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 — fichier introuvable : ' + rel);
            return;
        }
        res.writeHead(200, {
            'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
            // Aucun cache : un simple F5 suffit pour voir les modifications.
            'Cache-Control': 'no-store, must-revalidate',
        });
        res.end(buffer);
    });
});

function listen(index) {
    if (index >= PORTS.length) {
        console.error('Aucun port libre parmi ' + PORTS.join(', ') + '.');
        process.exit(1);
    }
    const port = PORTS[index];

    server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            listen(index + 1);
        } else {
            console.error(err.message);
            process.exit(1);
        }
    });

    server.listen(port, () => {
        const url = 'http://localhost:' + port + '/';
        console.log('');
        console.log('  Pokémon Luck — aperçu local');
        console.log('  ' + url);
        console.log('');
        console.log('  Dossier servi : ' + ROOT);
        console.log('  F5 dans le navigateur recharge les modifications.');
        console.log('  Ctrl+C dans cette fenêtre pour arrêter.');
        console.log('');
        exec('start "" "' + url + '"');
    });
}

listen(0);
