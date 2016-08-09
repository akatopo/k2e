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
        { name: 'Georgia', family: 'georgia' },
        { name: 'Serif', family: 'serif' },
      ],
      { name: 'Caslon Pro', family: 'adobe-caslon-pro' },
      { name: 'Bookerly', family: 'bookerly' },
      [
        { name: 'Droid', family: 'droid sans' },
        { name: 'Roboto', family: 'roboto', fallback: 'sans' },
        { name: 'Verdana', family: 'verdana', fallback: 'sans' },
        { name: 'Sans', family: 'sans' },
      ],
    ],
  },
});

})();
