# ArnoldWork · catálogo de herramientas.
# Cada entrada genera /herramientas/<slug>/ y su hueco en /herramientas/.
# "pieza" es el archivo de piezas/<pieza>.html con la herramienta en sí.
# En los textos se puede usar HTML sencillo (<strong>, <a>, <em>).

GRUPOS = [
    ("fuerza", "Fuerza"),
    ("cuerpo", "Nutrición y cuerpo"),
    ("entreno", "Organiza el entreno"),
]

HERRAMIENTAS = [
    {
        "pieza": "rm",
        "slug": "calculadora-1rm",
        "grupo": "fuerza",
        "nombre": "Tu máximo (1RM)",
        "titulo": "Calculadora de 1RM: tu máximo y con qué peso entrenar",
        "descripcion": "Calcula tu repetición máxima (1RM) a partir de cualquier serie y la tabla de pesos por porcentaje para entrenar. Gratis y sin registro.",
        "h1": "Calculadora de 1RM",
        "intro": "Mete un peso y las repeticiones que hiciste con él y te digo tu máximo estimado y con cuánto entrenar a cada porcentaje. Sin probar una repetición a tope, que es donde vienen los sustos.",
        "articulo": """
<h2>Cómo se calcula</h2>
<p>La calculadora hace la media de dos fórmulas clásicas, <strong>Epley y Brzycki</strong>. Las dos parten de la misma idea: si con un peso haces 8 repeticiones, tu máximo está más o menos un 25 % por encima. Promediarlas corrige los extremos de cada una.</p>
<p>La estimación es buena entre 3 y 10 repeticiones y con una serie que haya acabado cerca del fallo. Si te sobraban cinco repeticiones, el máximo real será más alto que el que sale aquí.</p>
<h2>Para qué sirve saber tu 1RM</h2>
<p>Muchos programas dan los pesos en porcentaje: «4 series de 6 al 80 %». Con la tabla de abajo ves directamente cuántos kilos son, redondeados a medio kilo para que se puedan montar con discos.</p>
<p>No hace falta probar tu máximo real para entrenar bien. Si empiezas, es mejor estimarlo así y guardar las repeticiones a tope para cuando lleves años.</p>
""",
        "faq": [
            ("¿Es fiable una calculadora de 1RM?", "Es una estimación. Con series de 3 a 6 repeticiones hechas cerca del fallo suele quedarse a un 3-5 % del máximo real. Por encima de 12 repeticiones se dispara el error."),
            ("¿Cada cuánto debo recalcular mi máximo?", "Cada 4 a 8 semanas, o cuando notes que los pesos de la tabla se te han quedado cortos. Usa siempre el mismo ejercicio y una serie hecha con buena técnica."),
        ],
    },
    {
        "pieza": "subir",
        "slug": "cuando-subir-peso",
        "grupo": "fuerza",
        "nombre": "¿Subo peso?",
        "titulo": "¿Cuándo subir peso en el gimnasio? Calculadora de doble progresión",
        "descripcion": "Mete las repeticiones de tus últimas sesiones y te digo si toca subir, mantener o bajar el peso, con el método de doble progresión.",
        "h1": "¿Cuándo subir peso?",
        "intro": "La duda número uno de la sala. Mete lo que hiciste las últimas sesiones con el mismo peso y te digo si toca subir, mantener o bajar, y cuánto.",
        "articulo": """
<h2>La regla: doble progresión</h2>
<p>Eliges un rango de repeticiones, por ejemplo de 8 a 12. Con el mismo peso intentas sumar repeticiones sesión a sesión. <strong>Cuando llegas al techo del rango en tu serie más dura, subes el peso</strong> y vuelves a empezar desde abajo.</p>
<p>Es el método más sencillo que funciona: no necesitas porcentajes ni calcular nada, solo apuntar lo que haces.</p>
<h2>Cuánto subir</h2>
<ul>
<li><strong>Pierna y peso muerto:</strong> 5 kg (2,5 por lado).</li>
<li><strong>Tren superior con barra:</strong> 2,5 kg.</li>
<li><strong>Mancuernas:</strong> el siguiente par, normalmente 2 kg por mancuerna.</li>
<li><strong>Máquinas y poleas:</strong> la placa más pequeña.</li>
</ul>
<p>Después de subir es normal perder dos o tres repeticiones. No es un paso atrás: estás al principio del rango otra vez.</p>
<h2>Cuándo bajar</h2>
<p>Si dos sesiones seguidas no llegas al mínimo del rango, el peso te queda grande. Baja un 10 % y vuelve a construir. Si llevas tres sesiones sin sumar ni una repetición, antes de tocar el peso revisa el sueño, la proteína y el descanso.</p>
""",
        "faq": [
            ("¿Cada cuánto se sube de peso en el gimnasio?", "Cuando llegas al techo de tu rango de repeticiones con buena técnica. Al empezar puede ser cada semana; con años de entrenamiento, cada varias semanas."),
            ("¿Es malo bajar de peso?", "No. Bajar un 10 % cuando llevas dos sesiones por debajo del rango es tomar carrerilla, no retroceder."),
        ],
    },
    {
        "pieza": "nivel",
        "slug": "nivel-de-fuerza",
        "grupo": "fuerza",
        "nombre": "¿Cómo de fuerte soy?",
        "titulo": "¿Cómo de fuerte soy? Nivel de fuerza en sentadilla, banca y peso muerto",
        "descripcion": "Compara tu sentadilla, press banca y peso muerto con tu peso corporal y mira tu nivel: principiante, novato, intermedio, avanzado o élite.",
        "h1": "¿Cómo de fuerte soy?",
        "intro": "Tus tres básicos comparados con tu peso corporal. Mete un máximo real o una serie cualquiera cerca del fallo y te digo en qué nivel estás y cuánto te falta para el siguiente.",
        "articulo": """
<h2>Cómo se mide</h2>
<p>Lo que importa no es cuántos kilos levantas, sino <strong>cuántas veces tu peso corporal</strong>. Levantar 100 kg en sentadilla no es lo mismo pesando 60 kg que pesando 110.</p>
<p>Si metes una serie de varias repeticiones, primero estimo tu máximo con la misma fórmula que la <a href="/herramientas/calculadora-1rm/">calculadora de 1RM</a> y luego lo comparo con tu peso.</p>
<h2>Qué significa cada nivel</h2>
<ul>
<li><strong>Principiante y novato:</strong> los primeros meses. Aquí se sube casi cada semana.</li>
<li><strong>Intermedio:</strong> uno a tres años de entrenamiento constante. La mayoría de la gente que entrena en serio acaba aquí.</li>
<li><strong>Avanzado:</strong> años de trabajo bien planificado.</li>
<li><strong>Élite:</strong> niveles de competición. Muy poca gente llega.</li>
</ul>
<p>Los niveles son orientativos y sirven para ver por dónde vas tú, no para compararte con el de al lado.</p>
""",
        "faq": [
            ("¿Cuánto debería levantar en press banca?", "Como referencia para hombres, levantar tu peso corporal en banca es un nivel intermedio. Para mujeres, alrededor de 0,65 veces el peso corporal."),
            ("¿Tengo que probar mi máximo real?", "No. Puedes meter una serie de 3 a 8 repeticiones cerca del fallo y la herramienta estima el máximo."),
        ],
    },
    {
        "pieza": "discos",
        "slug": "calculadora-discos",
        "grupo": "fuerza",
        "nombre": "Discos en la barra",
        "titulo": "Calculadora de discos: qué discos poner en la barra",
        "descripcion": "Escribe el peso total y te digo qué discos poner en cada lado de la barra olímpica, de 15 kg, Z o sin barra.",
        "h1": "Qué discos pongo en la barra",
        "intro": "Escribe el peso total que quieres levantar y te digo los discos de cada lado, del más grande al más pequeño. Sin hacer cuentas con la barra cargada delante.",
        "articulo": """
<h2>Cómo se cuenta</h2>
<p>Al peso total se le resta la barra y lo que queda se divide entre dos: eso es lo que va en cada lado. Una barra olímpica pesa <strong>20 kg</strong>, la olímpica de mujer <strong>15 kg</strong> y las barras cortas o Z suelen pesar entre 7 y 10 kg.</p>
<p>La calculadora usa los discos normales de un gimnasio: 25, 20, 15, 10, 5, 2,5 y 1,25 kg. Si el peso no se puede montar exacto, te dice el más cercano.</p>
<h2>Un consejo de sala</h2>
<p>Pon siempre los discos grandes por dentro y los pequeños por fuera, y usa cierres. Y al acabar, ya sabes: recoge los discos.</p>
""",
        "faq": [
            ("¿Cuánto pesa la barra del gimnasio?", "La barra olímpica de hombre pesa 20 kg y la de mujer 15 kg. Las barras cortas y las Z varían: mira si llevan el peso marcado."),
        ],
    },
    {
        "pieza": "calentamiento",
        "slug": "series-de-aproximacion",
        "grupo": "fuerza",
        "nombre": "Series de aproximación",
        "titulo": "Series de aproximación: calcula tu calentamiento con pesas",
        "descripcion": "Dime el peso de tu serie efectiva y te preparo las series de aproximación con los discos de cada una. Para hipertrofia y para Heavy Duty.",
        "h1": "Series de aproximación",
        "intro": "Dime el peso de tu serie efectiva y te preparo el calentamiento, serie a serie, con los discos que tienes que poner en cada una.",
        "articulo": """
<h2>Para qué sirven</h2>
<p>Las series de aproximación preparan las articulaciones, afinan la técnica y te avisan si hoy el peso se mueve bien o mal, <strong>sin cansarte</strong> para la serie que cuenta. Por eso ninguna se acerca al fallo.</p>
<h2>Cómo se reparten</h2>
<p>Se empieza con la barra sola y se sube por escalones, bajando las repeticiones a medida que el peso se acerca al de trabajo. Para hipertrofia bastan dos o tres aproximaciones. Si entrenas fuerza o <a href="/herramientas/recuperacion-heavy-duty/">Heavy Duty</a>, con una sola serie muy pesada, conviene hacer más escalones y más cortos.</p>
<p>Entre aproximaciones, un minuto como mucho. Antes de la serie efectiva, dos o tres.</p>
""",
        "faq": [
            ("¿Cuántas series de calentamiento hay que hacer?", "Entre dos y cinco, según lo pesada que sea la serie de trabajo. Cuanto más cerca de tu máximo, más escalones."),
        ],
    },
    {
        "pieza": "macros",
        "slug": "calculadora-calorias-macros",
        "grupo": "cuerpo",
        "nombre": "Calorías y macros",
        "titulo": "Calculadora de calorías y macros para ganar músculo o perder grasa",
        "descripcion": "Calcula cuántas calorías comer al día y cómo repartir proteína, hidratos y grasa según tu objetivo. Fórmula de Mifflin-St Jeor. Gratis.",
        "h1": "Calculadora de calorías y macros",
        "intro": "Cuánto comer al día según tu objetivo y cómo repartirlo en proteína, hidratos y grasa. Es un punto de partida: pésate dos semanas y ajusta según lo que pase.",
        "articulo": """
<h2>Cómo se calcula</h2>
<p>Primero estimo lo que gastas en reposo con la fórmula de <strong>Mifflin-St Jeor</strong>, la más fiable de las sencillas. Luego lo multiplico por tu nivel de actividad y ajusto según el objetivo:</p>
<ul>
<li><strong>Perder grasa:</strong> un 20 % por debajo de lo que gastas.</li>
<li><strong>Recomposición:</strong> un 10 % por debajo.</li>
<li><strong>Ganar músculo:</strong> un 10 % por encima. Más no hace crecer más rápido, solo engorda más.</li>
</ul>
<h2>El reparto</h2>
<p>La proteína va primero: entre <strong>1,8 y 2,2 g por kilo</strong> según el objetivo. La grasa, al menos 0,8 g por kilo. El resto, hidratos, que son la gasolina del entrenamiento.</p>
<h2>Ajusta con la báscula</h2>
<p>Ninguna fórmula conoce tu cuerpo. Pésate varias mañanas por semana y mira la media: si en dos semanas no se mueve en la dirección que buscas, sube o baja unas 150-200 kcal.</p>
""",
        "faq": [
            ("¿Cuánta proteína necesito para ganar músculo?", "Entre 1,6 y 2,2 g por kilo de peso al día cubre a casi todo el mundo. La herramienta usa 1,8 g para ganar músculo y más en déficit, para proteger el músculo."),
            ("¿Cuántas calorías para perder grasa sin perder músculo?", "Un déficit moderado, alrededor del 20 % de lo que gastas, con proteína alta y entrenamiento de fuerza. Perder más de un 1 % del peso a la semana suele costar músculo."),
        ],
    },
    {
        "pieza": "grasa",
        "slug": "grasa-corporal-ffmi",
        "grupo": "cuerpo",
        "nombre": "Grasa corporal y FFMI",
        "titulo": "Calculadora de grasa corporal y FFMI con cinta métrica",
        "descripcion": "Calcula tu porcentaje de grasa corporal con el método de la Marina de EE. UU. y tu FFMI (índice de masa libre de grasa) con una cinta métrica.",
        "h1": "Grasa corporal y FFMI",
        "intro": "Con una cinta métrica y el método de la Marina de EE. UU. Además te calculo el FFMI, que dice cuánto músculo tienes para tu altura.",
        "articulo": """
<h2>Cómo medirte</h2>
<p>Mide siempre igual: por la mañana, en ayunas y con la cinta ajustada pero sin apretar.</p>
<ul>
<li><strong>Cuello:</strong> justo por debajo de la nuez.</li>
<li><strong>Cintura:</strong> los hombres a la altura del ombligo; las mujeres en la parte más estrecha.</li>
<li><strong>Cadera</strong> (solo mujeres): en la parte más ancha de los glúteos.</li>
</ul>
<h2>Qué es el FFMI</h2>
<p>El FFMI es como el índice de masa corporal, pero contando solo la masa libre de grasa. Sirve para saber cuánto músculo tienes para tu altura. En hombres, por encima de 22 se nota que entrenas; por encima de 25 es muy raro sin ayudas.</p>
<p>El método tiene un margen de error de 3 o 4 puntos. Lo valioso es la tendencia: mídete una vez al mes y mira cómo cambia.</p>
""",
        "faq": [
            ("¿Es fiable el método de la Marina?", "Para seguir tu evolución, sí: el error es de unos 3-4 puntos, pero si mides siempre igual, los cambios de un mes a otro son reales."),
            ("¿Qué FFMI es normal?", "En hombres sin entrenar suele estar entre 18 y 20; entrenando varios años, entre 21 y 23. En mujeres, unos 3 puntos menos."),
        ],
    },
    {
        "pieza": "volumen",
        "slug": "volumen-semanal",
        "grupo": "entreno",
        "nombre": "Volumen semanal",
        "titulo": "Volumen semanal: cuántas series por músculo a la semana",
        "descripcion": "Apunta tus series efectivas por músculo y comprueba si estás dentro del rango de 10 a 20 series semanales para hipertrofia.",
        "h1": "Volumen semanal por músculo",
        "intro": "Apunta cuántas series efectivas haces a la semana para cada músculo y te marco cuál se queda corto y cuál va sobrado. Se guarda en tu móvil.",
        "articulo": """
<h2>Qué cuenta como serie</h2>
<p>Solo las <strong>series efectivas</strong>: las que acaban a pocas repeticiones del fallo. Los calentamientos y las aproximaciones no cuentan.</p>
<p>Un ejercicio compuesto trabaja más de un músculo. Una forma sencilla de contar: el press banca suma una serie a pecho y media a tríceps y hombro.</p>
<h2>El rango de referencia</h2>
<p>Para ganar músculo, la mayoría de la gente responde bien con <strong>10 a 20 series por músculo y semana</strong>, repartidas en dos o más sesiones. Por debajo de 6 series, sobre todo mantienes. Por encima de 20, cuidado con la recuperación.</p>
<p>Si entrenas Heavy Duty, este rango no es tu medida: allí una o dos series al fallo por músculo y sesión son el plan.</p>
""",
        "faq": [
            ("¿Cuántas series por músculo a la semana para hipertrofia?", "Entre 10 y 20 series efectivas es el rango en el que crece la mayoría de la gente. Empieza por abajo y sube si dejas de progresar."),
        ],
    },
    {
        "pieza": "recuperacion",
        "slug": "recuperacion-heavy-duty",
        "grupo": "entreno",
        "nombre": "Recuperación Heavy Duty",
        "titulo": "Recuperación Heavy Duty: qué rutina toca y cuándo volver a entrenar",
        "descripcion": "Marca tus sesiones de Heavy Duty (rotación A, B, C y D) y te digo qué rutina toca y cuántos días te faltan para estar recuperado.",
        "h1": "Recuperación Heavy Duty",
        "intro": "La rotación de HeavyWork: A, B, C y D, con días de descanso entre sesiones. Marca el día que entrenas y te digo qué toca y cuándo estás listo para volver.",
        "articulo": """
<h2>Por qué tanto descanso</h2>
<p>En el Heavy Duty de Mike Mentzer cada serie va <strong>al fallo absoluto</strong>. Es un estímulo tan fuerte que el cuerpo necesita varios días para recuperarse y crecer. Volver antes de tiempo es entrenar sobre un músculo que todavía no se ha reparado.</p>
<h2>La rotación</h2>
<ul>
<li><strong>A:</strong> pecho y espalda.</li>
<li><strong>B:</strong> piernas.</li>
<li><strong>C:</strong> hombros y brazos.</li>
<li><strong>D:</strong> piernas.</li>
</ul>
<p>Empieza con cuatro días de descanso entre sesiones. Si al volver no has superado lo de la última vez, prueba a descansar uno más. El método completo está explicado en <a href="https://heavywork.arnoldwork.com" target="_blank" rel="noopener">HeavyWork</a>.</p>
""",
        "faq": [
            ("¿Cuántos días hay que descansar en Heavy Duty?", "Entre 3 y 7 días entre sesiones, según cómo te recuperes. Si no mejoras de una sesión a la siguiente, alarga el descanso antes de cambiar nada más."),
        ],
    },
    {
        "pieza": "descansos",
        "slug": "cronometro-descansos",
        "grupo": "entreno",
        "nombre": "Cronómetro de descansos",
        "titulo": "Cronómetro de descansos entre series para el gimnasio",
        "descripcion": "Temporizador de descanso entre series con aviso sonoro: 1, 1:30, 2, 3 o 5 minutos. Mantiene la pantalla encendida. Gratis y sin descargar nada.",
        "h1": "Cronómetro de descansos",
        "intro": "Elige el descanso y dale. Te avisa con un pitido al terminar y mantiene la pantalla encendida mientras corre. Sin descargar ninguna app.",
        "articulo": """
<h2>Cuánto descansar entre series</h2>
<ul>
<li><strong>1 minuto:</strong> ejercicios ligeros y de aislamiento.</li>
<li><strong>1:30 a 2 minutos:</strong> hipertrofia en general.</li>
<li><strong>2 a 3 minutos:</strong> básicos pesados como sentadilla, banca o peso muerto.</li>
<li><strong>3 a 5 minutos:</strong> fuerza máxima y series al fallo absoluto.</li>
</ul>
<p>Descansar poco no hace el entrenamiento mejor, solo más cansado. Si en la siguiente serie pierdes muchas repeticiones, descansa más.</p>
<p>Consejo: añade la web a tu pantalla de inicio y el cronómetro se abre como una app, también sin cobertura.</p>
""",
        "faq": [
            ("¿Cuánto hay que descansar entre series para ganar músculo?", "Entre 1:30 y 3 minutos. Descansos más largos permiten hacer más repeticiones con el mismo peso, y eso suele dar mejores resultados."),
        ],
    },
    {
        "pieza": "tempo",
        "slug": "tempo-repeticiones",
        "grupo": "entreno",
        "nombre": "Tempo",
        "titulo": "Metrónomo de tempo para las repeticiones (4-0-4 y más)",
        "descripcion": "Marca el ritmo de cada repetición con pitidos: segundos al bajar, pausa y subir. Ideal para Heavy Duty (4 segundos arriba y 4 abajo).",
        "h1": "Tempo de las repeticiones",
        "intro": "Te marca el ritmo de cada repetición con pitidos, para que no aceleres cuando quema. Configura los segundos de bajada, pausa y subida.",
        "articulo": """
<h2>Qué es el tempo</h2>
<p>El tempo es la velocidad a la que haces cada fase de la repetición. Se escribe con números: <strong>4-0-4</strong> significa cuatro segundos bajando, sin pausa y cuatro subiendo.</p>
<p>Controlar el tempo evita que el peso lo mueva la inercia y hace que la serie sea comparable de una sesión a otra: si un día subes más rápido, no has mejorado, has hecho trampa.</p>
<h2>Heavy Duty</h2>
<p>En Heavy Duty se trabaja a 4 segundos arriba y 4 abajo, hasta el fallo. Si llegas al fallo antes de acabar las repeticiones, dale a parar: eso es exactamente lo que buscas.</p>
""",
        "faq": [
            ("¿Qué tempo es mejor para hipertrofia?", "Cualquier tempo controlado entre 2 y 4 segundos por fase funciona. Lo importante es no dejar caer el peso y mantener el mismo ritmo cada sesión."),
        ],
    },
]
