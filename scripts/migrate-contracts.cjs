/* One-time, reproducible inventory of the Angular contracts. No Angular runtime is used by React. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('../../node_modules/typescript');
const root = path.resolve(__dirname, '../..');
const source = path.join(root, 'src/app');
const target = path.join(root, 'react-app/src');
if (fs.existsSync(path.join(target, 'app/route-components.ts'))) {
  throw new Error(
    'Bootstrap migration already exists. Edit the maintained React sources; do not overwrite customized pages.',
  );
}
const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const parse = (file) =>
  ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};
const label = (value) =>
  value
    .replace(/Component$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\bId\b/gi, 'ID')
    .replace(/^./, (v) => v.toUpperCase());
const classes = new Map();
for (const folder of ['RequestModel', 'ResponseModel']) {
  for (const file of walk(path.join(source, folder)).filter((f) => f.endsWith('.ts'))) {
    const ast = parse(file);
    for (const c of ast.statements.filter(ts.isClassDeclaration)) classes.set(c.name.text, c);
    write(
      path.join(target, 'models', folder, path.relative(path.join(source, folder), file)),
      fs.readFileSync(file, 'utf8').replace(/\u00a0/g, ' '),
    );
  }
}
function fieldsFor(name, seen = new Set()) {
  if (seen.has(name)) return [];
  seen.add(name);
  const c = classes.get(name);
  if (!c) return [];
  const inherited = (c.heritageClauses || []).flatMap((h) =>
    h.types.flatMap((t) => fieldsFor(t.expression.getText(), seen)),
  );
  return [
    ...inherited,
    ...c.members.filter(ts.isPropertyDeclaration).map((m) => {
      const type = m.type?.getText() || 'string';
      const init = m.initializer?.getText();
      let initial;
      if (init && /^-?\d+(\.\d+)?$/.test(init)) initial = Number(init);
      else if (init === 'true' || init === 'false') initial = init === 'true';
      else if (init && /^['"]/.test(init)) initial = init.slice(1, -1);
      return {
        name: m.name.getText(),
        label: label(m.name.getText()),
        type: /number/.test(type)
          ? 'number'
          : /boolean/.test(type)
            ? 'boolean'
            : /File/.test(type)
              ? 'file'
              : /Date/.test(type)
                ? 'date'
                : 'string',
        required: !m.questionToken && !type.includes('null'),
        ...(initial !== undefined ? { default: initial } : {}),
      };
    }),
  ];
}
const operations = {};
const byClass = {};
const services = [];
const missing = [];
for (const file of walk(path.join(source, 'services')).filter(
  (f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'),
)) {
  const ast = parse(file);
  for (const c of ast.statements.filter(ts.isClassDeclaration)) {
    const className = c.name.text;
    const entries = [];
    for (const m of c.members.filter(ts.isMethodDeclaration)) {
      const name = m.name.getText();
      if (!m.type?.getText().startsWith('Observable')) continue;
      const body = m.body?.getText() || '';
      const apiPath = body.match(
        /["'`]((?:\/)(?:MasterData|User|Config|AA|Transaction|Report|SysMgr|PaySPMT)\/[^"'`?\s]+)([^"'`]*)["'`]/,
      );
      if (!apiPath) {
        missing.push(className + '.' + name);
        continue;
      }
      const method = /PostAPI|PostFileAPI|\.post[<(]|HttpRequest\('POST'/.test(body)
        ? 'POST'
        : 'GET';
      let fields = method === 'POST' ? fieldsFor(m.parameters[0]?.type?.getText()) : [];
      const query = {};
      for (const match of body.matchAll(/[?&](\w+)=["']\s*\+\s*(\w+)/g)) {
        query[match[1]] = match[2];
        const p = m.parameters.find((p) => p.name.getText() === match[2]);
        fields.push({
          name: match[2],
          label: label(match[1]),
          type: p?.type?.getText() === 'number' ? 'number' : 'string',
          required: true,
        });
      }
      if (name === 'login')
        fields = [
          { name: 'Username', label: 'Username', type: 'string', required: true },
          { name: 'Password', label: 'Password', type: 'string', required: true },
        ];
      const multipart = /PostFileAPI/.test(body);
      if (multipart) fields = [{ name: 'file', label: 'File', type: 'file', required: true }];
      const id = className + '.' + name;
      // GET alone does not imply a read: token generation changes state.
      const read =
        /^(Get|List|GenderList|MaritalStatusList|AdressTypeList|AgencyList|BankList|StateList|District|KycTypeList|UserType|Demographic|PayoutTransactionReport)/.test(
          name,
        ) && !/Generate|Customer/.test(name);
      operations[id] = {
        id,
        title: label(name)
          .replace(/^Getall/i, 'List')
          .replace(/^Get All /, 'List '),
        method,
        path: apiPath[1],
        query,
        fields,
        read,
        ...(multipart ? { multipart } : {}),
      };
      entries.push([name, id]);
    }
    if (entries.length) {
      byClass[className] = Object.fromEntries(entries);
      services.push(className);
      write(
        path.join(target, 'services', className + '.ts'),
        `import { operationRequest } from '../core/api';\nimport { operations } from './operations';\nimport type { Fields } from '../core/types';\n\nexport const ${className} = {\n${entries.map(([name, id]) => `  ${name}: (values: Fields = {}, signal?: AbortSignal) => operationRequest(operations[${JSON.stringify(id)}], values, signal),`).join('\n')}\n};\n`,
      );
    }
  }
}
const routeAst = parse(path.join(source, 'app.routes.ts'));
const imports = {};
for (const i of routeAst.statements.filter(ts.isImportDeclaration)) {
  for (const named of i.importClause?.namedBindings?.elements || [])
    imports[named.name.text] = path.resolve(source, i.moduleSpecifier.text + '.ts');
}
const pages = [];
function visit(n, parent = '') {
  if (ts.isObjectLiteralExpression(n)) {
    const props = Object.fromEntries(
      n.properties.filter(ts.isPropertyAssignment).map((p) => [p.name.getText(), p.initializer]),
    );
    const route = props.path?.text;
    if (route === 'Dashboard') {
      props.children?.elements.forEach((e) => visit(e, '/Dashboard'));
      return;
    }
    if (props.component && imports[props.component.getText()] && route !== '**') {
      const component = props.component.getText();
      const file = imports[component];
      const ast = parse(file);
      const text = fs.readFileSync(file, 'utf8');
      const html = fs.readFileSync(file.replace('.ts', '.html'), 'utf8');
      const c = ast.statements.find(ts.isClassDeclaration);
      const constructor = c.members.find(ts.isConstructorDeclaration);
      const injection = Object.fromEntries(
        (constructor?.parameters || [])
          .filter((p) => p.type)
          .map((p) => [p.name.getText(), p.type.getText()]),
      );
      const used = [];
      function calls(node) {
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
          const expression = node.expression;
          const owner = expression.expression.getText().replace(/^this\./, '');
          const service = injection[owner];
          const id = byClass[service]?.[expression.name.text];
          if (id && !used.includes(id)) used.push(id);
        }
        ts.forEachChild(node, calls);
      }
      calls(c);
      const defaults = {};
      for (const match of text.matchAll(/this\.\w+\.(\w+)\s*=\s*(\d+|['"][^'"\r\n]*['"])\s*;/g)) {
        if (!/Mobile|Token|Password|reference/i.test(match[1]))
          defaults[match[1]] = /^\d+$/.test(match[2]) ? Number(match[2]) : match[2].slice(1, -1);
      }
      const columnsText = text.match(/displayedColumns[^=]*=\s*\[([^\]]*)\]/)?.[1] || '';
      const columns = [...columnsText.matchAll(/['"]([^'"]+)['"]/g)]
        .map((m) => m[1])
        .filter((n) => !/action|button|select|edit|view|approve/i.test(n));
      const title = html.match(/<h[1-3][^>]*>([^<{]+)<\//)?.[1]?.trim() || label(component);
      pages.push({
        path: parent + '/' + route,
        title,
        group: file.split(path.sep).slice(-3, -2)[0],
        component: component.replace(/Component$/, 'Page'),
        source: path.relative(root, file).replaceAll('\\', '/'),
        operations: used,
        defaults,
        columns,
      });
    }
  }
  ts.forEachChild(n, (child) => visit(child, parent));
}
visit(routeAst);
write(
  path.join(target, 'services/operations.ts'),
  `import type { Operation } from '../core/types';\nexport const operations: Record<string, Operation> = ${JSON.stringify(operations, null, 2)};\n`,
);
write(
  path.join(target, 'app/pages.ts'),
  `import type { PageDefinition } from '../core/types';\nexport const pages: PageDefinition[] = ${JSON.stringify(pages, null, 2)};\n`,
);
for (const p of pages.filter((p) => p.path.startsWith('/Dashboard/'))) {
  write(
    path.join(target, 'pages', p.component + '.tsx'),
    `import { FeaturePage } from '../components/FeaturePage';\nimport { pages } from '../app/pages';\nexport default function ${p.component}() {\n  return <FeaturePage page={pages.find(page => page.path === ${JSON.stringify(p.path)})!} />;\n}\n`,
  );
}
write(
  path.join(target, 'app/route-components.ts'),
  `import { lazy } from 'react';\nexport const routeComponents = {\n${pages
    .filter((p) => p.path.startsWith('/Dashboard/'))
    .map((p) => `  ${JSON.stringify(p.path)}: lazy(() => import('../pages/${p.component}')),`)
    .join('\n')}\n};\n`,
);
write(
  path.join(root, 'react-app/CONTRACT_INVENTORY.json'),
  JSON.stringify(
    {
      routes: pages.length,
      dashboardRoutes: pages.filter((p) => p.path.startsWith('/Dashboard/')).length,
      services,
      operations: Object.keys(operations).length,
      methodsRequiringManualImplementation: missing,
    },
    null,
    2,
  ),
);
console.log(
  `Generated ${pages.length} pages, ${Object.keys(operations).length} operations, ${services.length} services. Manual methods: ${missing.join(', ')}`,
);
