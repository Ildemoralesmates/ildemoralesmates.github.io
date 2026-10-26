#!/usr/bin/env python3
"""Genera les versions valenciana (<slug>/) i castellana (es/<slug>/) dels quatre simuladors
(Punnett, models atòmics, lleis dels gasos, selecció natural, ...) a partir de tools/simuladors/src/.

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
MAP={'punnett':'genetica-punnett','atoms':'models-atomics','gasos':'lleis-gasos','seleccio':'seleccio-natural','richter':'escala-richter','ones':'ones-sismiques','decay':'desintegracio-radioactiva','isostasia':'isostasia','meiosi':'meiosi','osmosi':'osmosi-difusio','fotosintesi':'fotosintesi-respiracio','engranatges':'engranatges-mcm','rectangles':'mcd-rectangles','zoom':'zoom-recta-decimals','potencies':'potencies-escacs-paper','arrel':'arrel-quadrada-area','rebaixes':'rebaixes-encadenades','mistos':'patrons-mistos','meandres':'meandres','estratigrafia':'estratigrafia','temps-geologic':'temps-geologic-un-any','inclinat':'pla-inclinat','tir':'tir-parabolic','kepler':'lleis-kepler','muntanya':'muntanya-russa','mru':'mru-mrua','lorentz':'particula-camp-magnetic','acel':'acceleracio-tangencial-normal','lissajous':'figures-lissajous','fraccions':'fraccions-suma-resta','pitagores':'pitagores','thales':'thales','barres':'fraccions-barres','balanca':'equacions-balanca','erato':'eratostenes','trig':'trigonometria','segongrau':'equacions-segon-grau','rectes':'rectes-tarifes','tec-engr':'engranatges-politges','tec-mec':'mecanismes-moviment','tec-pal':'palanques','tec-circ':'circuit-serie-paral-lel','tec-sim':'simulador-circuits','tec-res':'codi-colors-resistencies','tec-rob':'robot-laberint','tec-vist':'vistes-diedriques'}
DESC={'ca':{'gasos':"Simulador cinètic de gas ideal: lleis de Boyle–Mariotte, Charles i Gay-Lussac amb pressió mesurada a partir dels xocs, gràfiques i taula de mesures."},
 'es':{ 'tec-engr':'Engranajes, trenes compuestos, poleas con correa y los cambios de marcha de una bicicleta (subida, llano y bajada): cambia los dientes o los diámetros y mira cómo cambian la relación de transmisión, las rpm, el par y el sentido de giro. Para Tecnología de 2.º y 3.º de ESO, con predicción y test autocorregido.',
 'tec-mec':'Biela-manivela, leva y seguidor, piñón-cremallera y tornillo sin fin en movimiento: cambia las medidas y la velocidad y mira la gráfica del movimiento que se obtiene. Para Tecnología de 2.º y 3.º de ESO, con test autocorregido.',
 'tec-pal':'Palanca de primer, segundo y tercer género: mueve la fuerza y la carga, predice qué fuerza hace falta para el equilibrio (F·d = R·d) y mira hacia dónde se inclina. Con ejemplos reales: balancín, carretilla y pinzas. Para Tecnología de 2.º y 3.º de ESO, con test autocorregido.',
 'tec-circ':'Circuito eléctrico con electrones en movimiento: cambia el voltaje y las resistencias, compara bombillas en serie y en paralelo, funde una bombilla y comprueba la ley de Ohm con amperímetro y voltímetros. Para Tecnología de 2.º y 3.º de ESO, con predicción y test autocorregido.',
 'tec-sim':'Monta circuitos con pila, bombillas, resistencias, interruptores y pulsadores y comprueba si funcionan: el simulador calcula la corriente, avisa de los circuitos abiertos y de los cortocircuitos y funde las bombillas que reciben demasiado voltaje. Para Tecnología de 2.º y 3.º de ESO.',
 'tec-res':'Aprende el código de colores de las resistencias: elige el color de cada banda y mira el valor y la tolerancia, escribe un valor y comprueba qué bandas tiene, o resuelve retos aleatorios. Resistencias de 4 y 5 bandas. Para Tecnología de 2.º y 3.º de ESO, con test autocorregido.',
 'tec-rob':'Programa un robot con bloques (avanza, gira, repite, mientras, si-si no) para que llegue a la meta del laberinto. Cinco niveles que introducen secuencias, bucles, sensores y condicionales, con recuento de bloques. Para Tecnología de 2.º y 3.º de ESO, con test autocorregido.',
 'tec-vist':'Gira una pieza hecha de cubos y observa cómo se proyectan el alzado, la planta y el perfil izquierdo en el sistema diédrico europeo. Después dibuja tú las tres vistas y compruébalas. Para Tecnología y Dibujo de 2.º y 3.º de ESO, con test autocorregido.',
 'punnett':"Simulador de genética mendeliana: cuadros de Punnett para uno y dos genes, dominancia completa e incompleta, y simulación de descendientes.",
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
  'mistos':"Patrones con cerillas: construye figuras que crecen, completa la tabla, predice figuras lejanas y encuentra la expresión general en n. Iniciación al álgebra para 1.º y 2.º de ESO.",
 'isostasia':"Isostasia: montañas con raíces (modelo de Airy) y rebote glaciar con un manto viscoso. Simulación interactiva con test autocorregido.",
 'meandres':"Meandros: erosión en la orilla externa, sedimentación en la interna, corte del meandro y lago en media luna. Simulador interactivo con preguntas para razonar y test autocorregido.",
 'estratigrafia':"Estratigrafía: ordena los sucesos de un corte geológico (superposición, diques, fallas y discordancias) con comprobación automática, preguntas para razonar y test autocorregido.",
 'temps-geologic':"El tiempo geológico en un año: los 4.540 millones de años de la Tierra comprimidos en un calendario, con conversor de escala, preguntas para razonar y test autocorregido.",
 'meiosi':"Meiosis paso a paso con 2n = 4: crossing-over, orientación al azar de los pares de homólogos y cuatro gametos distintos. Con preguntas de predicción y test autocorregido.",
 'osmosi':"Simulador de partículas para entender la difusión y la ósmosis: membrana permeable, semipermeable o impermeable, concentraciones, temperatura y una célula en un medio hipotónico o hipertónico. Con preguntas y test autocorregido.",
 'fotosintesi':"Flujo de materia y energía entre el cloroplasto y la mitocondria: fotosíntesis y respiración celular, ciclo día-noche, punto de compensación y célula animal. Con preguntas de predicción y test autocorregido.",
 'inclinat':"Cambia el ángulo del plano inclinado y mira cómo el peso se descompone en P∥ = mg·sen θ y P⊥ = mg·cos θ; la normal equilibra la componente perpendicular. Con actividades para razonar: misiones, afirmaciones para desmontar y errores ajenos.",
 'muntanya':"Suelta una vagoneta de montaña rusa y compara la energía potencial y la cinética. Cambia la masa, la gravedad, el rozamiento, la altura de salida y la forma de la pista. Con actividades para razonar: misiones, afirmaciones para desmontar y errores ajenos.",
 'kepler':"Simulador de las tres leyes de Kepler: órbitas elípticas, áreas iguales en tiempos iguales y la relación T²/a³, con dos planetas para comparar. Con actividades para razonar: misiones, afirmaciones para desmontar y errores ajenos.",
 'mru':"Un móvil, tres gráficas: mueve un coche con MRU o MRUA y mira cómo se dibujan a la vez x–t, v–t y a–t. Tangente, área bajo v–t, segundo móvil y punto de encuentro. Con actividades para razonar: misiones, afirmaciones para desmontar y errores ajenos.",
 'lorentz':"Una carga que entra en un campo magnético uniforme gira: cambia la partícula (protón, electrón, alfa, positrón), la velocidad, el campo B y el ángulo, y mira el radio, el periodo y la hélice. Con actividades para razonar: misiones, afirmaciones para desmontar y errores ajenos.",
 'acel':"Un móvil recorre una circunferencia, una elipse o un circuito: mira por separado la aceleración tangencial (cambia el módulo de v) y la normal o centrípeta (cambia la dirección), con el radio de curvatura y la circunferencia osculatriz. Con actividades para razonar: misiones, afirmaciones para desmontar y errores ajenos.",
 'lissajous':"Dos movimientos oscilatorios perpendiculares, uno horizontal y otro vertical, dibujan una figura de Lissajous. Cambia las frecuencias y la fase, mira las dos ondas a la vez y aprende a deducir la relación fx:fy contando las tangencias. Con actividades para razonar: misiones, afirmaciones para desmontar y errores ajenos.",
 'fraccions':"Suma y resta de fracciones con barras: por qué hace falta un denominador común. Animación paso a paso (mcm, fracciones equivalentes, simplificar) con predicción, el error típico de sumar también los denominadores, actividades para razonar y test autocorregido. Para 2.º de ESO.",
 'pitagores':"Cuatro triángulos iguales se recolocan dentro de un mismo cuadrado: los espacios libres cambian de forma, pero no de área. Con actividades para razonar: misiones, afirmaciones para desmontar y errores ajenos.",
 'thales':"Arrastra los vértices A, B y C: la recta DE es siempre paralela a BC y los cocientes AD/AB, AE/AC y DE/BC coinciden (teorema de Thales); el área se multiplica por k². Con actividades para razonar: misiones, afirmaciones para desmontar y errores ajenos.",
 'barres':"Las barras tienen la misma longitud por unidad, así que se comparan a ojo: fracciones equivalentes, comparar y sumar. Con actividades para razonar: misiones, afirmaciones para desmontar y errores ajenos.",
 'balanca':"Cada bloque x pesa lo mismo. Aísla la x haciendo la misma operación en los dos lados; prueba a hacerlo solo en uno y mira qué pasa. Con actividades para razonar: misiones, afirmaciones para desmontar y errores ajenos.",
 'erato':"Criba de Eratóstenes interactiva: tacha los múltiplos de los primeros primos y descubre los números primos menores que 500. Con actividades para razonar: misiones, afirmaciones para desmontar y errores ajenos.",
 'trig':"Circunferencia goniométrica interactiva: mueve un punto y mira cómo cambian el seno, el coseno y la tangente. Tablas de ángulos notables con valores exactos (radicales), gráfica y test. Con actividades para razonar. Para 4.º ESO.",
 'segongrau':"Ecuaciones de segundo grado con situaciones reales (tiro a canasta, saltos de animales, cohetes de falla, un patio...): discriminante, soluciones, gráfica de la parábola y resolución paso a paso. Con modo libre y actividades para razonar.",
 'rectes':"Rectas y tarifas: escribe la pendiente y la ordenada en el origen de situaciones reales (taxi, gasolina, móvil, gimnasio...), mira la tabla y la gráfica y compara tarifas para descubrir cuál conviene. Con modo libre y actividades para razonar.",
 'tir':"Simulador de tiro parabólico: cambia la velocidad, el ángulo y la gravedad (Tierra, Luna, Marte, Júpiter) y compara trayectorias. Con actividades para razonar: misiones, afirmaciones para desmontar y errores ajenos."}}
FOOT={'ca':('Recursos de matemàtiques','deed.ca','Les imatges i materials de tercers conserven la seua pròpia llicència.'),
      'es':('Recursos de matemáticas','deed.es','Las imágenes y materiales de terceros conservan su propia licencia.')}
BACK_CSS=".back{display:inline-block;font:600 .9rem var(--f-num);color:var(--muted);text-decoration:none}\n.back:hover{color:var(--ink);text-decoration:underline}\n.back:focus-visible{outline:3px solid var(--pa);outline-offset:3px;border-radius:4px}\n"
def foot(l):
    n,d,x=FOOT[l]
    return (f'<footer data-cc style="margin:2.5rem auto 1.5rem;padding:0 16px;max-width:60rem;text-align:center;font:12.5px/1.5 system-ui,-apple-system,\'Segoe UI\',sans-serif;opacity:.7;color:inherit">© Ilde Morales · <a href="{BASE}/" style="color:inherit">{n}</a> · <a rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/{d}" style="color:inherit">CC BY-NC-SA 4.0</a> · {x}</footer>')
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
                  f'<link rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/{lic}">\n'
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
