#!/usr/bin/env python3
"""Genera les versions valenciana (<slug>/) i castellana (es/<slug>/) dels quatre simuladors
(Punnett, models atòmics, lleis dels gasos, selecció natural) a partir de tools/simuladors/src/.

Les pàgines duen el text en tots dos idiomes dins d'un diccionari I18N (valencià i castellà) i
el text de cada idioma s'escriu també en l'HTML estàtic perquè Google el indexe.
Cal Playwright (per a llegir el diccionari). Ús:  python3 tools/simuladors/genera.py
NO s'edita mai <slug>/index.html ni es/<slug>/index.html a mà: es canvia src/ i es torna a executar.
Després cal mantindre sitemap.xml (ja té les 8 URLs) i, si cal, la targeta d'index.html.
"""
import re, json, html, subprocess, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parent
OUT=R/'.build'; REPO=R.parent.parent
BASE='https://ildemoralesmates.github.io'
subprocess.run([sys.executable,str(R/'build.py')],check=True,cwd=R,stdout=subprocess.DEVNULL)
MAP={'punnett':'genetica-punnett','atoms':'models-atomics','gasos':'lleis-gasos','seleccio':'seleccio-natural','richter':'escala-richter','ones':'ones-sismiques','decay':'desintegracio-radioactiva','isostasia':'isostasia','engranatges':'engranatges-mcm','rectangles':'mcd-rectangles','zoom':'zoom-recta-decimals','potencies':'potencies-escacs-paper','arrel':'arrel-quadrada-area','rebaixes':'rebaixes-encadenades'}
DESC={'ca':{'gasos':"Simulador cinètic de gas ideal: lleis de Boyle–Mariotte, Charles i Gay-Lussac amb pressió mesurada a partir dels xocs, gràfiques i taula de mesures."},
 'es':{'punnett':"Simulador de genética mendeliana: cuadros de Punnett para uno y dos genes, dominancia completa e incompleta, y simulación de descendientes.",
 'atoms':"Simulador de los modelos atómicos de Thomson, Rutherford y Bohr: dispersión de partículas alfa con fuerza de Coulomb real y saltos electrónicos entre niveles.",
 'gasos':"Simulador cinético de gas ideal: leyes de Boyle–Mariotte, Charles y Gay-Lussac con presión medida a partir de los choques, gráficas y tabla de medidas.",
 'seleccio':"Simulador de selección natural: una población de escarabajos con color heredable, depredadores que ven mejor a los menos camuflados, y generaciones que se adaptan al entorno.",
 'richter':"Escala de Richter: compara dos terremotos y comprueba cómo cada punto de magnitud multiplica la amplitud por 10 y la energía por ≈32. Con sismograma, equivalencias y test autocorregido.",
 'ones':"Ondas sísmicas P y S: trazado de rayos en una Tierra esférica con velocidades tipo PREM, zonas de sombra y cómo deducimos el núcleo líquido. Con test autocorregido.",
 'decay':"Desintegración radiactiva y datación radiométrica: átomos que se desintegran al azar, periodo de semidesintegración y cálculo de la edad de una muestra. Con test autocorregido.",
 'engranatges':"Dos ruedas dentadas con una marca cada una: ¿cuándo vuelven a coincidir? Animación para entender el mínimo común múltiplo (mcm) en 1.º de ESO, con casos predefinidos, números libres, predicción y test autocorregido.",
 'rectangles':"Cubre un rectángulo con las baldosas cuadradas más grandes posible: el máximo común divisor (mcd) a simple vista y el algoritmo de Euclides animado. Para 1.º de ESO, con predicción, casos predefinidos y test autocorregido.",
 'zoom':"Haz zoom en la recta numérica: entre 0,1 y 0,2 aparecen diez marcas, y entre dos de ellas, diez más. Para 1.º de ESO: comparar y ordenar decimales (¿0,15 o 0,2?), con retos y test autocorregido.",
 'potencies':"Potencias de base 2 que crecen hasta salirse de la pantalla: la leyenda del trigo en el tablero de ajedrez y doblar una hoja 42 veces hasta la Luna. Para 1.º de ESO, con predicción y test autocorregido.",
 'arrel':"La raíz cuadrada como el lado de un cuadrado: cambia el área y mira cómo se ajusta el lado. ¿Por qué √50 está entre 7 y 8? Cuadrados perfectos, raíz entera y aproximación por décimas para 1.º de ESO, con reto y test autocorregido.",
 'rebaixes':"Porcentajes encadenados a simple vista: un 20 % y después otro 20 % de rebaja no hacen un 40 %. Modelo de área y barras de precio para 1.º de ESO, con subidas y bajadas, predicción y test autocorregido.",
 'isostasia':"Isostasia: montañas con raíces (modelo de Airy) y rebote glaciar con un manto viscoso. Simulación interactiva con test autocorregido."}}
FOOT={'ca':('Recursos de matemàtiques','deed.ca','Les imatges i materials de tercers conserven la seua pròpia llicència.'),
      'es':('Recursos de matemáticas','deed.es','Las imágenes y materiales de terceros conservan su propia licencia.')}
BACK_CSS=".back{display:inline-block;font:600 .9rem var(--f-num);color:var(--muted);text-decoration:none}\n.back:hover{color:var(--ink);text-decoration:underline}\n.back:focus-visible{outline:3px solid var(--pa);outline-offset:3px;border-radius:4px}\n"
def foot(l):
    n,d,x=FOOT[l]
    return (f'<footer data-cc style="margin:2.5rem auto 1.5rem;padding:0 16px;max-width:60rem;text-align:center;font:12.5px/1.5 system-ui,-apple-system,\'Segoe UI\',sans-serif;opacity:.7;color:inherit">© Ilde · <a href="{BASE}/" style="color:inherit">{n}</a> · <a rel="license" href="https://creativecommons.org/licenses/by-sa/4.0/{d}" style="color:inherit">CC BY-SA 4.0</a> · {x}</footer>')
def prerender(s,I,l):
    d=I[l]; g=lambda k: d.get(k, I['ca'].get(k,k))
    out=s
    out=re.sub(r'(<(\w+)\b[^>]*\sdata-i18n="([^"]+)"[^>]*>)(.*?)(</\2>)',lambda m:m.group(1)+html.escape(g(m.group(3)),quote=False)+m.group(5),out,flags=re.S)
    out=re.sub(r'(<(\w+)\b[^>]*\sdata-i18n-html="([^"]+)"[^>]*>)(.*?)(</\2>)',lambda m:m.group(1)+g(m.group(3))+m.group(5),out,flags=re.S)
    def aria(m):
        tag=m.group(0); k=re.search(r'data-i18n-aria="([^"]+)"',tag).group(1)
        return re.sub(r'aria-label="[^"]*"','aria-label="%s"'%html.escape(g(k)),tag)
    out=re.sub(r'<\w+\b[^>]*\sdata-i18n-aria="[^"]+"[^>]*>',aria,out)
    return out
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page()
    for key,slug in MAP.items():
        f=OUT/f'{key}.html'; s0=f.read_text(encoding='utf-8')
        pg.goto('file://'+str(f)); I=pg.evaluate('I18N')
        for l in ('ca','es'):
            s=s0
            desc=DESC[l].get(key) or re.search(r'<meta name="description" content="([^"]*)"',s).group(1)
            title=I[l]['title']
            url=f'{BASE}/{slug}/' if l=='ca' else f'{BASE}/es/{slug}/'
            lic='deed.ca' if l=='ca' else 'deed.es'
            s=s.replace('<html lang="ca">',f'<html lang="{l}">',1)
            s=re.sub(r'<title>.*?</title>',f'<title>{html.escape(title)}</title>',s,count=1)
            s=re.sub(r'(<meta name="description" content=")[^"]*"',lambda m:m.group(1)+desc+'"',s,count=1)
            meta=(f'<link rel="canonical" href="{url}">\n<link rel="alternate" hreflang="ca" href="{BASE}/{slug}/">\n<link rel="alternate" hreflang="es" href="{BASE}/es/{slug}/">\n<link rel="alternate" hreflang="x-default" href="{BASE}/{slug}/">\n'
                  f'<link rel="license" href="https://creativecommons.org/licenses/by-sa/4.0/{lic}">\n'
                  f'<meta property="og:type" content="website">\n<meta property="og:locale" content="{"ca_ES" if l=="ca" else "es_ES"}">\n<meta property="og:locale:alternate" content="{"es_ES" if l=="ca" else "ca_ES"}">\n<meta property="og:site_name" content="{FOOT[l][0]}">\n'
                  f'<meta property="og:title" content="{html.escape(title)}">\n<meta property="og:description" content="{desc}">\n<meta property="og:url" content="{url}">\n'
                  f'<meta property="og:image" content="{BASE}/og-image.png">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n')
            assert '<meta name="author" content="Ilde">' in s
            s=s.replace('<meta name="author" content="Ilde">','<meta name="author" content="Ilde">\n'+meta,1)
            s=s.replace('</style>',BACK_CSS+'</style>',1)
            up='../' if l=='ca' else '../../'
            s=s.replace('<div class="page">\n  <header class="top">',f'<div class="page">\n  <a class="back" href="{up}">← {FOOT[l][0]}</a>\n  <header class="top">',1)
            assert 'class="back"' in s
            s=re.sub(r'<footer class="cc">.*?</footer>',foot(l),s,flags=re.S); assert 'data-cc' in s
            # idioma fix per URL: sense localStorage; el selector navega a l'altra URL
            s=s.replace("let LANG='ca';",f"let LANG='{l}';",1)
            s=re.sub(r"try\{const s=localStorage\.getItem\('ilde-lang'\);.*?catch\(e\)\{\}\n","",s,count=1)
            tgt=f"b.dataset.lang==='es'?'{'../es/'+slug+'/' if l=='ca' else './'}':'{'./' if l=='ca' else '../../'+slug+'/'}'"
            old="LANG=b.dataset.lang; try{localStorage.setItem('ilde-lang',LANG);}catch(e){} applyLang();"
            assert old in s
            s=s.replace(old,f"if(b.dataset.lang!==LANG) location.href={tgt};",1)
            s=prerender(s,I,l)
            d=(REPO/slug) if l=='ca' else (REPO/'es'/slug); d.mkdir(parents=True,exist_ok=True)
            (d/'index.html').write_text(s,encoding='utf-8'); print(l,slug,len(s))
    b.close()
