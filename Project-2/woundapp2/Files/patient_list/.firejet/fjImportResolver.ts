import _generate from '@babel/generator';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import path from 'path';
import { Plugin } from 'vite';

//@ts-ignore
const generate = _generate.default as typeof _generate;

/**Given a path, return the name of the compiled file group */
type ImportPathToGroupName = Record<string, string>;

export function customImportPlugin(pathToGroup: ImportPathToGroupName): Plugin {
  const getLibPath = (groupName: string) => {
    return path.join('/.firejet', groupName, 'library.js');
  };

  return {
    name: 'custom-import-plugin',
    enforce: 'pre',
    async resolveId(source, importer) {
      const groupName = pathToGroup[source];
      if (groupName === undefined) return null;
      const libPath = getLibPath(groupName);
      return libPath;
    },
    transform(code, id) {
      // Skip non-JavaScript/TypeScript files
      if (!/\.[jt]sx?$/.test(id)) {
        return null;
      }

      return null;

      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });

      let modified = false;

      traverse(ast, {
        ImportDeclaration(nodePath) {
          // Check if this import couldn't be resolved
          const groupName = pathToGroup[nodePath.node.source.value];
          if (groupName === undefined) return;

          modified = true;

          // Convert default import to named import
          if (nodePath.node.specifiers[0].type === 'ImportDefaultSpecifier') {
            nodePath.node.specifiers = [
              t.importSpecifier(
                t.identifier(nodePath.node.specifiers[0].local.name),
                t.identifier(nodePath.node.specifiers[0].local.name),
              ),
              ...nodePath.node.specifiers.slice(1),
            ];
          }
        },
      });

      if (!modified) return null;

      const output = generate(ast, { retainLines: true }, code);
      return {
        code: output.code,
        map: output.map,
      };
    },
  };
}
