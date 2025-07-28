// Convert file to Uint8Array chunks
export const fileToChunks = async (file: File, chunkSize = 1024 * 1024) => { // 1MB chunks
    const chunks: Uint8Array[] = [];
    let offset = 0;

    while (offset < file.size) {
        const chunk = file.slice(offset, offset + chunkSize);
        const arrayBuffer = await chunk.arrayBuffer();
        chunks.push(new Uint8Array(arrayBuffer));
        offset += chunkSize;
    }

    return chunks;
};