@Library('ritika-dasher-trusted-agent-shared-library') _

pipeline {

//     agent {
//       kubernetes {
//             defaultContainer 'test-pod'
//             yaml '''
//                 apiVersion: v1
//                 kind: Pod
//                 metadata:
//                   labels:
//                     run: test-pod
//                   name: test-pod
//                 spec:
//                   containers:
//                   - command:
//                     - sleep
//                     - "99999"
//                     env:
//                         - name: CONTAINER_NAME
//                           valueFrom:
//                             fieldRef:
//                               fieldPath: metadata.name
//                     image: node:24.8.0-alpine
//                     name: test-pod
//                     resources: {}
//                   restartPolicy: Never
//             '''
//       }
//     }

//         agent {
//           kubernetes {
//             yaml nodeAgentYaml()
//             defaultContainer 'node-container'
//             idleMinutes 5
//             showRawYaml false
//           }
//         }


    agent {
        label 'node-agent'
    }

//     tools {
//         nodejs "nodejs-24-4-1"
//     }

    environment {
      MONGO_URI = "mongodb://mongodb-svc:27017/mydb"
    }

    options {
      buildDiscarder logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '1', daysToKeepStr: '', numToKeepStr: '3')
      disableConcurrentBuilds abortPrevious: true
    }

    stages {
        stage("Install Dependencies") {

            options {
              timestamps()
            }

            steps {

                container('node-container') {
                    echo "Installing Dependencies..."

                    sh '''
                        set -ex
                        npm install --no-audit
                    '''
                }
            }
        }
        stage('Dependency Checking') {
            parallel {
                stage('NPM Dependency Scanning') {
                    steps {

                        container('node-container') {
                            echo "Scanning Dependencies using npm audit..."

                            sh '''
                                set -ex
                                npm audit --audit-level=critical
                            '''
                        }
                    }
                }
                stage('OWASP Dependency Scanning') {
                    steps {

                        container('node-container') {
                            echo "Scanning Dependencies using owasp..."

                            sh '''
                                set -ex
                                dependency-check.sh \
                                --scan \'./\' \
                                --out \'./\' \
                                --format \'ALL\' \
                                --prettyPrint \
                                --nvdApiKey b3e7726d-3647-4fc6-a293-e2db6482208f \
                                --disableYarnAudit
                            '''

                            dependencyCheckPublisher failedTotalCritical: 1, pattern: 'dependency-check-report.xml', stopBuild: true
                        }

//                         dependencyCheck additionalArguments: '''
//                             --scan \'./\'
//                             --out \'./\'
//                             --format \'ALL\'
//                             --prettyPrint
//                             --nvdApiKey b3e7726d-3647-4fc6-a293-e2db6482208f
//                             --disableYarnAudit'''
// //                             odcInstallation: 'dependency-check-12-1-3'
                    }
                }
            }
        }
        stage('Unit Testing') {
            steps {

                container('node-container') {

                    withCredentials([usernamePassword(credentialsId: 'Mongodb-creds', passwordVariable: 'MONGO_PASSWORD', usernameVariable: 'MONGO_USERNAME')]) {

                        echo "Seeding Planets Data For Unit Testing..."
                        sh 'npm run db:seed'

                        echo "Unit Testing In Progress..."
                        sh 'npm run test'
                    }
                }
            }
        }
        stage("Coverage Testing") {
            steps {

                container('node-container') {

                    withCredentials([usernamePassword(credentialsId: 'Mongodb-creds', passwordVariable: 'MONGO_PASSWORD', usernameVariable: 'MONGO_USERNAME')]) {

                        catchError(buildResult: 'SUCCESS', message: 'Total Coverage is less than 90%', stageResult: 'UNSTABLE') {

                            echo "Coverage Testing In Progress..."

                            sh 'npm run coverage'
                        }
                    }
                }
            }
        }
        stage("Build Image Using Kaniko") {
            steps {
                container('kaniko-container') {
                    sh """
                        set -ex
                        /kaniko/executor \
                           --context "dir://${WORKSPACE}" \
                           --destination "arn:aws:ecr:ap-south-1:705454746869:repository/jenkins-test" \
                           --cache "true" \
                           --cache-repo "arn:aws:ecr:ap-south-1:705454746869:repository/jenkins-test"
                    """
                }
            }
        }
    }
    post {
        always {
            junit allowEmptyResults: true, stdioRetention: 'FAILED',skipMarkingBuildUnstable: true, testResults: 'dependency-check-junit.xml'

            publishHTML([
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                icon: '',
                keepAll: true,
                reportDir: '.',
                reportFiles: 'dependency-check-report.html',
                reportName: 'Dependency Check HTML Report',
                reportTitles: 'Dependency Check HTML Report',
                useWrapperFileDirectly: false
            ])

            junit allowEmptyResults: true, keepProperties: true, keepTestNames: true,skipMarkingBuildUnstable: true, stdioRetention: 'ALL', testResults: 'test-results.xml'
        }
    }
}