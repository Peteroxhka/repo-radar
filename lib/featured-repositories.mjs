// Reviewed repository seeds. Each row is fetched again from the official
// GitHub API before insertion; never trust a URL's existence or description.
// Seeds are an inclusion list, not a bypass of fork/archive/empty checks.
export const featuredOriginals=[
 {fullName:"dnestruev/messenger",category:"tools",
  homepage:"https://dnestruev.github.io/messenger/",
  fallbackDescription:"Веб-мессенджер с прямыми сообщениями и файлами"},
 {fullName:"Peteroxhka/repo-radar",category:"web",
  homepage:"https://peteroxhka.github.io/repo-radar/",
  fallbackDescription:"Каталог GitHub-проектов с поиском, категориями и сообществом"},
 {fullName:"Peteroxhka/ConsoleWebKit",category:"web",
  homepage:"https://peteroxhka.github.io/ConsoleWebKit/",
  verifyFile:"index.html",
  fallbackDescription:"ConsoleWebKit — диагностика консольных браузеров и каталог проектов"},
 // Original upstream projects supplied by the owner of Repo Radar.
 {fullName:"itsPLK/ps5-y2jb-autoloader",category:"tools",
  fallbackDescription:"PS5 research and payload loader project"},
 {fullName:"niakw/ProsperoEden-Encore",category:"games",
  fallbackDescription:"Experimental Nintendo Switch emulator for PS5 homebrew"},
 {fullName:"Gezine/CivSwitch",category:"tools",
  fallbackDescription:"Nintendo Switch userland security research"},
 {fullName:"zecoxao/BD-JB-Relapse",category:"tools",
  fallbackDescription:"PS5 Blu-ray Java security research"},
 {fullName:"mihawk-99/PS5_MihawkOS",category:"games",
  fallbackDescription:"Experimental homebrew environment for PlayStation 5"},
 {fullName:"notmaj0r/Y2JB",category:"tools",
  fallbackDescription:"PS5 YouTube application userland security research"},
 {fullName:"THZoria/NX_Firmware",category:"tools",
  fallbackDescription:"Nintendo Switch firmware reference"},
 {fullName:"sthetix/Warmboot-Extractor",category:"tools",
  fallbackDescription:"Nintendo Switch firmware utility"},
 {fullName:"suchmememanyskill/EmmcHaccGen",category:"tools",
  fallbackDescription:"Nintendo Switch eMMC preparation utility"},
 {fullName:"Ultra-NX/UltraNX",category:"games",
  fallbackDescription:"Customized firmware project for Nintendo Switch"},
 {fullName:"Atmosphere-NX/Atmosphere",category:"games",
  fallbackDescription:"Custom firmware for Nintendo Switch"},
 {fullName:"Swordpdf/PS5SX2",category:"games",
  fallbackDescription:"PCSX2 emulator port for PS5 homebrew"},
 {fullName:"illusionyy/ps-patch-system",category:"tools",
  fallbackDescription:"Application patching framework for PS4 and PS5"},
 {fullName:"mpereiraesaa/prospero-win",category:"games",
  fallbackDescription:"Windows application compatibility runtime for PS5"},
 {fullName:"MangoScango/ps5-account-tools",category:"tools",
  fallbackDescription:"Local account and profile management utilities for PS5"}
];
// Separate verified owner accounts. 0-star projects are eligible if they
// contain meaningful source and a clear description.
export const trackedOwners=["Peteroxhka","dnestruev"];
export const consoleDiscoveryQueries=[
 ["games","topic:ps5-homebrew"],
 ["games","topic:playstation-5"],
 ["games","topic:nintendo-switch"],
 ["tools","ps5 developer tools in:name,description"],
 ["games","switch emulator in:name,description"],
 ["tools","console homebrew in:name,description"]
];
