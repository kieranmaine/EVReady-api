import * as dotenv from "dotenv";
import app from "./app";

dotenv.config({ path: __dirname + "/../.env" });

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}...`);
});
