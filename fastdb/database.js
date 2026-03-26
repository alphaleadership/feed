import { JSONFilePreset } from 'lowdb/node'
import { BinarySearchTree } from './bst.js'

export class FastDB {
  #db
  #indices = {}
  #filePath
  #defaultData

  constructor(filePath = 'db.json', defaultData = { posts: [] }) {
    this.#filePath = filePath
    this.#defaultData = defaultData
  }

  /**
   * Initialise la connexion au fichier et construit les index BST
   */
  async init() {
    this.#db = await JSONFilePreset(this.#filePath, this.#defaultData)
    await this._buildIndices()
    return this
  }

  async _buildIndices() {
    for (const collectionName in this.#db.data) {
      if (Array.isArray(this.#db.data[collectionName])) {
        this.#indices[collectionName] = new BinarySearchTree()
        for (const item of this.#db.data[collectionName]) {
          this.#indices[collectionName].insert(item.id, item)
        }
      }
    }
  }

  /**
   * Récupère les données d'une collection avec pagination
   */
  async getAll(collection, { page = 1, pageSize = 10 } = {}) {
    await this.#db.read()
    const data = this.#db.data[collection] || []
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
    return this.#db.data[collection]?.find(item => item.id === id)
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
    
    const newItem = { 
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5), 
      ...item 
    }
    this.#db.data[collection].push(newItem)
    
    // Mise à jour de l'index BST
    this.#indices[collection].insert(newItem.id, newItem)
    
    await this.#db.write()
    return newItem
  }

  /**
   * Met à jour un élément et synchronise l'index
   */
  async update(collection, id, updates) {
    await this.#db.read()
    const index = this.#db.data[collection]?.findIndex(item => item.id === id)
    if (index !== -1 && index !== undefined) {
      const updatedItem = { ...this.#db.data[collection][index], ...updates }
      this.#db.data[collection][index] = updatedItem
      
      // Mise à jour de l'index (Suppression + Insertion)
      this.#indices[collection].remove(id)
      this.#indices[collection].insert(id, updatedItem)
      
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
    const index = this.#db.data[collection]?.findIndex(item => item.id === id)
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
   * Force la reconstruction des index (utile si le fichier JSON a été modifié manuellement)
   */
  async refreshIndices() {
    await this._buildIndices()
  }
}
