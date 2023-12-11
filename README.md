# Logan's Language API - [Wiki Docs](https://github.com/dhasty1/Logan_Language_API/wiki)

This API leverages Microsoft's Azure AI Language API to analyze sentiments, recognize named entities, and detect languages of submitted texts. This README will provide you with an overview of local development and link to supporting documentation simplifying the usage of this service.

## Table of Contents
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)

## Getting Started

If you simply wish to interact with this API, please visit [our Swagger site](http://104.131.185.166:3000/docs/). If you wish to clone this project locally and refactor to make it your own, please see the prerequisites and installation instructions below.

### Prerequisites

- Your own [Azure](https://azure.microsoft.com/en-us/free/) Account
- Your own Azure AI [Language](https://azure.microsoft.com/en-us/products/ai-services/ai-language/) Resource
- Node v20.5.1
- npm v10.2.5
- Docker Desktop

### Installation

![setup](https://media.giphy.com/media/iCI7s9vM9jJse6bWWL/giphy.gif)

Navigate to the directory of your choosing and clone the repo.

```bash
git clone https://github.com/dhasty1/Logan_Language_API.git
```

Once cloned, install all required dependencies.

```bash
npm install
```

You now have a local instance set you and can begin making edits. To start the server, you'll need to change your host path. Within `swagger.js`, change the `host` to `localhost:3000`. 

This project is Dockerized, enabling its use in any environment. Ensure you have [Docker](https://docs.docker.com/get-docker/) installed and build the container using

```bash
docker build -t your-image-name .
```

Once your image is built, you can start your container.

```bash
docker run -p 3000:3000 -d --restart always -e API_KEY=your-specific-api-key -e API_ENDPOINT=your-specific-api-endpoint your-image-name
```

You will need to replace `your-specific-api-key` and `your-specific-api-endpoint` with your API key and endpoints obtained when you sign up for a Microsoft Azure account and create an AI Language Resource. It is also highly advisable to create a `.env` file to house your API key and endpoint as you don't want the public to have access to those.

Once your image is up and running, you can navigate to `localhost:3000/docs` to view you Swagger site and make calls to the API!

## Usage

Logan Language API is a very straightforward API to use. Usage details can be viewed on our Wiki general usage [doc](https://github.com/dhasty1/Logan_Language_API/wiki/General-Use).

## Contributing

If you wish to directly contribute to this project, please first reach out via [email](mailto:dhasty1@charlotte.edu) to express your interest. We require signed commits and any contributions must be made via Pull Request as we don't allow pushing commits to the main branch.


## Acknowledgments

We would like to acknowledge Microsoft Azure AI Language technology as this project would not be possible without their impressive efforts.
