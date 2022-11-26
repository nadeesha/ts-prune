import { Project } from "ts-morph";

export const initialize = (tsConfigFilePath: string) => {
  const project = new Project({ tsConfigFilePath });

  return {
    project,
  };
};
