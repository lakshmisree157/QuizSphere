const validateQuestion = (question) => {
  if (!question) return false;
  
  return (
    question.uniqueId &&
    typeof question.content === 'string' &&
    Array.isArray(question.options) &&
    question.options.length >= 2 &&
    typeof question.correctAnswer === 'string' &&
    question.options.includes(question.correctAnswer) &&
    typeof question.bloomLevel === 'number' &&
    question.bloomLevel >= 1 &&
    question.bloomLevel <= 6
  );
};

const validateTestData = (test) => {
  if (!test || !test.questions || !Array.isArray(test.questions)) {
    return false;
  }

  return test.questions.every(validateQuestion);
};

module.exports = {
  validateQuestion,
  validateTestData
};