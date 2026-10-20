// Detalle escondido: un pequeño pez ΙΧΘΥΣ (el símbolo con el que se reconocían los primeros cristianos).
// Al tocarlo muestra el versículo de esta app. Textos libres de derechos: Reina-Valera 1909, King James y Lutero 1912.
// Uso: <script src="/ichthys.js" data-v="fil4" data-donde="footer .casa" data-color="#DE3A3A" defer></script>
//   data-v: versículo (clave de V); data-donde: elemento tras el que va el pez; data-color: color del pez.
(function(){
  "use strict";
  var V={
    fil4:{es:["Todo lo puedo en Cristo que me fortalece.","Filipenses 4:13"],en:["I can do all things through Christ which strengtheneth me.","Philippians 4:13"],de:["Ich vermag alles durch den, der mich mächtig macht, Christus.","Philipper 4,13"]},
    tim4:{es:["He peleado la buena batalla, he acabado la carrera, he guardado la fe.","2 Timoteo 4:7"],en:["I have fought a good fight, I have finished my course, I have kept the faith.","2 Timothy 4:7"],de:["Ich habe einen guten Kampf gekämpft, ich habe den Lauf vollendet, ich habe Glauben gehalten.","2. Timotheus 4,7"]},
    jn8:{es:["Yo soy la luz del mundo: el que me sigue, no andará en tinieblas, mas tendrá la lumbre de la vida.","Juan 8:12"],en:["I am the light of the world: he that followeth me shall not walk in darkness, but shall have the light of life.","John 8:12"],de:["Ich bin das Licht der Welt. Wer mir nachfolgt, der wird nicht wandeln in der Finsternis, sondern wird das Licht des Lebens haben.","Johannes 8,12"]},
    jos24:{es:["Yo y mi casa serviremos a Jehová.","Josué 24:15"],en:["As for me and my house, we will serve the LORD.","Joshua 24:15"],de:["Ich aber und mein Haus wollen dem HERRN dienen.","Josua 24,15"]},
    mt5:{es:["Bienaventurados los pacificadores: porque ellos serán llamados hijos de Dios.","Mateo 5:9"],en:["Blessed are the peacemakers: for they shall be called the children of God.","Matthew 5:9"],de:["Selig sind die Friedfertigen; denn sie werden Gottes Kinder heißen.","Matthäus 5,9"]},
    mt6:{es:["Porque donde estuviere vuestro tesoro, allí estará vuestro corazón.","Mateo 6:21"],en:["For where your treasure is, there will your heart be also.","Matthew 6:21"],de:["Denn wo euer Schatz ist, da ist auch euer Herz.","Matthäus 6,21"]}
  };
  var VERSION={es:"Reina-Valera 1909",en:"King James Version",de:"Luther 1912"};
  var guion=document.currentScript||{dataset:{}}, d=guion.dataset||{};
  var verso=V[d.v]||V.fil4, color=d.color||"currentColor";
  function idioma(){var l=(document.documentElement.lang||"es").slice(0,2).toLowerCase();return verso[l]?l:"es";}
  var PEZ='<svg viewBox="0 0 60 30" width="W" height="H" aria-hidden="true"><path d="M3 4 Q22 30 46 15 Q22 0 3 26" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><circle cx="38" cy="13" r="1.8" fill="currentColor"/></svg>';
  function abrir(){
    var l=idioma(), v=verso[l], f=document.createElement("div");
    f.setAttribute("role","dialog"); f.setAttribute("aria-modal","true");
    f.style.cssText="position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:20px;background:rgba(2,4,6,.65)";
    f.innerHTML='<div style="max-width:420px;background:#0b0d10;color:#fff;border-radius:18px;padding:22px 22px 18px;box-shadow:0 10px 30px rgba(0,0,0,.45);display:grid;gap:10px;text-align:center;font-family:system-ui,-apple-system,Segoe UI,sans-serif">'
      +'<div style="color:'+color+'">'+PEZ.replace("W","60").replace("H","30")+'</div>'
      +'<blockquote style="margin:0;font:italic 1.1rem/1.5 Georgia,serif"></blockquote>'
      +'<cite style="font:700 .9rem system-ui,sans-serif;font-style:normal;color:'+color+'"></cite>'
      +'<button type="button" style="justify-self:center;border:0;border-radius:10px;padding:8px 18px;background:'+color+';color:#0b0d10;font-weight:700;cursor:pointer">'+(l==="es"?"Amén":"Amen")+'</button></div>';
    f.querySelector("blockquote").textContent="«"+v[0]+"»";
    f.querySelector("cite").textContent=v[1]+" ("+VERSION[l]+")";
    function cerrar(){f.remove();}
    f.addEventListener("click",function(e){if(e.target===f||e.target.tagName==="BUTTON")cerrar();});
    document.addEventListener("keydown",function esc(e){if(e.key==="Escape"){cerrar();document.removeEventListener("keydown",esc);}});
    document.body.appendChild(f); f.querySelector("button").focus();
  }
  function poner(){
    var b=document.createElement("button");
    b.type="button"; b.className="ichthys"; b.setAttribute("aria-label","ΙΧΘΥΣ");
    b.style.cssText="background:none;border:0;padding:4px;margin:6px 0 0;display:inline-block;color:"+color+";opacity:.55;cursor:pointer;line-height:0;vertical-align:middle";
    b.innerHTML=PEZ.replace("W","28").replace("H","14");
    b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();abrir();});
    var donde=d.donde&&document.querySelector(d.donde);
    if(donde&&donde.parentNode) donde.parentNode.insertBefore(b,donde.nextSibling);
    else{b.style.position="fixed";b.style.right="6px";b.style.bottom="6px";b.style.zIndex="50";document.body.appendChild(b);}
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",poner); else poner();
})();
