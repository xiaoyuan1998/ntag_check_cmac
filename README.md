# Validateur NTAG CMAC

Application web pour la validation des URL NTAG CMAC, développée avec Next.js et TypeScript.

## Fonctionnalités

- ✨ Validation des URL NTAG avec vérification CMAC
- 📝 Affichage détaillé du processus de validation
- 🔍 Visualisation des étapes de calcul CMAC
- 🌐 Interface utilisateur moderne et réactive
- 🇫🇷 Interface entièrement en français

## Prérequis

- Node.js (version 18 ou supérieure)
- npm (gestionnaire de paquets Node.js)

## Installation

1. Clonez le dépôt :
```bash
git clone https://github.com/xiaoyuan1998/ntag_check_cmac.git
cd ntag_check_cmac
```

2. Installez les dépendances :
```bash
npm install
```

## Utilisation

### Mode Développement

Pour lancer l'application en mode développement :
```bash
npm run dev
```
L'application sera accessible à l'adresse : http://localhost:3000

### Mode Production

1. Construisez l'application :
```bash
npm run build
```

2. Démarrez le serveur de production :
```bash
npm start
```
L'application sera accessible à l'adresse : http://localhost:3000

## Structure du Projet

- `/app` - Code source principal de l'application
  - `/api` - Points d'accès API pour la validation
  - `/config` - Fichiers de configuration (clés, etc.)
  - `/components` - Composants réutilisables
  - `page.tsx` - Page d'accueil
  - `verify/page.tsx` - Page de résultats de validation

## Fonctionnement

1. L'utilisateur entre une URL NTAG à valider
2. L'application extrait les paramètres de l'URL (UID, CTR, CMAC)
3. Le système effectue les calculs de validation :
   - Conversion du CTR
   - Construction de SV2
   - Calcul HMAC
   - Calcul SDMMAC
4. Le résultat de la validation est affiché avec les détails du processus

## Sécurité

- La clé maître est stockée de manière sécurisée dans un fichier de configuration
- Les calculs sensibles sont effectués côté serveur
- Les erreurs sont gérées de manière sécurisée

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
