/* Conservative console identification for legacy browser engines (ES5).
   User-Agent strings are hints, never proof of firmware or jailbreak support. */
(function (root) {
  "use strict";
  var models = [
    { id: "PS5", label: "PlayStation 5", match: /PlayStation\s*5(?:\b|\/)/i },
    { id: "PS4", label: "PlayStation 4", match: /PlayStation\s*4(?:\b|\/)/i },
    { id: "PS3", label: "PlayStation 3", match: /(?:PLAYSTATION\s*3|PS3Browser)/i },
    { id: "PS Vita", label: "PS Vita", match: /(?:PlayStation\s*Vita|PS\s*Vita)/i },
    { id: "Wii U", label: "Wii U", match: /(?:Nintendo\s*Wii\s*U|Nintendo\s*WiiU|WiiU)/i },
    { id: "Nintendo Switch", label: "Nintendo Switch", match: /Nintendo\s*Switch/i },
    { id: "Xbox", label: "Xbox", match: /(?:Xbox\s*(?:One|Series)|Xbox\b)/i }
  ];
  function normalVersion(value) {
    var text = String(value || "").trim();
    return /^\d{1,2}\.\d{1,2}(?:\.\d{1,2})?$/.test(text) ? text : "";
  }
  function detect(userAgent) {
    var ua = String(userAgent || "").slice(0, 800);
    var selected = null, i;
    for (i = 0; i < models.length; i++) {
      if (models[i].match.test(ua)) { selected = models[i]; break; }
    }
    var firmware = "",versionMatch;
    // PlayStation firmware appears in the user-agent on many, but not all,
    // firmware/browser combinations. Do not parse unrelated Safari/WebKit versions.
    if (selected && selected.id === "PS5") {
      versionMatch = ua.match(/PlayStation\s*5\s*\/\s*(\d{1,2}\.\d{2}(?:\.\d{1,2})?)/i);
      if (versionMatch) firmware = normalVersion(versionMatch[1]);
    } else if (selected && selected.id === "PS4") {
      versionMatch = ua.match(/PlayStation\s*4\s*(?:\/|\s)\s*(\d{1,2}\.\d{2}(?:\.\d{1,2})?)/i);
      if (versionMatch) firmware = normalVersion(versionMatch[1]);
    }
    return {
      model: selected ? selected.id : "",
      label: selected ? selected.label : "",
      firmware: firmware,
      reportedBy: selected ? "user-agent" : "unknown",
      userAgent: ua
    };
  }
  function firmwareCheck(value) {
    return normalVersion(value);
  }
  root.RepoRadarConsoleDetect = { detect: detect, firmwareCheck: firmwareCheck, models: models.map(function (model) {
    return { id: model.id, label: model.label };
  }) };
}(typeof window !== "undefined" ? window : this));
