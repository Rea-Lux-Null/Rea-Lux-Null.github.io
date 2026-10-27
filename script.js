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

  /* flowing light (subtle) */
  var cv=document.getElementById("flow"),ctx=cv.getContext("2d");
  var W=0,H=0,mouse={x:0,y:0,tx:0,ty:0,on:false},running=true;
  function resize(){var d=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0)}
  resize();addEventListener("resize",function(){resize();if(reduce)draw(0)});
  addEventListener("pointermove",function(e){mouse.tx=e.clientX;mouse.ty=e.clientY;if(!mouse.on){mouse.x=mouse.tx;mouse.y=mouse.ty;mouse.on=true}});
  var rib=[
    {y:.22,amp:70,f:1.2,sp:.00026,h:200,a:.30},
    {y:.52,amp:95,f:.85,sp:-.0002,h:42,a:.26},
    {y:.78,amp:60,f:1.6,sp:.0003,h:200,a:.20}
  ];
  function draw(ts){
    if(!running)return;
    var light=body.classList.contains("light");
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation=light?"source-over":"lighter";
    var sh=(scrollY||0)*.12;
    rib.forEach(function(r){
      var by=H*r.y-sh,L=light?45:68;
      ctx.beginPath();
      for(var x=-10;x<=W+10;x+=8){
        var nx=x/W;
        var y=by+Math.sin(nx*Math.PI*2*r.f+ts*r.sp*6)*r.amp+Math.sin(nx*Math.PI*5+ts*r.sp*11)*r.amp*.16;
        if(mouse.on){var dx=x-mouse.x,dy=y-mouse.y;y-=dy*Math.exp(-(dx*dx+dy*dy)/52000)*.3}
        x===-10?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      var g=ctx.createLinearGradient(0,0,W,0);
      g.addColorStop(0,"hsla("+r.h+",90%,"+L+"%,0)");
      g.addColorStop(.5,"hsla("+r.h+",90%,"+L+"%,"+(light?r.a*.6:r.a)+")");
      g.addColorStop(1,"hsla("+r.h+",90%,"+L+"%,0)");
      ctx.strokeStyle=g;ctx.lineWidth=1.4;
      ctx.shadowBlur=light?0:14;ctx.shadowColor="hsla("+r.h+",95%,65%,.8)";
      ctx.stroke();
    });
    ctx.shadowBlur=0;
    if(mouse.on){
      mouse.x+=(mouse.tx-mouse.x)*.08;mouse.y+=(mouse.ty-mouse.y)*.08;
      var rg=ctx.createRadialGradient(mouse.x,mouse.y,0,mouse.x,mouse.y,200);
      if(light){rg.addColorStop(0,"rgba(255,196,80,.25)");rg.addColorStop(1,"rgba(255,196,80,0)")}
      else{rg.addColorStop(0,"rgba(255,217,138,.13)");rg.addColorStop(.6,"rgba(127,214,255,.04)");rg.addColorStop(1,"rgba(127,214,255,0)")}
      ctx.fillStyle=rg;ctx.fillRect(mouse.x-200,mouse.y-200,400,400);
    }
    if(!reduce)requestAnimationFrame(draw);
  }
  if(reduce)draw(0);else requestAnimationFrame(draw);
  document.addEventListener("visibilitychange",function(){
    if(document.hidden)running=false;
    else if(!running){running=true;if(!reduce)requestAnimationFrame(draw)}
  });

  console.log("You opened the console. Congratulations.");
  console.log("There is probably nothing useful here.");
})();
