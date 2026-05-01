const { execSync } = require('child_process');

/**
 * Génère un diagramme Mermaid gitGraph à partir de l'historique Git local.
 * @param {Object} options 
 */
function generateGitGraph(options = {}) {
  const limit = options.limit || 20;
  const showAll = options.all ? '--all' : '';
  
  try {
    // On utilise la commande git native pour récupérer l'historique
    // Format : hash | parents | refs | subject
    const cmd = `git log ${showAll} -n ${limit} --pretty=format:"%H|%P|%D|%s" --reverse`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const lines = output.split('\n').filter(Boolean);

    let mermaid = 'gitGraph\n';
    const branchesCreated = new Set(['main', 'master', 'develop']);
    let currentBranch = 'main';

    lines.forEach(line => {
      const [hash, parents, refs, subject] = line.split('|');
      const parentHashes = parents ? parents.split(' ') : [];
      
      // Extraction des références (branches et tags)
      const refList = refs ? refs.split(',').map(r => r.trim()) : [];
      
      // On cherche une branche locale (pas de remote, pas de HEAD)
      const branchRef = refList.find(r => 
        !r.startsWith('tag:') && 
        !r.startsWith('HEAD ->') && 
        !r.includes('/') &&
        r !== ''
      );
      
      const tagRef = refList.find(r => r.startsWith('tag:'))?.replace('tag: ', '');

      // Gestion des Merges
      if (parentHashes.length > 1) {
        // Mermaid gitGraph est limité pour les merges complexes
        // On marque le commit de merge avec un style spécial
        mermaid += `    commit id: "merge-${hash.substring(0, 7)}", type: HIGHLIGHT\n`;
        return;
      }

      // Création de branche si nouvelle
      if (branchRef && !branchesCreated.has(branchRef)) {
        mermaid += `    branch ${branchRef}\n`;
        branchesCreated.add(branchRef);
        currentBranch = branchRef;
      }

      // Changement de branche (checkout)
      if (branchRef && currentBranch !== branchRef) {
        mermaid += `    checkout ${branchRef}\n`;
        currentBranch = branchRef;
      }

      // Ajout du commit
      const tagParam = tagRef ? `, tag: "${tagRef}"` : '';
      mermaid += `    commit id: "${hash.substring(0, 7)}"${tagParam}\n`;
    });

    return mermaid;
  } catch (error) {
    return `// Erreur : Assurez-vous d'être dans un dépôt Git valide.\n// ${error.message}`;
  }
}

// Récupération des arguments CLI
const limitArg = process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1];
const showAll = process.argv.includes('--all');

const result = generateGitGraph({ 
  limit: limitArg ? parseInt(limitArg, 10) : 20,
  all: showAll
});

console.log(result);
