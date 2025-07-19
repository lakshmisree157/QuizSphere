# Project Verification Guide

## Pre-Testing Setup

### 1. Environment Setup
```bash
# Backend
cd server
npm install
cp .env.example .env  # Create your .env file
# Fill in your environment variables

# Frontend  
cd client
npm install
cp .env.example .env  # Create your .env file
# Set REACT_APP_API_URL=http://localhost:5000

# ML Service
cd ml-service
pip install -r requirements.txt
```

### 2. Database Setup
- Ensure MongoDB is running
- Create database: `adaptive-quiz`
- Verify connection in backend

## 🧪 **Testing Checklist**

### Backend API Testing

#### 1. Authentication Endpoints
```bash
# Test Registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","name":"Test User","email":"test@example.com","password":"password123"}'

# Test Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Save the token from login response
TOKEN="your-jwt-token-here"
```

#### 2. PDF Upload & Question Generation
```bash
# Upload PDF
curl -X POST http://localhost:5000/api/questions/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "pdf=@test-document.pdf"

# Check generated questions
curl -X GET http://localhost:5000/api/questions \
  -H "Authorization: Bearer $TOKEN"
```

#### 3. Test Creation
```bash
# Create test from questions
curl -X POST http://localhost:5000/api/tests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"testName":"Test Quiz","description":"Test Description","questionIds":["question-id-1","question-id-2"]}'
```

#### 4. Quiz Attempt
```bash
# Start quiz
curl -X GET http://localhost:5000/api/tests/{testId}/questions \
  -H "Authorization: Bearer $TOKEN"

# Submit quiz attempt
curl -X POST http://localhost:5000/api/quiz-attempts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "testId":"test-id",
    "answers":[
      {"questionId":"q1","question":"What is...","userAnswer":"Answer","correctAnswer":"Correct","type":"MCQ","options":["A","B","C"]}
    ],
    "timeSpent":300
  }'
```

#### 5. Feedback System
```bash
# Submit feedback
curl -X POST http://localhost:5000/api/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quizId":"quiz-id","questionId":"question-id","feedbackText":"Great question!"}'

# Get feedback
curl -X GET http://localhost:5000/api/feedback/{quizId} \
  -H "Authorization: Bearer $TOKEN"
```

### Frontend Testing

#### 1. User Interface Flow
1. **Registration/Login**
   - [ ] User can register with valid data
   - [ ] User can login with correct credentials
   - [ ] Error handling for invalid data
   - [ ] JWT token stored in localStorage

2. **Dashboard**
   - [ ] Shows available tests
   - [ ] Displays quiz attempts with feedback stats
   - [ ] Navigation to different sections works
   - [ ] Stats cards show correct data

3. **PDF Upload**
   - [ ] File selection works
   - [ ] Upload progress indicator
   - [ ] Success/error messages
   - [ ] Questions generated and displayed

4. **Quiz Taking**
   - [ ] Questions load correctly
   - [ ] Timer works
   - [ ] Answer selection works
   - [ ] Submit functionality
   - [ ] Navigation to results

5. **Results & Feedback**
   - [ ] Results display correctly
   - [ ] Performance breakdown shows
   - [ ] Feedback input works
   - [ ] Feedback submission successful
   - [ ] Previous feedback displays
   - [ ] Feedback statistics update

#### 2. Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile responsiveness

### ML Service Testing

#### 1. Service Health
```bash
# Check if ML service is running
curl http://localhost:8000/health

# Test question generation
curl -X POST http://localhost:8000/generate-questions \
  -H "Content-Type: application/json" \
  -d '{"text":"Sample text content"}'
```

#### 2. Integration Testing
- [ ] Backend can connect to ML service
- [ ] Question generation works
- [ ] Answer similarity checking works
- [ ] Error handling for ML service failures

## 🔧 **Manual Testing Scenarios**

### Scenario 1: Complete User Journey
1. Register new user
2. Upload PDF document
3. Create quiz from generated questions
4. Take the quiz
5. Submit feedback for questions
6. View results and statistics
7. Check dashboard for updated stats

### Scenario 2: Error Handling
1. Try to login with wrong credentials
2. Upload invalid file format
3. Submit quiz without answering questions
4. Access protected routes without authentication
5. Submit feedback without quiz ID

### Scenario 3: Data Persistence
1. Create quiz attempt
2. Refresh page
3. Verify data persists
4. Check feedback remains after page reload

## 📊 **Performance Testing**

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Test API endpoints
artillery quick --count 10 --num 5 http://localhost:5000/api/health
```

### Database Performance
- [ ] Query response times < 200ms
- [ ] No memory leaks
- [ ] Connection pooling works
- [ ] Indexes are effective

## 🐛 **Common Issues & Solutions**

### Backend Issues
1. **MongoDB Connection Error**
   - Check MongoDB is running
   - Verify connection string
   - Check network access

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Validate token format

3. **CORS Errors**
   - Check CLIENT_URL in .env
   - Verify frontend URL matches

### Frontend Issues
1. **API Connection Errors**
   - Check REACT_APP_API_URL
   - Verify backend is running
   - Check network connectivity

2. **State Management Issues**
   - Clear localStorage
   - Check AuthContext
   - Verify component props

### ML Service Issues
1. **Service Not Responding**
   - Check if service is running
   - Verify port configuration
   - Check Python dependencies

## ✅ **Final Verification Checklist**

### Backend
- [ ] All API endpoints respond correctly
- [ ] Authentication works
- [ ] Database operations successful
- [ ] Error handling works
- [ ] ML service integration works
- [ ] Feedback system functional
- [ ] No console errors

### Frontend
- [ ] All pages load correctly
- [ ] User flows work end-to-end
- [ ] Responsive design works
- [ ] No JavaScript errors
- [ ] State management works
- [ ] API integration successful

### Integration
- [ ] Frontend-backend communication
- [ ] Backend-ML service communication
- [ ] Database consistency
- [ ] Real-time updates work

## 📝 **Test Results Template**

```
Test Date: _______________
Tester: ________________

Backend Tests:
- Authentication: [ ] Pass [ ] Fail
- PDF Upload: [ ] Pass [ ] Fail  
- Quiz Creation: [ ] Pass [ ] Fail
- Quiz Taking: [ ] Pass [ ] Fail
- Feedback System: [ ] Pass [ ] Fail

Frontend Tests:
- Registration/Login: [ ] Pass [ ] Fail
- Dashboard: [ ] Pass [ ] Fail
- Quiz Interface: [ ] Pass [ ] Fail
- Results Page: [ ] Pass [ ] Fail
- Responsive Design: [ ] Pass [ ] Fail

Integration Tests:
- End-to-End Flow: [ ] Pass [ ] Fail
- ML Service: [ ] Pass [ ] Fail
- Data Persistence: [ ] Pass [ ] Fail

Issues Found:
1. ________________
2. ________________
3. ________________

Overall Status: [ ] Ready for Deployment [ ] Needs Fixes
```

## 🚀 **Ready for Deployment?**

Once all tests pass:
1. Update environment variables for production
2. Build frontend for production
3. Follow deployment plan
4. Monitor logs after deployment
5. Run smoke tests on production environment 