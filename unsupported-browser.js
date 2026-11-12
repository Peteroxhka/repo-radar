(function(){
 function showNotice(){
  var panel=document.createElement("div");
  panel.className="compat-notice";
  panel.setAttribute("role","alert");
  panel.appendChild(document.createTextNode("This browser is too old to run Repo Radar. Please update it, or visit "));
  var link=document.createElement("a");
  link.href="https://github.com/Peteroxhka/repo-radar";
  link.textContent="Repo Radar on GitHub";
  panel.appendChild(link);
  if(document.body)document.body.insertBefore(panel,document.body.firstChild);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",showNotice);
 else showNotice();
})();
