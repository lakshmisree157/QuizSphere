
export const quizStyles = {
  questionCard: {
    p: 4,
    mb: 3,
    borderRadius: 2,
    transition: 'transform 0.3s ease-in-out',
    boxShadow: '0 4px 12px rgba(63, 81, 181, 0.2)',
    '&:hover': {
      transform: 'translateY(-6px)',
      boxShadow: '0 8px 24px rgba(63, 81, 181, 0.4)'
    }
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    mb: 4,
    backgroundColor: '#6573c3'
  },
  scoreSection: {
    p: 4,
    mb: 4,
    borderRadius: 4,
    backgroundColor: 'background.paper',
    border: '2px solid',
    borderColor: 'primary.main',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 4px 20px rgba(63, 81, 181, 0.3)'
  },
  resultTable: {
    '& .MuiTableCell-root': {
      py: 2
    }
  },
  correctAnswer: {
    backgroundColor: '#D4EFDF',
    color: '#4caf50',
    fontWeight: 'bold',
    '&:hover': {
      backgroundColor: '#D4EFDF'
    }
  },
  wrongAnswer: {
    backgroundColor: '#FADBD8',
    color: '#f44336',
    fontWeight: 'bold',
    '&:hover': {
      backgroundColor: '#FADBD8'
    }
  }
};

export const dashboardStyles = {
  welcomeCard: {
    p: 5,
    mb: 5,
    background: 'linear-gradient(45deg, #3f51b5 30%, #6573c3 90%)',
    color: 'white',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(63, 81, 181, 0.4)',
    fontWeight: 600,
    letterSpacing: 1
  },
  statsCard: {
    p: 4,
    textAlign: 'center',
    transition: 'transform 0.3s ease-in-out',
    borderRadius: 8,
    boxShadow: '0 4px 20px rgba(63, 81, 181, 0.2)',
    '&:hover': {
      transform: 'translateY(-8px)',
      boxShadow: '0 8px 24px rgba(63, 81, 181, 0.4)'
    }
  },
  uploadButton: {
    background: 'linear-gradient(45deg, #3f51b5 30%, #2c387e 90%)',
    color: 'white',
    fontWeight: 600,
    borderRadius: 8,
    padding: '10px 28px',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'linear-gradient(45deg, #2c387e 30%, #3f51b5 90%)',
      boxShadow: '0 6px 20px rgba(44, 62, 80, 0.5)'
    }
  },
  tableRowHover: {
    transition: 'background-color 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#e3eaf2'
    }
  }
};

export const uploadStyles = {
  dropzone: {
    p: 5,
    border: '2px dashed',
    borderColor: 'primary.main',
    borderRadius: 8,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      borderColor: 'primary.dark',
      backgroundColor: 'rgba(63, 81, 181, 0.1)'
    }
  },
  progressContainer: {
    mt: 4,
    p: 3,
    borderRadius: 4,
    backgroundColor: 'background.paper',
    boxShadow: '0 4px 20px rgba(63, 81, 181, 0.2)'
  }
};
