FROM node:alpine
RUN apk add --update nginx
RUN mkdir -p /usr/share/nginx/html
RUN mkdir /src
ADD ./fastrum /src
WORKDIR /src
RUN npm install .
COPY ./nginx.conf /etc/nginx/nginx.conf
RUN ln -s /src/manager/astrum.js /usr/local/bin/astrum
WORKDIR /usr/share/nginx/html
EXPOSE 80
CMD nginx -g 'daemon off;'
