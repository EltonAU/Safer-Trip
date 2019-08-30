FROM node:boron

# Copy app source
COPY . /safer

# Set work directory to /src
WORKDIR /safer

# INstall app dependencies
RUN npm install

# Expose port to outside world
EXPOSE 3000

# start command as per package.json
CMD node index.js