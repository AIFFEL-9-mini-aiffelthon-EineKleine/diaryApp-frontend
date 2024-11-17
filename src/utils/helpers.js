export const splitIntoSentences = (text) => {
    // Simple regex to split sentences
    return text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
  };