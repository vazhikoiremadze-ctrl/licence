/* SVG აიკონები (ინლაინ, ბიბლიოთეკების გარეშე) */
(function () {
  'use strict';
  var P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 13 2 2 4-4"/>',
    wand: '<path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>',
    bot: '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><path d="M8 16h0"/><path d="M16 16h0"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m8.5 12.5 2.5 2.5 5-6"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    xCircle: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    arrowR: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    flame: '<path d="M12 22c4.4 0 7-2.8 7-6.5 0-4.5-4.6-6-5.5-10.5-2.5 1.5-4 3.6-4 6 0 .8.2 1.6.5 2.3A3.6 3.6 0 0 0 7 10.5C5.7 12 5 13.9 5 16c0 3.4 2.6 6 7 6z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.7V17c0 .6-.5 1-1 1.3-1.1.6-1.5 1.6-1.5 2.7h9c0-1.1-.4-2.1-1.5-2.7-.5-.3-1-.7-1-1.3v-2.3"/><path d="M6 4h12v6a6 6 0 0 1-12 0V4z"/>',
    chart: '<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx="1"/><rect x="12" y="8" width="3" height="10" rx="1"/><rect x="17" y="5" width="3" height="13" rx="1"/>',
    bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h0"/>',
    sound: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.6 5.4a9.4 9.4 0 0 1 0 13.2"/>',
    soundOff: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    play: '<circle cx="12" cy="12" r="10"/><path d="m10 8.5 6 3.5-6 3.5v-7z"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.3"/><path d="M21 3v6h-6"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4.5-4.5L6 21"/>',
    sign: '<path d="M12 2 2 20h20L12 2z"/><path d="M12 9v5"/><path d="M12 17h0"/>',
    car: '<path d="M5 17h14l1.5-6A2.5 2.5 0 0 0 18 8H6a2.5 2.5 0 0 0-2.5 3L5 17z"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
    wheel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.4"/><path d="M12 15.4V21"/><path d="M9.1 10.3 3.8 8.6"/><path d="m14.9 10.3 5.3-1.7"/>',
    twin: '<rect x="3" y="7" width="9" height="13" rx="2"/><rect x="13" y="4" width="8" height="11" rx="2"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m11 12 9-9"/><path d="m16 7 2.5 2.5"/>',
    send: '<path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/>',
    bookOpen: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2V4z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7V4z"/>',
    flag: '<path d="M4 22V4"/><path d="M4 4h13l-2 4 2 4H4"/>',
    route: '<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h6a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6"/>',
    layers: '<path d="m12 2 10 5.5-10 5.5L2 7.5 12 2z"/><path d="m2 12.5 10 5.5 10-5.5"/><path d="m2 17.5 10 5.5 10-5.5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z"/>',
    sparkle: '<path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m5.6 5.6 2.8 2.8"/><path d="m15.6 15.6 2.8 2.8"/><path d="m18.4 5.6-2.8 2.8"/><path d="m8.4 15.6-2.8 2.8"/>',
    gauge: '<path d="M12 15.5 17 9"/><path d="M12 3a9 9 0 0 1 9 9c0 1.7-.5 3.3-1.3 4.6H4.3A8.9 8.9 0 0 1 3 12a9 9 0 0 1 9-9z"/>',
    ruler: '<rect x="2" y="8" width="20" height="8" rx="1.5"/><path d="M6 8v3"/><path d="M10 8v4"/><path d="M14 8v3"/><path d="M18 8v4"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-5"/><path d="M12 8h0"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.1 3.6-6.5 8-6.5s8 2.4 8 6.5"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z"/>',
    cloudOff: '<path d="m2 2 20 20"/><path d="M9 5.4A7 7 0 0 1 20 11.9a4.4 4.4 0 0 1-.5 2.1"/><path d="M5.6 9.3A7 7 0 0 0 9 19h8.5"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    upload: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>'
  };
  function Icon(name, cls) {
    var d = P[name] || P.info;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"' +
      (cls ? ' class="' + cls + '"' : '') + ' aria-hidden="true">' + d + '</svg>';
  }
  function Mascot() {
    return '<svg viewBox="0 0 132 132" aria-hidden="true">' +
      '<circle cx="66" cy="66" r="56" fill="#1d2332" stroke="#ffc83d" stroke-width="4"/>' +
      '<circle cx="66" cy="66" r="40" fill="none" stroke="#39435c" stroke-width="10"/>' +
      '<circle cx="66" cy="66" r="15" fill="#ffc83d"/>' +
      '<path d="M66 81v27" stroke="#39435c" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="M55 61 34 55" stroke="#39435c" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="M77 61 98 55" stroke="#39435c" stroke-width="10" stroke-linecap="round"/>' +
      '<g class="mascot-eyes">' +
      '<circle cx="58" cy="40" r="4.2" fill="#eef1f7" class="eye"/>' +
      '<circle cx="74" cy="40" r="4.2" fill="#eef1f7" class="eye"/>' +
      '</g>' +
      '<path d="M56 47q10 8 20 0" stroke="#eef1f7" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '</svg>';
  }
  function Car() {
    return '<svg viewBox="0 0 190 74" aria-hidden="true">' +
      '<ellipse cx="95" cy="66" rx="82" ry="6" fill="rgba(0,0,0,.35)"/>' +
      '<path d="M14 44c0-9 7-13 16-14l14-11c5-4 10-6 17-6h58c7 0 12 2 17 6l14 11c9 1 16 5 16 14v9c0 3-3 6-6 6H20c-3 0-6-3-6-6v-9z" fill="#ffc83d"/>' +
      '<path d="M50 20h38v16H40l10-16z" fill="#20273a"/>' +
      '<path d="M96 20h40l12 16H96V20z" fill="#20273a"/>' +
      '<path d="M99 22h34l10 13H99V22z" fill="#8fd0ff" opacity=".65"/>' +
      '<path d="M53 22h32v13H43l10-13z" fill="#8fd0ff" opacity=".65"/>' +
      '<rect x="10" y="40" width="14" height="8" rx="3" fill="#ff6b6b"/>' +
      '<rect x="166" y="40" width="14" height="8" rx="3" fill="#fff3c4"/>' +
      '<circle cx="48" cy="59" r="13" fill="#171c28"/><circle cx="48" cy="59" r="6" fill="#4a5570"/>' +
      '<circle cx="142" cy="59" r="13" fill="#171c28"/><circle cx="142" cy="59" r="6" fill="#4a5570"/>' +
      '</svg>';
  }
  window.Icon = Icon;
  window.MascotSVG = Mascot;
  window.CarSVG = Car;
})();
