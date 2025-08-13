# Usa la imagen oficial de OpenJDK 17
FROM openjdk:17-jdk-slim

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Instala dependencias para Node.js y herramientas de red
RUN apt-get update && \
    apt-get install -y curl netcat-openbsd && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs git && \
    rm -rf /var/lib/apt/lists/*

# Copia Lavalink y el bot al contenedor
COPY . .

# Instala dependencias del bot
RUN npm install


# Expone ambos puertos
EXPOSE 2333
EXPOSE 10000

# Variable de entorno para la contraseña de Lavalink
ENV LAVALINK_SERVER_PASSWORD=changeme

# Script de inicio que maneja correctamente el orden de arranque
CMD export LAVALINK_SERVER_PASSWORD="${LAVALINK_SERVER_PASSWORD}" && \
    echo "🚀 Iniciando Lavalink en puerto 2333..." && \
    java -Djdk.tls.client.protocols=TLSv1.2 -jar Lavalink.jar & \
    LAVALINK_PID=$! && \
    echo "⏳ Esperando a que Lavalink esté listo..." && \
    while ! nc -z localhost 2333; do \
      sleep 2; \
      echo "⏳ Lavalink aún no está listo..."; \
    done && \
    echo "✅ Lavalink está listo en puerto 2333!" && \
    sleep 5 && \
    echo "🤖 Iniciando bot Discord en puerto 10000..." && \
    node index.js