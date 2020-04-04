FROM node
WORKDIR /usr/src/app
EXPOSE 80
COPY . .
RUN npm ci --only=production
USER node
CMD ["npm", "start"]
