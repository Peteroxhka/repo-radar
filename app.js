import {normalizeSearch, mergeMessages, isCurrentChat, dmConversationFilter, attachmentMime} from "./lib/core.mjs";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.57.0";
import {trustedGitHubPagesSite} from "./lib/catalog.mjs";
import {officialText} from "./lib/official-info.mjs";
import {consoleMetadata,filterConsoleProjects,sortConsoleProjects,consoleFacetOptions} from "./lib/console-filters.mjs";
import {SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, DATABASE_SCHEMA} from "./config.js";
const sb=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{db:{schema:DATABASE_SCHEMA},auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
function generateUUID(){
 if(typeof crypto.randomUUID==="function")return crypto.randomUUID();
 // iOS / Android browsers predating crypto.randomUUID still support secure RNG.
 const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);
 bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const h=Array.from(bytes,x=>x.toString(16).padStart(2,"0")).join("");
 return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
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
const featuredSiteLinks={"dnestruev/messenger":"https://dnestruev.github.io/messenger/","peteroxhka/repo-radar":"https://peteroxhka.github.io/repo-radar/"};
translations.ru.officialRadar="Официальный проект Repo Radar";
translations.en.officialRadar="Official Repo Radar project";
translations.ru.visitSite="Открыть сайт проекта";
translations.en.visitSite="Visit project website";
translations.ru.console_webkit="Консольные WebKit";
translations.en.console_webkit="Console WebKit";
translations.en.expandDescription="Show full description";
translations.en.collapseDescription="Show less";
translations.ru.expandDescription="Показать полностью";
translations.ru.collapseDescription="Свернуть";
Object.assign(translations.en,{
 consoleFilterHeading:"Console WebKit filters",consoleFilterNote:"Only versions stated in project metadata are shown. Unspecified compatibility is not assumed.",
 consoleModel:"Console",projectVersion:"Project version",firmwareVersion:"Firmware version",firmwareType:"Firmware type",
 anyConsole:"All consoles",anyVersion:"Any project version",anyFirmwareVersion:"Any firmware version",
 anyFirmwareType:"Any firmware type",unspecified:"Not specified"
});
Object.assign(translations.ru,{
 consoleFilterHeading:"Фильтры консольных WebKit",consoleFilterNote:"Указываются только версии из описаний и названий проектов. Неизвестную совместимость не предполагаем.",
 consoleModel:"Консоль",projectVersion:"Версия проекта",firmwareVersion:"Версия прошивки",firmwareType:"Тип прошивки",
 anyConsole:"Все консоли",anyVersion:"Любая версия проекта",anyFirmwareVersion:"Любая версия прошивки",
 anyFirmwareType:"Любой тип прошивки",unspecified:"Не указано"
});
Object.assign(translations.en,{
 adminPanel:"Admin",adminIntro:"Catalog health and reversible moderation. Restricted to the verified site owner.",
 adminCatalog:"Manage repositories",adminCatalogHint:"Search repositories and hide unsuitable catalog entries. You can restore any project.",
 adminSearch:"Find repository",adminFind:"Search",adminHide:"Hide",adminRestore:"Restore",
 adminHidden:"Hidden",adminVisible:"Visible",adminSaved:"Catalog visibility updated.",
 adminSafety:"This panel controls catalog visibility only — not accounts, private conversations or database settings.",
 adminSummaryTotal:"Indexed repositories",adminSummaryVisible:"Visible projects",adminSummaryHidden:"Hidden projects",
 adminSummaryWebkit:"Console WebKit",adminSummaryUsers:"Registered users",adminSummaryMessages:"Messages",
 repoDetails:"Project details",viewDetails:"View details",sourceCode:"Source on GitHub",projectAuthor:"Author",
 projectScreenshots:"Screenshots from GitHub",screenshotsLoading:"Checking GitHub README for screenshots...",
 screenshotsNone:"No screenshots found in the project README.",screenshotsUnavailable:"Screenshots are temporarily unavailable.",
 refreshLatest:"Load latest version"
});
Object.assign(translations.ru,{
 adminPanel:"Админка",adminIntro:"Состояние каталога и обратимая модерация. Только для подтверждённого владельца сайта.",
 adminCatalog:"Управление репозиториями",adminCatalogHint:"Находи проекты и скрывай неподходящие записи. Любой проект можно восстановить.",
 adminSearch:"Найти репозиторий",adminFind:"Поиск",adminHide:"Скрыть",adminRestore:"Восстановить",
 adminHidden:"Скрыт",adminVisible:"Виден",adminSaved:"Видимость проекта обновлена.",
 adminSafety:"Админка управляет только каталогом — не аккаунтами, личными сообщениями или настройками базы.",
 adminSummaryTotal:"Репозиториев в базе",adminSummaryVisible:"Видимых проектов",adminSummaryHidden:"Скрытых проектов",
 adminSummaryWebkit:"Консольные WebKit",adminSummaryUsers:"Пользователей",adminSummaryMessages:"Сообщений",
 repoDetails:"О проекте",viewDetails:"Подробнее",sourceCode:"Исходники на GitHub",projectAuthor:"Автор",
 projectScreenshots:"Скриншоты из GitHub",screenshotsLoading:"Ищем скриншоты в GitHub README...",
 screenshotsNone:"В README нет скриншотов.",screenshotsUnavailable:"Не удалось загрузить скриншоты.",
 refreshLatest:"Загрузить новую версию"
});

Object.assign(translations.en,{
 adminSupabaseTitle:"Supabase connection",adminSupabaseHint:"This site's database is linked. Check it or test another project's public API. Never enter a service_role key.",
 adminConnectSupabase:"Connect Supabase",supabaseCurrentIntro:"Repo Radar already uses Supabase. Verify the current connection below.",
 supabaseCheckCurrent:"Check current connection",supabaseExternalIntro:"Test another project's public API. This does not replace Repo Radar's database or grant administrative access.",
 supabaseProjectUrl:"Supabase project URL",supabasePublicKey:"Publishable key (sb_publishable_…) only",
 supabaseTestPublic:"Test public connection",supabaseNeverSecret:"Never enter a service_role key, secret key, or database password. External connection details are not stored.",
 supabaseCurrentOK:"Current Supabase connection is working and admin access is verified.",
 supabaseExternalOK:"Public Supabase API responds. This is a connectivity check only; no project has been linked for administration.",
 supabaseInvalid:"Enter a valid https://<project>.supabase.co URL and a publishable key.",
 buildGuideLink:"Build a website with Supabase"
});
Object.assign(translations.ru,{
 adminSupabaseTitle:"Подключение Supabase",adminSupabaseHint:"База сайта уже подключена. Проверь её или протестируй публичный API другого проекта. Никогда не вводи service_role ключ.",
 adminConnectSupabase:"Привязать Supabase",supabaseCurrentIntro:"Repo Radar уже использует Supabase. Проверь действующее подключение.",
 supabaseCheckCurrent:"Проверить текущее подключение",supabaseExternalIntro:"Можно проверить публичный API другого проекта. Это не заменяет базу Repo Radar и не выдаёт права администратора.",
 supabaseProjectUrl:"URL проекта Supabase",supabasePublicKey:"Только publishable-ключ (sb_publishable_…)",
 supabaseTestPublic:"Проверить публичное подключение",supabaseNeverSecret:"Никогда не вводи service_role, secret key или пароль базы. Данные внешнего подключения не сохраняются.",
 supabaseCurrentOK:"Текущий Supabase доступен, права администратора подтверждены.",
 supabaseExternalOK:"Публичный API Supabase отвечает. Это только проверка связи, а не админское подключение.",
 supabaseInvalid:"Укажи адрес https://<проект>.supabase.co и publishable-ключ.",
 buildGuideLink:"Как создать свой сайт с Supabase"
});


// These paragraphs describe only Repo Radar itself. We never pretend to
// have translated third-party maintainers' descriptions automatically.
const projectLongDescription={
 ru:`Repo Radar — открытый каталог репозиториев GitHub, созданный для поиска интересных проектов, исходного кода, инструментов разработчика и образовательных материалов. Вместо бесконечного просмотра случайных репозиториев здесь можно искать по названию и точному адресу owner/repository, выбирать категорию, язык программирования и сортировку по настоящему количеству звёзд.

В каталоге есть отдельная категория «Консольные WebKit». Она помогает найти проекты, которые в своих метаданных упоминают WebKit и игровые консоли. Доступны фильтры по консоли, версии проекта, указанным версиям прошивки и типу прошивки. Показанные метаданные не являются подтверждением совместимости конкретного проекта с устройством.

Карточка каждого проекта содержит краткое описание, ссылку на автора, исходный репозиторий и, когда адрес действительно известен, ссылку на опубликованный сайт GitHub Pages. На сайте также предусмотрены профили, вход через GitHub или электронную почту, личные сообщения и отправка поддерживаемых файлов.

Техническая основа — HTML, CSS и JavaScript на GitHub Pages, Supabase для хранения данных и авторизации, а GitHub Actions собирает и обновляет каталог. Раздел администратора доступен только проверенному владельцу Repo Radar и позволяет управлять видимостью записей. Проект размещён с открытым исходным кодом; документация по запуску похожего каталога находится в репозитории.`,
 en:`Repo Radar is an open-source GitHub repository discovery catalog designed to help people find interesting projects, source code, developer utilities, and educational resources. Instead of scrolling through unrelated repositories, visitors can search by repository name or exact owner/repository path, filter by category and programming language, and sort by real GitHub star counts.

A dedicated Console WebKit category helps discover repositories whose published metadata mentions both WebKit and gaming consoles. Visitors can filter by console, project version, reported firmware version, and firmware type. These values come from repository metadata and should not be interpreted as independently verified device compatibility.

Each project has a compact overview and links to its author, source repository, and a GitHub Pages website where a verified address is available. The site also includes user profiles, GitHub or email sign-in, direct messages, and supported file attachments.

Repo Radar uses HTML, CSS, and JavaScript deployed on GitHub Pages, Supabase for data and authentication, and GitHub Actions to collect and refresh repository information. A restricted owner-only administration area supports catalog visibility management. The source code and instructions for building a similar project are available in its public GitHub repository.`
};
Object.assign(translations.en,{
 shortDescription:"Short description",
 descriptionRuHeading:"Описание на русском",
 descriptionEnHeading:"Description in English",
 descriptionUntranslatedRu:"Подтверждённый перевод на русский ещё не добавлен. Ниже приведено оригинальное описание автора:\\n\\n",
 descriptionUntranslatedEn:"An English translation has not been provided for this repository. Original author description:\\n\\n"
});
Object.assign(translations.ru,{
 shortDescription:"Краткое описание",
 descriptionRuHeading:"Подробное описание на русском",
 descriptionEnHeading:"Подробное описание на английском",
 descriptionUntranslatedRu:"Подтверждённый перевод на русский ещё не добавлен. Ниже приведено оригинальное описание автора:\\n\\n",
 descriptionUntranslatedEn:"An English translation has not been provided for this repository. Original author description:\\n\\n"
});
const PROJECT_FALLBACK_IMAGE="./assets/nobody-came.png";
function getProjectImage(repo){
 for(const prop of ["preview_image","open_graph_image","logo_url","image_url"]){
  const value=repo?.[prop];
  if(typeof value!=="string")continue;
  try{
   const url=new URL(value);
   if(url.protocol!=="https:"||url.username||url.password)continue;
   if(["raw.githubusercontent.com","user-images.githubusercontent.com","github.com"].includes(url.hostname)||
      url.hostname.endsWith(".githubusercontent.com"))return url.href;
  }catch{}
 }
 return PROJECT_FALLBACK_IMAGE;
}
function getDescriptions(repo){
 if(repo.full_name?.toLowerCase()==="peteroxhka/repo-radar")return projectLongDescription;
 const original=String(repo.description||"").trim()||t("noDescription");
 const ru=String(repo.description_ru||"").trim();
 const en=String(repo.description_en||"").trim();
 const containsRussian=/[а-яё]/i.test(original);
 return {
  ru:ru|| (containsRussian?original:t("descriptionUntranslatedRu")+original),
  en:en|| (!containsRussian?original:t("descriptionUntranslatedEn")+original)
 };
}

const categoryKeys=["all","programming","tools","ai","data","web","learning","games","console_webkit","other"];
const localeNames={ru:"Русский",en:"English",es:"Español",fr:"Français",de:"Deutsch",pt:"Português",zh:"中文",ja:"日本語",ko:"한국어",ar:"العربية",hi:"हिन्दी",tr:"Türkçe"};
const allowedExt=new Set(["jpg","jpeg","png","webp","gif","bmp","heic","mp4","webm","mov","m4v","mp3","ogg","wav","m4a","aac","flac","pdf","txt","md","csv","json","doc","docx","xls","xlsx","ppt","pptx","odt","ods","odp","zip","7z","rar"]);
const blockedMime=/x-msdownload|x-executable|x-sh|x-bat|x-dosexec|javascript|text\/html|svg\+xml/i;
// English is the default for new visitors; an explicit saved choice wins.
let locale=localStorage.getItem("radar-locale")||"en";
if(!translations[locale])locale="en";
let theme=localStorage.getItem("radar-theme")||"dark";if(!["dark","light","cosmic"].includes(theme))theme="dark";
let state={chatEpoch:0,messageBusy:false,historyCursor:null,historyMore:false,contactRequest:0,category:"all",language:"",search:"",sort:"popular",includeDescription:false,consoleFilters:{console:"",version:"",firmwareVersion:"",firmwareType:""},consoleRows:null,user:null,profile:null,peer:null,allRows:[],totalCount:0,catalogTotal:0,categoryCounts:{},categoryCountsLoaded:false,hasMore:true,loading:false,languageOptions:[],languageOptionsLoaded:false,listRequestId:0,searchTimer:null,seen:new Map(),sub:null,refreshTimer:null,register:false,adminAuthorized:false};
let adminAccessEpoch=0,detailRequestEpoch=0;
Object.assign(translations.ru,{sort:"Сортировка",sortPopular:"Самые популярные ★",sortLeast:"Меньше звёзд",sortRecent:"Недавно обновлённые",sortNewest:"Новые проекты",sortForked:"Чаще копируют",searchDescription:"Искать также в описаниях",ps4Website:"Открыть сайт"});
Object.assign(translations.en,{sort:"Sort",sortPopular:"Most starred ★",sortLeast:"Least starred",sortRecent:"Recently updated",sortNewest:"Newest repositories",sortForked:"Most forked",searchDescription:"Also search descriptions",ps4Website:"Open website"});
const categoryLabels={ru:"Без категории",en:"Unclassified",es:"Sin categoría",fr:"Sans catégorie",de:"Nicht kategorisiert",pt:"Sem categoria",zh:"未分类",ja:"未分類",ko:"미분류",ar:"غير مصنف",hi:"अवर्गीकृत",tr:"Kategorisiz"};
Object.assign(translations.ru,{olderMessages:"Предыдущие сообщения",ps4Title:"Мир PlayStation 4",ps4Intro:"Инструменты разработки, эмуляция и проекты сообщества PS4.",ps4Source:"Открыть репозиторий",ps4Search:"Найти PS4 в каталоге",ps4Reference:"Проект из твоей подборки",ps4Sdk:"Открытый модульный SDK для разработки под PS4.",ps4Toolchain:"Инструменты и примеры для создания домашних приложений PS4.",ps4Emulator:"Эмулятор PlayStation 4 для компьютера.",cleanupFailed:"Сообщение не отправлено. Не удалось удалить вложение из хранилища.",messageTooLong:"Сообщение не должно превышать 4000 символов."});
Object.assign(translations.en,{olderMessages:"Older messages",ps4Title:"The PlayStation 4 world",ps4Intro:"Development tools, emulation and PS4 community projects.",ps4Source:"Open repository",ps4Search:"Find PS4 in the catalog",ps4Reference:"Project from your collection",ps4Sdk:"An open modular SDK for PS4 development.",ps4Toolchain:"Tools and examples for building PS4 homebrew applications.",ps4Emulator:"A PlayStation 4 emulator for desktop computers.",cleanupFailed:"Message not sent. The attachment could not be removed from storage.",messageTooLong:"Messages must not exceed 4000 characters."});
function t(k){if(k==="other")return categoryLabels[locale]??"Unclassified";return translations[locale]?.[k]??officialText(locale,k)??translations.en[k]??k;}
function descriptionFor(repo){
 if(repo.full_name?.toLowerCase()==="peteroxhka/repo-radar")return officialText(locale,"repoRadarDescription");
 return String(repo.description||"");
}
function setStatus(id,message,isError=false){const el=$(id);if(!el)return;el.textContent=message;el.classList.toggle("error",isError);}
function safeErr(e){console.error("Repo Radar:",e);return e?.message||t("error");}
function localized(){document.documentElement.lang=locale;document.documentElement.dir=locale==="ar"?"rtl":"ltr";
document.querySelectorAll("[data-i18n]").forEach(el=>{const key=el.dataset.i18n;if(key==="headline")el.innerHTML=t(key);else el.textContent=t(key);});
$("repo-search").placeholder=t("repoSearch");$("user-search").placeholder=t("userSearch");$("message-input").placeholder=t("messagePlaceholder");if($("language").options.length)$("language").options[0].textContent=t("allLanguages");
$("auth-title").textContent=state.register?t("register"):t("welcomeBack");$("auth-submit").textContent=state.register?t("register"):t("signIn");$("auth-switch").textContent=state.register?t("alreadyAccount"):t("needAccount");
$("locale").value=locale;renderCategories();if(state.consoleRows)renderConsoleSelectors(state.consoleRows);renderRepos();}
function themeApply(){document.body.dataset.theme=theme;$("theme").value=theme;localStorage.setItem("radar-theme",theme);}
for(const [code,name] of Object.entries(localeNames)){$("locale").add(new Option(name,code));}
$("locale").addEventListener("change",e=>{locale=e.target.value;localStorage.setItem("radar-locale",locale);localized();});
$("theme").addEventListener("change",e=>{theme=e.target.value;themeApply();});
themeApply();
const number=n=>n>=1000?(n/1000).toFixed(1)+"k":String(n??0);
function renderCategories(){
 $("console-filters").classList.toggle("hidden",state.category!=="console_webkit");
 $("categories").replaceChildren(...categoryKeys.map(key=>{const b=document.createElement("button");b.className="chip"+(state.category===key?" active":"");const count=key==="all"?state.catalogTotal:(state.categoryCounts[key]??0);b.textContent=state.categoryCountsLoaded?`${t(key)} · ${Number(count).toLocaleString(locale)}`:t(key);b.type="button";b.onclick=()=>{state.category=key;renderCategories();loadRepos(true);};return b;}));
}
const consoleControls=[
 ["console-model","console","anyConsole","consoles"],
 ["console-version","version","anyVersion","versions"],
 ["console-firmware-version","firmwareVersion","anyFirmwareVersion","firmwareVersions"],
 ["console-firmware-type","firmwareType","anyFirmwareType","firmwareTypes"]
];
function renderConsoleSelectors(rows){
 const options=consoleFacetOptions(rows,state.consoleFilters.console);
 for(const [id,key,labelKey,optionKey] of consoleControls){
  const el=$(id),values=options[optionKey],current=state.consoleFilters[key];
  const items=[new Option(t(labelKey),"")];
  if(key!=="console"||rows.some(r=>!consoleMetadata(r).consoles.length))items.push(new Option(t("unspecified"),"__unknown__"));
  for(const name of values)items.push(new Option(name,name));
  el.replaceChildren(...items);
  if(current && (current==="__unknown__"||values.includes(current)))el.value=current;
  else{state.consoleFilters[key]="";el.value="";}
 }
}
let consoleCachePromise=null,consoleCacheAt=0;
async function fetchConsoleRows(){
 if(!consoleCachePromise||Date.now()-consoleCacheAt>5*60*1000){
  consoleCacheAt=Date.now();
  consoleCachePromise=(async()=>{
   const rows=[],batch=500;
   for(let start=0;;start+=batch){
    const {data,error}=await sb.from("repos").select("id,name,owner_login,full_name,description,html_url,language,topics,stars,license_spdx,category,pushed_at,created_at,forks_count,homepage")
     .eq("category","console_webkit").eq("is_fork",false).eq("is_archived",false).eq("admin_hidden",false).order("id").range(start,start+batch-1);
    if(error)throw error;
    rows.push(...(data||[]));
    if(!data||data.length<batch)break;
   }
   return rows;
  })().catch(err=>{consoleCachePromise=null;throw err;});
 }
 return consoleCachePromise;
}
for(const [id,key] of consoleControls){
 $(id).onchange=e=>{state.consoleFilters[key]=e.target.value;loadRepos(true);};
}
async function updateCategoryCounts(){if(state.categoryCountsLoaded)return;try{const{data,error}=await sb.rpc("list_repo_category_counts");if(error)throw error;state.categoryCounts=Object.fromEntries((data||[]).map(row=>[row.category,Number(row.total)]));state.catalogTotal=Object.values(state.categoryCounts).reduce((sum,value)=>sum+value,0);state.categoryCountsLoaded=true;renderCategories();}catch(error){console.warn("Repository category counts unavailable:",error.message);state.categoryCountsLoaded=false;}}
const REPO_PAGE_SIZE=48;
async function updateLanguageOptions(){if(!state.languageOptionsLoaded){const{data,error}=await sb.rpc("list_repo_languages");if(error){console.warn("Language list unavailable:",error.message);state.languageOptions=[...new Set(state.allRows.map(r=>r.language).filter(Boolean))].sort((a,b)=>a.localeCompare(b));}else{state.languageOptions=(data||[]).map(row=>row.language).filter(Boolean);}state.languageOptionsLoaded=true;}const select=$("language"),current=state.language;const names=state.languageOptions.slice();if(current&&!names.includes(current))names.unshift(current);select.replaceChildren(new Option(t("allLanguages"),""));for(const name of names)select.add(new Option(name,name));select.value=current;}
function renderRepos(){const rows=state.allRows;const frag=document.createDocumentFragment();if(!rows.length){const empty=document.createElement("div");empty.className="empty";empty.textContent=t("noProjects");frag.append(empty);}
for(const r of rows){const card=document.createElement("article");card.className="repo-card";const title=document.createElement("a");title.className="repo-title";title.textContent=r.name;try{const url=new URL(r.html_url);if(url.protocol==="https:"&&url.hostname==="github.com"){title.href=url.href;title.target="_blank";title.rel="noopener noreferrer";}}catch{}const descWrap=document.createElement("div");descWrap.className="repo-description-wrap";
const desc=document.createElement("p");desc.className="repo-desc";
const fullDescription=descriptionFor(r);
const characters=Array.from(fullDescription);
const hasLongDescription=characters.length>350;
const preview=hasLongDescription?characters.slice(0,300).join("").trimEnd()+"…":fullDescription||t("noDescription");
desc.textContent=preview;
descWrap.append(desc);
if(hasLongDescription){
 const toggle=document.createElement("button");
 toggle.className="description-toggle";toggle.type="button";
 toggle.setAttribute("aria-expanded","false");toggle.textContent=t("expandDescription");
 toggle.onclick=()=>{
  const expanded=toggle.getAttribute("aria-expanded")==="true";
  toggle.setAttribute("aria-expanded",expanded?"false":"true");
  desc.textContent=expanded?preview:fullDescription;
  desc.classList.toggle("expanded",!expanded);
  toggle.textContent=t(expanded?"expandDescription":"collapseDescription");
 };
 descWrap.append(toggle);
}
const meta=document.createElement("div");meta.className="repo-meta";
const things=[[r.owner_login,"repo-owner"],[r.language,"repo-tag"],["★ "+number(r.stars)],r.license_spdx?[r.license_spdx]:null,r.pushed_at?[new Date(r.pushed_at).toLocaleDateString(locale)]:null].filter(Boolean);
for(const [str,cls] of things){const item=document.createElement("span");if(cls)item.className=cls;item.textContent=str;meta.append(item);}
if(r.category==="console_webkit"){
 const info=consoleMetadata(r),tags=[...info.consoles];
 if(info.projectVersion)tags.push(info.projectVersion);
 for(const fw of info.firmwareVersions)tags.push(`${t("firmwareVersion")}: ${fw}`);
 tags.push(...info.firmwareTypes);
 for(const tag of tags){const el=document.createElement("span");el.className="repo-tag";el.textContent=tag;meta.append(el);}
}
if(r.full_name?.toLowerCase()==="peteroxhka/repo-radar"){const badge=document.createElement("span");badge.className="official-project-tag";badge.textContent=t("officialRadar");card.append(badge);}
card.append(title,descWrap,meta);
const projectSite=trustedGitHubPagesSite(r.site_url)||featuredSiteLinks[r.full_name?.toLowerCase()];
if(projectSite){const site=document.createElement("a");site.className="project-site-link";site.href=projectSite;site.target="_blank";site.rel="noopener noreferrer";site.textContent=t("visitSite");card.append(site);}
const details=document.createElement("button");
details.className="project-details-button";details.type="button";details.textContent=t("viewDetails");
details.onclick=()=>openProjectDetails(r);
card.append(details);
card.tabIndex=0;card.setAttribute("role","group");
card.setAttribute("aria-label",`${r.name}: ${t("viewDetails")}`);
card.onclick=e=>{if(e.target.closest?.("a,button"))return;openProjectDetails(r);};
card.onkeydown=e=>{if(e.target===card&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openProjectDetails(r);}};
frag.append(card);} $("grid").replaceChildren(frag);}

// Show a calm animated detail panel. Screenshot fetching is intentionally removed.
function setProjectDescriptionLanguage(value){
 const selected=value==="ru"?"ru":"en";
 for(const code of ["ru","en"]){
  const active=code===selected;
  const tab=$("repo-desc-tab-"+code),panel=$("repo-panel-"+code);
  tab.classList.toggle("active",active);
  tab.setAttribute("aria-selected",String(active));
  tab.tabIndex=active?0:-1;
  panel.classList.toggle("hidden",!active);
  if(active){panel.classList.remove("animate-description");void panel.offsetWidth;panel.classList.add("animate-description");}
  else panel.classList.remove("animate-description");
 }
}
for(const language of ["ru","en"]){
 $("repo-desc-tab-"+language).onclick=()=>setProjectDescriptionLanguage(language);
 $("repo-desc-tab-"+language).onkeydown=event=>{
  if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
  event.preventDefault();
  const target=event.key==="Home"?"ru":event.key==="End"?"en":language==="ru"?"en":"ru";
  setProjectDescriptionLanguage(target);$("repo-desc-tab-"+target).focus();
 };
}
function openProjectDetails(repo){
 detailRequestEpoch++;
 const fullname=String(repo.full_name||"");
 const pieces=fullname.split("/");
 const valid=pieces.length===2&&pieces.every(p=>/^[A-Za-z0-9_.-]+$/.test(p));
 const url=valid?"https://github.com/"+pieces.map(encodeURIComponent).join("/"):null;
 const title=$("repo-detail-title"),titleLink=document.createElement("a");
 titleLink.textContent=repo.name||fullname;
 if(url){titleLink.href=url;titleLink.target="_blank";titleLink.rel="noopener noreferrer";}
 title.replaceChildren(titleLink);
 const short=String(descriptionFor(repo)||t("noDescription")).trim();
 $("repo-detail-description").textContent=Array.from(short).slice(0,280).join("")+(Array.from(short).length>280?"…":"");
 const text=getDescriptions(repo);
 $("repo-description-ru").textContent=text.ru;
 $("repo-description-en").textContent=text.en;
 const pic=$("repo-preview-image");
 pic.onerror=null;
 pic.alt=repo.name?repo.name+" — project image":"* But nobody came.";
 pic.onerror=()=>{
  pic.onerror=null;
  pic.src=PROJECT_FALLBACK_IMAGE;
  pic.alt="* But nobody came.";
 };
 pic.src=getProjectImage(repo);
 const labels=[repo.language,repo.category,"★ "+number(repo.stars)].filter(Boolean);
 const tags=labels.map(value=>{
  const span=document.createElement("span");span.className="repo-tag";span.textContent=value;return span;
 });
 $("repo-detail-tags").replaceChildren(...tags);
 const source=$("repo-source-link"),owner=$("repo-owner-link");
 for(const [element,target] of [[source,url],[owner,valid?"https://github.com/"+encodeURIComponent(pieces[0]):null]]){
  if(target){element.href=target;element.classList.remove("hidden");}
  else{element.removeAttribute("href");element.classList.add("hidden");}
 }
 const live=trustedGitHubPagesSite(repo.site_url||repo.homepage)||
  featuredSiteLinks[fullname.toLowerCase()];
 const site=$("repo-live-link");
 if(live){site.href=live;site.classList.remove("hidden");}
 else{site.removeAttribute("href");site.classList.add("hidden");}
 setProjectDescriptionLanguage(locale==="ru"?"ru":"en");
 openDialog("repo-dialog");
}

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
if(state.category==="console_webkit"){
 const all=await fetchConsoleRows();
 if(requestId!==state.listRequestId)return;
 state.consoleRows=all;renderConsoleSelectors(all);
 const filtered=sortConsoleProjects(filterConsoleProjects(all,{
  search:normalizeSearch(state.search),language:state.language,includeDescription:state.includeDescription,
  ...state.consoleFilters
 }),state.sort);
 const page=filtered.slice(offset,offset+REPO_PAGE_SIZE).map(r=>({...r,site_url:trustedGitHubPagesSite(r.homepage)}));
 state.allRows=reset?page:state.allRows.concat(page);
 state.totalCount=filtered.length;
 state.hasMore=state.allRows.length<state.totalCount;
 $("repo-count").textContent=state.totalCount.toLocaleString(locale);
 await updateLanguageOptions();
 if(requestId!==state.listRequestId)return;
 renderRepos();
 more.hidden=!state.hasMore;$("load-more-wrap").hidden=!state.hasMore;
 setStatus("status",`${state.allRows.length.toLocaleString(locale)} / ${state.totalCount.toLocaleString(locale)}`);
 return;
}
const{data,error}=await sb.rpc("search_catalog",{
 q:normalizeSearch(state.search),category_filter:state.category,
 language_filter:state.language,sort_by:state.sort,
 include_description:state.includeDescription,
 page_size:REPO_PAGE_SIZE,page_offset:offset
});
if(requestId!==state.listRequestId)return;
if(error)throw error;
const page=data||[];
let siteById=new Map();
if(page.length){
 try{
  const {data:sites,error:sitesError}=await sb.rpc("list_catalog_sites",{repo_ids:page.map(r=>r.id)});
  if(sitesError)throw sitesError;
  siteById=new Map((sites||[]).map(r=>[String(r.id),trustedGitHubPagesSite(r.homepage)]).filter(([,url])=>!!url));
 }catch(siteError){console.warn("GitHub Pages links unavailable:",siteError.message);}
}
if(requestId!==state.listRequestId)return;
const enriched=page.map(r=>({...r,site_url:siteById.get(String(r.id))||null}));
state.allRows=reset?enriched:state.allRows.concat(enriched);
state.totalCount=Number(page[0]?.total_count??(reset?0:state.totalCount));
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
$("repo-sort").onchange=e=>{state.sort=e.target.value;loadRepos(true);};
$("search-descriptions").onchange=e=>{state.includeDescription=e.target.checked;loadRepos(true);};
$("repo-search").oninput=e=>{
 state.search=e.target.value.trim();
 // A new search should search the entire catalog, rather than silently keeping
 // a console/category/language filter selected during a previous search.
 if(state.search){
  state.category="all";state.language="";
  state.consoleFilters={console:"",version:"",firmwareVersion:"",firmwareType:""};
  $("language").value="";
  renderCategories();
 }
 state.listRequestId+=1;state.loading=true;clearTimeout(state.searchTimer);
 state.searchTimer=setTimeout(()=>loadRepos(true),250);
};
$("load-more").onclick=()=>loadRepos(false);
if("IntersectionObserver" in window){
const catalogObserver=new IntersectionObserver(entries=>{
if(!$("view-discover").classList.contains("hidden")&&entries.some(entry=>entry.isIntersecting)&&state.hasMore&&!state.loading)loadRepos(false);
},{root:null,rootMargin:"900px 0px 900px 0px",threshold:0});
catalogObserver.observe($("load-more-sentinel"));
}
function showTab(tab){
 if(tab==="admin"&&!state.adminAuthorized)return;
 for(const name of ["discover","messages","admin"]){
  $("view-"+name).classList.toggle("hidden",tab!==name);
  $("tab-"+name).classList.toggle("active",tab===name);
  $("tab-"+name).setAttribute("aria-current",tab===name?"page":"false");
 }
 if(tab==="messages"&&state.user)loadContacts();
 if(tab==="admin")loadAdminDashboard();
 if(tab==="discover")loadRepos(true);
}
$("tab-discover").onclick=()=>showTab("discover");
$("tab-messages").onclick=()=>showTab("messages");
$("tab-admin").onclick=()=>showTab("admin");
$("reload-latest").onclick=()=>{
 const url=new URL(location.href);
 url.searchParams.set("latest",Date.now().toString(36));
 location.assign(url.href);
};
function openDialog(id){
 const d=$(id);if(d.open)return;
 if(typeof d.showModal==="function")d.showModal();
 else{d.setAttribute("open","");d.classList.add("legacy-dialog-open");}
}
function closeDialog(id){
 const d=$(id);if(!d)return;
 const finish=()=>{
  d.classList.remove("is-closing");
  if(typeof d.close==="function"&&d.open)d.close();
  else{d.removeAttribute("open");d.classList.remove("legacy-dialog-open");}
 };
 if(id==="repo-dialog"){
  detailRequestEpoch++;
  if(d.open&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
   d.classList.add("is-closing");
   const guard=window.setTimeout(finish,220);
   d.addEventListener("animationend",()=>{window.clearTimeout(guard);finish();},{once:true});
   return;
  }
 }
 finish();
}
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>closeDialog(b.dataset.close));
$("repo-dialog").addEventListener("close",()=>{detailRequestEpoch++;});

// Protected admin RPCs run on Supabase with an immutable, verified GitHub identity.
// Never trust a username, button visibility or data from the browser for authorization.
async function checkAdminAccess(userId){
 const epoch=++adminAccessEpoch;
 let allowed=false;
 try{
  const {data,error}=await sb.rpc("admin_is_authorized");
  if(error)throw error;
  allowed=data===true;
 }catch(e){console.warn("Admin authorization unavailable:",e.message);}
 if(epoch!==adminAccessEpoch||state.user?.id!==userId)return;
 state.adminAuthorized=allowed;
 $("tab-admin").classList.toggle("hidden",!allowed);
 if(!allowed&&!$("view-admin").classList.contains("hidden"))showTab("discover");
}
async function loadAdminDashboard(){
 if(!state.adminAuthorized||!state.user)return;
 setStatus("admin-status",t("loading"));
 const [sum,listing]=await Promise.all([sb.rpc("admin_dashboard"),sb.rpc("admin_find_repos",{search_text:"",max_results:20})]);
 if(!state.adminAuthorized)return;
 if(sum.error||listing.error){setStatus("admin-status",safeErr(sum.error||listing.error),true);return;}
 const data=sum.data?.[0]||{};
 const metrics=[
 ["adminSummaryTotal","total_repos"],["adminSummaryVisible","visible_repos"],
 ["adminSummaryHidden","hidden_repos"],["adminSummaryWebkit","console_webkits"],
 ["adminSummaryUsers","profiles_count"],["adminSummaryMessages","messages_count"]
 ];
 const cards=metrics.map(([label,key])=>{
  const box=document.createElement("div");box.className="admin-stat";
  const title=document.createElement("span");title.textContent=t(label);
  const number=document.createElement("strong");number.textContent=Number(data[key]??0).toLocaleString(locale);
  box.append(title,number);return box;
 });
 $("admin-stats").replaceChildren(...cards);
 renderAdminRepoResults(listing.data||[]);
 setStatus("admin-status","");
}
function renderAdminRepoResults(rows){
 const items=rows.map(r=>{
  const wrapper=document.createElement("div");wrapper.className="admin-repo-row";
  const info=document.createElement("div");info.className="admin-repo-info";
  const name=document.createElement("strong");name.textContent=r.full_name;
  const meta=document.createElement("span");meta.textContent=`${r.category} · ★ ${number(r.stars)} · ${t(r.admin_hidden?"adminHidden":"adminVisible")}`;
  info.append(name,meta);
  const github=document.createElement("a");
  const githubPath=String(r.full_name||"").split("/");
  const validPath=githubPath.length===2&&githubPath.every(part=>/^[a-zA-Z0-9_.-]+$/.test(part));
  github.textContent="GitHub";
  github.className="admin-repo-github";
  if(validPath){
   github.href="https://github.com/"+githubPath.map(encodeURIComponent).join("/");
   github.target="_blank";github.rel="noopener noreferrer";
  }else{github.removeAttribute("href");github.classList.add("hidden");}
  const action=document.createElement("button");action.type="button";
  action.className="button "+(r.admin_hidden?"button-primary":"button-outline");
  action.textContent=t(r.admin_hidden?"adminRestore":"adminHide");
  action.onclick=async()=>{
   action.disabled=true;
   const {data,error}=await sb.rpc("admin_set_repo_hidden",{repo_id:r.id,hidden:!r.admin_hidden,note:"Catalog moderation"});
   if(error||!data){setStatus("admin-status",safeErr(error||Error("Project not found")),true);action.disabled=false;return;}
   state.categoryCountsLoaded=false;state.consoleRows=null;consoleCachePromise=null;
   setStatus("admin-status",t("adminSaved"));
   await loadAdminDashboard();
  };
  wrapper.append(info,github,action);return wrapper;
 });
 if(!items.length){const empty=document.createElement("p");empty.className="hint";empty.textContent=t("noProjects");items.push(empty);}
 $("admin-project-list").replaceChildren(...items);
}

// This is a public connectivity test for admin review, NOT OAuth or a privileged
// integration. The entered publishable key is never sent to our backend, stored,
// added to URLs, or copied into the active application configuration.
$("admin-supabase-connect").onclick=()=>{
 if(!state.adminAuthorized)return;
 $("supabase-project-url").value="";
 $("supabase-public-key").value="";
 setStatus("supabase-current-status","");
 setStatus("supabase-test-status","");
 openDialog("supabase-dialog");
};
$("supabase-check-current").onclick=async()=>{
 if(!state.adminAuthorized)return;
 const button=$("supabase-check-current");button.disabled=true;
 setStatus("supabase-current-status",t("busy"));
 try{
  const {data,error}=await sb.rpc("admin_is_authorized");
  if(error||data!==true)throw error||Error("Admin access required");
  setStatus("supabase-current-status",t("supabaseCurrentOK"));
 }catch(e){setStatus("supabase-current-status",safeErr(e),true);}
 finally{button.disabled=false;}
};
$("supabase-public-test-form").onsubmit=async event=>{
 event.preventDefault();
 if(!state.adminAuthorized)return;
 const input=$("supabase-project-url").value.trim();
 const key=$("supabase-public-key").value.trim();
 let url;
 try{url=new URL(input);}catch{setStatus("supabase-test-status",t("supabaseInvalid"),true);return;}
 // Only *.supabase.co HTTPS project URLs. No custom origins, no private hosts.
 if(url.protocol!=="https:"||url.username||url.password||url.port||
  !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)||
  url.pathname!=="/"||url.search||url.hash||
  !/^sb_publishable_[A-Za-z0-9_-]{8,}$/.test(key)){
  setStatus("supabase-test-status",t("supabaseInvalid"),true);return;
 }
 const button=$("supabase-test-external");button.disabled=true;
 setStatus("supabase-test-status",t("busy"));
 try{
  const res=await fetch(url.origin+"/auth/v1/settings",{
   method:"GET",headers:{apikey:key,Accept:"application/json"},cache:"no-store"
  });
  if(!res.ok)throw Error("Supabase public API HTTP "+res.status);
  setStatus("supabase-test-status",t("supabaseExternalOK"));
 }catch(e){setStatus("supabase-test-status",safeErr(e),true);}
 finally{button.disabled=false;$("supabase-public-key").value="";}
};

$("admin-search-form").onsubmit=async e=>{
 e.preventDefault();if(!state.adminAuthorized)return;
 setStatus("admin-status",t("loading"));
 const query=$("admin-project-search").value.trim();
 const {data,error}=await sb.rpc("admin_find_repos",{search_text:query,max_results:40});
 if(error){setStatus("admin-status",safeErr(error),true);return;}
 renderAdminRepoResults(data||[]);setStatus("admin-status","");
};

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
closeDialog("auth-dialog");$("auth-form").reset();setStatus("auth-status","");
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
if(file&&!githubAccount()){if(file.size>5*1024*1024||!["image/jpeg","image/png","image/webp","image/gif"].includes(file.type))throw Error(t("unsupportedFile"));const ext=file.type.split("/")[1]==="jpeg"?"jpg":file.type.split("/")[1];const path=state.user.id+"/"+generateUUID()+"."+ext;const {error:upErr}=await sb.storage.from("repo-radar-avatars").upload(path,file,{contentType:file.type,upsert:false});if(upErr)throw upErr;const{data}=sb.storage.from("repo-radar-avatars").getPublicUrl(path);image=data.publicUrl;}
const{error}=await sb.from("profiles").update({username:name,avatar_url:image}).eq("id",state.user.id);if(error)throw error;await fetchProfile();$("avatar-file").value="";setStatus("profile-status",t("saved"));}catch(err){setStatus("profile-status",safeErr(err),true);}finally{button.disabled=false;}};
$("signout").onclick=async()=>{const{error}=await sb.auth.signOut();if(error){setStatus("profile-status",safeErr(error),true);return;}closeDialog("profile-dialog");};
function stopChat(){setStatus("chat-status","");$("file-input").disabled=true;state.chatEpoch+=1;state.contactRequest+=1;state.messageBusy=false;state.historyCursor=null;state.historyMore=false;$("chat-history").hidden=true;$("message-input").value="";$("file-input").value="";setStatus("file-preview","");delete $("chat-messages").dataset.lastId;if(state.sub){sb.removeChannel(state.sub);state.sub=null;}if(state.refreshTimer){clearInterval(state.refreshTimer);state.refreshTimer=null;}state.peer=null;state.seen.clear();$("chat-messages").replaceChildren();$("conversation-list").replaceChildren();$("chat-partner").textContent=t("chooseChat");$("message-input").disabled=true;$("message-send").disabled=true;}
async function onSession(){const{data:{user}}=await sb.auth.getUser();const previous=state.user?.id;state.user=user||null;if(previous&&previous!==user?.id)stopChat();if(!user)stopChat();
$("auth-open").classList.toggle("hidden",!!user);$("profile-open").classList.toggle("hidden",!user);$("chat-guest").classList.toggle("hidden",!!user);$("chat-app").classList.toggle("hidden",!user);
if(user){
 await fetchProfile();
 await checkAdminAccess(user.id);
 if(!$("view-messages").classList.contains("hidden"))await loadContacts();
}else{
 adminAccessEpoch+=1;state.adminAuthorized=false;$("tab-admin").classList.add("hidden");
 if(!$("view-admin").classList.contains("hidden"))showTab("discover");
}}
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
if((result.data||[]).length<500)break;cursor=result.data.slice(-1)[0].id;
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
const latest=!first?Array.from(state.seen.values()).slice(-1)[0]:null;
const before=older?state.historyCursor:null;
let q=sb.from("direct_messages").select("id,sender_id,recipient_id,content,file_path,file_name,file_type,file_size,created_at").or(dmConversationFilter(userId,peerId,older?null:latest,before)).order("created_at",{ascending:false}).order("id",{ascending:false});
const {data,error}=await q.limit(100);if(!current())return;if(error)throw error;
let page=data||[];
// Catch up all unseen messages after a suspended tab, without gaps over 100 rows.
if(!older&&!first&&page.length===100){
let tail=page.slice(-1)[0];
while(true){
const {data:batch,error:batchError}=await sb.from("direct_messages").select("id,sender_id,recipient_id,content,file_path,file_name,file_type,file_size,created_at").or(dmConversationFilter(userId,peerId,latest,tail)).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(100);
if(!current())return;if(batchError)throw batchError;page.push(...(batch||[]));if((batch||[]).length<100)break;tail=batch.slice(-1)[0];
}}
if(first||older){state.historyCursor=page.slice(-1)[0]||state.historyCursor;state.historyMore=page.length===100;}
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
file_path=user.id+"/"+peer.id+"/"+generateUUID()+"."+ext;const{error:uploadError}=await sb.storage.from("repo-radar-dm").upload(file_path,file,{contentType:file_type,upsert:false});if(uploadError)throw uploadError;}
const {error}=await sb.from("direct_messages").insert({sender_id:user.id,recipient_id:peer.id,content:message,file_path,file_name,file_type,file_size});
if(error){if(file_path){const cleanup=await sb.storage.from("repo-radar-dm").remove([file_path]);if(cleanup.error||!cleanup.data?.length)throw Error(t("cleanupFailed"));}throw error;}
if(!current())return;setStatus("chat-status","");
$("message-input").value="";$("file-input").value="";setStatus("file-preview","");await loadMessages();await loadContacts();
}catch(err){if(current())setStatus("chat-status",safeErr(err),true);}finally{if(current()){button.disabled=false;$("message-input").disabled=false;$("file-input").disabled=false;}}};
localized();reportOAuthRedirectError();onSession().catch(e=>console.error(e));loadRepos();

