(function(){
  "use strict";
  var body=document.body;
  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(id){return document.getElementById(id)}

  /* opened from disk (file://): root-absolute links would point at the device's root */
  if(location.protocol==="file:"){
    document.querySelectorAll('a[href^="/"]').forEach(function(a){
      var h=a.getAttribute("href").replace(/^\//,"");
      a.setAttribute("href",h===""||h.charAt(0)==="#"?"index.html"+h:h);
    });
  }
  $("year").textContent=new Date().getFullYear();

  /* toast */
  var toastEl=$("toast"),tt;
  function toast(m){toastEl.textContent=m;toastEl.classList.add("show");clearTimeout(tt);tt=setTimeout(function(){toastEl.classList.remove("show")},2400)}

  /* theme (same storage key as the main page, so the choice carries over) */
  var themeBtn=$("themeBtn");
  try{if(localStorage.getItem("rea-theme")==="light")body.classList.add("light")}catch(e){}
  function refreshTheme(){
    var l=body.classList.contains("light");
    themeBtn.textContent=l?"☾":"☼";
    themeBtn.setAttribute("aria-label",l?"Switch to dark mode":"Switch to light mode");
    document.querySelector('meta[name="theme-color"]').setAttribute("content",l?"#f7f6f1":"#0b0b0d");
  }
  refreshTheme();
  themeBtn.addEventListener("click",function(){
    body.classList.toggle("light");
    try{localStorage.setItem("rea-theme",body.classList.contains("light")?"light":"dark")}catch(e){}
    refreshTheme();
  });

  /* show the missing path (textContent only, so it can never inject HTML) */
  var path=location.pathname+location.search+location.hash;
  $("path").textContent=path.length>160?path.slice(0,157)+"…":path;

  /* messes counter: shares the key with the main page */
  var n=0;
  function readN(){try{n=parseInt(localStorage.getItem("rea-mess"),10)||0}catch(e){n=0}}
  function writeN(){try{localStorage.setItem("rea-mess",String(n))}catch(e){}}
  readN();
  $("messNow").textContent=n;

  /* whose fault is it */
  var suspects=[
    ["Rea","Typo. Probably mine."],
    ["You","Did you type that by hand?"],
    ["The router","It's always the router."],
    ["My SSD","It's dying, give it a break."],
    ["Old link","Links rot. It happens."],
    ["Nobody","Plot twist: this page never existed."]
  ];
  var si=0,counted=false;
  $("blameBtn").addEventListener("click",function(){
    var s=suspects[si%suspects.length];si++;
    $("suspect").textContent=s[0];
    toast(s[1]);
    var ch=$("char");if(ch&&!reduce){ch.classList.remove("nudge");void ch.offsetWidth;ch.classList.add("nudge")}
    if(s[0]==="Rea"&&!counted){counted=true;n++;writeN();$("messNow").textContent=n;}
  });

  /* flicker the zero: the light is "unstable" */
  var zero=$("zero");
  function flick(){
    if(reduce)return;
    zero.classList.remove("flicker");
    void zero.offsetWidth;
    zero.classList.add("flicker");
  }
  zero.addEventListener("click",flick);
  zero.setAttribute("role","button");
  zero.setAttribute("tabindex","0");
  zero.setAttribute("aria-label","Flicker the light");
  zero.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();flick()}});
  setTimeout(flick,500);
  if(!reduce)setInterval(flick,9000);

  console.log("404. You opened the console. Of course you did.");
})();
