(function () {

enyo.kind({
  name: 'k2e.Constants',
  kind: 'enyo.Object',
  statics: {
    EXPORT_PATH: '/Default.aspx/Export',
    AUTH_PATH: '/Auth.aspx',
    REVOKE_PATH: '/Default.aspx/Revoke',
    AUTH_WINDOW_NAME: 'k2e Evernote authentication',
    AUTH_WINDOW_FEATURES: 'width=800, height=600',
    AUTH_DONE_QUERY_PARAM: 'authDone',
    ACCESS_TOKEN_COOKIE_NAME: 'K2eAccessToken',
    CONSUMER_PUBLIC_KEY_COOKIE_NAME: 'ConsumerPublicKey',
    THEME_INFO: [
      { name: 'Dark', class: 'k2e-document-view-dark' },
      { name: 'Light', class: 'k2e-document-view-light' },
      { name: 'OMG ponies', class: 'k2e-document-view-omg-ponies' },
    ],
    FONT_INFO: [
      [
        { name: 'Acuta', family: 'acuta', webFont: true, fallback: 'serif' },
        { name: 'Serif', family: 'serif' },
      ],
      [
        { name: 'Bookerly', family: 'bookerly', fallback: 'serif' },
        { name: 'Georgia', family: 'georgia', fallback: 'serif' },
        { name: 'Serif', family: 'serif' },
      ],
      [
        { name: 'PT Sans', family: 'pt-sans', webFont: true, fallback: 'sans-serif' },
        { name: 'Droid', family: 'droid sans', fallback: 'sans-serif' },
        { name: 'Roboto', family: 'roboto', fallback: 'sans-serif' },
        { name: 'Verdana', family: 'verdana', fallback: 'sans-serif' },
        { name: 'Sans', family: 'sans-serif' },
      ],
    ],
  },
});

})();
