# Dynamic Shopping Cart Web App

## Overview
This project is a single-page shopping cart web application.
It demonstrates full CRUD operations connected to a database.

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Database: SQLite
- Architecture: Single Page Application (SPA)

## Features
- View products from database (READ)
- Add items to cart (CREATE)
- Update quantity (UPDATE)
- Remove items from cart (DELETE)
- Dynamic UI updates without page reload

## Folder Structure
- /public → frontend files (HTML, CSS, JS)
- /database → database setup and seed file
- server.js → backend server
- package.json → project configuration

## How to Run
1. Install dependencies: `npm install`
2. Seed database: `node database/seed.js`
3. Start server: `npm run dev`
4. Open: http://localhost:3000

## Challenges
One of the main challenges in this project was connecting the frontend interface to the backend API while keeping the page dynamic without reloads. Implementing CRUD operations required careful handling of asynchronous requests between the client and server. Another challenge was ensuring that cart updates were reflected immediately in the user interface. This was solved by dynamically updating the DOM after each database operation.