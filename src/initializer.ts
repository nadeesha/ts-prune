import { Project, ts } from "ts-morph";
import { IConfigInterface } from "./configurator";

export const initialize = (tsConfigFilePath: string, config: IConfigInterface) => {
  const project = new Project({
    tsConfigFilePath,
    resolutionHost: (moduleResolutionHost, getCompilerOptions) => {
      return {
        resolveModuleNames: (moduleNames, containingFile) => {
          const compilerOptions = getCompilerOptions();
          const resolvedModules: ts.ResolvedModule[] = [];

          for (const moduleName of moduleNames.map(removeTsExtension)) {
            const result = ts.resolveModuleName(moduleName, containingFile, compilerOptions, moduleResolutionHost);
            if (result.resolvedModule) {
              if (config.internalDependencies?.includes(result.resolvedModule.packageId?.name)) {
                // For internal dependencies, resolve paths to /dist to /src instead
                const editedFileName = result.resolvedModule.resolvedFileName.replace(/dist\/(.+).d.ts/, 'src/$1.ts');
                result.resolvedModule.resolvedFileName = editedFileName;
              }
              resolvedModules.push(result.resolvedModule);
            } else {
              resolvedModules.push(null);
            }
          }

          return resolvedModules;
        },
      };

      function removeTsExtension(moduleName: string) {
        if (moduleName.slice(-3).toLowerCase() === ".ts")
          return moduleName.slice(0, -3);
        return moduleName;
      }
    },
  });

  return {
    project
  };
};
