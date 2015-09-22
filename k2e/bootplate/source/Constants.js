enyo.kind({
    name: "Constants",

    kind: "enyo.Object",

    statics: {
        "EXPORT_PATH": '/Default.aspx/Export',
        "AUTH_PATH": '/Auth.aspx',
        "AUTH_WINDOW_NAME": 'k2e Evernote authentication',
        "AUTH_WINDOW_FEATURES": 'width=800, height=600',
        "AUTH_DONE_QUERY_PARAM": 'authDone',
        "ACCESS_TOKEN_COOKIE_NAME": 'K2eAccessToken',
        "CONSUMER_PUBLIC_KEY_COOKIE_NAME": 'ConsumerPublicKey',
        "POPUP_TIMEOUT_MS": 4000
    }
});