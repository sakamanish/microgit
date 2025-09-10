pipeline {
  agent any

  environment {
    DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
    DOCKERHUB_USERNAME = "your-dockerhub-username"
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

    stage('Setup Node and Python') {
      steps {
        sh 'node -v || true'
        sh 'python --version || true'
      }
    }

    stage('Install Frontend Deps') {
      steps {
        dir('frontend') {
          sh 'npm ci --no-audit --no-fund'
        }
      }
    }

    stage('Build Frontend') {
      steps {
        dir('frontend') {
          sh 'npm run build'
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
          sh 'python -m pip install --upgrade pip'
          sh 'pip install -r requirements.txt'
        }
      }
    }

    stage('Unit Tests (placeholder)') {
      steps {
        echo 'Add your tests here'
      }
    }

    stage('Docker Build') {
      steps {
        script {
          sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -f backend/Dockerfile ."
          sh "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -f frontend/Dockerfile ."
        }
      }
    }

    stage('Docker Push') {
      when {
        expression { return env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master' }
      }
      steps {
        sh 'echo "$DOCKERHUB_CREDENTIALS_PSW" | docker login -u "$DOCKERHUB_CREDENTIALS_USR" --password-stdin'
        sh "docker push ${BACKEND_IMAGE}:${IMAGE_TAG}"
        sh "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}"
      }
    }
  }

  post {
    always {
      cleanWs()
    }
  }
}
