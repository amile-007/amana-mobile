const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Résolution alias @/ → ./ (remplace tsconfig paths à l'exécution)
config.resolver.alias = { '@': '.' }

module.exports = config
