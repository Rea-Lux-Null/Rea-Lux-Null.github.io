/* Flowing-light background: the ONE implementation used by the portfolio, the 404 page and the wiki.
   Usage: <canvas id="flow" aria-hidden="true" data-intensity="1"></canvas> + this script.
   data-intensity scales ribbon/glow opacity (1 = full strength, lower for long reading pages). */
(function(){
  "use strict";
  var cv=document.getElementById("flow");
  if(!cv||!cv.getContext)return;
  var ctx=cv.getContext("2d"),body=document.body;
  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var k=parseFloat(cv.getAttribute("data-intensity"));if(!(k>0))k=1;
  var W=0,H=0,mouse={x:0,y:0,tx:0,ty:0,on:false},running=true;
  var scrollNow=window.scrollY||0;           /* smoothed scroll position, so fast flicks glide */

  function resize(){var d=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0)}
  resize();
  addEventListener("resize",function(){resize();if(reduce)draw(0)});
  addEventListener("pointermove",function(e){mouse.tx=e.clientX;mouse.ty=e.clientY;if(!mouse.on){mouse.x=mouse.tx;mouse.y=mouse.ty;mouse.on=true}});

  /* h: 198 = light blue (Rea), 46 = yellow (Lux). par = how fast each ribbon drifts with scrolling (depth). */
  var rib=[
    {y:.14,amp:70,f:1.2, sp:.00026,h:198,a:.62,par:1.00},
    {y:.40,amp:95,f:.85, sp:-.0002,h:46, a:.56,par:1.30},
    {y:.66,amp:60,f:1.6, sp:.0003, h:198,a:.50,par:.75},
    {y:.88,amp:80,f:1.0, sp:-.00024,h:46,a:.46,par:1.10}
  ];

  function draw(ts){
    if(!running)return;
    var light=body.classList.contains("light");
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation=light?"source-over":"lighter";

    var target=window.scrollY||0;
    scrollNow+=(target-scrollNow)*(reduce?1:.14);
    if(Math.abs(target-scrollNow)<.1)scrollNow=target;

    rib.forEach(function(r){
      /* Parallax that WRAPS: the ribbon drifts up as you scroll and re-enters from the bottom,
         so a very long page never runs out of ribbons. The wrap happens fully off-screen. */
      var m=r.amp*1.4+34,span=H+2*m;
      var by=(((H*r.y-scrollNow*.12*r.par+m)%span)+span)%span-m;
      var L=light?40:62,S=100;
      ctx.beginPath();
      for(var x=-10;x<=W+10;x+=8){
        var nx=x/W;
        var y=by+Math.sin(nx*Math.PI*2*r.f+ts*r.sp*6)*r.amp+Math.sin(nx*Math.PI*5+ts*r.sp*11)*r.amp*.16;
        if(mouse.on){var dx=x-mouse.x,dy=y-mouse.y;y-=dy*Math.exp(-(dx*dx+dy*dy)/52000)*.3}
        x===-10?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      var a=Math.min(1,(light?r.a*.85:r.a)*k);
      var g=ctx.createLinearGradient(0,0,W,0);
      g.addColorStop(0,"hsla("+r.h+","+S+"%,"+L+"%,0)");
      g.addColorStop(.5,"hsla("+r.h+","+S+"%,"+L+"%,"+a+")");
      g.addColorStop(1,"hsla("+r.h+","+S+"%,"+L+"%,0)");
      ctx.strokeStyle=g;ctx.lineWidth=2;
      ctx.shadowBlur=light?0:18;ctx.shadowColor="hsla("+r.h+",100%,60%,"+Math.min(1,.9*k)+")";
      ctx.stroke();
    });
    ctx.shadowBlur=0;

    if(mouse.on){
      mouse.x+=(mouse.tx-mouse.x)*.08;mouse.y+=(mouse.ty-mouse.y)*.08;
      var rg=ctx.createRadialGradient(mouse.x,mouse.y,0,mouse.x,mouse.y,220);
      if(light){rg.addColorStop(0,"rgba(255,176,40,"+(.30*k)+")");rg.addColorStop(1,"rgba(255,176,40,0)")}
      else{rg.addColorStop(0,"rgba(255,210,74,"+(.20*k)+")");rg.addColorStop(.6,"rgba(79,195,255,"+(.07*k)+")");rg.addColorStop(1,"rgba(79,195,255,0)")}
      ctx.fillStyle=rg;ctx.fillRect(mouse.x-220,mouse.y-220,440,440);
    }
    if(!reduce)requestAnimationFrame(draw);
  }
  if(reduce)draw(0);else requestAnimationFrame(draw);

  /* reduced motion draws a still frame, so redraw when the theme or scroll position changes */
  if(reduce){
    addEventListener("scroll",function(){draw(0)},{passive:true});
    new MutationObserver(function(){draw(0)}).observe(body,{attributes:true,attributeFilter:["class"]});
  }
  document.addEventListener("visibilitychange",function(){
    if(document.hidden)running=false;
    else if(!running){running=true;if(!reduce)requestAnimationFrame(draw)}
  });
})();
