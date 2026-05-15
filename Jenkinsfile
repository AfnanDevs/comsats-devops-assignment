pipeline {
    agent any

    environment {
        DOCKER_NETWORK  = 'devops-network'
        DB_CONTAINER    = 'mongodb-prod'
        APP_CONTAINER   = 'webapp-prod'
        SELENIUM_HUB    = 'selenium-chrome'
        TEST_CONTAINER  = 'selenium-runner'
    }

    stages {
        stage('Code Build & Prep') {
            steps {
                echo '=== STAGE 1: Fetching Source Code and Cleaning Environment ==='
                sh """
                    docker network create ${DOCKER_NETWORK} || true
                    docker rm -f ${APP_CONTAINER} ${DB_CONTAINER} ${SELENIUM_HUB} ${TEST_CONTAINER} || true
                """
            }
        }

        stage('Language-Specific Unit Testing') {
            agent {
                docker { 
                    image 'node:18-alpine'
                    reuseNode true
                }
            }
            steps {
                echo '=== STAGE 2: Running Node.js App Unit Tests via Jest ==='
                // This executes directly inside the Node environment safely
                sh 'npm install'
                sh 'npm test'
            }
        }

        stage('Containerized Deployment') {
            steps {
                echo '=== STAGE 3: Deploying App and Database Containers ==='
                sh "docker run -d --name ${DB_CONTAINER} --network ${DOCKER_NETWORK} -p 27017:27017 mongo:latest"
                sh "docker build -t devops-web-app:latest ."
                sh """
                    docker run -d \
                    --name ${APP_CONTAINER} \
                    --network ${DOCKER_NETWORK} \
                    -p 3000:3000 \
                    -e MONGO_URI=mongodb://${DB_CONTAINER}:27017/devopsdb \
                    devops-web-app:latest
                """
                sh "sleep 10"
            }
        }

        stage('Containerized Selenium Testing') {
            steps {
                echo '=== STAGE 4: Executing Automated UI Browser Tests ==='
                sh """
                    docker run -d \
                    --name ${SELENIUM_HUB} \
                    --network ${DOCKER_NETWORK} \
                    -p 4444:4444 \
                    -v /dev/shm:/dev/shm \
                    selenium/standalone-chrome:latest
                """
                sh "sleep 5"
                sh "docker build -f Dockerfile.selenium -t selenium-test-suite ."
                sh """
                    docker run --rm \
                    --name ${TEST_CONTAINER} \
                    --network ${DOCKER_NETWORK} \
                    -e SELENIUM_HOST=${SELENIUM_HUB} \
                    -e APP_URL=http://${APP_CONTAINER}:3000 \
                    selenium-test-suite
                """
            }
        }
    }

    post {
        always {
            echo '=== Post-Execution Cleanup ==='
            sh "docker rm -f ${SELENIUM_HUB} || true"
        }
        success {
            echo 'PIPELINE SUCCESS: All verification gates passed flawlessly.'
        }
        failure {
            echo 'PIPELINE FAILURE: One or more architectural stages broke down.'
        }
    }
}