/* global k2e */

(function () {

enyo.kind({
  name: 'k2e.settings.RevokeEvernotePermissionsActionItem',
  kind: 'k2e.settings.SettingsActionItem',
  classes: 'k2e-settings-item-caution',
  label: 'Revoke Evernote permissions',
  buttonLabel: 'Revoke',
  buttonClasses: 'k2e-caution-button',
  cookieModel: undefined,
  computed: [
    {method: 'disabledComputed', path: [
        'cookieModel',
        'modelDep1',
        'modelDep2'
    ]}
  ],
  disabledComputed: function () {
    return !(
        !!this.get('cookieModel.' + k2e.Constants.CONSUMER_PUBLIC_KEY_COOKIE_NAME) &&
        !!this.get('cookieModel.' + k2e.Constants.ACCESS_TOKEN_COOKIE_NAME)
    );
  },
  bindings: [
    { from: '.disabledComputed', to: '.disabled'},
    { from: '.cookieModel.' + k2e.Constants.CONSUMER_PUBLIC_KEY_COOKIE_NAME, to: '.modelDep1' },
    { from: '.cookieModel.' + k2e.Constants.ACCESS_TOKEN_COOKIE_NAME, to: '.modelDep2' }
  ]
});

})();
