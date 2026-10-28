(function(){
  "use strict";
  var body=document.body;
  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("year").textContent=new Date().getFullYear();

  /* toast */
  var toastEl=document.getElementById("toast"),tt;
  function toast(m){toastEl.textContent=m;toastEl.classList.add("show");clearTimeout(tt);tt=setTimeout(function(){toastEl.classList.remove("show")},2000)}

  /* theme */
  var themeBtn=document.getElementById("themeBtn");
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

  /* mobile menu */
  var menuBtn=document.getElementById("menuBtn"),navLinks=document.getElementById("navLinks");
  function closeMenu(){navLinks.classList.remove("open");menuBtn.setAttribute("aria-expanded","false");menuBtn.setAttribute("aria-label","Open menu");menuBtn.textContent="☰"}
  menuBtn.addEventListener("click",function(){
    var o=navLinks.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded",String(o));
    menuBtn.setAttribute("aria-label",o?"Close menu":"Open menu");
    menuBtn.textContent=o?"×":"☰";
  });
  navLinks.querySelectorAll("a").forEach(function(a){a.addEventListener("click",closeMenu)});

  /* reveal */
  var rv=document.querySelectorAll(".reveal");
  if("IntersectionObserver" in window&&!reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.1});
    rv.forEach(function(el,i){el.style.transitionDelay=(i%3)*70+"ms";io.observe(el)});
  }else{rv.forEach(function(el){el.classList.add("in")})}

  /* meaning toggle */
  var meaning=document.getElementById("meaning"),mt=document.getElementById("meaningText");
  var ms=["“The real light”","“The flowing light”"],mi=0;
  meaning.addEventListener("click",function(){
    mt.classList.add("swap");
    setTimeout(function(){mi=(mi+1)%ms.length;mt.textContent=ms[mi];mt.classList.remove("swap")},240);
  });

  /* laziness meter */
  var fill=document.getElementById("barFill"),pct=document.getElementById("pct"),meter=document.getElementById("meter");
  function runMeter(){
    fill.style.width="90%";
    var s=null,d=reduce?1:1700;
    function step(ts){if(!s)s=ts;var p=Math.min((ts-s)/d,1);pct.textContent=Math.round((1-Math.pow(1-p,3))*90)+"%";if(p<1)requestAnimationFrame(step)}
    requestAnimationFrame(step);
  }
  if("IntersectionObserver" in window){
    var mo=new IntersectionObserver(function(e){if(e[0].isIntersecting){runMeter();mo.disconnect()}},{threshold:.5});
    mo.observe(meter);
  }else runMeter();

  /* mess cards */
  document.querySelectorAll(".mess-card").forEach(function(c){
    c.addEventListener("pointermove",function(e){var r=c.getBoundingClientRect();c.style.setProperty("--mx",(e.clientX-r.left)+"px");c.style.setProperty("--my",(e.clientY-r.top)+"px")});
    function t(){c.classList.toggle("open")}
    c.addEventListener("click",t);
    c.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();t()}});
  });

  /* mess counter */
  var cEl=document.getElementById("messCount"),n=0;
  try{n=parseInt(localStorage.getItem("rea-mess"),10)||0}catch(e){}
  cEl.textContent=n;
  var lines=["Noted. Again.","New one. Impressive.","Feature, not a bug.","Back up your files, Rea.","The router is watching.","Progress is progress."];
  document.getElementById("messBtn").addEventListener("click",function(){
    n++;cEl.textContent=n;
    try{localStorage.setItem("rea-mess",String(n))}catch(e){}
    toast(lines[n%lines.length]);
  });

  console.log("You opened the console. Congratulations.");
  console.log("There is probably nothing useful here.");
})();
