/* Repo Radar Console Hub. ES5 for older console WebKit-based browsers. */
(function(){
 "use strict";
 var $=function(id){return document.getElementById(id);};
 var detector=window.RepoRadarConsoleDetect;
 var info=detector?detector.detect(navigator.userAgent):{model:"",firmware:"",userAgent:navigator.userAgent||""};
 var selected=info.model||"";
 var labels={
 en:{
  "nav-home":"← Return to catalog","hero-eyebrow":"CONSOLE · BROWSER · FIRMWARE",
  "main-title":"Explore your console browser.","hero-summary":"Identify your console browser where possible, check its reported firmware and find related open-source projects in Repo Radar.",
  "no-exploit":"Read-only diagnostics. No exploits are executed.",
  "detector-kicker":"AUTOMATIC DETECTION","detection-title":"Your device",
  "device-label":"Detected console","firmware-label":"Firmware hint","browser-label":"Browser engine hint",
  "notice-ua":"Detection uses your browser's user-agent string. It may be missing, modified or inaccurate. Firmware is never confirmed by a webpage alone.",
  "selector-kicker":"CHOOSE A PLATFORM","select-title":"Console selection",
  "manual-firmware-label":"Firmware (optional)","detect-again":"Detect again",
  "results-kicker":"NEXT STEPS","results-title":"Explore related projects",
  "safety-note":"Repositories are maintained by third parties and may be outdated. A matching firmware number is not proof of compatibility. This website does not perform a jailbreak or bypass console security.",
  "footer-tagline":"Independent open-source project catalog",
  unknown:"Not detected",unknownFirmware:"Not available",unverified:"User-agent hint only",
  checkManually:"Check the firmware in your console settings before relying on this hint.",
  maybeWebKit:"WebKit reported",otherEngine:"Not verified",
  select:"Choose your console",selectedCaption:"SELECTED CONSOLE",
  projectButton:"Browse projects in Repo Radar ↗",validation:"Enter a firmware version such as 9.00 or 14.02.",
  firmwareField:"Firmware for reference",noVersion:"Not provided",labelAuto:"Detected from browser",labelManual:"Entered manually",
  generic:"Find console-related WebKit projects in the Repo Radar catalog. Repository descriptions are third-party claims and are not an independent safety or compatibility check.",
  noBrowserGuarantee:"This console's browser may not use WebKit, or may not expose an identifiable user-agent. Check compatibility manually."
 },
 ru:{
  "nav-home":"← Вернуться в каталог","hero-eyebrow":"КОНСОЛЬ · БРАУЗЕР · ПРОШИВКА",
  "main-title":"Исследуй браузер своей консоли.","hero-summary":"Определи браузер консоли, если это возможно, проверь указанную прошивку и найди связанные проекты в Repo Radar.",
  "no-exploit":"Безопасная диагностика. Эксплойты не запускаются.",
  "detector-kicker":"АВТООПРЕДЕЛЕНИЕ","detection-title":"Твоё устройство",
  "device-label":"Обнаруженная консоль","firmware-label":"Версия прошивки","browser-label":"Движок браузера",
  "notice-ua":"Определение основано на User-Agent браузера. Эти данные могут быть скрыты или неточны. Сайт не может достоверно подтвердить прошивку.",
  "selector-kicker":"ВЫБЕРИ ПЛАТФОРМУ","select-title":"Выбор консоли",
  "manual-firmware-label":"Версия прошивки (необязательно)","detect-again":"Определить заново",
  "results-kicker":"СЛЕДУЮЩИЙ ШАГ","results-title":"Подходящие проекты",
  "safety-note":"Проекты созданы сторонними разработчиками и могут устареть. Совпадение версии прошивки не гарантирует совместимость. Сайт не выполняет джейлбрейк и не обходит защиту консоли.",
  "footer-tagline":"Независимый каталог открытых проектов",
  unknown:"Не определено",unknownFirmware:"Неизвестна",unverified:"Только подсказка User-Agent",
  checkManually:"Уточни настоящую прошивку в настройках консоли.",
  maybeWebKit:"Обнаружено упоминание WebKit",otherEngine:"Не подтверждён",
  select:"Выбери консоль",selectedCaption:"ВЫБРАННАЯ КОНСОЛЬ",
  projectButton:"Найти проекты в Repo Radar ↗",validation:"Укажи версию прошивки, например 9.00 или 14.02.",
  firmwareField:"Прошивка для справки",noVersion:"Не указана",labelAuto:"Определено браузером",labelManual:"Указано вручную",
  generic:"Открой подборку консольных WebKit-проектов в каталоге Repo Radar. Описания сторонних репозиториев не являются независимым подтверждением безопасности или совместимости.",
  noBrowserGuarantee:"Браузер этой консоли не обязательно использует WebKit и может не передавать сведения об устройстве. Проверяй совместимость самостоятельно."
 }};
 var lang="en";try{if(localStorage.getItem("radar-locale")==="ru")lang="ru";}catch(e){}
 var words=labels[lang];
 function setText(id,value){var element=$(id);if(element)element.textContent=value;}
 for(var key in words)if(Object.prototype.hasOwnProperty.call(words,key)&&$(key)&&key!=="main-title")setText(key,words[key]);
 var heading=$("main-title"),em=document.createElement("em");
 heading.textContent=lang==="ru"?"Исследуй браузер ":"Explore your ";
 em.textContent=lang==="ru"?"своей консоли.":"console browser.";
 heading.appendChild(em);
 function modelLabel(model){
  var items=detector?detector.models:[],i;
  for(i=0;i<items.length;i++)if(items[i].id===model)return items[i].label;
  return words.unknown;
 }
 function updateDetected(){
  setText("detected-console",info.model?modelLabel(info.model):words.unknown);
  setText("detected-firmware",info.firmware||words.unknownFirmware);
  setText("device-hint",info.model?words.unverified:"");
  setText("firmware-hint",words.checkManually);
  var webkit=/AppleWebKit\//i.test(info.userAgent||"");
  setText("detected-browser",webkit?words.maybeWebKit:words.otherEngine);
  setText("browser-hint",webkit?"User-Agent":"");
 }
 function selectModel(model){
  selected=model;
  var buttons=document.querySelectorAll("[data-console]"),i,b;
  for(i=0;i<buttons.length;i++){
   b=buttons[i];
   var active=b.getAttribute("data-console")===selected;
   b.className="console-choice"+(active?" active":"");
   b.setAttribute("aria-pressed",active?"true":"false");
  }
  renderSelection();
 }
 function renderSelection(){
  var firmwareInput=$("firmware-manual").value;
  var firmware=detector?detector.firmwareCheck(firmwareInput):"";
  var userSupplied=firmwareInput.replace(/\s/g,"").length>0;
  setText("firmware-validation",userSupplied&&!firmware?words.validation:"");
  setText("selected-caption",words.selectedCaption);
  setText("selected-title",selected?modelLabel(selected):words.select);
  setText("selected-description",(selected==="Xbox"||selected==="Nintendo Switch")?words.noBrowserGuarantee:words.generic);
  setText("selected-firmware",words.firmwareField+": "+(firmware||words.noVersion)+(firmware?" · "+(info.model===selected&&info.firmware===firmware?words.labelAuto:words.labelManual):""));
  var link=$("open-projects");
  if(selected){
   link.href="./?console="+encodeURIComponent(selected);
   link.className="primary-button";link.setAttribute("aria-disabled","false");
   link.textContent=words.projectButton;
  }else{
   link.href="./?category=console_webkit";
   link.className="primary-button";link.setAttribute("aria-disabled","false");
   link.textContent=lang==="ru"?"Посмотреть все консольные проекты ↗":"Browse all console projects ↗";
  }
 }
 var buttons=document.querySelectorAll("[data-console]"),j;
 for(j=0;j<buttons.length;j++)(function(b){
  b.onclick=function(){selectModel(b.getAttribute("data-console"));};
 })(buttons[j]);
 $("detect-again").onclick=function(){
  info=detector?detector.detect(navigator.userAgent):{model:"",firmware:"",userAgent:""};
  $("firmware-manual").value=info.firmware||"";
  updateDetected();selectModel(info.model||"");
 };
 $("firmware-manual").oninput=renderSelection;
 // If auto detection fails the visitor can still browse the complete catalog.
 $("firmware-manual").value=info.firmware||"";
 updateDetected();selectModel(selected);
}());