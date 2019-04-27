import { Project } from "ts-simple-ast";

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
