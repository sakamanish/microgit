pipeline {
  agent any

  environment {
    DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
    DOCKERHUB_USERNAME = "sakamanish"
    BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/ai-study-buddy-backend"
    FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/ai-study-buddy-frontend"
    IMAGE_TAG = "${env.BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Show Versions') {
      steps {
        bat 'node -v || ver'
        bat 'python --version || ver'
        bat 'docker version'
      }
    }

    stage('Install Frontend Deps') {
      steps {
        dir('frontend') {
          bat 'npm ci --no-audit --no-fund'
        }
      }
    }

    stage('Build Frontend') {
      steps {
        dir('frontend') {
          bat 'npm run build'
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'frontend/build/**', onlyIfSuccessful: false
        }
      }
    }

    stage('Install Backend Deps') {
      steps {
        dir('backend') {
          bat 'python -m pip install --upgrade pip'
          bat 'pip install -r requirements.txt'
        }
      }
    }

    stage('Docker Build (Local)') {
      steps {
        bat "docker build -t %BACKEND_IMAGE%:%IMAGE_TAG% -f backend/Dockerfile ."
        bat "docker build -t %FRONTEND_IMAGE%:%IMAGE_TAG% -f frontend/Dockerfile ."
      }
    }

    stage('Docker Run (Local)') {
      steps {
        // Stop and remove if already running
        bat 'docker rm -f ai-study-backend 2>NUL || ver >NUL'
        bat 'docker rm -f ai-study-frontend 2>NUL || ver >NUL'
        // Run backend (expects backend\\.env to exist with GEMINI_API_KEY)
        bat 'docker run -d --name ai-study-backend -p 5000:5000 --env-file backend\\.env %BACKEND_IMAGE%:%IMAGE_TAG%'
        // Run frontend on port 3000
        bat 'docker run -d --name ai-study-frontend -p 3000:80 %FRONTEND_IMAGE%:%IMAGE_TAG%'
      }
    }

    stage('Docker Push (optional)') {
      when {
        expression { return env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master' }
      }
      steps {
        bat 'echo %DOCKERHUB_CREDENTIALS_PSW% | docker login -u %DOCKERHUB_CREDENTIALS_USR% --password-stdin'
        bat 'docker push %BACKEND_IMAGE%:%IMAGE_TAG%'
        bat 'docker push %FRONTEND_IMAGE%:%IMAGE_TAG%'
      }
    }
  }

  post {
    always {
      echo 'Pipeline finished.'
    }
  }
}
