
  function renderTags(tags) {
    if (!tags || !Array.isArray(tags) || tags.length === 0) return '';
    const emojiMap = {
      'ia': '🤖',
      'santé': '🏥',
      'gouvernement': '🏛️',
      'éducation': '🎓',
      'finance': '💼',
      'télécom': '📞'
    };
    return tags.map(tag => {
      const emoji = emojiMap[tag.toLowerCase()] || '🏷️';
      return `<span class="tag-badge tag-${tag.toLowerCase()}">${emoji} ${tag}</span>`;
    }).join(' ');
  }

  function confirmShowLink(event, index) {
    event.preventDefault();
    const userConfirmed = confirm("Ce lien mène vers un contenu NSFW. Êtes-vous sûr de vouloir l'afficher ?");
    if (userConfirmed) {
      const link = document.querySelector(`a[data-nsfw-id="` + index + `"]`);
      if (link) link.classList.remove('hidden');
      event.target.style.display = 'none';
      if(event.target.parentElement.querySelector('p')) {
          event.target.parentElement.querySelector('p').style.display = 'none';
      }
    }
  }

  function confirmShowExternalLink(event) {
    event.preventDefault();
    const userConfirmed = confirm("Ce lien mène vers un contenu NSFW. Êtes-vous sûr de vouloir l'ouvrir ?");
    if (userConfirmed) {
      const link = event.target.nextElementSibling;
      if (link) link.classList.remove('hidden');
      event.target.style.display = 'none';
    }
  }

  // Délégation d'événements (évite les handlers inline, requis par la CSP stricte)
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('.show-nsfw-link');
    if (!btn) return;
    if (btn.dataset.nsfwIndex !== undefined) {
      confirmShowLink(event, btn.dataset.nsfwIndex);
    } else if (btn.hasAttribute('data-show-external')) {
      confirmShowExternalLink(event);
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('fuites-container');
    const params = new URLSearchParams(window.location.search);
    const breachId = params.get('id');

    container.addEventListener('change', (e) => {
      if (e.target && e.target.id === 'fuites-sort') {
        currentSort = e.target.value;
        renderList(sortBreaches(allBreaches, currentSort));
      }
    });

    const dataUrl = '/data/breaches.json';

    fetch(dataUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        // Filtrage
        const filtered = data.breaches.filter(item => {
          if (!item || item.IsRetired) return false;
          const name = (item.Name || item.Title || item.slug || '').toLowerCase();
          return !name.includes('cve');
        });

        // Dedoublonnage : meme titre normalise = meme incident.
        // On garde la fiche la plus complete (description + nb de victimes).
        const normTitle = (t) => (t || '').toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,!?:;-–—_]/g, '');
        const score = (x) => (x.Description ? x.Description.length : 0) + (x.PwnCount || 0);
        const seen = new Map();
        const breaches = [];
        let dupCount = 0;
        filtered.forEach(item => {
          const k = normTitle(item.Title || item.Name || item.slug);
          if (!k) { breaches.push(item); return; }
          const prev = seen.get(k);
          if (!prev) { seen.set(k, item); breaches.push(item); return; }
          dupCount++;
          if (score(item) > score(prev)) {
            seen.set(k, item);
            const i = breaches.indexOf(prev);
            if (i !== -1) breaches[i] = item;
          }
        });
        window.__fuitesDupCount = dupCount;

        allBreaches = breaches;
        const sorted = sortBreaches(allBreaches, currentSort);

        if (breachId !== null) {
          const currentIndex = sorted.findIndex(b => b.index == breachId );
          if (currentIndex !== -1) {
            renderDetails(sorted, currentIndex);
          } else {
            renderList(sorted);
          }
        } else {
          renderList(sorted);
        }
      })
      .catch(error => {
        container.innerHTML = `<div class="breach-details">
          <div class="nsfw-warning">
            <h2>Erreur</h2>
            <p>Impossible de charger le fichier de données des fuites. Veuillez vérifier que le fichier <code>source/_data/breaches.json</code> existe et est accessible.</p>
            <p>Détail de l'erreur: ${error}</p>
          </div>
        </div>`;
      });

    const SEVERITY_ORDER = { 'CRITIQUE': 4, 'ÉLEVÉ': 3, 'MODÉRÉ': 2, 'FAIBLE': 1 };
    let allBreaches = [];
    let currentSort = 'date-desc';

    const nameOf = (x) => (x.Name || x.Title || x.slug || '').toLowerCase();
    const byDateDesc = (a, b) => new Date(b.BreachDate || 0) - new Date(a.BreachDate || 0) || nameOf(a).localeCompare(nameOf(b), 'fr');

    function sortBreaches(list, mode) {
      const arr = list.slice();
      switch (mode) {
        case 'date-asc': arr.sort((a, b) => -byDateDesc(a, b)); break;
        case 'name-asc': arr.sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'fr')); break;
        case 'pwn-desc': arr.sort((a, b) => (b.PwnCount || 0) - (a.PwnCount || 0) || byDateDesc(a, b)); break;
        case 'severity-desc': arr.sort((a, b) => (SEVERITY_ORDER[b.SeverityLevel] || 0) - (SEVERITY_ORDER[a.SeverityLevel] || 0) || byDateDesc(a, b)); break;
        default: arr.sort(byDateDesc); // date-desc
      }
      return arr;
    }

    function renderList(breaches) {
      let html = `
        <div class="fuites-header">
          <h1>Liste des Fuites de Données</h1>
          <p style="color: var(--text-secondary)">Total : ${breaches.length} incidents recensés${window.__fuitesDupCount ? ` (${window.__fuitesDupCount} doublon${window.__fuitesDupCount > 1 ? 's' : ''} retiré${window.__fuitesDupCount > 1 ? 's' : ''})` : ''}</p>
          <label style="color: var(--text-secondary); font-size: 0.9em;">Trier par :
            <select id="fuites-sort" style="margin-left: 6px; background: var(--bg-secondary, #161c36); color: inherit; border: 1px solid #3a4470; border-radius: 6px; padding: 4px 8px;">
              <option value="date-desc">Date (récent → ancien)</option>
              <option value="date-asc">Date (ancien → récent)</option>
              <option value="name-asc">Nom (A → Z)</option>
              <option value="pwn-desc">Victimes (décroissant)</option>
              <option value="severity-desc">Sévérité (critique d'abord)</option>
            </select>
          </label>
        </div>
        <div class="fuite-grid">
      `;
      
      if (!breaches || breaches.length === 0) {
        container.innerHTML = '<div class="fuites-header"><h1>Liste des Fuites</h1><p>Aucune fuite trouvée.</p></div>';
        return;
      }

      html += breaches.map((breach) => {
        const NEW_PERIOD_DAYS = 7;
        const now = new Date();
        const addedDate = new Date(breach.AddedDate || breach.BreachDate);
        const msLeft = (addedDate.getTime() + (NEW_PERIOD_DAYS * 24 * 60 * 60 * 1000)) - now.getTime();
        const isRecentlyAdded = msLeft > 0;
        
        let newBadgeHtml = '';
        if (isRecentlyAdded) {
          const dLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
          const hLeft = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const mLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
          newBadgeHtml = `<span class="severity-badge" style="background-color: rgba(40, 167, 69, 0.2); color: #75b798; border: 1px solid rgba(40, 167, 69, 0.4);" title="Encore ${dLeft}j ${hLeft}h ${mLeft}m">NOUVEAU (${dLeft}j ${hLeft}h ${mLeft}m)</span>`;
        }

        let contentHtml = '';
        if (breach.isNSFW) {
          contentHtml = `
            <div class="nsfw-warning">
              <h3>⚠️ Contenu NSFW</h3>
              <p>Ce lien peut contenir du contenu sensible.</p>
              <button data-nsfw-index="${breach.index}" class="show-nsfw-link">Révéler la fuite</button>
              <a href="/fuites?id=${breach.index}" data-nsfw-id="${breach.index}" class="title-link hidden">${breach.Title || breach.Name}</a>
            </div>
          `;
        } else {
          contentHtml = `<a href="/fuites?id=${breach.index}" class="title-link">${breach.Title || breach.Name}</a>`;
        }

        let classesHtml = '';
        if (breach.DataClasses && breach.DataClasses.length > 0) {
          const displayClasses = breach.DataClasses.slice(0, 5);
          const extra = breach.DataClasses.length > 5 ? `<span class="data-class">+${breach.DataClasses.length - 5}</span>` : '';
          classesHtml = `
            <div class="data-classes">
              ${displayClasses.map(item => `<span class="data-class">${item}</span>`).join('')}
              ${extra}
            </div>
          `;
        }

        return `
          <div class="fuite-card ${breach.isBlocked ? 'blocked-card' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5em;">
              ${breach.isBlocked ? `<span class="severity-badge" style="background-color: #450a0a; color: #fecaca; border: 1px solid #991b1b; margin-bottom: 0;">DOMAINE BLOQUÉ</span>` : '<span></span>'}
              ${newBadgeHtml}
            </div>
            ${contentHtml}
            <div class="date">${new Date(breach.BreachDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            ${breach.SeverityLevel ? `<span class="severity-badge severity-${breach.SeverityLevel.toLowerCase()}">${breach.SeverityLevel}</span>` : ''}
            ${renderTags(breach.tags)}
            ${classesHtml}
          </div>
        `;
      }).join('');
      
      html += '</div>';
      container.innerHTML = html;
      const sel = document.getElementById('fuites-sort');
      if (sel) sel.value = currentSort;
    }

    function renderDetails(breaches, currentIndex) {
      const breach = breaches[currentIndex];
      const prevBreach = breaches[currentIndex - 1];
      const nextBreach = breaches[currentIndex + 1];

      let html = `
        <div class="breach-details">
          <div class="breach-header">
            <h1>${breach.Title || breach.Name}</h1>
            ${renderTags(breach.tags)}
            ${breach.isBlocked ? `
              <div class="nsfw-warning" style="margin-top: 15px; background-color: #450a0a; border-color: #991b1b;">
                <h2 style="color: #fecaca;">⚠️ Attention : Domaine bloqué ou indésirable</h2>
                <p style="color: #fecaca;">Ce domaine (<strong>${breach.Domain}</strong>) est répertorié comme potentiellement malveillant ou indésirable.</p>
                ${breach.blockedNote ? `<p style="color: #fecaca;"><strong>Notes :</strong> ${breach.blockedNote}</p>` : ''}
              </div>
            ` : ''}
            ${breach.isNSFW ? `
              <div class="nsfw-warning" style="margin-top: 15px;">
                <h2>⚠️ Attention : Contenu potentiellement inadapté (NSFW)</h2>
              </div>
            ` : ''}
            ${breach.SeverityLevel ? `<span class="severity-badge severity-${breach.SeverityLevel.toLowerCase()}">${breach.SeverityLevel}</span>` : ''}
            
            <div class="breach-meta-grid">
              <div class="meta-item">
                <span class="meta-label">Date de la fuite</span>
                <span class="meta-value">${new Date(breach.BreachDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              
              ${breach.PwnCount > 0 ? `
                <div class="meta-item">
                  <span class="meta-label">Comptes affectés</span>
                  <span class="meta-value">${breach.PwnCount.toLocaleString('fr-FR')}</span>
                </div>
              ` : ''}
              
              ${breach.Domain ? `
                <div class="meta-item">
                  <span class="meta-label">Domaine</span>
                  <span class="meta-value"><a href="http://${breach.Domain}" target="_blank" rel="noopener noreferrer">${breach.Domain}</a></span>
                </div>
              ` : `
                <div class="meta-item">
                  <span class="meta-label">Domaine</span>
                  <span class="meta-value">Non spécifié</span>
                </div>
              `}
            </div>
          </div>
          
          <div class="breach-content">
            <h2>Description</h2>
            <div class="description">${breach.Description ? breach.Description.replace(/\\n/g, "<br/>") : 'Aucune description disponible.'}</div>
            
            ${breach.DataClasses && breach.DataClasses.length > 0 ? `
              <h2>Données compromises</h2>
              <div class="data-classes">
                ${breach.DataClasses.map(item => `<span class="data-class">${item}</span>`).join('')}
              </div>
            ` : ''}
            
            ${breach.lien || breach.path ? `
              <h2>Plus d'informations</h2>
              <p>
                ${breach.isNSFW ? `
                  <button data-show-external class="show-nsfw-link">Afficher le lien externe</button>
                  <a href="${breach.lien || breach.path}" target="_blank" rel="noopener noreferrer" class="hidden">Annonce officielle de la fuite</a>
                ` : `
                  <a href="${breach.lien || breach.path}" target="_blank" rel="noopener noreferrer">Annonce officielle de la fuite</a>
                `}
              </p>
            ` : ''}
          </div>
          
          <div class="nav-buttons">
            ${prevBreach ? `<a href="/fuites?id=${prevBreach.index}" class="nav-btn">&larr; Précédent</a>` : '<span></span>'}
            <a href="/fuites/" class="nav-btn primary">Retour à la liste</a>
            ${nextBreach ? `<a href="/fuites?id=${nextBreach.index}" class="nav-btn">Suivant &rarr;</a>` : '<span></span>'}
          </div>
        </div>
      `;
      container.innerHTML = html;
    }
  });
