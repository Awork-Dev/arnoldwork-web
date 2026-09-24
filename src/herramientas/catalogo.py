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

HERRAMIENTAS += [
    {
        "pieza": "rpe",
        "slug": "calculadora-rpe-rir",
        "grupo": "fuerza",
        "nombre": "RIR y RPE",
        "titulo": "Calculadora de RPE y RIR: qué peso usar en cada serie",
        "descripcion": "Convierte una serie hecha a RPE o RIR en el peso para otra serie: otras repeticiones u otro esfuerzo. Con la tabla de RPE completa.",
        "h1": "Calculadora de RIR y RPE",
        "intro": "¿Tu programa dice «3×8 a RPE 8» y no sabes qué peso poner? Mete una serie que hayas hecho y cómo de dura fue, y te digo el peso para la que quieres hacer.",
        "articulo": """
<h2>RIR y RPE, en cristiano</h2>
<p><strong>RIR</strong> son las repeticiones que te quedaban en la recámara al acabar la serie. <strong>RPE</strong> es lo mismo contado sobre 10: RPE 10 es el fallo, RPE 9 es que te sobraba una, RPE 8 que te sobraban dos.</p>
<p>Usar el esfuerzo en vez de un peso fijo tiene una ventaja: se adapta a tu día. Si has dormido mal, el mismo RPE 8 será con algo menos de peso, y está bien que así sea.</p>
<h2>Cómo se calcula</h2>
<p>La herramienta usa la tabla de RPE de Mike Tuchscherer, la más extendida en powerlifting. De tu serie saca tu máximo estimado y, con él, el peso que corresponde a las repeticiones y el esfuerzo que buscas.</p>
<p>Al principio cuesta saber cuántas repeticiones te sobraban. Un truco: graba alguna serie y fíjate cuándo empieza a frenarse la barra. Con unas semanas de práctica se afina mucho.</p>
""",
        "faq": [
            ("¿Qué RPE usar para ganar músculo?", "La mayoría de las series entre RPE 7 y 9, es decir, dejando de 1 a 3 repeticiones en la recámara. Llegar al fallo en todas las series cansa mucho más y aporta poco extra."),
            ("¿RIR 2 es lo mismo que RPE 8?", "Sí. RPE = 10 − RIR. RIR 2 (te sobraban dos) es RPE 8; RIR 0 es RPE 10, el fallo."),
        ],
    },
    {
        "pieza": "puntos",
        "slug": "calculadora-dots-wilks",
        "grupo": "fuerza",
        "nombre": "Puntos DOTS y Wilks",
        "titulo": "Calculadora DOTS y Wilks para powerlifting",
        "descripcion": "Calcula tus puntos DOTS y Wilks a partir de tu total y tu peso corporal, para comparar tu fuerza con gente de cualquier peso.",
        "h1": "Calculadora de puntos DOTS y Wilks",
        "intro": "Tu total en sentadilla, banca y peso muerto, puesto en puntos para poder compararte con gente de cualquier peso, como en las competiciones de powerlifting.",
        "articulo": """
<h2>Para qué sirven los puntos</h2>
<p>Un total de 500 kg no vale lo mismo pesando 70 kg que pesando 120. Las fórmulas de puntos corrigen el peso corporal para que se pueda comparar a todo el mundo en la misma tabla.</p>
<ul>
<li><strong>DOTS:</strong> la fórmula que usan hoy la mayoría de federaciones. Es la que sale en grande.</li>
<li><strong>Wilks:</strong> la clásica, usada durante décadas. La dejo para que puedas comparar con marcas antiguas.</li>
</ul>
<h2>Qué es el total</h2>
<p>La suma de tu mejor repetición en sentadilla, press banca y peso muerto. Si no has probado tu máximo, puedes estimarlo con la <a href="/herramientas/calculadora-1rm/">calculadora de 1RM</a>, aunque en competición solo cuenta el real.</p>
""",
        "faq": [
            ("¿Qué es un buen DOTS?", "Como orientación: por encima de 300 es un buen nivel de gimnasio, por encima de 400 es nivel de competición y por encima de 500 hablamos de campeonatos."),
            ("¿Qué diferencia hay entre DOTS y Wilks?", "Las dos corrigen el peso corporal. DOTS es más reciente y trata de forma más justa a los pesos muy ligeros y muy pesados; por eso la han adoptado muchas federaciones."),
        ],
    },
    {
        "pieza": "musculo",
        "slug": "cuanto-musculo-puedo-ganar",
        "grupo": "cuerpo",
        "nombre": "¿Cuánto músculo puedo ganar?",
        "titulo": "¿Cuánto músculo puedo ganar al año de forma natural?",
        "descripcion": "Calcula cuánto músculo puedes ganar este año y en los siguientes sin ayudas, según tu experiencia, y tu techo aproximado para tu altura.",
        "h1": "¿Cuánto músculo puedo ganar?",
        "intro": "Expectativas reales, sin humo. Cuánto músculo puedes ganar este año y los siguientes entrenando y comiendo bien, y hasta dónde puede llegar alguien de tu altura.",
        "articulo": """
<h2>Lo que dicen los números</h2>
<p>La referencia más usada es la de Lyle McDonald. Para un hombre que entrena y come bien, más o menos:</p>
<ul>
<li><strong>Primer año:</strong> 9 a 11 kg de músculo.</li>
<li><strong>Segundo año:</strong> la mitad, unos 4,5 a 5,5 kg.</li>
<li><strong>Tercer año:</strong> la mitad otra vez, unos 2 a 3 kg.</li>
<li><strong>A partir del cuarto:</strong> alrededor de 1 kg al año.</li>
</ul>
<p>En mujeres, aproximadamente la mitad. Son medias: la genética, el sueño y la constancia mueven estos números arriba o abajo, pero no los multiplican.</p>
<h2>Por qué importa saberlo</h2>
<p>Porque te protege del humo. Si alguien te promete 10 kilos de músculo en tres meses, miente o vende algo. Y porque te ayuda a comer bien: si la báscula sube mucho más rápido que esto, lo que ganas de más es grasa. Ajusta con la <a href="/herramientas/calculadora-calorias-macros/">calculadora de calorías</a>.</p>
<h2>El techo</h2>
<p>El techo lo estimo con el FFMI, el índice de masa libre de grasa: en hombres, un FFMI de 24 es un físico muy musculado sin ayudas; en mujeres, alrededor de 20. Muy poca gente llega ahí, y hacerlo lleva muchos años.</p>
""",
        "faq": [
            ("¿Cuánto músculo se gana en un mes?", "El primer año, un hombre gana de media algo menos de 1 kg de músculo al mes; una mujer, alrededor de medio kilo. A partir del segundo año, bastante menos."),
            ("¿Por qué gano menos músculo que antes?", "Es normal: cuanto más cerca estás de tu techo, más despacio se avanza. No significa que lo estés haciendo mal."),
        ],
    },
    {
        "pieza": "rutina",
        "slug": "generador-de-rutina",
        "grupo": "entreno",
        "nombre": "Generador de rutina",
        "titulo": "Generador de rutina de gimnasio gratis: de 2 a 6 días",
        "descripcion": "Crea tu rutina de gimnasio o de casa según los días que puedes entrenar: ejercicios, series y repeticiones de cada día. Gratis y sin registro.",
        "h1": "Generador de rutina",
        "intro": "Elige cuántos días puedes entrenar, dónde y cuánto llevas, y te monto la rutina con los ejercicios, series y repeticiones de cada día. Sin registros ni suscripciones.",
        "articulo": """
<h2>Cómo están montadas</h2>
<p>Todas las rutinas se basan en lo mismo: los <strong>movimientos básicos</strong> (sentadilla, bisagra de cadera, empujes y tirones) primero, cuando estás fresco, y los ejercicios pequeños al final. Cada músculo se entrena al menos dos veces por semana.</p>
<ul>
<li><strong>2 o 3 días:</strong> cuerpo completo. Lo mejor si empiezas.</li>
<li><strong>4 días:</strong> torso y pierna, dos veces cada uno.</li>
<li><strong>5 días:</strong> torso y pierna más empuje, tirón y pierna.</li>
<li><strong>6 días:</strong> empuje, tirón y pierna, dos vueltas.</li>
</ul>
<p>Más días no es mejor por sí solo: la mejor rutina es la que puedes cumplir semana tras semana.</p>
<h2>Cómo progresar</h2>
<p>Trabaja en el rango de repeticiones de cada ejercicio. Cuando llegues arriba en todas las series, sube el peso: la herramienta <a href="/herramientas/cuando-subir-peso/">¿Subo peso?</a> te lo dice. Y apunta lo que haces en el <a href="/herramientas/cuaderno-de-entreno/">cuaderno de entreno</a>.</p>
""",
        "faq": [
            ("¿Cuántos días a la semana hay que entrenar para ganar músculo?", "Con tres días de cuerpo completo bien hechos se gana músculo de sobra, sobre todo al empezar. Cuatro o más días permiten repartir mejor el volumen, no son obligatorios."),
            ("¿Sirve la rutina para entrenar en casa?", "Sí. Elige «Casa: mancuernas y banco» y te cambio cada ejercicio por su versión con mancuernas."),
        ],
    },
    {
        "pieza": "cuaderno",
        "slug": "cuaderno-de-entreno",
        "grupo": "entreno",
        "nombre": "Cuaderno de entreno",
        "titulo": "Cuaderno de entreno online gratis: apunta tus pesos",
        "descripcion": "Apunta tus series, mira tu progreso en una gráfica por ejercicio y descárgalo en Excel. Se guarda en tu móvil, sin registro.",
        "h1": "Cuaderno de entreno",
        "intro": "Lo que no se mide, no sube. Apunta cada serie y mira cómo progresa cada ejercicio en una gráfica. Todo se queda en tu móvil: sin cuentas, sin anuncios.",
        "articulo": """
<h2>Por qué apuntar</h2>
<p>Es la diferencia entre entrenar y hacer ejercicio. Si no sabes lo que hiciste la semana pasada, no puedes saber si hoy toca subir. Apuntar es también la forma más rápida de detectar un estancamiento.</p>
<h2>Cómo usarlo</h2>
<ul>
<li>Apunta tu <strong>serie más dura</strong> de cada ejercicio, o todas si te gusta el detalle.</li>
<li>La gráfica muestra el <strong>1RM estimado</strong> de cada día. Así puedes comparar una serie de 5 con una de 10.</li>
<li>Descarga el historial en CSV para abrirlo en Excel o Google Sheets.</li>
</ul>
<p>Los datos se guardan en el navegador de tu móvil. Si borras los datos del navegador o cambias de teléfono, se pierden: descárgalos de vez en cuando como copia.</p>
""",
        "faq": [
            ("¿Dónde se guardan mis datos?", "Solo en tu móvil o tu ordenador, en el navegador. No se envían a ningún sitio y nadie más puede verlos."),
            ("¿Puedo pasar mis datos a Excel?", "Sí, con el botón «Descargar en Excel (CSV)» tienes todo el historial en una hoja."),
        ],
    },
    {
        "pieza": "sustituto",
        "slug": "sustituto-de-ejercicio",
        "grupo": "entreno",
        "nombre": "Sustituto de ejercicio",
        "titulo": "Sustituto de ejercicio: alternativas para el gimnasio y para casa",
        "descripcion": "¿Máquina ocupada o entrenas en casa? Elige el ejercicio y lo que tienes (máquinas, mancuernas, gomas o nada) y te doy alternativas equivalentes.",
        "h1": "Sustituto de ejercicio",
        "intro": "¿La máquina está ocupada, entrenas en casa o te molesta algo? Elige el ejercicio y lo que tienes a mano y te doy alternativas que trabajan lo mismo.",
        "articulo": """
<h2>Cómo elegir un buen sustituto</h2>
<p>Un ejercicio se puede cambiar por otro que haga el <strong>mismo movimiento</strong> y cargue los <strong>mismos músculos</strong>. Un press se cambia por otro press, un tirón por otro tirón. Por eso las alternativas están agrupadas por patrón de movimiento, no por máquina.</p>
<p>Si cambias a una versión más fácil, compénsalo con más repeticiones o con pausas y bajadas lentas, para que la serie siga acabando cerca del fallo.</p>
<h2>Si te duele algo</h2>
<p>Cambiar de ejercicio puede ayudar cuando un movimiento concreto te molesta, pero no es un tratamiento. Si el dolor sigue o va a más, consúltalo con un profesional sanitario.</p>
""",
        "faq": [
            ("¿Se puede ganar músculo solo con mancuernas?", "Sí. Con mancuernas y un banco se pueden trabajar todos los músculos. Lo importante es que las series sean duras y que vayas subiendo el peso o las repeticiones."),
        ],
    },
    {
        "pieza": "creatina",
        "slug": "calculadora-creatina",
        "grupo": "cuerpo",
        "nombre": "Creatina",
        "titulo": "Calculadora de creatina: cuánta tomar según tu peso",
        "descripcion": "Calcula tu dosis diaria de creatina monohidrato según tu peso, con o sin fase de carga. Pautas de la ISSN, gratis y sin registro.",
        "h1": "Calculadora de creatina",
        "intro": "Mete tu peso y te digo cuántos gramos de creatina tomar al día y, si quieres notarla antes, cómo hacer la fase de carga. Sin marcas, sin cápsulas mágicas: monohidrato y constancia.",
        "articulo": """
<h2>Cuánta creatina tomar</h2>
<p>La Sociedad Internacional de Nutrición Deportiva (ISSN) recomienda unos <strong>0,03 g por kilo al día</strong>, que en la práctica son <strong>3 a 5 g diarios</strong> para casi todo el mundo. Esa dosis llena los depósitos del músculo en unas 3 o 4 semanas.</p>
<p>Si quieres notarla antes, se puede hacer una <strong>fase de carga</strong>: unos 0,3 g por kilo al día (unos 20 g) durante 5 a 7 días, repartidos en 4 tomas, y después la dosis diaria. El resultado final es el mismo; solo cambia lo rápido que llegas.</p>
<h2>Qué creatina tomar</h2>
<p>La <strong>creatina monohidrato</strong> es la más estudiada, la que mejor funciona y la más barata. Las versiones «avanzadas» (HCL, Kre-Alkalyn, etc.) no han demostrado ser mejores. Tómala todos los días, también los de descanso, y a la hora que te venga bien.</p>
""",
        "faq": [
            ("¿Hay que hacer descansos con la creatina?", "No. No hace falta ciclarla ni descansar: se puede tomar todo el año. Si la dejas, los niveles bajan poco a poco en unas semanas."),
            ("¿La creatina retiene líquidos?", "Hace que el músculo guarde más agua dentro, por eso la báscula puede subir 1 o 2 kg las primeras semanas. No es grasa ni hinchazón bajo la piel."),
            ("¿A qué hora se toma la creatina?", "Da igual. Lo importante es tomarla todos los días. Mucha gente la toma después de entrenar o con una comida para no olvidarse."),
        ],
    },
    {
        "pieza": "proteina",
        "slug": "calculadora-proteina",
        "grupo": "cuerpo",
        "nombre": "Proteína diaria",
        "titulo": "Calculadora de proteína: cuántos gramos necesitas al día",
        "descripcion": "Calcula cuánta proteína necesitas al día según tu peso, objetivo y edad, cuánta en cada comida y cómo se ve en el plato. Gratis y sin registro.",
        "h1": "Calculadora de proteína diaria",
        "intro": "Mete tu peso, tu edad y lo que buscas, y te digo cuántos gramos de proteína comer al día, cuánto en cada comida y ejemplos reales de platos. Sin polvos mágicos.",
        "articulo": """
<h2>Cuánta proteína al día</h2>
<p>Si entrenas con pesas y quieres ganar músculo, la evidencia apunta a <strong>1,6 a 2,2 g por kilo de peso al día</strong>. Si estás perdiendo grasa conviene ir a la parte alta, hasta unos 2,4 g por kilo, para no perder músculo por el camino. Sin entrenar con pesas, con 1 a 1,2 g por kilo es suficiente.</p>
<p>A partir de los 50 años el músculo responde algo peor a la misma cantidad, por eso la calculadora suma un poco.</p>
<h2>Repartirla en el día</h2>
<p>Lo más práctico es repartirla en <strong>3 a 5 comidas</strong> con 25 a 45 g cada una. No hace falta obsesionarse con la «ventana anabólica»: lo que cuenta es el total del día y comerla con constancia.</p>
""",
        "faq": [
            ("¿Se puede comer demasiada proteína?", "En personas sanas, hasta unos 2,5 g por kilo es seguro. Más no da más músculo: el resto se usa como energía. Si tienes problemas de riñón, pregunta a tu médico."),
            ("¿Hace falta tomar batidos de proteína?", "No. Son solo comida en polvo y una forma cómoda de llegar a la cifra. Si llegas con comida normal, no los necesitas."),
            ("¿Cuenta la proteína del pan, el arroz o las legumbres?", "Sí, suma. Las legumbres aportan bastante; el pan y el arroz, algo menos. Las fuentes animales, los lácteos, la soja y las legumbres combinadas son las más completas."),
        ],
    },
    {
        "pieza": "fecha",
        "slug": "cuando-llegare-a-mi-peso",
        "grupo": "cuerpo",
        "nombre": "¿Cuándo llegaré a mi peso?",
        "titulo": "¿Cuándo llegaré a mi peso? Calculadora de fecha objetivo",
        "descripcion": "Calcula en qué fecha llegarás a tu peso objetivo según el ritmo, cuántas calorías de menos o de más necesitas y los controles para ir comprobando.",
        "h1": "¿Cuándo llegaré a mi peso?",
        "intro": "Tu peso de hoy, el que quieres y a qué ritmo. Te doy la fecha aproximada, las calorías de diferencia al día y un calendario para comprobar que vas bien.",
        "articulo": """
<h2>A qué ritmo perder o ganar peso</h2>
<p>Para perder grasa sin perder músculo, lo recomendable es bajar entre un <strong>0,5 % y un 1 % del peso a la semana</strong>. Con 80 kg son entre 400 y 800 gramos semanales. Más rápido suele costar músculo y rebote.</p>
<p>Para ganar músculo, lo razonable es subir entre un <strong>0,25 % y un 0,5 % a la semana</strong>. Subir más deprisa no da más músculo: el exceso suele ser grasa.</p>
<h2>Por qué se va frenando</h2>
<p>La calculadora usa un porcentaje del peso de cada semana, así que el ritmo se va frenando a medida que te acercas: es lo que pasa en la vida real. Un kilo de grasa equivale a unas 7.700 kcal, y de ahí sale la diferencia diaria de calorías.</p>
""",
        "faq": [
            ("¿Por qué el peso sube y baja de un día a otro?", "El agua, la sal, los hidratos y la digestión mueven la báscula 1 o 2 kg de un día para otro. Pésate cada mañana y fíjate en la media semanal."),
            ("¿Qué hago si me estanco?", "Si la media semanal no se mueve en dos o tres semanas, ajusta 100 a 200 kcal al día y revisa que estás anotando bien lo que comes."),
        ],
    },
    {
        "pieza": "test",
        "slug": "test-que-rutina-hacer",
        "grupo": "entreno",
        "nombre": "¿Qué rutina es para ti?",
        "titulo": "Test: ¿qué rutina de gimnasio es para ti?",
        "descripcion": "Responde 5 preguntas y descubre qué rutina de gimnasio te encaja: Heavy Duty, cuerpo completo, torso-pierna o empuje-tirón-pierna. Gratis.",
        "h1": "¿Qué rutina es para ti?",
        "intro": "Cinco preguntas sobre tu tiempo, tu experiencia y cómo te gusta entrenar. Te digo qué forma de entrenar te encaja y te llevo directo a empezarla.",
        "articulo": """
<h2>No hay una rutina perfecta, hay una que vas a seguir</h2>
<p>La mejor rutina es la que encaja con tu vida: los días que de verdad puedes ir, el tiempo que tienes y cómo disfrutas entrenando. Una rutina brillante que abandonas en febrero vale menos que una sencilla que sigues todo el año.</p>
<h2>Las opciones</h2>
<p><strong>Heavy Duty</strong>: pocas series, todas al fallo, y mucho descanso. Ideal si tienes poco tiempo y te gusta entrenar a muerte. <strong>Cuerpo completo</strong>: 2 o 3 días trabajando todo el cuerpo, lo mejor para empezar. <strong>Torso y pierna</strong>: 4 días, más volumen por músculo. <strong>Empuje, tirón y pierna</strong>: para quien puede ir 5 o 6 días.</p>
""",
        "faq": [
            ("¿Cuántos días a la semana hay que entrenar?", "Con 2 o 3 días bien hechos se progresa mucho, sobre todo al empezar. Más días permiten más volumen, pero solo compensa si puedes recuperarte y mantenerlo."),
            ("¿Cuándo cambio de rutina?", "Cuando lleves varias semanas sin progresar pese a descansar y comer bien, o cuando cambie tu tiempo disponible. No hace falta cambiar solo por aburrimiento."),
        ],
    },
]

_ORDEN = ["rm", "rpe", "subir", "nivel", "puntos", "discos", "calentamiento",
          "macros", "proteina", "creatina", "grasa", "musculo", "fecha",
          "test", "rutina", "cuaderno", "sustituto", "volumen", "recuperacion", "descansos", "tempo"]
assert sorted(_ORDEN) == sorted(h["pieza"] for h in HERRAMIENTAS)
HERRAMIENTAS.sort(key=lambda h: _ORDEN.index(h["pieza"]))

# Nombre corto para la lista de la portada.
_CORTOS = {'rm': '1RM',
            'rpe': 'RIR y RPE',
            'subir': '¿Subo peso?',
            'nivel': '¿Cómo de fuerte soy?',
            'puntos': 'DOTS y Wilks',
            'discos': 'Discos en la barra',
            'calentamiento': 'Aproximaciones',
            'macros': 'Calorías y macros',
            'proteina': 'Proteína diaria',
            'creatina': 'Creatina',
            'fecha': '¿Cuándo llegaré?',
            'test': 'Test de rutina',
            'grasa': 'Grasa corporal',
            'musculo': '¿Cuánto músculo?',
            'rutina': 'Generador de rutina',
            'cuaderno': 'Cuaderno',
            'sustituto': 'Sustitutos',
            'volumen': 'Volumen semanal',
            'recuperacion': 'Recuperación HD',
            'descansos': 'Descansos',
            'tempo': 'Tempo'}
for _h in HERRAMIENTAS:
    _h["corto"] = _CORTOS.get(_h["pieza"], _h["nombre"])
