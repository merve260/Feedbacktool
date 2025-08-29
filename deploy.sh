#!/bin/bash
set -e  # Script sofort beenden, falls ein Fehler auftritt

# Produktion-Build erstellen
ng build --configuration production

# Deployment zu Firebase Hosting durchführen
firebase deploy --only hosting

