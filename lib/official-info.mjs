// First-party text for Repo Radar. Never machine-translate third-party
// repository descriptions; this module only localizes our own project.
const officialTranslations={
  "en": {
    "featuredRepoEyebrow": "Official source of Repo Radar",
    "featuredRepoTitle": "Repo Radar on GitHub",
    "repoRadarDescription": "Repo Radar is an open-source GitHub project discovery site with search, categories, filters, project previews, and a community.",
    "featuredRepoGithub": "View source code",
    "featuredRepoWebsite": "Open website"
  },
  "ru": {
    "featuredRepoEyebrow": "Официальные исходники Repo Radar",
    "featuredRepoTitle": "Repo Radar на GitHub",
    "repoRadarDescription": "Repo Radar — открытый каталог проектов GitHub с поиском, категориями, фильтрами, карточками проектов и сообществом.",
    "featuredRepoGithub": "Исходный код на GitHub",
    "featuredRepoWebsite": "Открыть сайт"
  },
  "es": {
    "featuredRepoEyebrow": "Código oficial de Repo Radar",
    "featuredRepoTitle": "Repo Radar en GitHub",
    "repoRadarDescription": "Repo Radar es un catálogo de proyectos de GitHub de código abierto con búsqueda, categorías, filtros, vistas previas y comunidad.",
    "featuredRepoGithub": "Ver código fuente",
    "featuredRepoWebsite": "Abrir sitio web"
  },
  "fr": {
    "featuredRepoEyebrow": "Code source officiel de Repo Radar",
    "featuredRepoTitle": "Repo Radar sur GitHub",
    "repoRadarDescription": "Repo Radar est un catalogue open source de projets GitHub avec recherche, catégories, filtres, aperçus et communauté.",
    "featuredRepoGithub": "Voir le code source",
    "featuredRepoWebsite": "Ouvrir le site"
  },
  "de": {
    "featuredRepoEyebrow": "Offizieller Quellcode von Repo Radar",
    "featuredRepoTitle": "Repo Radar auf GitHub",
    "repoRadarDescription": "Repo Radar ist ein quelloffener GitHub-Projektkatalog mit Suche, Kategorien, Filtern, Projektvorschauen und Community.",
    "featuredRepoGithub": "Quellcode ansehen",
    "featuredRepoWebsite": "Website öffnen"
  },
  "pt": {
    "featuredRepoEyebrow": "Código-fonte oficial do Repo Radar",
    "featuredRepoTitle": "Repo Radar no GitHub",
    "repoRadarDescription": "Repo Radar é um catálogo aberto de projetos do GitHub com pesquisa, categorias, filtros, prévias de projetos e comunidade.",
    "featuredRepoGithub": "Ver código-fonte",
    "featuredRepoWebsite": "Abrir site"
  },
  "zh": {
    "featuredRepoEyebrow": "Repo Radar 官方源代码",
    "featuredRepoTitle": "GitHub 上的 Repo Radar",
    "repoRadarDescription": "Repo Radar 是一个开源 GitHub 项目目录，支持搜索、分类、筛选、项目预览和社区交流。",
    "featuredRepoGithub": "查看源代码",
    "featuredRepoWebsite": "打开网站"
  },
  "ja": {
    "featuredRepoEyebrow": "Repo Radar の公式ソースコード",
    "featuredRepoTitle": "GitHub の Repo Radar",
    "repoRadarDescription": "Repo Radar は検索、カテゴリ、フィルター、プロジェクトのプレビュー、コミュニティ機能を備えたオープンソースの GitHub プロジェクトカタログです。",
    "featuredRepoGithub": "ソースコードを見る",
    "featuredRepoWebsite": "サイトを開く"
  },
  "ko": {
    "featuredRepoEyebrow": "Repo Radar 공식 소스 코드",
    "featuredRepoTitle": "GitHub의 Repo Radar",
    "repoRadarDescription": "Repo Radar는 검색, 카테고리, 필터, 프로젝트 미리보기 및 커뮤니티 기능을 갖춘 오픈 소스 GitHub 프로젝트 카탈로그입니다.",
    "featuredRepoGithub": "소스 코드 보기",
    "featuredRepoWebsite": "웹사이트 열기"
  },
  "ar": {
    "featuredRepoEyebrow": "الشيفرة المصدرية الرسمية لـ Repo Radar",
    "featuredRepoTitle": "Repo Radar على GitHub",
    "repoRadarDescription": "Repo Radar دليل مفتوح المصدر لمشاريع GitHub يضم البحث والتصنيفات والفلاتر ومعاينة المشاريع ومجتمع المستخدمين.",
    "featuredRepoGithub": "عرض الشيفرة المصدرية",
    "featuredRepoWebsite": "فتح الموقع"
  },
  "hi": {
    "featuredRepoEyebrow": "Repo Radar का आधिकारिक सोर्स कोड",
    "featuredRepoTitle": "GitHub पर Repo Radar",
    "repoRadarDescription": "Repo Radar एक ओपन-सोर्स GitHub प्रोजेक्ट कैटलॉग है जिसमें खोज, श्रेणियाँ, फ़िल्टर, प्रोजेक्ट प्रीव्यू और समुदाय शामिल हैं।",
    "featuredRepoGithub": "सोर्स कोड देखें",
    "featuredRepoWebsite": "वेबसाइट खोलें"
  },
  "tr": {
    "featuredRepoEyebrow": "Repo Radar resmî kaynak kodu",
    "featuredRepoTitle": "GitHub'da Repo Radar",
    "repoRadarDescription": "Repo Radar; arama, kategoriler, filtreler, proje önizlemeleri ve topluluk özellikleri sunan açık kaynaklı bir GitHub proje kataloğudur.",
    "featuredRepoGithub": "Kaynak kodu görüntüle",
    "featuredRepoWebsite": "Web sitesini aç"
  }
};
export function officialText(locale,key){
 return (officialTranslations[locale]||officialTranslations.en)[key]||officialTranslations.en[key]||null;
}
export const supportedOfficialLocales=Object.keys(officialTranslations);
