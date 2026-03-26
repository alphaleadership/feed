import { FastDB } from './database.js'

async function run() {
  // Instanciation de la base de données
  const db = new FastDB('db.json')
  await db.init()

  console.log('--- Utilisation du système de classe FastDB ---')
  
  // Création
  const post = await db.create('posts', { title: 'Nouvelle architecture', content: 'C\'est une classe maintenant !' })
  console.log('Post créé :', post)

  // Recherche via BST (propriété privée de l'instance)
  const found = await db.findById('posts', post.id)
  console.log('Post trouvé via index BST :', found.title)

  // Pagination
  const result = await db.getAll('posts', { page: 1, pageSize: 5 })
  console.log('Nombre total de posts :', result.total)
  console.log('Premier item de la page 1 :', result.items[0].title)

  // Exemple d'une deuxième base de données indépendante
  const logDb = new FastDB('logs.json', { logs: [] })
  await logDb.init()
  await logDb.create('logs', { message: 'Système initialisé', timestamp: new Date() })
  console.log('\n--- Logs.json a été créé indépendamment ---')
}

run().catch(console.error)
