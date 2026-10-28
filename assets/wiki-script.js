(function(){
"use strict";
var RAW = document.getElementById("src").textContent;
var body = document.body;

/* ---------- helpers ---------- */
function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function slug(s){
  return s.toLowerCase().replace(/[—–]/g,"-").replace(/[^a-z0-9À-ɏ]+/g,"-").replace(/^-+|-+$/g,"");
}
function inline(s){
  var codes=[];
  s=esc(s).replace(/`([^`]+)`/g,function(_,c){codes.push(c);return "\u0000"+(codes.length-1)+"\u0000"});
  s=s.replace(/\*\*([^*]+?)\*\*/g,"<strong>$1</strong>");
  s=s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g,"$1<em>$2</em>");
  s=s.replace(/\u0000(\d+)\u0000/g,function(_,i){return "<code>"+codes[+i]+"</code>"});
  return s;
}
function plain(s){return s.replace(/^\|\s*:?-+.*$/gm,"").replace(/^\|\s*/gm,"").replace(/\s*\|\s*/g," · ").replace(/^>\s?/gm,"").replace(/^#+\s+/gm,"").replace(/[`*]/g,"")}

/* ---------- parse source into pages ---------- */
var lines = RAW.split(/\r?\n/);
var docTitle = "EXCEED/MEMENTO";
var pages = [];      // {title, slug, lines[], group, label, num, sub}
var cur = null;
lines.forEach(function(ln){
  var m;
  if((m=ln.match(/^# (.+)$/))){docTitle=m[1].trim();return}
  if((m=ln.match(/^## (.+)$/))){
    cur={title:m[1].trim(),lines:[]};
    cur.slug=slug(cur.title);
    pages.push(cur);return;
  }
  if(cur)cur.lines.push(ln);
});
var homeList = null;
pages = pages.filter(function(p){
  if(/^Main Season List/i.test(p.title)){homeList=p;return false}
  return true;
});
pages.forEach(function(p){
  // trim trailing blank / hr
  while(p.lines.length && /^\s*(---+)?\s*$/.test(p.lines[p.lines.length-1])) p.lines.pop();
  var m=p.title.match(/^Season (\d+)\s*[—-]\s*(.+)$/);
  if(m){
    p.group="Season";p.num=("0"+m[1]).slice(-2);p.label=m[2];
    // subtitle: first non-empty line if fully italic
    for(var i=0;i<p.lines.length;i++){
      if(!p.lines[i].trim())continue;
      var sm=p.lines[i].match(/^\*([^*]+)\*$/);
      if(sm){p.sub=sm[1];p.lines.splice(i,1)}
      break;
    }
    p.eyebrow="Season "+m[1];
    p.display=m[2];
  }else{
    p.label=p.title;p.display=p.title;
    if(/^Naming Notes/.test(p.title))p.group="Start";
    else if(/^The New Human World|^Films/.test(p.title))p.group="After Season 15 & Spin-offs";
    else p.group="World & Systems";
    p.eyebrow=p.group;
  }
  p.text=plain(p.lines.join("\n"));
});
var groupOrder=["Start","Season","After Season 15 & Spin-offs","World & Systems"];

/* ---------- markdown block renderer ---------- */
function renderMD(src, toc){
  var out=[],i=0,L=src;
  function para(buf){if(buf.length)out.push("<p>"+buf.map(inline).join("<br>")+"</p>")}
  var pbuf=[];
  function flushP(){para(pbuf);pbuf=[]}
  while(i<L.length){
    var ln=L[i],m;
    if(!ln.trim()){flushP();i++;continue}
    if((m=ln.match(/^(#{3,6})\s+(.+)$/))){
      flushP();
      var lvl=m[1].length,txt=m[2].trim(),id=slug(txt);
      toc.push({lvl:lvl,txt:txt,id:id});
      out.push('<h'+lvl+' id="'+id+'">'+inline(txt)+'<a class="anchor" href="#" data-a="'+id+'" aria-label="Link">#</a></h'+lvl+'>');
      i++;continue;
    }
    if(/^\s*---+\s*$/.test(ln)){flushP();out.push("<hr>");i++;continue}
    if(/^\|/.test(ln)){
      flushP();
      var rows=[];
      while(i<L.length&&/^\|/.test(L[i])){rows.push(L[i]);i++}
      var cells=function(r){return r.replace(/^\|/,"").replace(/\|\s*$/,"").split("|").map(function(c){return c.trim()})};
      var head=cells(rows[0]),h="<div class=\"tablewrap\"><table><thead><tr>"+head.map(function(c){return "<th>"+inline(c)+"</th>"}).join("")+"</tr></thead><tbody>";
      for(var r=1;r<rows.length;r++){
        if(/^\|\s*:?-+/.test(rows[r]))continue;
        h+="<tr>"+cells(rows[r]).map(function(c){return "<td>"+inline(c)+"</td>"}).join("")+"</tr>";
      }
      out.push(h+"</tbody></table></div>");continue;
    }
    if(/^>/.test(ln)){
      flushP();
      var paras=[],b=[];
      while(i<L.length&&/^>/.test(L[i])){
        var t=L[i].replace(/^>\s?/,"");
        if(!t.trim()){if(b.length)paras.push(b);b=[]}else b.push(t);
        i++;
      }
      if(b.length)paras.push(b);
      out.push("<blockquote>"+paras.map(function(pb){
        return "<p>"+pb.map(function(t){
          var sm=t.match(/^([^:.!?*]{1,38}):\s+(.*)$/);
          if(sm)return '<span class="spk">'+esc(sm[1])+':</span> '+inline(sm[2]);
          return inline(t);
        }).join("<br>")+"</p>";
      }).join("")+"</blockquote>");
      continue;
    }
    if(/^\s*[-*]\s+/.test(ln)){
      flushP();
      var items=[];
      while(i<L.length&&/^\s*[-*]\s+/.test(L[i])){items.push(L[i].replace(/^\s*[-*]\s+/,""));i++}
      out.push("<ul>"+items.map(function(t){return "<li>"+inline(t)+"</li>"}).join("")+"</ul>");
      continue;
    }
    var sm2=ln.match(/^\*([^*]+)\*$/);
    if(sm2&&!pbuf.length){out.push("<p><em>"+inline(sm2[1])+"</em></p>");i++;continue}
    pbuf.push(ln);i++;
  }
  flushP();
  return out.join("\n");
}

/* ---------- stats from source ---------- */
var seasonPages=pages.filter(function(p){return p.group==="Season"});
var filmPage=pages.filter(function(p){return /^Films/.test(p.title)})[0];
var filmCount=filmPage?filmPage.lines.filter(function(l){return /^### \d+\./.test(l)}).length:0;

/* ---------- sidebar ---------- */
var nav=document.getElementById("nav");
function buildNav(activeSlug,toc){
  var h='<div class="grp">Home</div><a href="#/" class="'+(activeSlug==="home"?"on":"")+'">Home &amp; season list</a>';
  groupOrder.forEach(function(g){
    var ps=pages.filter(function(p){return p.group===g});
    if(!ps.length)return;
    h+='<div class="grp">'+esc(g)+'</div>';
    ps.forEach(function(p){
      var on=p.slug===activeSlug;
      h+='<a href="#/'+p.slug+'" class="'+(on?"on":"")+'">'+(p.num?'<span class="n">'+p.num+'</span>':"")+esc(p.label)+'</a>';
      if(on&&toc&&toc.length){
        var subs=toc.filter(function(t){return t.lvl===3});
        if(subs.length)h+='<div class="sub">'+subs.map(function(t){return '<a href="#" data-a="'+t.id+'">'+esc(plain(t.txt))+'</a>'}).join("")+'</div>';
      }
    });
  });
  nav.innerHTML=h;
}

/* ---------- views ---------- */
var article=document.getElementById("article"),tocEl=document.getElementById("toc");
var order=[{slug:"home",title:"Home"}].concat(pages.map(function(p){return {slug:p.slug,title:p.title}}));

function pager(slugNow){
  var idx=order.findIndex(function(o){return o.slug===slugNow});
  var prev=order[idx-1],next=order[idx+1];
  function a(o,cls,lab){return o?'<a class="'+cls+'" href="#/'+(o.slug==="home"?"":o.slug)+'"><small>'+lab+'</small><span>'+esc(o.title)+'</span></a>':'<a class="ph"></a>'}
  return '<div class="pager">'+a(prev,"prev","← Previous")+a(next,"next","Next →")+'</div>';
}

function renderHome(){
  document.title=docTitle+" Wiki";
  var h='<div class="eyebrow">Wiki · original work</div><h1>'+esc(docTitle)+'</h1>';
  h+='<div class="hero-wiki"><p class="lead">An fantasy story about humans who become gods, and who learn that divine power does not erase human flaws.</p>';
  h+='<div class="stats"><div class="stat"><b>'+seasonPages.length+'</b><span>Seasons</span></div><div class="stat"><b>'+filmCount+'</b><span>Films &amp; spin-offs</span></div><div class="stat"><b>'+pages.length+'</b><span>Pages</span></div></div></div>';
  h+='<div class="note" id="note"><span><b>Warning:</b> This wiki contains sensitive contents, including violence, loss, and trauma. This work exists only in its outline form, covering the overall storyline, character names, and other general details. The full story has not been written.</span><button type="button" aria-label="Close" id="noteX">×</button></div>';
  h+='<h2 style="margin-top:8px">Season list</h2><div class="sgrid">'+seasonPages.map(function(p){
    return '<a class="scard" href="#/'+p.slug+'"><div class="num">SEASON '+p.num+'</div><h4>'+esc(p.display)+'</h4><p>'+esc(p.sub||"")+'</p></a>';
  }).join("")+'</div>';
  var others=pages.filter(function(p){return p.group!=="Season"});
  h+='<h2>Explore</h2><div class="qgrid">'+others.map(function(p){
    return '<a href="#/'+p.slug+'"><small>'+esc(p.group)+'</small>'+esc(p.title)+'</a>';
  }).join("")+'</div>';
  h+=pager("home");
  article.innerHTML=h;
  tocEl.innerHTML="";
  buildNav("home");
  var nx=document.getElementById("noteX");
  if(nx)nx.onclick=function(){document.getElementById("note").remove()};
  bindCards();
}
function bindCards(){
  article.querySelectorAll(".scard").forEach(function(c){
    c.addEventListener("pointermove",function(e){var r=c.getBoundingClientRect();c.style.setProperty("--mx",(e.clientX-r.left)+"px");c.style.setProperty("--my",(e.clientY-r.top)+"px")});
  });
}

function renderPage(p,term){
  document.title=p.title+" · "+docTitle+" Wiki";
  var toc=[];
  var html='<div class="eyebrow">'+esc(p.eyebrow)+'</div><h1>'+esc(p.display)+'</h1>';
  if(p.sub)html+='<div class="sub">'+esc(p.sub)+'</div>';
  html+=renderMD(p.lines,toc);
  html+=pager(p.slug);
  article.innerHTML=html;
  buildNav(p.slug,toc);
  // right toc
  if(toc.length){
    tocEl.innerHTML='<div class="t">On this page</div>'+toc.filter(function(t){return t.lvl<=4}).map(function(t){return '<a class="h'+t.lvl+'" href="#" data-a="'+t.id+'">'+esc(plain(t.txt))+'</a>'}).join("");
  }else tocEl.innerHTML="";
  if(term)highlight(article,term);
}

function highlight(root,term){
  var re=new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"gi"),first=null;
  var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);
  var nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(function(n){
    if(!re.test(n.nodeValue)){re.lastIndex=0;return}
    re.lastIndex=0;
    if(n.parentNode.closest("script,style,.anchor"))return;
    var frag=document.createDocumentFragment(),txt=n.nodeValue,last=0,m;
    while((m=re.exec(txt))){
      frag.appendChild(document.createTextNode(txt.slice(last,m.index)));
      var mk=document.createElement("mark");mk.textContent=m[0];frag.appendChild(mk);
      if(!first)first=mk;last=m.index+m[0].length;
      if(m[0].length===0)re.lastIndex++;
    }
    frag.appendChild(document.createTextNode(txt.slice(last)));
    n.parentNode.replaceChild(frag,n);
  });
  if(first)setTimeout(function(){first.scrollIntoView({block:"center"})},40);
}

/* ---------- routing ---------- */
var pendingTerm=null;
function route(){
  var h=location.hash.replace(/^#\/?/,"");
  body.classList.remove("menu");
  if(!h||h==="home"){renderHome();window.scrollTo(0,0);return}
  var p=pages.filter(function(x){return x.slug===h})[0];
  if(!p){renderHome();return}
  renderPage(p,pendingTerm);
  if(!pendingTerm)window.scrollTo(0,0);
  pendingTerm=null;
}
window.addEventListener("hashchange",route);

/* in-page anchors (delegated) */
document.addEventListener("click",function(e){
  var a=e.target.closest("[data-a]");
  if(!a)return;
  e.preventDefault();
  var el=document.getElementById(a.getAttribute("data-a"));
  if(el){el.scrollIntoView({behavior:"smooth",block:"start"});body.classList.remove("menu")}
});

/* ---------- search ---------- */
var q=document.getElementById("q"),res=document.getElementById("results");
function doSearch(){
  var term=q.value.trim();
  if(term.length<2){res.hidden=true;res.innerHTML="";return}
  var re=new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"i"),hits=[];
  pages.forEach(function(p){
    var t=p.title+"\n"+p.text,m=re.exec(t);
    if(!m)return;
    var all=(t.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"gi"))||[]).length;
    var s=Math.max(0,m.index-50),e=Math.min(t.length,m.index+term.length+80);
    var snip=(s>0?"…":"")+t.slice(s,e).replace(/\s+/g," ")+(e<t.length?"…":"");
    hits.push({p:p,all:all,snip:snip});
  });
  hits.sort(function(a,b){return b.all-a.all});
  if(!hits.length){res.hidden=false;res.innerHTML='<div class="none">No results for “'+esc(term)+'”.</div>';return}
  var hre=new RegExp("("+term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","gi");
  res.hidden=false;
  res.innerHTML=hits.slice(0,25).map(function(h){
    return '<a href="#/'+h.p.slug+'" data-term="'+esc(term)+'"><div class="rt">'+esc(h.p.title)+' · '+h.all+'×</div><div class="rs">'+esc(h.snip).replace(hre,"<mark>$1</mark>")+'</div></a>';
  }).join("");
}
q.addEventListener("input",doSearch);
res.addEventListener("click",function(e){
  var a=e.target.closest("a[data-term]");
  if(!a)return;
  pendingTerm=a.getAttribute("data-term");
  if(location.hash==="#/"+a.getAttribute("href").slice(2)){e.preventDefault();route()}
});
document.addEventListener("keydown",function(e){
  if(e.key==="/"&&document.activeElement!==q&&!/input|textarea/i.test(document.activeElement.tagName)){e.preventDefault();body.classList.add("menu");q.focus()}
  if(e.key==="Escape"){q.value="";doSearch();q.blur();body.classList.remove("menu")}
});

/* ---------- chrome ---------- */
var themeBtn=document.getElementById("themeBtn");
/* shared with the portfolio ("rea-theme"); falls back to the old wiki-only key */
try{if((localStorage.getItem("rea-theme")||localStorage.getItem("wiki-theme"))==="light")body.classList.add("light")}catch(e){}
function themeUI(){var l=body.classList.contains("light");themeBtn.textContent=l?"☾":"☼";document.querySelector('meta[name="theme-color"]').setAttribute("content",l?"#f7f6f1":"#0b0b0d")}
themeUI();
themeBtn.onclick=function(){body.classList.toggle("light");try{localStorage.setItem("rea-theme",body.classList.contains("light")?"light":"dark")}catch(e){}themeUI()};
document.getElementById("menuBtn").onclick=function(){body.classList.toggle("menu")};
document.getElementById("scrim").onclick=function(){body.classList.remove("menu")};

var prog=document.getElementById("progress");
function onScroll(){
  var h=document.documentElement,max=h.scrollHeight-h.clientHeight;
  prog.style.width=(max>0?(h.scrollTop/max)*100:0)+"%";
  // scroll-spy
  var links=tocEl.querySelectorAll("a[data-a]");
  if(!links.length)return;
  var curId=null;
  links.forEach(function(a){
    var el=document.getElementById(a.getAttribute("data-a"));
    if(el&&el.getBoundingClientRect().top<140)curId=a.getAttribute("data-a");
  });
  links.forEach(function(a){a.classList.toggle("on",a.getAttribute("data-a")===curId)});
}
window.addEventListener("scroll",onScroll,{passive:true});

route();
window.__wiki={pages:pages,seasonCount:seasonPages.length,filmCount:filmCount};
})();
