export const splitIntoSentences = (text) => {
  // Enhanced regex-based sentence splitter for better accuracy
  // This can be further improved or replaced with a library like 'sentence-splitter' if needed
  return text.match(/[^.!?]+[.!?]+/g) || [text];
};