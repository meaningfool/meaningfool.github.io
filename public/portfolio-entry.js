(() => {
  const hasShare = window.location.hash.length > 1;
  document.documentElement.dataset.portfolioState = hasShare ? 'portfolio' : 'not-found';
  document.title = hasShare ? 'Portfolio · Josselin Perrus' : '404 - Page Not Found | meaningfool';
})();
