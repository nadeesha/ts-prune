import { Project } from "ts-morph";

export const initialize = (
  tsConfigFilePath: string,
  outputStream: NodeJS.WriteStream
) => {
  const project = new Project({ tsConfigFilePath });

  return {
    project,
    writer: (payload: string) => outputStream.write(payload)
  };
};
