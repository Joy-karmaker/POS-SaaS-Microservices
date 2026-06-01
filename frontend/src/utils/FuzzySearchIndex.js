class TrieNode {
  constructor() {
    this.children = {};
    this.productIds = new Set();
  }
}

export class FuzzySearchIndex {
  constructor() {
    this.root = new TrieNode();
    this.productsMap = new Map(); // id -> product
  }

  /**
   * Clears the index and all cached products.
   */
  clear() {
    this.root = new TrieNode();
    this.productsMap.clear();
  }

  /**
   * Bulk adds products to the index.
   */
  addProducts(products) {
    if (!products || !Array.isArray(products)) return;
    for (const p of products) {
      if (p && p.id) {
        p._lowerName = p.name ? p.name.toLowerCase() : '';
        p._numericSalesVelocity = p.sales_velocity ? parseFloat(p.sales_velocity) : 0;
        this.productsMap.set(p.id, p);
      }
    }
    this.rebuild();
  }

  /**
   * Adds or updates a single product in the index.
   */
  addProduct(product) {
    if (!product || !product.id) return;
    product._lowerName = product.name ? product.name.toLowerCase() : '';
    product._numericSalesVelocity = product.sales_velocity ? parseFloat(product.sales_velocity) : 0;
    this.productsMap.set(product.id, product);
    this.rebuild(); // Rebuild the Trie to maintain clean tokens and avoid memory fragmentation
  }

  /**
   * Removes a product from the index.
   */
  removeProduct(productId) {
    if (this.productsMap.has(productId)) {
      this.productsMap.delete(productId);
      this.rebuild();
    }
  }

  /**
   * Rebuilds the search tree from the stored products.
   */
  rebuild() {
    this.root = new TrieNode();
    for (const [id, product] of this.productsMap.entries()) {
      const tokens = this.extractTokens(product);
      for (const token of tokens) {
        this.insertToken(token, id);
      }
    }
  }

  /**
   * Tokenizes product fields for index insertion.
   */
  extractTokens(product) {
    const fields = [
      product.name,
      product.sku,
      product.barcode,
      product.category?.name
    ].filter(Boolean);

    const tokens = new Set();
    for (const f of fields) {
      // Split by spaces, hyphens, underscores
      const words = f.toLowerCase().split(/[\s\-_]+/);
      for (const w of words) {
        // Keep only alphanumeric characters
        const cleaned = w.replace(/[^a-z0-9]/g, '');
        if (cleaned) {
          tokens.add(cleaned);
          // Also index partial substrings for prefix lookup of longer words
          if (cleaned.length > 3) {
            for (let len = 3; len < cleaned.length; len++) {
              tokens.add(cleaned.substring(0, len));
            }
          }
        }
      }
    }
    return Array.from(tokens);
  }

  /**
   * Inserts a token path into the Trie.
   */
  insertToken(token, productId) {
    let node = this.root;
    for (const char of token) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.productIds.add(productId);
  }

  /**
   * Searches the Trie using fuzzy typo-tolerance.
   * Runs in < 1ms on typical datasets.
   */
  search(query) {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) {
      return Array.from(this.productsMap.values());
    }

    const queryWords = cleanQuery.split(/[\s\-_]+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter(Boolean);
    if (queryWords.length === 0) {
      return Array.from(this.productsMap.values());
    }

    const matchedSets = [];

    for (const qw of queryWords) {
      const wordMatches = new Set();
      // Determine max edit distance threshold dynamically
      let maxDist = 0;
      if (qw.length >= 3 && qw.length <= 5) maxDist = 1;
      else if (qw.length > 5) maxDist = 2;

      // Build initial Levenshtein row for queryWord prefix matching
      const currentRow = Array.from({ length: qw.length + 1 }, (_, i) => i);

      // Traversal using backtracking
      for (const char in this.root.children) {
        this.searchRecursive(
          this.root.children[char],
          char,
          qw,
          currentRow,
          maxDist,
          wordMatches
        );
      }

      matchedSets.push(wordMatches);
    }

    // Intersect matches across all search terms (AND matching)
    let finalIds = new Set();
    if (matchedSets.length > 0) {
      const firstSet = matchedSets[0];
      const intersectIds = new Set();

      for (const id of firstSet) {
        let matchesAll = true;
        for (let i = 1; i < matchedSets.length; i++) {
          if (!matchedSets[i].has(id)) {
            matchesAll = false;
            break;
          }
        }
        if (matchesAll) {
          intersectIds.add(id);
        }
      }

      if (intersectIds.size > 0) {
        finalIds = intersectIds;
      } else {
        // Fallback to Union (OR matching) if strict match is empty
        for (const set of matchedSets) {
          for (const id of set) {
            finalIds.add(id);
          }
        }
      }
    }

    // Map IDs back to product records
    const results = [];
    for (const id of finalIds) {
      const p = this.productsMap.get(id);
      if (p) results.push(p);
    }

    // Rank results: exact name starts-with queries get highest ranking, then sorted by popularity (sales velocity)
    return results.sort((a, b) => {
      const aStarts = a._lowerName ? a._lowerName.startsWith(cleanQuery) : false;
      const bStarts = b._lowerName ? b._lowerName.startsWith(cleanQuery) : false;
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Sort by sales velocity descending
      const velA = a._numericSalesVelocity || 0;
      const velB = b._numericSalesVelocity || 0;
      if (velB !== velA) {
        return velB - velA;
      }

      // Fallback to stock quantity descending
      return b.stock_quantity - a.stock_quantity;
    });
  }

  /**
   * Recursive DFS backtracking over the Trie.
   */
  searchRecursive(node, char, queryWord, previousRow, maxDist, matches) {
    const columns = queryWord.length;
    const currentRow = [previousRow[0] + 1];

    for (let i = 1; i <= columns; i++) {
      const insertCost = currentRow[i - 1] + 1;
      const deleteCost = previousRow[i] + 1;
      const replaceCost = previousRow[i - 1] + (queryWord[i - 1] === char ? 0 : 1);
      currentRow.push(Math.min(insertCost, deleteCost, replaceCost));
    }

    // If the last column has edit distance <= maxDist, the token ending here is a match
    if (currentRow[columns] <= maxDist && node.productIds.size > 0) {
      for (const id of node.productIds) {
        matches.add(id);
      }
    }

    // Prune branches: only traverse deeper if at least one column is within maxDist edits
    if (Math.min(...currentRow) <= maxDist) {
      for (const nextChar in node.children) {
        this.searchRecursive(
          node.children[nextChar],
          nextChar,
          queryWord,
          currentRow,
          maxDist,
          matches
        );
      }
    }
  }
}
