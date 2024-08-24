export function stringToBytes(str: string) {
  const utf8 = new TextEncoder();
  const bytes = utf8.encode("myString");
  return bytes;
}