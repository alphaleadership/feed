import { JSONFile } from 'lowdb/node'
import { Low } from 'lowdb'
import { BinarySearchTree } from './bst.js'

export class FastDB {
  #db
  #indices = {}
  #filePath
  #defaultData
  #primaryKeys = {}

  constructor(filePath = 'db.json', defaultData = { posts: [] }, options = {}) {
    this.#filePath = filePath
    this.#defaultData = defaultData
    this.#primaryKeys = options.primaryKeys || {}
  }

  /**
   * Initialise la connexion au fichier et construit les index BST
   */
  async init() {
    const adapter = new JSONFile(this.#filePath)
    this.#db = new Low(adapter, this.#defaultData)
    await this.#db.read()
    
    // Si le fichier n'existe pas, lowdb met .data à null ou garde le défaut
    if (this.#db.data === null) {
        this.#db.data = this.#defaultData;
    }

    await this._buildIndices()
    return this
  }

  /**
   * Accès direct aux données (pour compatibilité avec les anciens scripts)
   */
  get data() {
    return this.#db.data
  }

  async _buildIndices() {
    for (const collectionName in this.#db.data) {
      if (Array.isArray(this.#db.data[collectionName])) {
        this.#indices[collectionName] = new BinarySearchTree()
        const pk = this.#primaryKeys[collectionName] || 'id'
        for (const item of this.#db.data[collectionName]) {
          if (item && item[pk] !== undefined) {
            this.#indices[collectionName].insert(item[pk], item)
          }
        }
      }
    }
  }

  /**
   * Récupère les données d'une collection avec pagination
   */
  async getAll(collection, { page = 1, pageSize = 10, filter = null } = {}) {
    await this.#db.read()
    let data = this.#db.data[collection] || []
    
    if (filter) {
      data = data.filter(filter)
    }

    if (page === null) return data; // Retourne tout si page est null

    const start = (page - 1) * pageSize
    const end = start + pageSize
    return {
      items: data.slice(start, end),
      total: data.length,
      page,
      pageSize
    }
  }

  /**
   * Recherche ultra-rapide via l'index BST (O(log n))
   */
  async findById(collection, id) {
    if (this.#indices[collection]) {
      return this.#indices[collection].find(id)
    }
    await this.#db.read()
    const pk = this.#primaryKeys[collection] || 'id'
    return this.#db.data[collection]?.find(item => item[pk] === id)
  }

  /**
   * Ajoute un élément et met à jour l'index
   */
  async create(collection, item) {
    await this.#db.read()
    if (!this.#db.data[collection]) {
      this.#db.data[collection] = []
      this.#indices[collection] = new BinarySearchTree()
    }
    
    const pk = this.#primaryKeys[collection] || 'id'
    const newItem = { ...item }
    
    if (newItem[pk] === undefined && pk === 'id') {
      newItem.id = Date.now().toString() + Math.random().toString(36).substr(2, 5)
    }
    
    this.#db.data[collection].push(newItem)
    
    // Mise à jour de l'index BST
    if (newItem[pk] !== undefined) {
      this.#indices[collection].insert(newItem[pk], newItem)
    }
    
    await this.#db.write()
    return newItem
  }

  /**
   * Met à jour un élément et synchronise l'index
   */
  async update(collection, id, updates) {
    await this.#db.read()
    const pk = this.#primaryKeys[collection] || 'id'
    const index = this.#db.data[collection]?.findIndex(item => item[pk] === id)
    
    if (index !== -1 && index !== undefined) {
      const updatedItem = { ...this.#db.data[collection][index], ...updates }
      this.#db.data[collection][index] = updatedItem
      
      // Mise à jour de l'index (Suppression + Insertion)
      this.#indices[collection]?.remove(id)
      this.#indices[collection]?.insert(id, updatedItem)
      
      await this.#db.write()
      return updatedItem
    }
    return null
  }

  /**
   * Supprime un élément et nettoie l'index
   */
  async delete(collection, id) {
    await this.#db.read()
    const pk = this.#primaryKeys[collection] || 'id'
    const index = this.#db.data[collection]?.findIndex(item => item[pk] === id)
    
    if (index !== -1 && index !== undefined) {
      const deleted = this.#db.data[collection].splice(index, 1)
      
      // Suppression de l'index BST
      this.#indices[collection]?.remove(id)
      
      await this.#db.write()
      return deleted[0]
    }
    return null
  }

  /**
   * Sauvegarde manuelle (utile pour les opérations en masse sur .data)
   */
  async save() {
    await this.#db.write()
    await this.refreshIndices()
  }

  /**
   * Force la reconstruction des index (utile si le fichier JSON a été modifié manuellement)
   */
  async refreshIndices() {
    await this._buildIndices()
  }
}
