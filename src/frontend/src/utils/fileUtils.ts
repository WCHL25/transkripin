// Optimized file chunking function
export const fileToChunks = async (file: File, chunkSize: number = 1024 * 1024): Promise<Uint8Array[]> => {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const fileReader = new FileReader();
    let offset = 0;

    const readNextChunk = () => {
      if (offset >= file.size) {
        resolve(chunks);
        return;
      }

      const slice = file.slice(offset, offset + chunkSize);
      fileReader.readAsArrayBuffer(slice);
    };

    fileReader.onload = (event) => {
      if (event.target?.result) {
        const chunk = new Uint8Array(event.target.result as ArrayBuffer);
        chunks.push(chunk);
        offset += chunkSize;
        
        // Use setTimeout to prevent blocking the UI thread
        setTimeout(readNextChunk, 0);
      }
    };

    fileReader.onerror = (error) => {
      reject(error);
    };

    // Start reading
    readNextChunk();
  });
};

// Alternative streaming approach for very large files
export const fileToChunksStream = async (file: File, chunkSize: number = 512 * 1024): Promise<Uint8Array[]> => {
  const chunks: Uint8Array[] = [];
  
  // Use streams if available (modern browsers)
  if (file.stream) {
    const reader = file.stream().getReader();
    let buffer = new Uint8Array(0);
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        // Combine with existing buffer
        const newBuffer = new Uint8Array(buffer.length + value.length);
        newBuffer.set(buffer);
        newBuffer.set(value, buffer.length);
        buffer = newBuffer;
        
        // Extract complete chunks
        while (buffer.length >= chunkSize) {
          chunks.push(buffer.slice(0, chunkSize));
          buffer = buffer.slice(chunkSize);
        }
      }
      
      // Add remaining data as final chunk
      if (buffer.length > 0) {
        chunks.push(buffer);
      }
      
    } finally {
      reader.releaseLock();
    }
    
    return chunks;
  }
  
  // Fallback to FileReader approach
  return fileToChunks(file, chunkSize);
};