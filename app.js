import {normalizeSearch, mergeMessages, isCurrentChat, dmConversationFilter, attachmentMime} from "./lib/core.mjs";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.57.0";
import {SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, DATABASE_SCHEMA} from "./config.js";
const sb=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{db:{schema:DATABASE_SCHEMA},auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const translations={
ru:{discover:"Обзор",messages:"Сообщения",darkTheme:"Тёмная",lightTheme:"Светлая",cosmicTheme:"Космос",loadMore:"Показать ещё",signIn:"Войти",eyebrow:"ОТКРЫТЫЙ КОД. НОВЫЕ ИДЕИ.",headline:"Находи свой следующий <em>любимый проект.</em>",tagline:"Лучшие открытые репозитории GitHub в одной красивой ленте. Обновление каждые шесть часов.",explore:"Исследовать проекты",projects:"проектов",trending:"Проекты, достойные внимания",search:"Поиск",allLanguages:"Все языки",language:"Язык программирования",loading:"Загружаем проекты...",community:"СООБЩЕСТВО",yourMessages:"Личные сообщения",messagesIntro:"Общайся и делись файлами. Без звонков.",joinConversation:"Присоединяйся к общению",loginToChat:"Войди или зарегистрируйся, чтобы писать другим пользователям.",conversations:"Диалоги",findUser:"Найти пользователя",startChat:"Начать диалог",chooseChat:"Выбери собеседника",send:"Отправить",attachmentLimit:"Вложения до 25 МБ, без исполняемых файлов.",welcomeBack:"Добро пожаловать",authIntro:"Сохраняй профиль и общайся с разработчиками.",continueGithub:"Продолжить с GitHub",orEmail:"или по электронной почте",username:"Имя пользователя",password:"Пароль",needAccount:"Нет аккаунта? Зарегистрироваться",alreadyAccount:"Уже есть аккаунт? Войти",register:"Зарегистрироваться",account:"АККАУНТ",yourProfile:"Твой профиль",uploadAvatar:"Загрузить фото профиля (до 5 МБ)",githubAvatarHint:"Для GitHub-аккаунта изображение меняется в настройках GitHub.",saveChanges:"Сохранить",signOut:"Выйти",footerNote:"Независимый каталог открытого кода",noProjects:"Ничего не найдено",noDescription:"Без описания",all:"Все",programming:"Код",tools:"Инструменты",ai:"ИИ",data:"Данные",web:"Веб",learning:"Обучение",games:"Игры",repoSearch:"Поиск по проектам...",userSearch:"Никнейм пользователя...",messagePlaceholder:"Написать сообщение...",noChat:"Пока нет диалогов",userNotFound:"Пользователь не найден",sameUser:"Нельзя начать диалог с собой",fileReady:"Файл выбран",fileTooLarge:"Файл превышает лимит 25 МБ",unsupportedFile:"Этот тип файла недоступен для загрузки",emailVerify:"Проверь почту для подтверждения регистрации",saved:"Сохранено",busy:"Загрузка...",error:"Ошибка",configNeeded:"Нужна настройка базы по инструкции README",previewOnly:"Для отправки сообщений настрой базу Supabase",githubUser:"Аккаунт GitHub",emailUser:"Email-аккаунт"},
en:{discover:"Discover",messages:"Messages",darkTheme:"Dark",lightTheme:"Light",cosmicTheme:"Cosmic",loadMore:"Load more",signIn:"Sign in",eyebrow:"OPEN SOURCE. NEW IDEAS.",headline:"Find your next <em>favorite project.</em>",tagline:"Explore standout open-source repositories from GitHub. Refreshed every six hours.",explore:"Explore projects",projects:"projects",trending:"Projects worth exploring",search:"Search",allLanguages:"All languages",language:"Programming language",loading:"Loading repositories...",community:"COMMUNITY",yourMessages:"Direct messages",messagesIntro:"Chat and share files. No calls.",joinConversation:"Join the conversation",loginToChat:"Sign in or sign up to message other users.",conversations:"Conversations",findUser:"Find a user",startChat:"Start chat",chooseChat:"Choose a conversation",send:"Send",attachmentLimit:"Attachments up to 25 MB; executable files are blocked.",welcomeBack:"Welcome back",authIntro:"Create your profile and connect with developers.",continueGithub:"Continue with GitHub",orEmail:"or with email",username:"Username",password:"Password",needAccount:"No account? Sign up",alreadyAccount:"Already registered? Sign in",register:"Sign up",account:"ACCOUNT",yourProfile:"Your profile",uploadAvatar:"Upload avatar (up to 5 MB)",githubAvatarHint:"GitHub users change their avatar in GitHub settings.",saveChanges:"Save changes",signOut:"Sign out",footerNote:"Independent open-source discovery",noProjects:"No projects found",noDescription:"No description",all:"All",programming:"Code",tools:"Tools",ai:"AI",data:"Data",web:"Web",learning:"Learning",games:"Games",repoSearch:"Search repositories...",userSearch:"Username...",messagePlaceholder:"Write a message...",noChat:"No conversations yet",userNotFound:"User not found",sameUser:"You can't chat with yourself",fileReady:"File selected",fileTooLarge:"File exceeds 25 MB",unsupportedFile:"This file type is not allowed",emailVerify:"Check your email to confirm your registration",saved:"Saved",busy:"Loading...",error:"Error",configNeeded:"Configure Supabase using the README",previewOnly:"Configure Supabase to send messages",githubUser:"GitHub account",emailUser:"Email account"},
es:{discover:"Explorar",messages:"Mensajes",signIn:"Entrar",darkTheme:"Oscuro",lightTheme:"Claro",cosmicTheme:"Cósmico",eyebrow:"CÓDIGO ABIERTO. NUEVAS IDEAS.",headline:"Descubre tu próximo <em>proyecto favorito.</em>",tagline:"Repositorios destacados de GitHub. Actualizados cada seis horas.",explore:"Explorar proyectos",projects:"proyectos",trending:"Proyectos destacados",all:"Todos",allLanguages:"Todos los lenguajes",welcomeBack:"Bienvenido",yourMessages:"Mensajes privados",send:"Enviar",register:"Registrarse",username:"Usuario",password:"Contraseña",signOut:"Salir",yourProfile:"Tu perfil",saveChanges:"Guardar",startChat:"Iniciar chat"},
fr:{discover:"Explorer",messages:"Messages",signIn:"Connexion",darkTheme:"Sombre",lightTheme:"Clair",cosmicTheme:"Cosmique",eyebrow:"OPEN SOURCE. NOUVELLES IDÉES.",headline:"Trouvez votre prochain <em>projet préféré.</em>",tagline:"Les meilleurs projets GitHub, mis à jour toutes les six heures.",explore:"Explorer",projects:"projets",trending:"Projets à découvrir",all:"Tous",welcomeBack:"Bienvenue",yourMessages:"Messages privés",send:"Envoyer",register:"S'inscrire",username:"Utilisateur",password:"Mot de passe",signOut:"Déconnexion",yourProfile:"Votre profil",saveChanges:"Enregistrer",startChat:"Démarrer un chat"},
de:{discover:"Entdecken",messages:"Nachrichten",signIn:"Anmelden",darkTheme:"Dunkel",lightTheme:"Hell",cosmicTheme:"Kosmos",eyebrow:"OPEN SOURCE. NEUE IDEEN.",headline:"Finde dein nächstes <em>Lieblingsprojekt.</em>",tagline:"Entdecke GitHub-Projekte. Alle sechs Stunden aktualisiert.",explore:"Projekte entdecken",projects:"Projekte",trending:"Entdeckenswerte Projekte",all:"Alle",welcomeBack:"Willkommen",yourMessages:"Direktnachrichten",send:"Senden",register:"Registrieren",username:"Benutzername",password:"Passwort",signOut:"Abmelden",yourProfile:"Dein Profil",saveChanges:"Speichern",startChat:"Chat starten"},
pt:{discover:"Explorar",messages:"Mensagens",signIn:"Entrar",darkTheme:"Escuro",lightTheme:"Claro",cosmicTheme:"Cósmico",eyebrow:"CÓDIGO ABERTO. NOVAS IDEIAS.",headline:"Encontre seu próximo <em>projeto favorito.</em>",tagline:"Projetos do GitHub atualizados a cada seis horas.",explore:"Explorar projetos",projects:"projetos",trending:"Projetos interessantes",all:"Todos",welcomeBack:"Bem-vindo",yourMessages:"Mensagens diretas",send:"Enviar",register:"Cadastrar",username:"Usuário",password:"Senha",signOut:"Sair",yourProfile:"Seu perfil",saveChanges:"Salvar",startChat:"Iniciar conversa"},
zh:{discover:"发现",messages:"消息",signIn:"登录",darkTheme:"深色",lightTheme:"浅色",cosmicTheme:"宇宙",eyebrow:"开源代码 · 全新创意",headline:"发现下一个<em>心仪项目。</em>",tagline:"探索 GitHub 开源项目，每六小时更新。",explore:"探索项目",projects:"个项目",trending:"值得关注的项目",all:"全部",welcomeBack:"欢迎回来",yourMessages:"私信",send:"发送",register:"注册",username:"用户名",password:"密码",signOut:"退出登录",yourProfile:"我的资料",saveChanges:"保存",startChat:"开始聊天"},
ja:{discover:"探す",messages:"メッセージ",signIn:"ログイン",darkTheme:"ダーク",lightTheme:"ライト",cosmicTheme:"コスモ",eyebrow:"オープンソース・新しいアイデア",headline:"次のお気に入りの<em>プロジェクトを発見。</em>",tagline:"GitHub の注目リポジトリ。6時間ごとに更新。",explore:"プロジェクトを探す",projects:"件",trending:"注目のプロジェクト",all:"すべて",welcomeBack:"ようこそ",yourMessages:"ダイレクトメッセージ",send:"送信",register:"登録",username:"ユーザー名",password:"パスワード",signOut:"ログアウト",yourProfile:"プロフィール",saveChanges:"保存",startChat:"チャットを開始"},
ko:{discover:"탐색",messages:"메시지",signIn:"로그인",darkTheme:"다크",lightTheme:"라이트",cosmicTheme:"우주",eyebrow:"오픈 소스. 새로운 아이디어.",headline:"다음 <em>즐겨찾는 프로젝트</em>를 찾아보세요.",tagline:"GitHub 오픈 소스 프로젝트를 6시간마다 업데이트합니다.",explore:"프로젝트 탐색",projects:"프로젝트",trending:"주목할 프로젝트",all:"전체",welcomeBack:"환영합니다",yourMessages:"다이렉트 메시지",send:"보내기",register:"가입",username:"사용자 이름",password:"비밀번호",signOut:"로그아웃",yourProfile:"프로필",saveChanges:"저장",startChat:"대화 시작"},
ar:{discover:"استكشف",messages:"الرسائل",signIn:"دخول",darkTheme:"داكن",lightTheme:"فاتح",cosmicTheme:"فضائي",eyebrow:"مصدر مفتوح. أفكار جديدة.",headline:"اكتشف <em>مشروعك المفضل التالي.</em>",tagline:"مشاريع مفتوحة المصدر من GitHub تتجدد كل ست ساعات.",explore:"استكشف المشاريع",projects:"مشروع",trending:"مشاريع تستحق الاستكشاف",all:"الكل",welcomeBack:"مرحباً",yourMessages:"رسائل خاصة",send:"إرسال",register:"إنشاء حساب",username:"اسم المستخدم",password:"كلمة المرور",signOut:"خروج",yourProfile:"ملفك الشخصي",saveChanges:"حفظ",startChat:"بدء محادثة"},
hi:{discover:"खोजें",messages:"संदेश",signIn:"लॉग इन",darkTheme:"डार्क",lightTheme:"लाइट",cosmicTheme:"कॉस्मिक",eyebrow:"ओपन सोर्स. नए विचार.",headline:"अपना अगला <em>पसंदीदा प्रोजेक्ट</em> खोजें।",tagline:"GitHub प्रोजेक्ट हर छह घंटे में अपडेट होते हैं।",explore:"प्रोजेक्ट खोजें",projects:"प्रोजेक्ट",trending:"देखने लायक प्रोजेक्ट",all:"सभी",welcomeBack:"स्वागत है",yourMessages:"निजी संदेश",send:"भेजें",register:"साइन अप",username:"यूज़रनेम",password:"पासवर्ड",signOut:"लॉग आउट",yourProfile:"प्रोफ़ाइल",saveChanges:"सहेजें",startChat:"चैट शुरू करें"},
tr:{discover:"Keşfet",messages:"Mesajlar",signIn:"Giriş",darkTheme:"Koyu",lightTheme:"Açık",cosmicTheme:"Kozmik",eyebrow:"AÇIK KAYNAK. YENİ FİKİRLER.",headline:"Yeni <em>favori projenizi</em> bulun.",tagline:"GitHub projeleri altı saatte bir güncellenir.",explore:"Projeleri keşfet",projects:"proje",trending:"Öne çıkan projeler",all:"Tümü",welcomeBack:"Hoş geldiniz",yourMessages:"Özel mesajlar",send:"Gönder",register:"Kaydol",username:"Kullanıcı adı",password:"Şifre",signOut:"Çıkış",yourProfile:"Profil",saveChanges:"Kaydet",startChat:"Sohbet başlat"}
};
const categoryKeys=["all","programming","tools","ai","data","web","learning","games","other"];
const localeNames={ru:"Русский",en:"English",es:"Español",fr:"Français",de:"Deutsch",pt:"Português",zh:"中文",ja:"日本語",ko:"한국어",ar:"العربية",hi:"हिन्दी",tr:"Türkçe"};
const allowedExt=new Set(["jpg","jpeg","png","webp","gif","bmp","heic","mp4","webm","mov","m4v","mp3","ogg","wav","m4a","aac","flac","pdf","txt","md","csv","json","doc","docx","xls","xlsx","ppt","pptx","odt","ods","odp","zip","7z","rar"]);
const blockedMime=/x-msdownload|x-executable|x-sh|x-bat|x-dosexec|javascript|text\/html|svg\+xml/i;
let locale=localStorage.getItem("radar-locale")||((navigator.language||"ru").slice(0,2));
if(!translations[locale])locale="en";
let theme=localStorage.getItem("radar-theme")||"dark";if(!["dark","light","cosmic"].includes(theme))theme="dark";
let state={chatEpoch:0,messageBusy:false,historyCursor:null,historyMore:false,contactRequest:0,category:"all",language:"",search:"",user:null,profile:null,peer:null,allRows:[],totalCount:0,catalogTotal:0,categoryCounts:{},categoryCountsLoaded:false,hasMore:true,loading:false,languageOptions:[],languageOptionsLoaded:false,listRequestId:0,searchTimer:null,seen:new Map(),sub:null,refreshTimer:null,register:false};
const categoryLabels={ru:"Без категории",en:"Unclassified",es:"Sin categoría",fr:"Sans catégorie",de:"Nicht kategorisiert",pt:"Sem categoria",zh:"未分类",ja:"未分類",ko:"미분류",ar:"غير مصنف",hi:"अवर्गीकृत",tr:"Kategorisiz"};
Object.assign(translations.ru,{olderMessages:"Предыдущие сообщения",ps4Title:"Мир PlayStation 4",ps4Intro:"Инструменты разработки, эмуляция и проекты сообщества PS4.",ps4Source:"Открыть репозиторий",ps4Search:"Найти PS4 в каталоге",ps4Reference:"Проект из твоей подборки",ps4Sdk:"Открытый модульный SDK для разработки под PS4.",ps4Toolchain:"Инструменты и примеры для создания домашних приложений PS4.",ps4Emulator:"Эмулятор PlayStation 4 для компьютера.",cleanupFailed:"Сообщение не отправлено. Не удалось удалить вложение из хранилища.",messageTooLong:"Сообщение не должно превышать 4000 символов."});
Object.assign(translations.en,{olderMessages:"Older messages",ps4Title:"The PlayStation 4 world",ps4Intro:"Development tools, emulation and PS4 community projects.",ps4Source:"Open repository",ps4Search:"Find PS4 in the catalog",ps4Reference:"Project from your collection",ps4Sdk:"An open modular SDK for PS4 development.",ps4Toolchain:"Tools and examples for building PS4 homebrew applications.",ps4Emulator:"A PlayStation 4 emulator for desktop computers.",cleanupFailed:"Message not sent. The attachment could not be removed from storage.",messageTooLong:"Messages must not exceed 4000 characters."});
function t(k){if(k==="other")return categoryLabels[locale]??"Unclassified";return translations[locale]?.[k]??translations.en[k]??k;}
function setStatus(id,message,isError=false){const el=$(id);if(!el)return;el.textContent=message;el.classList.toggle("error",isError);}
function safeErr(e){console.error("Repo Radar:",e);return e?.message||t("error");}
function localized(){document.documentElement.lang=locale;document.documentElement.dir=locale==="ar"?"rtl":"ltr";
document.querySelectorAll("[data-i18n]").forEach(el=>{const key=el.dataset.i18n;if(key==="headline")el.innerHTML=t(key);else el.textContent=t(key);});
$("repo-search").placeholder=t("repoSearch");$("user-search").placeholder=t("userSearch");$("message-input").placeholder=t("messagePlaceholder");if($("language").options.length)$("language").options[0].textContent=t("allLanguages");
$("auth-title").textContent=state.register?t("register"):t("welcomeBack");$("auth-submit").textContent=state.register?t("register"):t("signIn");$("auth-switch").textContent=state.register?t("alreadyAccount"):t("needAccount");
$("locale").value=locale;renderCategories();renderRepos();}
function themeApply(){document.body.dataset.theme=theme;$("theme").value=theme;localStorage.setItem("radar-theme",theme);}
for(const [code,name] of Object.entries(localeNames)){$("locale").add(new Option(name,code));}
$("locale").addEventListener("change",e=>{locale=e.target.value;localStorage.setItem("radar-locale",locale);localized();});
$("theme").addEventListener("change",e=>{theme=e.target.value;themeApply();});
themeApply();
const number=n=>n>=1000?(n/1000).toFixed(1)+"k":String(n??0);
function renderCategories(){$("categories").replaceChildren(...categoryKeys.map(key=>{const b=document.createElement("button");b.className="chip"+(state.category===key?" active":"");const count=key==="all"?state.catalogTotal:(state.categoryCounts[key]??0);b.textContent=state.categoryCountsLoaded?`${t(key)} · ${Number(count).toLocaleString(locale)}`:t(key);b.type="button";b.onclick=()=>{state.category=key;renderCategories();loadRepos(true);};return b;}));}
async function updateCategoryCounts(){if(state.categoryCountsLoaded)return;try{const{data,error}=await sb.rpc("list_repo_category_counts");if(error)throw error;state.categoryCounts=Object.fromEntries((data||[]).map(row=>[row.category,Number(row.total)]));state.catalogTotal=Object.values(state.categoryCounts).reduce((sum,value)=>sum+value,0);state.categoryCountsLoaded=true;renderCategories();}catch(error){console.warn("Repository category counts unavailable:",error.message);state.categoryCountsLoaded=false;}}
const REPO_PAGE_SIZE=48;
async function updateLanguageOptions(){if(!state.languageOptionsLoaded){const{data,error}=await sb.rpc("list_repo_languages");if(error){console.warn("Language list unavailable:",error.message);state.languageOptions=[...new Set(state.allRows.map(r=>r.language).filter(Boolean))].sort((a,b)=>a.localeCompare(b));}else{state.languageOptions=(data||[]).map(row=>row.language).filter(Boolean);}state.languageOptionsLoaded=true;}const select=$("language"),current=state.language;const names=state.languageOptions.slice();if(current&&!names.includes(current))names.unshift(current);select.replaceChildren(new Option(t("allLanguages"),""));for(const name of names)select.add(new Option(name,name));select.value=current;}
function renderRepos(){const rows=state.allRows;const frag=document.createDocumentFragment();if(!rows.length){const empty=document.createElement("div");empty.className="empty";empty.textContent=t("noProjects");frag.append(empty);}
for(const r of rows){const card=document.createElement("article");card.className="repo-card";const title=document.createElement("a");title.className="repo-title";title.textContent=r.full_name;try{const url=new URL(r.html_url);if(url.protocol==="https:"&&url.hostname==="github.com"){title.href=url.href;title.target="_blank";title.rel="noopener noreferrer";}}catch{}const desc=document.createElement("p");desc.className="repo-desc";desc.textContent=r.description||t("noDescription");const meta=document.createElement("div");meta.className="repo-meta";
const things=[[r.language,"repo-tag"],["★ "+number(r.stars)],r.license_spdx?[r.license_spdx]:null,r.pushed_at?[new Date(r.pushed_at).toLocaleDateString(locale)]:null].filter(Boolean);
for(const [str,cls] of things){const item=document.createElement("span");if(cls)item.className=cls;item.textContent=str;meta.append(item);}card.append(title,desc,meta);frag.append(card);} $("grid").replaceChildren(frag);}
async function loadRepos(reset=true){
if(!reset&&(state.loading||!state.hasMore))return;
const requestId=++state.listRequestId;
state.loading=true;
if(reset){state.allRows=[];state.totalCount=0;state.hasMore=true;$("grid").replaceChildren();}
const offset=reset?0:state.allRows.length;
const more=$("load-more");more.disabled=true;
if(reset){const loading=document.createElement("p");loading.className="empty";loading.textContent=t("loading");$("grid").replaceChildren(loading);}
setStatus("status",t("loading"));
try{
await updateCategoryCounts();
if(requestId!==state.listRequestId)return;
let query=sb.from("repos").select("id,full_name,description,html_url,language,stars,license_spdx,category,pushed_at",{count:"exact"});
if(state.category!=="all")query=query.eq("category",state.category);
if(state.language)query=query.eq("language",state.language);
const term=normalizeSearch(state.search);
if(term)query=query.or(`full_name.ilike.%${term}%,description.ilike.%${term}%`);
query=query.order("stars",{ascending:false}).order("id",{ascending:false}).range(offset,offset+REPO_PAGE_SIZE-1);
const{data,error,count}=await query;
if(requestId!==state.listRequestId)return;
if(error)throw error;
const page=data||[];
state.allRows=reset?page:state.allRows.concat(page);
state.totalCount=Number(count??state.allRows.length);
state.hasMore=page.length===REPO_PAGE_SIZE&&state.allRows.length<state.totalCount;
$("repo-count").textContent=state.totalCount.toLocaleString(locale);
await updateLanguageOptions();
if(requestId!==state.listRequestId)return;
renderRepos();
more.hidden=!state.hasMore;$("load-more-wrap").hidden=!state.hasMore;
setStatus("status",`${state.allRows.length.toLocaleString(locale)} / ${state.totalCount.toLocaleString(locale)}`);
}
catch(e){
if(requestId!==state.listRequestId)return;
setStatus("status",safeErr(e),true);
more.hidden=!state.hasMore;$("load-more-wrap").hidden=!state.hasMore;
if(reset)$("grid").replaceChildren();
}
finally{
if(requestId===state.listRequestId){state.loading=false;more.disabled=false;}
}}

$("language").onchange=e=>{state.language=e.target.value;loadRepos(true);};
$("repo-search").oninput=e=>{state.search=e.target.value.trim();state.listRequestId+=1;state.loading=true;clearTimeout(state.searchTimer);state.searchTimer=setTimeout(()=>loadRepos(true),250);};
$("load-more").onclick=()=>loadRepos(false);
if("IntersectionObserver" in window){
const catalogObserver=new IntersectionObserver(entries=>{
if(!$("view-discover").classList.contains("hidden")&&entries.some(entry=>entry.isIntersecting)&&state.hasMore&&!state.loading)loadRepos(false);
},{root:null,rootMargin:"900px 0px 900px 0px",threshold:0});
catalogObserver.observe($("load-more-sentinel"));
}
function showTab(tab){
for(const name of ["discover","messages","ps4"]){$("view-"+name).classList.toggle("hidden",tab!==name);$("tab-"+name).classList.toggle("active",tab===name);}
if(tab==="messages"&&state.user)loadContacts();
}
$("tab-discover").onclick=()=>showTab("discover");$("tab-messages").onclick=()=>showTab("messages");$("tab-ps4").onclick=()=>showTab("ps4");
$("ps4-catalog-search").onclick=()=>{state.category="all";state.language="";state.search="ps4";$("repo-search").value="ps4";$("language").value="";renderCategories();showTab("discover");loadRepos(true);};
function openDialog(id){if(!$(id).open)$(id).showModal();}document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$(b.dataset.close).close());
// OAuth provider failures are returned through query/hash parameters. Display
// the explanation instead of silently landing on an unauthenticated home page.
function reportOAuthRedirectError(){
  const url=new URL(location.href);
  const hash=new URLSearchParams(url.hash.startsWith("#")?url.hash.slice(1):"");
  const kind=url.searchParams.get("error")||hash.get("error");
  if(!kind)return;
  const message=url.searchParams.get("error_description")||hash.get("error_description")||kind;
  setRegister(false);openDialog("auth-dialog");setStatus("auth-status",message,true);
  for(const key of ["error","error_code","error_description"]){url.searchParams.delete(key);hash.delete(key);}
  url.hash=hash.toString()?hash.toString():"";history.replaceState(null,"",url.href);
}
function setRegister(enabled){state.register=enabled;$("username-label").classList.toggle("hidden",!enabled);$("auth-username").required=enabled;$("auth-password").autocomplete=enabled?"new-password":"current-password";localized();}
$("auth-open").onclick=()=>{setRegister(false);openDialog("auth-dialog");};$("chat-login").onclick=()=>$("auth-open").click();
$("auth-switch").onclick=()=>{setRegister(!state.register);setStatus("auth-status","");};
$("github-login").onclick=async()=>{setStatus("auth-status",t("busy"));try{const{error}=await sb.auth.signInWithOAuth({provider:"github",options:{redirectTo:new URL("./",location.href).href,scopes:"read:user user:email"}});if(error)throw error;}catch(e){setStatus("auth-status",safeErr(e),true);}};
$("auth-form").onsubmit=async e=>{e.preventDefault();const email=$("auth-email").value.trim(),password=$("auth-password").value;const submit=$("auth-submit");submit.disabled=true;setStatus("auth-status",t("busy"));
try{if(state.register){const username=$("auth-username").value.trim().toLowerCase();if(!/^[a-z0-9_]{3,24}$/.test(username))throw Error("Use 3–24 Latin letters, numbers, or _");
const{data,error}=await sb.auth.signUp({email,password,options:{data:{username},emailRedirectTo:new URL("./",location.href).href}});if(error)throw error;
if(!data.session){setStatus("auth-status",t("emailVerify"));return;}}
else{const{error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;}
$("auth-dialog").close();$("auth-form").reset();setStatus("auth-status","");
}catch(err){setStatus("auth-status",safeErr(err),true);}finally{submit.disabled=false;}};
function avatar(el,url,fallback){el.replaceChildren();if(url){try{const u=new URL(url);if(u.protocol==="https:"){const img=document.createElement("img");img.src=u.href;img.alt="";img.onerror=()=>{el.textContent=fallback?.charAt(0).toUpperCase()||"R";};el.append(img);return;}}catch{}}el.textContent=fallback?.charAt(0).toUpperCase()||"R";}
function githubAccount(){return state.user?.app_metadata?.provider==="github"||state.user?.app_metadata?.providers?.includes("github");}
async function fetchProfile(){if(!state.user)return;const{data,error}=await sb.from("profiles").select("id,username,avatar_url").eq("id",state.user.id).maybeSingle();
if(error){setStatus("profile-status",t("configNeeded")+" ("+error.message+")",true);return;}
state.profile=data;if(!data){setStatus("profile-status",t("configNeeded"),true);return;}
$("top-username").textContent=data.username;$("profile-current-username").textContent=data.username;$("profile-username").value=data.username;
const githubAvatar=githubAccount()?state.user.user_metadata?.avatar_url:null;
avatar($("top-avatar"),githubAvatar||data.avatar_url,data.username);
avatar($("profile-avatar"),githubAvatar||data.avatar_url,data.username);
$("profile-provider").textContent=githubAccount()?t("githubUser"):t("emailUser");
$("avatar-upload-row").classList.toggle("hidden",githubAccount());$("avatar-github-note").classList.toggle("hidden",!githubAccount());}
$("profile-open").onclick=()=>{setStatus("profile-status","");openDialog("profile-dialog");};
$("profile-form").onsubmit=async e=>{e.preventDefault();if(!state.user||!state.profile)return;const button=$("profile-form").querySelector('button[type="submit"]');button.disabled=true;setStatus("profile-status",t("busy"));try{
const name=$("profile-username").value.trim().toLowerCase();if(!/^[a-z0-9_]{3,24}$/.test(name))throw Error("Use 3–24 Latin letters, numbers, or _");
let image=state.profile.avatar_url;const file=$("avatar-file").files[0];
if(file&&!githubAccount()){if(file.size>5*1024*1024||!["image/jpeg","image/png","image/webp","image/gif"].includes(file.type))throw Error(t("unsupportedFile"));const ext=file.type.split("/")[1]==="jpeg"?"jpg":file.type.split("/")[1];const path=state.user.id+"/"+crypto.randomUUID()+"."+ext;const {error:upErr}=await sb.storage.from("repo-radar-avatars").upload(path,file,{contentType:file.type,upsert:false});if(upErr)throw upErr;const{data}=sb.storage.from("repo-radar-avatars").getPublicUrl(path);image=data.publicUrl;}
const{error}=await sb.from("profiles").update({username:name,avatar_url:image}).eq("id",state.user.id);if(error)throw error;await fetchProfile();$("avatar-file").value="";setStatus("profile-status",t("saved"));}catch(err){setStatus("profile-status",safeErr(err),true);}finally{button.disabled=false;}};
$("signout").onclick=async()=>{const{error}=await sb.auth.signOut();if(error){setStatus("profile-status",safeErr(error),true);return;}$("profile-dialog").close();};
function stopChat(){setStatus("chat-status","");$("file-input").disabled=true;state.chatEpoch+=1;state.contactRequest+=1;state.messageBusy=false;state.historyCursor=null;state.historyMore=false;$("chat-history").hidden=true;$("message-input").value="";$("file-input").value="";setStatus("file-preview","");delete $("chat-messages").dataset.lastId;if(state.sub){sb.removeChannel(state.sub);state.sub=null;}if(state.refreshTimer){clearInterval(state.refreshTimer);state.refreshTimer=null;}state.peer=null;state.seen.clear();$("chat-messages").replaceChildren();$("conversation-list").replaceChildren();$("chat-partner").textContent=t("chooseChat");$("message-input").disabled=true;$("message-send").disabled=true;}
async function onSession(){const{data:{user}}=await sb.auth.getUser();const previous=state.user?.id;state.user=user||null;if(previous&&previous!==user?.id)stopChat();if(!user)stopChat();
$("auth-open").classList.toggle("hidden",!!user);$("profile-open").classList.toggle("hidden",!user);$("chat-guest").classList.toggle("hidden",!!user);$("chat-app").classList.toggle("hidden",!user);
if(user){await fetchProfile();if(!$("view-messages").classList.contains("hidden"))await loadContacts();}}
sb.auth.onAuthStateChange(()=>{setTimeout(()=>onSession().catch(e=>console.error(e)),0);});
async function findUsersById(ids){if(!ids.length)return new Map();const{data,error}=await sb.from("profiles").select("id,username,avatar_url").in("id",ids);if(error)throw error;return new Map((data||[]).map(u=>[u.id,u]));}
async function loadContacts(){
const userId=state.user?.id,request=++state.contactRequest;if(!userId)return;
const current=()=>state.user?.id===userId&&request===state.contactRequest;
try{
const ids=[];let offset=0;
// Page distinct peers on the server, rather than cutting off message history.
for(;;){
const {data,error}=await sb.rpc("list_dm_contacts",{page_offset:offset,page_size:100});
if(!current())return;
if(error){
// Compatibility with databases that have not applied the new RPC yet.
if(!["PGRST202","42883"].includes(error.code))throw error;
ids.length=0;let cursor=null;const unique=new Set();
for(;;){
let q=sb.from("direct_messages").select("id,sender_id,recipient_id").or("sender_id.eq."+userId+",recipient_id.eq."+userId).order("id",{ascending:true}).limit(500);
if(cursor)q=q.gt("id",cursor);
const result=await q;if(!current())return;if(result.error)throw result.error;
for(const m of result.data||[])unique.add(m.sender_id===userId?m.recipient_id:m.sender_id);
if((result.data||[]).length<500)break;cursor=result.data.at(-1).id;
}ids.push(...unique);break;
}
ids.push(...(data||[]).map(row=>row.peer_id));if((data||[]).length<100)break;offset+=100;
}
if(state.peer&&!ids.includes(state.peer.id))ids.unshift(state.peer.id);
const people=new Map();for(let i=0;i<ids.length;i+=100){for(const [id,p] of await findUsersById(ids.slice(i,i+100)))people.set(id,p);if(!current())return;}
$("conversation-list").replaceChildren(...ids.filter(id=>people.has(id)).map(id=>{
const p=people.get(id),b=document.createElement("button");b.type="button";b.className="conversation"+(state.peer?.id===id?" active":"");const av=document.createElement("span");av.className="conversation-mark";av.textContent=p.username[0]?.toUpperCase()||"?";const label=document.createElement("span");label.textContent=p.username;b.append(av,label);b.onclick=()=>selectPeer(p);return b;}));
if(!ids.length)$("conversation-list").textContent=t("noChat");
}catch(e){if(current())setStatus("find-status",safeErr(e),true);}}
$("find-user").onclick=async()=>{if(!state.user)return;const username=$("user-search").value.trim().toLowerCase();if(!/^[a-z0-9_]{3,24}$/.test(username)){setStatus("find-status",t("userNotFound"),true);return;}try{const{data,error}=await sb.from("profiles").select("id,username,avatar_url").eq("username",username).maybeSingle();if(error)throw error;if(!data){setStatus("find-status",t("userNotFound"),true);return;}if(data.id===state.user.id){setStatus("find-status",t("sameUser"),true);return;}setStatus("find-status","");await selectPeer(data);}catch(e){setStatus("find-status",safeErr(e),true);}};
async function selectPeer(person){
stopChat();state.peer=person;const epoch=state.chatEpoch,userId=state.user?.id;if(!userId)return;
$("chat-partner").textContent="@"+person.username;$("file-input").disabled=false;$("message-input").disabled=false;$("message-send").disabled=false;
const current=()=>isCurrentChat(state,epoch,userId,person.id);
// Install resources before awaiting requests: a new selection can always clean them up.
state.sub=sb.channel("radar-dm-"+userId+"-"+epoch).on("postgres_changes",{event:"INSERT",schema:"repo_radar",table:"direct_messages",filter:"recipient_id=eq."+userId},()=>{if(current()){loadMessages();loadContacts();}}).subscribe();
state.refreshTimer=setInterval(()=>{if(current()){loadMessages();loadContacts();}},12000);
await loadMessages();if(!current())return;await loadContacts();if(current())$("message-input").focus();
}
$("chat-history").onclick=()=>loadMessages(true);
async function loadMessages(older=false){
const userId=state.user?.id,peerId=state.peer?.id,epoch=state.chatEpoch;
if(!userId||!peerId||state.messageBusy||(older&&!state.historyMore))return;
const current=()=>isCurrentChat(state,epoch,userId,peerId);state.messageBusy=true;$("chat-history").disabled=true;
try{
const first=state.seen.size===0;
const latest=!first?Array.from(state.seen.values()).at(-1):null;
const before=older?state.historyCursor:null;
let q=sb.from("direct_messages").select("id,sender_id,recipient_id,content,file_path,file_name,file_type,file_size,created_at").or(dmConversationFilter(userId,peerId,older?null:latest,before)).order("created_at",{ascending:false}).order("id",{ascending:false});
const {data,error}=await q.limit(100);if(!current())return;if(error)throw error;
let page=data||[];
// Catch up all unseen messages after a suspended tab, without gaps over 100 rows.
if(!older&&!first&&page.length===100){
let tail=page.at(-1);
while(true){
const {data:batch,error:batchError}=await sb.from("direct_messages").select("id,sender_id,recipient_id,content,file_path,file_name,file_type,file_size,created_at").or(dmConversationFilter(userId,peerId,latest,tail)).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(100);
if(!current())return;if(batchError)throw batchError;page.push(...(batch||[]));if((batch||[]).length<100)break;tail=batch.at(-1);
}}
if(first||older){state.historyCursor=page.at(-1)||state.historyCursor;state.historyMore=page.length===100;}
const messages=mergeMessages(Array.from(state.seen.values()),page);state.seen=new Map(messages.map(m=>[m.id,m]));
const box=$("chat-messages"),height=box.scrollHeight,top=box.scrollTop,nearBottom=height-top-box.clientHeight<100;
const frag=document.createDocumentFragment();
for(const m of messages){const div=document.createElement("div");div.className="message"+(m.sender_id===userId?" mine":"");
if(m.content){const p=document.createElement("p");p.className="message-text";p.textContent=m.content;div.append(p);}
if(m.file_path){const a=document.createElement("button");a.className="attachment-link";a.textContent="📎 "+(m.file_name||"Attachment");a.type="button";a.onclick=async()=>{
// Open synchronously so mobile popup blockers do not discard the user gesture.
const win=window.open("about:blank","_blank");if(win)win.opener=null;
try{const{data:link,error:linkError}=await sb.storage.from("repo-radar-dm").createSignedUrl(m.file_path,60);if(linkError)throw linkError;if(win)win.location.replace(link.signedUrl);else location.assign(link.signedUrl);}catch(e){if(win)win.close();if(current())setStatus("chat-status",safeErr(e),true);}};div.append(a);}
const tm=document.createElement("div");tm.className="message-time";tm.textContent=new Date(m.created_at).toLocaleString(locale,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});div.append(tm);frag.append(div);}
box.replaceChildren(frag);if(older)box.scrollTop=top+box.scrollHeight-height;else if(first||nearBottom)box.scrollTop=box.scrollHeight;
$("chat-history").hidden=!state.historyMore;
}catch(e){if(current())setStatus("chat-status",safeErr(e),true);}finally{if(current()){state.messageBusy=false;$("chat-history").disabled=false;}}
}
$("file-input").onchange=()=>{const file=$("file-input").files[0];setStatus("file-preview",file?("📎 "+file.name+" ("+Math.ceil(file.size/1024)+" KB)"):"");};
$("message-form").onsubmit=async e=>{e.preventDefault();const peer=state.peer,user=state.user;if(!peer||!user||$("message-send").disabled)return;const message=$("message-input").value.trim();const file=$("file-input").files[0];if(!message&&!file)return;if(Array.from(message).length>4000){setStatus("chat-status",t("messageTooLong"),true);return;}const epoch=state.chatEpoch;const current=()=>isCurrentChat(state,epoch,user.id,peer.id);const button=$("message-send");button.disabled=true;$("message-input").disabled=true;$("file-input").disabled=true;setStatus("chat-status",t("busy"));try{
let file_path=null,file_name=null,file_type=null,file_size=null;
if(file){if(file.size>25*1024*1024)throw Error(t("fileTooLarge"));const ext=file.name.split(".").pop()?.toLowerCase();if(!allowedExt.has(ext)||blockedMime.test(file.type||""))throw Error(t("unsupportedFile"));
file_name=file.name.slice(0,180);file_type=attachmentMime(file.name,file.type);if(!file_type)throw Error(t("unsupportedFile"));file_size=file.size;
file_path=user.id+"/"+peer.id+"/"+crypto.randomUUID()+"."+ext;const{error:uploadError}=await sb.storage.from("repo-radar-dm").upload(file_path,file,{contentType:file_type,upsert:false});if(uploadError)throw uploadError;}
const {error}=await sb.from("direct_messages").insert({sender_id:user.id,recipient_id:peer.id,content:message,file_path,file_name,file_type,file_size});
if(error){if(file_path){const cleanup=await sb.storage.from("repo-radar-dm").remove([file_path]);if(cleanup.error||!cleanup.data?.length)throw Error(t("cleanupFailed"));}throw error;}
if(!current())return;setStatus("chat-status","");
$("message-input").value="";$("file-input").value="";setStatus("file-preview","");await loadMessages();await loadContacts();
}catch(err){if(current())setStatus("chat-status",safeErr(err),true);}finally{if(current()){button.disabled=false;$("message-input").disabled=false;$("file-input").disabled=false;}}};
localized();reportOAuthRedirectError();onSession().catch(e=>console.error(e));loadRepos();

