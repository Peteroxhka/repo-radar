// Small reviewed descriptions. We do not label unverified machine translations
// as author-approved. Repository metadata is the fallback for everything else.
const curated={
 "freecodecamp/freecodecamp":{
  ru:"freeCodeCamp — бесплатная образовательная платформа с открытым исходным кодом, которая помогает изучать программирование, математику и информатику. В её репозитории находятся исходники сайта и учебная программа.\n\nПроект предоставляет интерактивные упражнения, практику на реальных задачах и материалы для самостоятельного изучения. Код учебной платформы открыт для изучения и участия сообщества. Открыть оригинальный репозиторий можно по ссылке GitHub в карточке.",
  en:"freeCodeCamp is a free, open-source learning platform for programming, mathematics, and computer science. This repository contains the website's source code and its curriculum.\n\nThe project provides interactive exercises and practical learning materials for people studying independently. Its platform code is open for community contributions. Visit the original GitHub repository to review the implementation and learning materials."
 },
 "shadps4-emu/shadps4":{
  ru:"shadPS4 — проект эмулятора PlayStation 4 с открытым исходным кодом, предназначенный для компьютеров. Разработчики развивают совместимость, графическую подсистему и инструменты запуска программ в эмулируемой среде.\n\nСовместимость конкретных игр зависит от версии эмулятора, оборудования и текущего состояния проекта. Перед использованием проверяйте документацию и актуальные сведения в официальном репозитории.",
  en:"shadPS4 is an open-source PlayStation 4 emulator project for computers. Its developers work on compatibility, graphics, and runtime features within an emulated environment.\n\nCompatibility with individual games depends on the emulator version, hardware, and ongoing development. Consult the official repository for current documentation and support details."
 },
 "microsoft/vscode":{
  ru:"Visual Studio Code — редактор исходного кода, разработанный Microsoft. Этот репозиторий содержит открытый код редактора, информацию о разработке, баг-трекер и материалы для участников проекта.\n\nРедактор поддерживает различные языки программирования, отладку и систему расширений. Отдельные сборки и связанные сервисы могут распространяться на собственных условиях: проверяйте лицензию и документацию.",
  en:"Visual Studio Code is Microsoft's source-code editor. This repository hosts the open-source code, development resources, issue tracking, and contribution materials.\n\nThe editor supports multiple programming languages, debugging, and extensions. Some distributed builds and associated services may use separate terms; review the project's licensing and documentation."
 },
 "facebook/react":{
  ru:"React — библиотека JavaScript для создания пользовательских интерфейсов из повторно используемых компонентов. Код распространяется как открытый проект и поддерживается разработчиками и сообществом.\n\nРепозиторий содержит исходники, тесты, документацию и материалы для участников разработки. Реальные возможности зависят от версии библиотеки и используемой среды.",
  en:"React is a JavaScript library for building user interfaces from reusable components. It is developed openly with community participation.\n\nThe repository includes source code, tests, documentation, and contributor resources. Available APIs depend on the library version and runtime environment."
 }
};
export function curatedDescription(fullName){
 return curated[String(fullName||"").toLowerCase()]||null;
}
