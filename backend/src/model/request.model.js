// // Request schema definition for animal help requests

// const requestTableName = 'requests';

// // Create table SQL: stores requests for centers to accept/reject user cases
// const createRequestTableSQL = `
// CREATE TABLE IF NOT EXISTS ${requestTableName} (
//   id SERIAL PRIMARY KEY,
//   case_id INTEGER NOT NULL,                -- references the animal CASE
//   requester_id INTEGER NOT NULL,            -- user who created the request
//   target_center_id INTEGER NOT NULL,        -- center (user with org role) requested
//   status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, cancelled, etc.
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   -- Optionally, add 'message' or comments field if desired
//   -- message TEXT,
//   CONSTRAINT fk_case FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE,
//   CONSTRAINT fk_requester FOREIGN KEY(requester_id) REFERENCES users(id) ON DELETE CASCADE,
//   CONSTRAINT fk_target_center FOREIGN KEY(target_center_id) REFERENCES users(id) ON DELETE CASCADE
// );
// `;

// // Optionally export the table name and create SQL for use in service and setup/migration logic
// module.exports = {
//   requestTableName,
//   createRequestTableSQL
// };