const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = process.argv[2] || path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const memory = new Map();
let failWrites = false;
const storage = {
  getItem: async key => memory.get(key) ?? null,
  setItem: async (key, value) => { if (failWrites) throw Error('Disk unavailable'); memory.set(key, value); },
  removeItem: async key => memory.delete(key),
};
function load(relative) {
  const source = fs.readFileSync(path.join(root, 'src', relative + '.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: name => name.includes('async-storage') ? storage : load('types/incident') });
  return exports;
}
(async () => {
  const service = load('services/storage');
  const first = await service.getIncidents();
  assert.equal(first.length, 2);
  await assert.rejects(service.updateIncidentStatus(first[0].id, 'RESOLVIDA'));
  await service.saveSession({ email: 'teste@antesdachuva.com', role: 'CIDADAO' });
  await assert.rejects(service.updateIncidentStatus(first[0].id, 'RESOLVIDA'));
  await service.saveSession({ email: 'gestor@antesdachuva.com', role: 'GESTOR' });
  assert.equal((await service.getSession()).role, 'GESTOR');
  await service.updateIncidentStatus(first[0].id, 'EM_ANALISE');
  assert.equal((await service.getIncidentById(first[0].id)).status, 'EM_ANALISE');
  await assert.rejects(service.updateIncidentStatus(first[0].id, 'INVALID'));
  await assert.rejects(service.updateIncidentStatus('missing', 'RESOLVIDA'));
  failWrites = true;
  await assert.rejects(service.updateIncidentStatus(first[0].id, 'RESOLVIDA'));
  assert.equal((await service.getIncidentById(first[0].id)).status, 'EM_ANALISE');
  failWrites = false;
  await service.clearSession();
  assert.equal(await service.getSession(), null);
  memory.set('@antes-da-chuva/session:v1', JSON.stringify({email:'teste@antesdachuva.com'}));
  assert.equal((await service.getSession()).role, 'CIDADAO');
  memory.set('@antes-da-chuva/incidents:v1', JSON.stringify([{ ...first[0], address: undefined, neighborhood: undefined, location: 'Endereço antigo' }]));
  const migrated = (await service.getIncidents())[0];
  assert.equal(migrated.address, 'Endereço antigo');
  assert.equal(migrated.neighborhood, 'Não informado');
  console.log('PASS: roles, denied access, status persistence, validation, write failure, logout and legacy records');
})().catch(error => { console.error(error); process.exitCode = 1; });
