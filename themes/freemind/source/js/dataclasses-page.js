
  document.getElementById('category-search').addEventListener('input', function(e) {
    const searchVal = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cards = document.querySelectorAll('.dataclass-col');
    cards.forEach(card => {
      const title = card.getAttribute('data-name').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (title.includes(searchVal)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
