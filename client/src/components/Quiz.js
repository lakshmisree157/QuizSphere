import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Clock,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';

const Quiz = () => {
  const { testId, attemptId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes in seconds
  const [timerExpired, setTimerExpired] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        if (attemptId) {
          // Fetch quiz attempt questions
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/quiz-attempts/${attemptId}/questions`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );

          console.log('Attempt questions response:', response.data); // Debug log

          if (!response.data?.success || !response.data?.questions) {
            throw new Error('No questions available in attempt');
          }

          // Ensure each question has options
          const questionsWithOptions = response.data.questions.map(q => ({
            ...q,
            options: q.options || (q.type === 'MCQ' ? [] : q.type === 'YES_NO' ? ['Yes', 'No'] : [])
          }));

          setQuestions(questionsWithOptions);
          console.log('Processed questions:', questionsWithOptions); // Debug log

          // Pre-fill selected answers from attempt
          const preSelected = {};
          questionsWithOptions.forEach(q => {
            if (q.userAnswer) {
              preSelected[q.uniqueId] = q.userAnswer;
            }
          });
          setSelectedAnswers(preSelected);
        } else if (testId) {
          // Fetch test questions
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/tests/${testId}/questions`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );

          console.log('Test questions response:', response.data); // Debug log

          if (!response.data?.success || !response.data?.questions) {
            throw new Error('No questions available');
          }

          // Ensure each question has options
          const allQuestions = response.data.questions.map(q => ({
            ...q,
            options: q.options || (q.type === 'MCQ' ? [] : q.type === 'YES_NO' ? ['Yes', 'No'] : [])
          }));

          // Randomly select questions
          const selectedQuestions = allQuestions
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(10, allQuestions.length));

          console.log('Selected questions with options:', selectedQuestions); // Debug log
          setQuestions(selectedQuestions);
        } else {
          throw new Error('No testId or attemptId provided');
        }
      } catch (error) {
        console.error('Error fetching questions:', error); // Debug log
        setError(error.response?.data?.error || error.message || 'Failed to fetch questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [testId, attemptId, navigate]);

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      setTimerExpired(true);
      handleSubmit(); // Auto-submit when timer expires
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time for display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get timer color based on remaining time
  const getTimerColor = () => {
    if (timeLeft <= 60) return 'text-red-600 bg-red-50 border-red-200'; // Last minute
    if (timeLeft <= 120) return 'text-orange-600 bg-orange-50 border-orange-200'; // Last 2 minutes
    return 'text-green-600 bg-green-50 border-green-200'; // Normal time
  };

  const handleSubmit = async () => {
    try {
      console.log('=== Quiz Submission Started ===');
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        navigate('/login');
        return;
      }

      // Don't validate answers if timer expired (allow partial submission)
      if (!timerExpired) {
        const unansweredQuestions = questions.filter(q => !selectedAnswers[q.uniqueId]);
        if (unansweredQuestions.length > 0) {
          console.log('Unanswered questions:', unansweredQuestions.length);
          setError(`Please answer all questions before submitting. ${unansweredQuestions.length} questions remaining.`);
          return;
        }
      }

      const endTime = Date.now();
      const timeSpent = Math.floor((endTime - startTime) / 1000);

      console.log('Preparing submission:', {
        testId,
        questionsCount: questions.length,
        timeSpent,
        selectedAnswersCount: Object.keys(selectedAnswers).length
      });

      const answers = questions.map(q => ({
        questionId: q.uniqueId,
        question: q.content,
        userAnswer: selectedAnswers[q.uniqueId] || '',
        correctAnswer: q.correctAnswer,
        type: q.type,
        options: q.options || [],
        isCorrect: selectedAnswers[q.uniqueId] === q.correctAnswer
      }));

      console.log('Making POST request to submit quiz');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/quiz-attempts`,
        {
          testId,
          answers,
          timeSpent
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Quiz submission response:', response.data);

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to submit quiz');
      }

      const attemptId = response.data?.attemptId;
      if (!attemptId) {
        console.error('No attemptId in response:', response.data);
        throw new Error('No attempt ID received from server');
      }

      console.log('Received attemptId:', attemptId);

      // Add a small delay to ensure the attempt is saved
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify the attempt exists before navigating
      try {
        console.log('Verifying attempt with ID:', attemptId);
        const verifyResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/quiz-attempts/${attemptId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        console.log('Verification response:', verifyResponse.data);
        
        if (!verifyResponse.data?.success || !verifyResponse.data?.attempt) {
          throw new Error('Attempt verification failed');
        }
        
        // Use replace instead of navigate to prevent back button issues
        console.log('Attempt verified, navigating to result page with ID:', attemptId);
        navigate(`/quiz-result/${attemptId}`, { replace: true });
      } catch (verifyError) {
        console.error('Error verifying attempt:', verifyError);
        throw new Error('Failed to verify quiz attempt. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError(error.response?.data?.error || error.message || 'Failed to submit quiz. Please try again.');
    }
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'MCQ':
        return <CheckCircle className="w-4 h-4" />;
      case 'YES_NO':
        return <AlertCircle className="w-4 h-4" />;
      case 'FILL_IN_BLANK':
        return <FileText className="w-4 h-4" />;
      case 'TRUE_FALSE':
      case 'TRUE_FALSE':  // Added to handle TRUE_FALSE properly
        return <FileText className="w-4 h-4" />;
      case 'DESCRIPTIVE':
        return <FileText className="w-4 h-4" />;
      case 'SHORT_ANSWER':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const renderQuestionInput = (question) => {
    console.log('Rendering question:', question); // Debug log for current question

    switch (question.type) {
      case 'MCQ':
        if (!question.options || question.options.length === 0) {
          console.warn('MCQ question has no options:', question); // Debug log
          return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800">No options available for this question</span>
            </div>
          );
        }
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <label
                key={index}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
              >
                <input
                  type="radio"
                  name={`question-${question.uniqueId}`}
                  value={option}
                  checked={selectedAnswers[question.uniqueId] === option}
                  onChange={(e) => setSelectedAnswers({
                    ...selectedAnswers,
                    [question.uniqueId]: e.target.value
                  })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-gray-700 flex-1">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'YES_NO':
        return (
          <div className="space-y-3">
            {['Yes', 'No'].map((option) => (
              <label
                key={option}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
              >
                <input
                  type="radio"
                  name={`question-${question.uniqueId}`}
                  value={option}
                  checked={selectedAnswers[question.uniqueId] === option}
                  onChange={(e) => setSelectedAnswers({
                    ...selectedAnswers,
                    [question.uniqueId]: e.target.value
                  })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-gray-700 flex-1">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'DESCRIPTIVE':
        return (
          <textarea
            rows={4}
            placeholder="Enter your answer here..."
            value={selectedAnswers[question.uniqueId] || ''}
            onChange={(e) => setSelectedAnswers({
              ...selectedAnswers,
              [question.uniqueId]: e.target.value
            })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[100px]"
          />
        );
      
      case 'SHORT_ANSWER':
        return (
          <textarea
            rows={4}
            placeholder="Enter your answer here..."
            value={selectedAnswers[question.uniqueId] || ''}
            onChange={(e) => setSelectedAnswers({
              ...selectedAnswers,
              [question.uniqueId]: e.target.value
            })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[100px]"
          />
        );

      case 'TRUE_FALSE':
        return (
          <div className="space-y-3">
            {['True', 'False'].map((option) => (
              <label
                key={option}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
              >
                <input
                  type="radio"
                  name={`question-${question.uniqueId}`}
                  value={option}
                  checked={selectedAnswers[question.uniqueId] === option}
                  onChange={(e) => setSelectedAnswers({
                    ...selectedAnswers,
                    [question.uniqueId]: e.target.value
                  })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-gray-700 flex-1">{option}</span>
              </label>
            ))}
          </div>
        );
      
      default:
        console.warn('Unknown question type:', question.type); // Debug log
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">Unknown question type: {question.type}</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading quiz questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">Error</h3>
          </div>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-800">No Questions Available</h3>
          </div>
          <p className="text-blue-700">There are no questions available for this quiz.</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Quiz Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Question {currentQuestion + 1} of {questions.length}
              </h1>
              <p className="text-gray-600 mt-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Started {Math.floor((Date.now() - startTime) / 60000)} minutes ago
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Timer Display */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-bold text-lg ${getTimerColor()}`}>
                <Clock className="w-5 h-5" />
                <span>{formatTime(timeLeft)}</span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
                {getQuestionTypeIcon(currentQ.type)}
                <span className="font-medium">
                  {currentQ.bloomLevel ? `Bloom Level ${currentQ.bloomLevel}` : currentQ.type}
                </span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Timer Warning for mobile */}
          {timeLeft <= 120 && (
            <div className={`mb-4 p-3 rounded-lg border flex items-center gap-2 ${getTimerColor()}`}>
              <Clock className="w-5 h-5" />
              <span className="font-semibold">
                {timeLeft <= 60 ? 'Time is running out!' : 'Less than 2 minutes remaining'}
              </span>
              <span className="ml-auto font-bold">{formatTime(timeLeft)}</span>
            </div>
          )}
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 leading-relaxed">
              {currentQ.content}
            </h2>
          </div>

          <div className="mb-8">
            {renderQuestionInput(currentQ)}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <button
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              disabled={currentQuestion === 0}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={!selectedAnswers[currentQ.uniqueId] && !timerExpired}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                <Send className="w-4 h-4" />
                {timerExpired ? 'Submit (Time Up)' : 'Submit Quiz'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                disabled={!selectedAnswers[currentQ.uniqueId] && !timerExpired}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Question Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Question Overview</h3>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`
                  w-10 h-10 rounded-lg border-2 font-medium transition-all duration-200
                  ${index === currentQuestion
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : selectedAnswers[questions[index].uniqueId]
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }
                `}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-4">
            <span className="inline-block w-3 h-3 bg-green-500 rounded mr-2"></span>
            Answered: {Object.keys(selectedAnswers).length} / {questions.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Quiz;