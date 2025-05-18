export const quizStyles = {
  questionCard: {
    p: 4,
    mb: 3,
    borderRadius: 2,
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)'
    }
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    mb: 4
  },
  scoreSection: {
    p: 3,
    mb: 3,
    borderRadius: 2,
    backgroundColor: 'background.paper',
    border: '1px solid',
    borderColor: 'primary.light',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  resultTable: {
    '& .MuiTableCell-root': {
      py: 2
    }
  },
  correctAnswer: {
    backgroundColor: 'success.light',
    '&:hover': {
      backgroundColor: 'success.light'
    }
  },
  wrongAnswer: {
    backgroundColor: 'error.light',
    '&:hover': {
      backgroundColor: 'error.light'
    }
  }
};

export const dashboardStyles = {
  welcomeCard: {
    p: 4,
    mb: 4,
    background: 'linear-gradient(45deg, #2C3E50 30%, #3498DB 90%)',
    color: 'white'
  },
  statsCard: {
    p: 3,
    textAlign: 'center',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)'
    }
  },
  uploadButton: {
    background: 'linear-gradient(45deg, #E74C3C 30%, #C0392B 90%)',
    color: 'white',
    '&:hover': {
      background: 'linear-gradient(45deg, #C0392B 30%, #E74C3C 90%)'
    }
  }
};

export const uploadStyles = {
  dropzone: {
    p: 4,
    border: '2px dashed',
    borderColor: 'primary.light',
    borderRadius: 2,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      borderColor: 'primary.main',
      backgroundColor: 'rgba(44, 62, 80, 0.04)'
    }
  },
  progressContainer: {
    mt: 3,
    p: 2,
    borderRadius: 1,
    backgroundColor: 'background.paper'
  }
};