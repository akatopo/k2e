(function () {

enyo.kind({
  name: 'k2e.settings.DefaultSettings',
  kind: 'enyo.Object',
  statics: {
    settings: {
      themeName: '"Dark"',
      fontSize: '100',
      textMargin: '"20"',
      ignoredTitleList: '""',
      articleExtraction: 'false',
      periodicalTitleList: '""',
      googleSearchApiKey: '""',
      googleSearchApiCx: '""',
      googleSearchApiLoc: '"https://www.googleapis.com/customsearch/v1?"',
      font: '"Georgia"',
    },
  },
});

})();
