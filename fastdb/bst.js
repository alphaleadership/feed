class Node {
  constructor(key, value) {
    this.key = key
    this.value = value
    this.left = null
    this.right = null
  }
}

export class BinarySearchTree {
  constructor() {
    this.root = null
  }

  insert(key, value) {
    const newNode = new Node(key, value)
    if (!this.root) {
      this.root = newNode
      return
    }
    this._insertNode(this.root, newNode)
  }

  _insertNode(node, newNode) {
    if (newNode.key < node.key) {
      if (!node.left) node.left = newNode
      else this._insertNode(node.left, newNode)
    } else {
      if (!node.right) node.right = newNode
      else this._insertNode(node.right, newNode)
    }
  }

  find(key) {
    return this._findNode(this.root, key)
  }

  _findNode(node, key) {
    if (!node) return null
    if (key < node.key) return this._findNode(node.left, key)
    if (key > node.key) return this._findNode(node.right, key)
    return node.value
  }

  // Pour la suppression et le rééquilibrage (optionnel pour un index simple, mais crucial pour la performance réelle)
  remove(key) {
    this.root = this._removeNode(this.root, key)
  }

  _removeNode(node, key) {
    if (!node) return null
    if (key < node.key) {
      node.left = this._removeNode(node.left, key)
      return node
    } else if (key > node.key) {
      node.right = this._removeNode(node.right, key)
      return node
    } else {
      if (!node.left && !node.right) return null
      if (!node.left) return node.right
      if (!node.right) return node.left
      
      const aux = this._findMinNode(node.right)
      node.key = aux.key
      node.value = aux.value
      node.right = this._removeNode(node.right, aux.key)
      return node
    }
  }

  _findMinNode(node) {
    if (!node.left) return node
    return this._findMinNode(node.left)
  }

  // Retourne les données triées (utile pour la pagination)
  toArray() {
    const result = []
    this._inOrder(this.root, result)
    return result
  }

  _inOrder(node, result) {
    if (node) {
      this._inOrder(node.left, result)
      result.push(node.value)
      this._inOrder(node.right, result)
    }
  }
}
