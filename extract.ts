import ts, { SourceFile } from "typescript";
import fs from "fs";

const apiFile = "./webclientapitests/api.ts";
const folderPath = "./tests";

const importCode = "import {expect, test} from '@jest/globals';\r\n\r\n";

const testTemplate = "test(\"\", async () => {})";

function append(fileName: string, text: string) {
  fs.appendFile(fileName, text+'\r\n', function(err: any) {
    if (err) throw err;
    console.log(err);
    });
}



function findInterfaceNode(sourceFile: ts.SourceFile, interfaceName: string): ts.InterfaceDeclaration | undefined {
  let foundInterface: ts.InterfaceDeclaration | undefined;

  ts.forEachChild(sourceFile, visit);

  function visit(node: ts.Node) {
      if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
          foundInterface = node;
          return;
      }
      ts.forEachChild(node, visit);
  }

  return foundInterface;
}

function getClassMethodsWithSignature(sourceFile: ts.SourceFile): string[] {
  const methodNames: string[] = [];

  // Visit each node in the source file
  ts.forEachChild(sourceFile, visit);

  function visit(node: ts.Node) {
    if (ts.isClassDeclaration(node) && node.name) {
        const className = node.name.text;
        if (className) {    
          const classNameFile = `${folderPath}/${className}`+'.ts';    
          fs.writeFile(classNameFile, importCode, function(err: any) {
            if (err) throw err;
            console.log(err);
            }
        );
        ts.forEachChild(node, (member) => {            
          if (ts.isMethodDeclaration(member)) {
              const methodName = member.name.getText();
              if (methodName) {
                  append(classNameFile, ` Method ${methodName}`);
                  //console.log(methodName);
                  methodNames.push(methodName);  
              }
              member.parameters.forEach((param, index) => {
                const paramName = param.name.getText();
                const paramType = param.type?.getText();

                append(classNameFile, ` Param ${index + 1}: ${paramName} (${paramType})`);

                //console.log(` Param ${index + 1}: ${paramName} (${paramType})`);
                let interfaceNode = findInterfaceNode(sourceFile, paramType as string);
                if (interfaceNode) {
                  append(classNameFile, ` Interface ${interfaceNode.name.text}`);
                  //console.log(` Interface ${interfaceNode.name.text}`);
                }
            });
          }
      });
      }
        // ts.forEachChild(node, (member) => {            
        //     if (ts.isMethodDeclaration(member)) {
        //         const methodName = member.name.getText();
        //         if (methodName) {
        //             console.log(methodName);
        //             methodNames.push(methodName);  
        //         }
        //         member.parameters.forEach((param, index) => {
        //           const paramName = param.name.getText();
        //           const paramType = param.type?.getText();
        //           fs.writeFile(classNameFile, ` Param ${index + 1}: ${paramName} (${paramType})` function(err: any) {
        //             if (err) throw err;
        //             console.log(err);
        //             });
        //           console.log(` Param ${index + 1}: ${paramName} (${paramType})`);
        //           let interfaceNode = findInterfaceNode(sourceFile, paramType as string);
        //           if (interfaceNode) {
        //             console.log(` Interface ${interfaceNode.name.text}`);

        //           }
        //       });
        //     }
        // });
    }

    ts.forEachChild(node, visit);
}
  return classNames;
}

const fileContent = fs.readFileSync(apiFile, "utf8");

// Step 2: Create the SourceFile
const sourceFile = ts.createSourceFile(
  apiFile, // The file name
    fileContent, // The file content
    ts.ScriptTarget.ES2020, // The script target
    true, // Set to true if the file is a module
    ts.ScriptKind.TS // The script kind
);

fs.mkdir(folderPath, { recursive: true }, (err) => { if (err) throw err});
const classNames = getClassMethodsWithSignature(sourceFile as SourceFile);
console.log(classNames);