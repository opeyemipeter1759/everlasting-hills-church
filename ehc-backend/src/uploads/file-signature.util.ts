type UploadLike = { buffer: Buffer; mimetype: string };

function startsWith(buffer: Buffer, bytes: number[]): boolean {
  return bytes.every((byte, index) => buffer[index] === byte);
}

function ascii(buffer: Buffer, start: number, end: number): string {
  return buffer.subarray(start, end).toString('ascii');
}

/** Verify the file's magic/container signature rather than trusting multipart MIME. */
export function hasValidFileSignature(file: UploadLike): boolean {
  const { buffer, mimetype } = file;
  if (!buffer?.length) return false;

  switch (mimetype.toLowerCase()) {
    case 'image/jpeg':
    case 'image/jpg':
      return startsWith(buffer, [0xff, 0xd8, 0xff]);
    case 'image/png':
      return startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'image/gif':
      return ascii(buffer, 0, 6) === 'GIF87a' || ascii(buffer, 0, 6) === 'GIF89a';
    case 'image/webp':
      return ascii(buffer, 0, 4) === 'RIFF' && ascii(buffer, 8, 12) === 'WEBP';
    case 'image/avif':
      return ascii(buffer, 4, 8) === 'ftyp' && /avif|avis/.test(ascii(buffer, 8, 32));
    case 'application/pdf':
      return ascii(buffer, 0, 5) === '%PDF-';
    case 'application/msword':
      return startsWith(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return (
        startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]) &&
        buffer.includes(Buffer.from('[Content_Types].xml')) &&
        buffer.includes(Buffer.from('word/'))
      );
    case 'audio/mpeg':
      return ascii(buffer, 0, 3) === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
    case 'audio/mp4':
      return ascii(buffer, 4, 8) === 'ftyp';
    case 'audio/wav':
      return ascii(buffer, 0, 4) === 'RIFF' && ascii(buffer, 8, 12) === 'WAVE';
    case 'audio/ogg':
      return ascii(buffer, 0, 4) === 'OggS';
    case 'audio/aac':
      return buffer[0] === 0xff && (buffer[1] === 0xf1 || buffer[1] === 0xf9);
    default:
      return false;
  }
}
