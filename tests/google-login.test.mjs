import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const openLogin = html.slice(html.indexOf('    var apriLogin ='), html.indexOf('    var chiudiLogin ='));
const automaticLogin = html.slice(html.indexOf("  if (new URLSearchParams(location.search).get('studio')"), html.indexOf("  /* ============ FLASHCARD DELL'AREA"));
function setup(search) {
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, { style: {}, textContent: '', clicks: 0, focused: false, focus() { this.focused = true; }, click() { this.clicks++; } });
    return elements.get(id);
  };
  const loginOverlay = { hidden: true, querySelector: () => get('login-google') };
  const context = vm.createContext({ URLSearchParams, location: { search }, document: { getElementById: get }, loginOverlay, navLogin: get('nav-login'), loginOpener: null });
  vm.runInContext(openLogin, context);
  return { context, get, loginOverlay };
}
test('studio entry opens Google login without a DOM click event', () => {
  const x = setup('?studio=1');
  vm.runInContext(automaticLogin, x.context);
  assert.equal(x.loginOverlay.hidden, false);
  assert.equal(x.get('login-google').clicks, 1);
  assert.equal(x.get('gacct-demo').style.display, 'none');
  assert.equal(x.context.loginOpener, x.get('nav-login'));
});
test('normal click preserves link prevention and focus return target', () => {
  const x = setup('');
  let prevented = false;
  const opener = {};
  x.context.apriLogin({ preventDefault() { prevented = true; }, currentTarget: opener });
  assert.equal(prevented, true);
  assert.equal(x.context.loginOpener, opener);
  assert.equal(x.loginOverlay.hidden, false);
});
test('ordinary homepage does not automatically open login', () => {
  const x = setup('');
  vm.runInContext(automaticLogin, x.context);
  assert.equal(x.loginOverlay.hidden, true);
  assert.equal(x.get('login-google').clicks, 0);
});
