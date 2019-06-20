export const writer = (outputStream: NodeJS.WriteStream) => (
  payload: string
) => {
  outputStream.write(payload);
  outputStream.write("\n");
};
