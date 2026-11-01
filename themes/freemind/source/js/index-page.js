const SITE_CONFIG = JSON.parse(document.getElementById('site-config').textContent);
const SITE_URL = SITE_CONFIG.url;

		// Utilitaires de formatage
		const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(n);
		const formatPwnCount = (count) => {
			if (count >= 1000000000) return (count / 1000000000).toFixed(2) + 'Md';
			if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
			if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
			return count.toString();
		};
		const pluralize = (count, singular, plural) => Math.abs(count) > 1 ? plural : singular;

		// Charger et analyser les données
		fetch(' + SITE_URL + '/data/breaches.json')
			.then(response => response.json())
			.then(data => {
				if (!data.breaches || !Array.isArray(data.breaches)) {
					console.error('Format de données invalide');
					return;
				}

				// Filtrer les fuites valides
				const breaches = data.breaches.filter(b => b && !b.IsRetired && b.Name);
				const now = new Date();
				const currentYear = now.getFullYear();
				const lastYear = currentYear - 1;

				// ============ STATISTIQUES GLOBALES ============
				let totalPwnCount = 0;
				let verifiedCount = 0;
				let sensitiveCount = 0;
				let currentYearCount = 0;
				let lastYearCount = 0;
				let currentYearPwnCount = 0;
				let lastYearPwnCount = 0;

				breaches.forEach(breach => {
					const pwnCount = Number(breach.PwnCount) || 0;
					totalPwnCount += pwnCount;
					if (breach.IsVerified) verifiedCount++;
					if (breach.IsSensitive) sensitiveCount++;

					const breachYear = new Date(breach.BreachDate).getFullYear();
					if (breachYear === currentYear) {
						currentYearCount++;
						currentYearPwnCount += pwnCount;
					}
					if (breachYear === lastYear) {
						lastYearCount++;
						lastYearPwnCount += pwnCount;
					}
				});

				// Afficher statistiques globales
				const globalStats = `
					<div class="col-md-6 col-lg-3 mb-3">
						<div style="background: rgba(56, 189, 248, 0.1); border-left: 4px solid #38bdf8; padding: 15px; border-radius: 8px;">
							<div style="font-size: 0.85em; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px;">Total fuites</div>
							<div style="font-size: 2em; font-weight: bold; color: #38bdf8;">${formatNumber(breaches.length)}</div>
							<div style="font-size: 0.75em; color: #6b7280; margin-top: 5px;">répertoriées</div>
						</div>
					</div>
					<div class="col-md-6 col-lg-3 mb-3">
						<div style="background: rgba(249, 115, 22, 0.1); border-left: 4px solid #f97316; padding: 15px; border-radius: 8px;">
							<div style="font-size: 0.85em; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px;">Comptes compromis</div>
							<div style="font-size: 2em; font-weight: bold; color: #f97316;">${formatPwnCount(totalPwnCount)}</div>
							<div style="font-size: 0.75em; color: #6b7280; margin-top: 5px;">au total</div>
						</div>
					</div>
					<div class="col-md-6 col-lg-3 mb-3">
						<div style="background: rgba(74, 222, 128, 0.1); border-left: 4px solid #4ade80; padding: 15px; border-radius: 8px;">
							<div style="font-size: 0.85em; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px;">Année ${currentYear}</div>
							<div style="font-size: 2em; font-weight: bold; color: #4ade80;">${formatNumber(currentYearCount)}</div>
							<div style="font-size: 0.75em; color: #6b7280; margin-top: 5px;">fuites en ${currentYear}</div>
						</div>
					</div>
					<div class="col-md-6 col-lg-3 mb-3">
						<div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 15px; border-radius: 8px;">
							<div style="font-size: 0.85em; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px;">Vérifiées</div>
							<div style="font-size: 2em; font-weight: bold; color: #ef4444;">${formatNumber(verifiedCount)}</div>
							<div style="font-size: 0.75em; color: #6b7280; margin-top: 5px;">(${(verifiedCount / breaches.length * 100).toFixed(1)}%)</div>
						</div>
					</div>
				`;
				document.getElementById('global-stats-container').innerHTML = globalStats;

				// ============ FUITES CRITIQUES ============
				const criticalBreaches = breaches
					.filter(breach => breach.IsCritical)
					.sort((a, b) => new Date(b.BreachDate) - new Date(a.BreachDate))
					.slice(0, 5);

				if (criticalBreaches.length > 0) {
					const criticalHtml = `
						<div class="row">
							${criticalBreaches.map((breach, idx) => {
								const date = new Date(breach.BreachDate);
								const formattedDate = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
								const pwnDisplay = formatPwnCount(breach.PwnCount || 0);
								const dataClasses = breach.DataClasses || [];
								const dataClassesDisplay = dataClasses.length > 0 
									? dataClasses.slice(0, 3).join(', ') + (dataClasses.length > 3 ? '...' : '')
									: 'Données non spécifiées';

								return `
									<div class="col-md-6 col-lg-4 mb-3">
										<div class="card h-100" style="background: linear-gradient(145deg, #7f1d1d 0%, #5f0f0f 100%); border: 2px solid #dc2626;">
											<div class="card-body">
												<div class="d-flex justify-content-between align-items-start mb-2">
													<span class="badge bg-danger fs-6">#${idx + 1}</span>
													<span class="badge bg-dark" style="font-size: 0.7em;">
														<i class="fa fa-calendar me-1"></i>${formattedDate}
													</span>
												</div>
												<h5 class="card-title mb-2" style="color: #fca5a5;">
													<i class="fa fa-exclamation-triangle me-2"></i>${breach.Title || breach.Name}
												</h5>
												<p class="mb-2" style="color: #fecaca; font-size: 0.9rem;">
													<i class="fa fa-users me-2"></i><strong>${pwnDisplay}</strong> comptes compromis
												</p>
												<p class="mb-3" style="color: #fecaca; font-size: 0.85rem;">
													<i class="fa fa-database me-2"></i>${dataClassesDisplay}
												</p>
												<a href="<%- config.url %>/fuites?id=${breach.index}" class="btn btn-sm btn-danger w-100">
													<i class="fa fa-eye me-1"></i>Détails
												</a>
											</div>
										</div>
									</div>
								`;
							}).join('')}
						</div>
					`;
					document.getElementById('critical-breaches-container').innerHTML = criticalHtml;
				}

				// ============ TYPES DE DONNÉES ============
				const dataClassStats = {};
				breaches.forEach(breach => {
					if (breach.DataClasses && Array.isArray(breach.DataClasses)) {
						breach.DataClasses.forEach(dataClass => {
							if (!dataClassStats[dataClass]) {
								dataClassStats[dataClass] = { name: dataClass, count: 0, pwnCount: 0 };
							}
							dataClassStats[dataClass].count++;
							dataClassStats[dataClass].pwnCount += Number(breach.PwnCount) || 0;
						});
					}
				});

				const dataClassArray = Object.values(dataClassStats)
					.sort((a, b) => b.count - a.count)
					.slice(0, 12);

				const maxDataClassCount = dataClassArray[0]?.count || 1;
				const dataClassHtml = `
					<div class="row">
						${dataClassArray.map((item, idx) => {
							const percentage = (item.count / maxDataClassCount * 100);
							return `
								<div class="col-md-6 col-lg-4 mb-3">
									<div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 15px;">
										<div class="mb-2">
											<span style="color: #a7f3d0; font-weight: bold;">${idx + 1}. ${item.name}</span>
											<span style="float: right; background: rgba(16, 185, 129, 0.3); color: #a7f3d0; padding: 3px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold;">
												${item.count}
											</span>
										</div>
										<div style="color: #cbd5e1; font-size: 0.9em; margin-bottom: 8px;">
											${formatPwnCount(item.pwnCount)} comptes
										</div>
										<div style="width: 100%; background: rgba(0,0,0,0.3); border-radius: 4px; height: 6px; overflow: hidden;">
											<div style="width: ${percentage}%; background: linear-gradient(90deg, #10b981, #34d399); height: 100%; border-radius: 4px;"></div>
										</div>
									</div>
								</div>
							`;
						}).join('')}
					</div>
				`;
				document.getElementById('dataclass-container').innerHTML = dataClassHtml;

				// ============ ENTREPRISES TOUCHÉES ============
				const companyStats = {};
				breaches.forEach(breach => {
					const company = breach.Name || 'Inconnu';
					if (!companyStats[company]) {
						companyStats[company] = { name: company, count: 1, pwnCount: Number(breach.PwnCount) || 0 };
					} else {
						companyStats[company].count++;
						companyStats[company].pwnCount += Number(breach.PwnCount) || 0;
					}
				});

				const companyArray = Object.values(companyStats)
					.sort((a, b) => b.pwnCount - a.pwnCount)
					.slice(0, 12);

				const maxCompanyPwnCount = companyArray[0]?.pwnCount || 1;
				const companyHtml = `
					<div class="row">
						${companyArray.map((company, idx) => {
							const medals = ['🥇', '🥈', '🥉'];
							const medal = idx < 3 ? medals[idx] : '';
							const percentage = (company.pwnCount / maxCompanyPwnCount * 100);
							return `
								<div class="col-md-6 col-lg-4 mb-3">
									<div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 15px; position: relative;">
										${medal ? '<div style="position: absolute; top: 10px; right: 10px; font-size: 1.5em;">' + medal + '</div>' : ''}
										<div style="color: #93c5fd; font-weight: bold; margin-bottom: 8px; word-break: break-word; padding-right: 30px;">
											${company.name}
										</div>
										<div style="font-size: 0.85em; color: #cbd5e1; margin-bottom: 6px;">
											<i class="fa fa-shield"></i> ${company.count} ${pluralize(company.count, 'fuite', 'fuites')}
										</div>
										<div style="font-size: 0.85em; color: #cbd5e1; margin-bottom: 10px;">
											<i class="fa fa-users"></i> ${formatPwnCount(company.pwnCount)}
										</div>
										<div style="width: 100%; background: rgba(0,0,0,0.3); border-radius: 4px; height: 4px; overflow: hidden;">
											<div style="width: ${percentage}%; background: linear-gradient(90deg, #3b82f6, #60a5fa); height: 100%; border-radius: 4px;"></div>
										</div>
									</div>
								</div>
							`;
						}).join('')}
					</div>
				`;
				document.getElementById('company-container').innerHTML = companyHtml;

				// ============ ENTREPRISES PAR NOMBRE DE FUITES ============
				const companiesByCount = Object.values(companyStats)
					.sort((a, b) => b.count - a.count)
					.slice(0, 15);

				document.getElementById('breach-count').textContent = `${companiesByCount.length} entreprises répertoriées`;

				const categoryHtml = `
					<div class="row">
						${companiesByCount.map((company, idx) => `
							<div class="col-md-6 col-lg-4 mb-3">
								<div style="background: linear-gradient(135deg, #2e3192 0%, #1a1a3e 100%); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 15px;">
									<div class="mb-2">
										<div style="color: #d8b4fe; font-weight: bold; margin-bottom: 4px;">
											${idx + 1}. ${company.name}
										</div>
										<span style="background: rgba(139, 92, 246, 0.3); color: #d8b4fe; padding: 4px 8px; border-radius: 12px; font-size: 0.75em; font-weight: bold; display: inline-block;">
											${company.count} fuites
										</span>
									</div>
									<div style="color: #cbd5e1; font-size: 0.85em;">
										${formatPwnCount(company.pwnCount)} comptes compromis
									</div>
								</div>
							</div>
						`).join('')}
					</div>
				`;
				document.getElementById('category-container').innerHTML = categoryHtml;

				console.log('✅ Toutes les statistiques générées avec succès');
			})
			.catch(error => {
				console.error('❌ Erreur lors du chargement des données:', error);
				document.getElementById('global-stats-container').innerHTML = `
					<div class="col-12">
						<div class="alert alert-danger">
							<i class="fa fa-exclamation-circle"></i> Erreur lors du chargement des statistiques. Veuillez rafraîchir la page.
						</div>
					</div>
				`;
			});
	