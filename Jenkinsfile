pipeline {
    agent any

    environment {
        // Define shared network and container names
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
                // Ensure a clean Docker network environment exists
                sh """
                    docker network create ${DOCKER_NETWORK} || true
                    docker rm -f ${APP_CONTAINER} ${DB_CONTAINER} ${SELENIUM_HUB} ${TEST_CONTAINER} || true
                """
            }
        }

        stage('Language-Specific Unit Testing') {
            steps {
                echo '=== STAGE 2: Running Node.js App Unit Tests via Jest ==='
                // Run tests inside a temporary, clean node container
                sh "docker run --rm -v \$(pwd):/app -w /app node:18-alpine sh -c 'npm install && npm test'"
            }
        }

        stage('Containerized Deployment') {
            steps {
                echo '=== STAGE 3: Deploying App and Database Containers ==='
                // 1. Launch Production Database Container
                sh "docker run -d --name ${DB_CONTAINER} --network ${DOCKER_NETWORK} -p 27017:27017 mongo:latest"
                
                // 2. Build Web Application Custom Docker Image
                sh "docker build -t devops-web-app:latest ."
                
                // 3. Launch Web Application Container connected to the database
                sh """
                    docker run -d \
                    --name ${APP_CONTAINER} \
                    --network ${DOCKER_NETWORK} \
                    -p 3000:3000 \
                    -e MONGO_URI=mongodb://${DB_CONTAINER}:27017/devopsdb \
                    devops-web-app:latest
                """
                // Give the services a brief moment to stabilize connections
                sh "sleep 10"
            }
        }

        stage('Containerized Selenium Testing') {
            steps {
                echo '=== STAGE 4: Executing Automated UI Browser Tests ==='
                // 1. Launch Standalone Chrome Browser Environment for Selenium
                sh """
                    docker run -d \
                    --name ${SELENIUM_HUB} \
                    --network ${DOCKER_NETWORK} \
                    -p 4444:4444 \
                    -v /dev/shm:/dev/shm \
                    selenium/standalone-chrome:latest
                """
                // Give Chrome enough time to initialize its internal web driver server
                sh "sleep 5"

                // 2. Build and Run the Containerized Selenium Script
                sh """
                    docker build -f Dockerfile.selenium -t selenium-test-suite .
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
            // Clean up the testing infrastructure and browser containers, keeping the app live
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