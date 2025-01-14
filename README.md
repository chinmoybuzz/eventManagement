# Event Management API

The **Event Management API** is a robust backend service designed to simplify the management of events, including creation, registration, scheduling, and attendee tracking. This API is built with scalability and flexibility in mind, providing developers with endpoints to seamlessly integrate event management features into their applications.

## Features

- **Event Creation and Management**: Create, update, and delete events with detailed attributes such as name, date, location, and description.
- **Attendee Registration**: Allow users to register for events, view registration details, and manage their participation.
- **Event Scheduling**: Manage event schedules, set time zones, and avoid scheduling conflicts.
- **User Authentication**: Secure login and registration system for administrators and attendees.
- **Search and Filter**: Find events based on keywords, dates, locations, or categories.
- **Analytics and Reporting**: Gain insights into event performance, attendee demographics, and registration trends.

## Tech Stack

- **Backend Framework**: ExpressJs
- **Database**:  MongoDB
- **Authentication**:  JWT, OAuth
- **API Documentation**: Postman

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd EventManagementApi
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add the necessary environment variables (e.g., database URL, API keys).

5. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/v1/signup`: Register a new user.
- `POST /api/v1/login`: Log in an existing user.

### Events
- `GET /api/v1/event/list`: Retrieve a list of all events.
- `POST /api/v1/event/add`: Create a new event (admin only).
- `GET /api/v1/event/edit/:id`: Get details of a specific event.
- `PUT /api/v1/events/:id`: Update event details (admin only).
- `DELETE /api/v1/event/delete`: Delete an event (admin only).

### Attendees
- `POST /api/events/enroll`: Register for an event.
- `GET /api/events/list`: List all attendees for an event  (admin only).

## Contributions

Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Submit a pull request with a detailed description of your changes.

---

Feel free to contact me for any queries or suggestions. Happy coding!

