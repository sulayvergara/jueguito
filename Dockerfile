# Usamos la imagen oficial de Node.js
FROM node:18

# Establecemos el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copiamos los archivos de la aplicación al contenedor
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto de los archivos de la aplicación
COPY . .

# Exponemos el puerto en el que la aplicación va a correr
EXPOSE 3001

# Comando para ejecutar la aplicación
CMD ["npm", "start"]
