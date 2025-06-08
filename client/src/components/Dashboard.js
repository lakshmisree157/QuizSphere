import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  UploadCloud, 
  Play, 
  BarChart3, 
  Edit3, 
  Eye, 
  RotateCcw, 
  Trash2, 
  Award, 
  Clock, 
  Calendar,
  TrendingUp,
  BookOpen,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const Dashboard = () => {
  const [tests, setTests] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const [testsResponse, attemptsResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/tests`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/quiz-attempts`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        setTests(testsResponse.data?.tests || []);
        setQuizAttempts(attemptsResponse.data?.attempts || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.response?.data?.error || 'Failed to fetch data');
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleDeleteAttempt = async () => {
    if (!selectedAttempt) return;

    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/quiz-attempts/${selectedAttempt._id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setQuizAttempts(prev => prev.filter(a => a._id !== selectedAttempt._id));
      } else {
        throw new Error('Failed to delete attempt');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete attempt');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setSelectedAttempt(null);
    }
  };

  const getQuestionTypeStats = (questions) => {
    const stats = {
      MCQ: 0,
      YES_NO: 0,
      DESCRIPTIVE: 0,
      TRUE_FALSE: 0,
      SHORT_ANSWER: 0
    };

    questions?.forEach(q => {
      const type = (q.type || 'MCQ').toUpperCase().trim();
      if (!stats.hasOwnProperty(type)) {
        stats[type] = 0;
      }
      stats[type]++;
    });

    return stats;
  };

  const getAttemptStats = (testId) => {
    const testAttempts = quizAttempts.filter(a => a.testId && a.testId._id === testId);
    if (testAttempts.length === 0) return null;

    const totalAttempts = testAttempts.length;
    const avgScore = testAttempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts;
    const bestScore = Math.max(...testAttempts.map(a => a.score));
    const latestAttempt = new Date(Math.max(...testAttempts.map(a => new Date(a.createdAt))));

    return {
      totalAttempts,
      avgScore: Math.round(avgScore),
      bestScore,
      latestAttempt
    };
  };

  const renderQuestionTypeChips = (questions) => {
    const stats = getQuestionTypeStats(questions);
    const typeColors = {
      MCQ: 'bg-blue-100 text-blue-800 border-blue-200',
      YES_NO: 'bg-green-100 text-green-800 border-green-200',
      DESCRIPTIVE: 'bg-purple-100 text-purple-800 border-purple-200',
      TRUE_FALSE: 'bg-orange-100 text-orange-800 border-orange-200',
      SHORT_ANSWER: 'bg-teal-100 text-teal-800 border-teal-200'
    };

    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(stats).map(([type, count]) => (
          count > 0 && (
            <span
              key={type}
              className={`px-2 py-1 text-xs font-medium rounded-md border ${typeColors[type] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
            >
              {type.replace('_', ' ')}: {count}
            </span>
          )
        ))}
      </div>
    );
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    if (score >= 60) return <AlertCircle className="w-4 h-4 text-amber-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center space-x-2 text-red-600 mb-2">
            <XCircle className="w-5 h-5" />
            <h3 className="font-semibold">Error</h3>
          </div>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Quiz Dashboard</h1>
            <p className="text-slate-600">Manage your tests and track your progress</p>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
          >
            <UploadCloud className="w-5 h-5" />
            <span>Upload PDF</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-slate-600 text-sm">Available Tests</p>
                <p className="text-2xl font-bold text-slate-800">{tests.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-slate-600 text-sm">Quiz Attempts</p>
                <p className="text-2xl font-bold text-slate-800">{quizAttempts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-slate-600 text-sm">Average Score</p>
                <p className="text-2xl font-bold text-slate-800">
                  {quizAttempts.length > 0 
                    ? Math.round(quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Tests */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Available Tests</h2>
          {tests.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tests.map((test) => {
                const attemptStats = getAttemptStats(test._id);
                return (
                  <div key={test._id} className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">{test.testName}</h3>
                        <p className="text-slate-600 mb-3">{test.description}</p>
                        {renderQuestionTypeChips(test.questions)}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => navigate(`/quiz-stats/${test._id}`)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors duration-200"
                          title="View Statistics"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/edit-quiz/${test._id}`)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors duration-200"
                          title="Edit Quiz"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/quiz/${test._id}`)}
                          className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors duration-200"
                          title="Start Quiz"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {attemptStats && (
                      <div className="border-t border-slate-200 pt-4">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Performance Overview</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                              <Award className="w-4 h-4 text-yellow-500" />
                              <span className="text-lg font-bold text-slate-800">{attemptStats.bestScore}%</span>
                            </div>
                            <p className="text-xs text-slate-600">Best Score</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                              <Target className="w-4 h-4 text-blue-500" />
                              <span className="text-lg font-bold text-slate-800">{attemptStats.avgScore}%</span>
                            </div>
                            <p className="text-xs text-slate-600">Average</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                              <RotateCcw className="w-4 h-4 text-purple-500" />
                              <span className="text-lg font-bold text-slate-800">{attemptStats.totalAttempts}</span>
                            </div>
                            <p className="text-xs text-slate-600">Attempts</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => navigate(`/quiz/${test._id}`)}
                        disabled={!test.questions?.length}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Take Quiz</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Tests Available</h3>
              <p className="text-slate-600">Upload a PDF to create your first test</p>
            </div>
          )}
        </div>

        {/* Recent Quiz Attempts */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Recent Quiz Attempts</h2>
          {quizAttempts.length > 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Test Name</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Score</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Question Types</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Time</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Date</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizAttempts.map((attempt, index) => (
                      <tr key={attempt._id} className={`hover:bg-slate-50 transition-colors duration-200 ${index !== quizAttempts.length - 1 ? 'border-b border-slate-100' : ''}`}>
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-800">{attempt.testId?.testName || 'Unknown Test'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {getScoreIcon(attempt.score)}
                            <span className={`font-bold ${getScoreColor(attempt.score)}`}>
                              {attempt.score}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {renderQuestionTypeChips(attempt.answers)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-1 text-slate-600">
                            <Clock className="w-4 h-4" />
                            <span>{Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-1 text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(attempt.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                console.log('Viewing results for attempt:', attempt._id);
                                navigate(`/quiz-result/${attempt._id}`);
                              }}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors duration-200"
                              title="View Results"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/quiz/${attempt.testId?._id || ''}`)}
                              className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors duration-200"
                              title="Retake Quiz"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAttempt(attempt);
                                setShowDeleteDialog(true);
                              }}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors duration-200"
                              title="Delete Attempt"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-slate-200">
              <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Quiz Attempts Yet</h3>
              <p className="text-slate-600">Start taking quizzes to see your attempts here</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 p-2 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Delete Quiz Attempt?</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this quiz attempt? This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAttempt}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;