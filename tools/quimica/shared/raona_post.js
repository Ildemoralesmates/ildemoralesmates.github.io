/* Passa els textos genèrics del motor (quiz.js + raona.js) al diccionari T d'aquesta pàgina; els de cada sim manen */
(function(){const d=I18N[LANG==='es'?'es':'ca'];Object.keys(d).forEach(k=>{if(!(k in T))T[k]=d[k];});
  $$('[data-i18n]').forEach(e=>{e.innerHTML=t(e.dataset.i18n);});
  $$('[data-i18n-aria]').forEach(e=>{e.setAttribute('aria-label',t(e.dataset.i18nAria));});})();
