pipeline {
    agent any

    tools {
        // Herramienta Node.js configurada en Jenkins (Global Tool Configuration)
        nodejs 'node-22'
    }

    environment {
        // ============================================
        // PATH - Agregar rutas necesarias
        // ============================================
        PATH = "C:\\Program Files\\Git\\bin;C:\\Program Files\\Git\\cmd;${env.PATH}"

        // ============================================
        // VARIABLES DEL PROYECTO FRONTEND
        // ============================================
        PROJECT_NAME = 'polleria-yacky-frontend'
        REPO_URL = 'https://github.com/POLLERIA-YACKI-PROYECTO/POLLERIA-YACKI-FRONTEND.git'
        BRANCH = 'main'
        PORT = '4200'

        // CORREGIDO: nombre real del directorio generado por Angular
        DIST_DIR = 'dist/polleria-yaki-frontend'

        // ============================================
        // CREDENCIALES
        // ============================================
        GIT_CREDENTIALS = credentials('Ardamins')
    }

    stages {
        // ============================================
        // STAGE 1: CHECKOUT - Clonar el código
        // ============================================
        stage('Checkout') {
            steps {
                cleanWs()

                git branch: "${env.BRANCH}",
                    url: "${env.REPO_URL}",
                    credentialsId: 'Ardamins'

                echo "Código clonado exitosamente"
            }
        }

        // ============================================
        // STAGE 2: INSTALAR DEPENDENCIAS
        // ============================================
        stage('Instalar Dependencias') {
            steps {
                bat 'npm install --no-fund --no-audit'
                echo "Dependencias instaladas"
            }
        }

        // ============================================
        // STAGE 3: CONSTRUIR EL PROYECTO
        // ============================================
        stage('Construir Frontend') {
            steps {
                echo "Construyendo el frontend..."

                bat 'npm run build -- --configuration production'

                // Verificar que el build se generó correctamente
                script {
                    def distPath = "${env.DIST_DIR}"
                    if (fileExists(distPath)) {
                        echo "Build generado correctamente en: ${distPath}"
                    } else {
                        error "No se encontró el directorio de build: ${distPath}"
                    }
                }
            }
        }

        // ============================================
        // STAGE 4: EJECUTAR PRUEBAS (Opcional)
        // ============================================
        stage('Ejecutar Pruebas') {
            steps {
                echo "Ejecutando pruebas unitarias..."

                bat 'npm run test -- --watch=false --browsers=ChromeHeadless'

                echo "Pruebas ejecutadas correctamente"
            }
        }

        // ============================================
        // STAGE 5: INICIAR SERVIDOR DE DESARROLLO
        // ============================================
        stage('Iniciar Servidor') {
            steps {
                echo "Iniciando servidor de desarrollo..."

                bat 'start /B npm run start -- --port=4200 --open=false > server.log 2>&1'

                echo "Servidor iniciado"

                sleep(time: 10, unit: 'SECONDS')
            }
        }

        // ============================================
        // STAGE 6: VERIFICAR HEALTH CHECK
        // ============================================
        stage('Health Check') {
            steps {
                echo "Verificando Health Check..."

                script {
                    try {
                        def healthCheck = powershell(returnStdout: true, script: '''
                            try {
                                $response = Invoke-WebRequest -Uri "http://localhost:4200" -UseBasicParsing
                                Write-Output $response.StatusCode
                            } catch {
                                Write-Output "000"
                            }
                        ''').trim()

                        echo "Estado del servidor: ${healthCheck}"

                        if (healthCheck == '200') {
                            echo "Frontend funcionando correctamente"
                        } else {
                            echo "El servidor respondió con código: ${healthCheck}"
                            bat 'type server.log'
                            error "Health Check falló"
                        }
                    } catch (e) {
                        echo "Error al verificar Health Check"
                        bat 'type server.log'
                        error "Health Check falló"
                    }
                }
            }
        }

        // ============================================
        // STAGE 7: GENERAR REPORTE
        // ============================================
        stage('Generar Reporte') {
            steps {
                script {
                    def commitHash = powershell(returnStdout: true, script: '''
                        $commit = git rev-parse --short HEAD 2>$null
                        if ($commit) {
                            Write-Output $commit.Trim()
                        } else {
                            Write-Output "unknown"
                        }
                    ''').trim()

                    def buildDate = new Date().format("yyyy-MM-dd HH:mm:ss")

                    def buildSize = powershell(returnStdout: true, script: '''
                        $path = "${env:DIST_DIR}"
                        if (Test-Path $path) {
                            $size = (Get-ChildItem -Path $path -Recurse | Measure-Object -Property Length -Sum).Sum
                            if ($size -gt 1MB) {
                                Write-Output ([math]::Round($size / 1MB, 2).ToString() + " MB")
                            } else {
                                Write-Output ([math]::Round($size / 1KB, 2).ToString() + " KB")
                            }
                        } else {
                            Write-Output "N/A"
                        }
                    ''').trim()

                    def report = """
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Reporte - ${env.PROJECT_NAME}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
                            .container { max-width: 900px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
                            h1 { color: #333; border-bottom: 2px solid #e67e22; padding-bottom: 10px; }
                            h2 { color: #555; margin-top: 20px; }
                            .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 4px; }
                            .info { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 10px 0; }
                            .info p { margin: 5px 0; }
                            .endpoint {
                                background: #e9ecef;
                                padding: 10px;
                                border-radius: 4px;
                                margin: 5px 0;
                                font-family: monospace;
                            }
                            .stats {
                                display: grid;
                                grid-template-columns: 1fr 1fr 1fr;
                                gap: 10px;
                                margin: 15px 0;
                            }
                            .stat-card {
                                background: #f8f9fa;
                                padding: 15px;
                                border-radius: 8px;
                                text-align: center;
                            }
                            .stat-value {
                                font-size: 24px;
                                font-weight: bold;
                                color: #e67e22;
                            }
                            .stat-label {
                                font-size: 12px;
                                color: #666;
                                margin-top: 5px;
                            }
                            .footer {
                                margin-top: 20px;
                                padding-top: 10px;
                                border-top: 1px solid #ddd;
                                color: #888;
                                font-size: 12px;
                                text-align: center;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Reporte de Construccion - Frontend</h1>
                            <div class="success">Construccion exitosa</div>

                            <div class="info">
                                <p><strong>Proyecto:</strong> ${env.PROJECT_NAME}</p>
                                <p><strong>Fecha Build:</strong> ${buildDate}</p>
                                <p><strong>Commit:</strong> ${commitHash}</p>
                                <p><strong>Rama:</strong> ${env.BRANCH}</p>
                                <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                            </div>

                            <h2>Estadisticas del Build</h2>
                            <div class="stats">
                                <div class="stat-card">
                                    <div class="stat-value">${buildSize}</div>
                                    <div class="stat-label">Tamaño del Build</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">${env.BUILD_NUMBER}</div>
                                    <div class="stat-label">Numero de Build</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">${commitHash}</div>
                                    <div class="stat-label">Commit Hash</div>
                                </div>
                            </div>

                            <h2>Endpoints</h2>
                            <div class="endpoint">Frontend: http://localhost:${env.PORT}</div>
                            <div class="endpoint">Build Directory: ${env.DIST_DIR}</div>

                            <div class="footer">
                                Generado por Jenkins Pipeline - ${buildDate}
                            </div>
                        </div>
                    </body>
                    </html>
                    """

                    writeFile file: 'build-report-frontend.html', text: report
                    archiveArtifacts artifacts: 'build-report-frontend.html'
                }
            }
        }
    }

    // ============================================
    // POST - ACCIONES DESPUÉS DEL PIPELINE
    // ============================================
    post {
        success {
            echo """
            ===================================================
            PIPELINE COMPLETADO EXITOSAMENTE
            ===================================================

            Proyecto: ${env.PROJECT_NAME}
            Frontend: http://localhost:${env.PORT}
            Build Directory: ${env.DIST_DIR}
            Build Number: ${env.BUILD_NUMBER}

            ===================================================
            """
        }

        failure {
            echo """
            ===================================================
            PIPELINE FALLÓ
            ===================================================

            Proyecto: ${env.PROJECT_NAME}
            Build Number: ${env.BUILD_NUMBER}

            Revisa los logs para más detalles.

            ===================================================
            """

            bat 'type server.log 2>nul || echo "No se encontró el log"'
        }

        always {
            echo "Limpieza completada"
        }
    }
}