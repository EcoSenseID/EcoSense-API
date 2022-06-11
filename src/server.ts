import app from './app.js';

// env
import { PORT } from './env_config.js';

// Server listening for requests
app.listen(PORT, (): void => {
    console.log(`App running on port ${PORT}.`);
});